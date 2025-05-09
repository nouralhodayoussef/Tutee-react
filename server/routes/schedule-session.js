// server/routes/schedule-session.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../utils/s3Uploader");

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

    console.log("📥 Request Body:", { tutorId, courseId, note, slots });
    console.log("📂 Uploaded Files:", req.files);

    if (!tuteeId || !tutorId || !courseId || !slots) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let parsedSlots;
    try {
      parsedSlots = JSON.parse(slots);
    } catch (err) {
      console.error("❌ Invalid slots format:", err);
      return res.status(400).json({ message: "Invalid slots format." });
    }

    const slot = parsedSlots[0];
    const date = slot.date;
    const time = slot.ranges[0].start;

    // Convert MySQL DAYOFWEEK to match your day.id structure
    const [slotRow] = await db.promise().query(
      `SELECT s.id FROM session_slots s
       JOIN tutor_availability a ON s.availability_id = a.id
       WHERE a.tutor_id = ?
         AND a.day_id = CASE DAYOFWEEK(?) 
           WHEN 1 THEN 7  -- Sunday
           WHEN 2 THEN 1  -- Monday
           WHEN 3 THEN 2  -- Tuesday
           WHEN 4 THEN 3  -- Wednesday
           WHEN 5 THEN 4  -- Thursday
           WHEN 6 THEN 5  -- Friday
           WHEN 7 THEN 6  -- Saturday
         END
         AND s.slot_time = ?`,
      [tutorId, date, time]
    );

    if (!slotRow.length) {
      console.error("❌ No matching time slot found:", { tutorId, date, time });
      return res.status(404).json({ message: "No matching time slot found." });
    }

    const slotId = slotRow[0].id;

    const [insertResult] = await db.promise().query(
      `INSERT INTO scheduled_sessions (tutee_id, tutor_id, course_id, slot_id, scheduled_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tuteeId, tutorId, courseId, slotId, date, note || null]
    );

    const sessionId = insertResult.insertId;
    console.log("✅ Inserted scheduled_session ID:", sessionId);

    if (req.files && req.files.length > 0) {
      const materials = req.files.map((f) => [sessionId, f.key]);
      await db.promise().query(
        `INSERT INTO materials (scheduled_session_id, file_path) VALUES ?`,
        [materials]
      );
      console.log("📦 Materials saved:", materials);
    }

    res.status(200).json({ message: "Session scheduled successfully" });
  } catch (err) {
    console.error("🔥 Scheduling failed:", err);
    res.status(500).json({ error: "Internal server error while scheduling session." });
  }
});

module.exports = router;
