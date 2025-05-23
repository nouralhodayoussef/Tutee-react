const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const db = require("../../config/db");
require("dotenv").config();

// Multer setup (temporary local storage)
const upload = multer({ dest: "uploads/" });

// S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/", upload.single("profilePhoto"), async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { profile_id } = req.session.user;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const ext = path.extname(file.originalname);
  const s3Key = `admin-profile-photos/${Date.now()}-${profile_id}${ext}`;

  try {
    const stream = fs.createReadStream(file.path);

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: "tutee-materials",
        Key: s3Key,
        Body: stream,
        ContentType: file.mimetype,
      },
    });

    const result = await upload.done();
    fs.unlinkSync(file.path); // Cleanup local file

    const photoUrl = result.Location;

    await db
      .promise()
      .query(`UPDATE admins SET photo = ? WHERE id = ?`, [photoUrl, profile_id]);

    res.json({ message: "Photo uploaded successfully", photo: photoUrl });
  } catch (err) {
    console.error("Admin upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
