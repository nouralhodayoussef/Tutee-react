const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/", async (req, res) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const adminId = req.session.user.profile_id;

  try {
    const [[admin]] = await db
      .promise()
      .query("SELECT photo FROM admins WHERE id = ?", [adminId]);

    res.json({ photo: admin?.photo || null });
  } catch (err) {
    console.error("Failed to fetch admin info:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
