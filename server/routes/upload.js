// server/routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../utils/s3Uploader");
const db = require("../config/db");

const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg", ".gif"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
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

router.post("/", upload.array("files"), (req, res) => {
  const sessionId = req.body.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing session ID" });
  }

  const values = req.files.map((file) => [sessionId, file.key]);

  const sql = "INSERT INTO materials (request_id, file_path) VALUES ?";

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("DB insert error:", err);
      return res.status(500).json({ error: "Failed to save file metadata" });
    }

    return res.status(200).json({ message: "Files uploaded", files: req.files.map(f => f.key) });
  });
});

module.exports = router;
