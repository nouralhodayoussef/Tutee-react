const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const crypto = require("crypto");
const s3 = require("../utils/s3Uploader");
const fetch = require("node-fetch");

const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg", ".gif"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    bucket: "tutee-materials",
    acl: "private",
    key: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

router.post("/", upload.array("materials"), async (req, res) => {
  try {
    const { tutorId, courseId, note, slots } = req.body;
    const tuteeId = req.session?.user?.role === "tutee" ? req.session.user.profile_id : null;

    if (!tuteeId || !tutorId || !courseId || !slots) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let parsedSlots;
    try {
      parsedSlots = JSON.parse(slots);
    } catch (err) {
      return res.status(400).json({ message: "Invalid slots format." });
    }

    // 🛑 Validate all selected slots BEFORE inserting
    for (const slotEntry of parsedSlots) {
      const { date, ranges } = slotEntry;

      for (const range of ranges) {
        const time = range.start;

        // Get slot ID
        const [slotRow] = await db.promise().query(
          `SELECT s.id FROM session_slots s
           JOIN tutor_availability a ON s.availability_id = a.id
           WHERE a.tutor_id = ?
             AND a.day_id = CASE DAYOFWEEK(?)
               WHEN 1 THEN 7 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 6 END
             AND s.slot_time = ?`,
          [tutorId, date, time]
        );

        if (!slotRow.length) {
          return res.status(400).json({ message: `Slot not available: ${date} ${time}` });
        }

        const slotId = slotRow[0].id;

        // Check for conflicts
        const [existing] = await db.promise().query(
          `SELECT id FROM scheduled_sessions
           WHERE tutor_id = ?
             AND scheduled_date = ?
             AND slot_id = ?
             AND status = 'scheduled'`,
          [tutorId, date, slotId]
        );

        if (existing.length > 0) {
          return res.status(409).json({ message: `Time slot already booked: ${date} ${time}` });
        }
      }
    }

    // ✅ All good — proceed to insert
    const uploadedMaterials = req.files || [];
    const scheduledSessionIds = [];

    for (const slotEntry of parsedSlots) {
      const { date, ranges } = slotEntry;

      for (const range of ranges) {
        const time = range.start;

        const [slotRow] = await db.promise().query(
          `SELECT s.id FROM session_slots s
           JOIN tutor_availability a ON s.availability_id = a.id
           WHERE a.tutor_id = ?
             AND a.day_id = CASE DAYOFWEEK(?)
               WHEN 1 THEN 7 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 6 END
             AND s.slot_time = ?`,
          [tutorId, date, time]
        );

        const slotId = slotRow[0].id;
        const roomLink = crypto.randomUUID();

        const [insertResult] = await db.promise().query(
          `INSERT INTO scheduled_sessions (tutee_id, tutor_id, course_id, slot_id, scheduled_date, room_link, note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tuteeId, tutorId, courseId, slotId, date, roomLink, note || null]
        );

        const sessionId = insertResult.insertId;
        scheduledSessionIds.push(sessionId);

        if (uploadedMaterials.length > 0) {
          const materials = uploadedMaterials.map((f) => [sessionId, f.key]);
          await db.promise().query(
            `INSERT INTO materials (scheduled_session_id, file_path) VALUES ?`,
            [materials]
          );
        }

        await fetch("http://localhost:4000/notify-tutor-when-booked", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.cookie || "",
          },
          body: JSON.stringify({ sessionId }),
        });
      }
    }

    res.status(200).json({
      message: `${scheduledSessionIds.length} session(s) booked successfully.`,
      sessions: scheduledSessionIds,
    });
  } catch (err) {
    console.error("🔥 Scheduling failed:", err);
    res.status(500).json({ error: "Internal server error while scheduling session." });
  }
});

module.exports = router;
