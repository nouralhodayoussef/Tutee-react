const express = require("express");
const db = require("../config/db");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../utils/s3Uploader");
const router = express.Router();

const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".zip", ".rar", ".7z"];

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
    key: (req, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
});

router.post("/", upload.array("materials"), async (req, res) => {
  console.log("✅ Hit /request-session route");

  const user = req.session.user;
  if (!user || user.role !== "tutee") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { tutorId, courseId, slots, note } = req.body;

  if (!tutorId || !courseId || !slots) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const parsedSlots = JSON.parse(slots);

    // Insert into requested_sessions
    const insertRequestSql = `
      INSERT INTO requested_sessions (tutee_id, tutor_id, course_id, note)
      VALUES (?, ?, ?, ?)
    `;
    const insertRequestValues = [user.profile_id, tutorId, courseId, note || null];

    const requestId = await new Promise((resolve, reject) =>
      db.query(insertRequestSql, insertRequestValues, (err, result) =>
        err ? reject(err) : resolve(result.insertId)
      )
    );

    // Create time slots in 1-hour chunks
    const sessionValues = [];

    parsedSlots.forEach((slot) => {
      const day = slot.date;

      slot.ranges.forEach((range) => {
        const start = toMinutes(range.start);
        const end = toMinutes(range.end);

        for (let m = start; m + 60 <= end; m += 60) {
          sessionValues.push([requestId, day, toTimeString(m)]);
        }
      });
    });

    if (sessionValues.length > 0) {
      const dateSql = `INSERT INTO session_dates (request_id, session_day, session_time) VALUES ?`;
      await new Promise((resolve, reject) =>
        db.query(dateSql, [sessionValues], (err) =>
          err ? reject(err) : resolve()
        )
      );
    }

    // Insert file paths into materials
    if (req.files && req.files.length > 0) {
      const fileSql = `INSERT INTO materials (request_id, file_path) VALUES ?`;
      const fileValues = req.files.map((f) => [
        requestId,
        `https://${f.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${f.key}`,
      ]);

      await new Promise((resolve, reject) =>
        db.query(fileSql, [fileValues], (err) =>
          err ? reject(err) : resolve()
        )
      );
    }

    return res.status(200).json({ message: "Request submitted successfully" });
  } catch (err) {
    console.error("❌ Error submitting request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Helpers
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

module.exports = router;
