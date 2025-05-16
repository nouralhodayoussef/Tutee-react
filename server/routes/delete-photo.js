// routes/delete-photo.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Default image URLs
const DEFAULT_FEMALE_TUTOR_PHOTO = "https://i.imgur.com/Axnh9mE.png";
const DEFAULT_FEMALE_TUTEE_PHOTO = "https://i.imgur.com/bqi2UBN.png";
const DEFAULT_MALE_TUTOR_PHOTO = "https://i.imgur.com/jLAZm7R.png";
const DEFAULT_MALE_TUTEE_PHOTO = "https://i.imgur.com/HHuaEy9.png";

// Helper function to return correct default photo
function getDefaultPhoto(role, gender) {
  if (role === "tutor") {
    return gender === "female" ? DEFAULT_FEMALE_TUTOR_PHOTO : DEFAULT_MALE_TUTOR_PHOTO;
  } else {
    return gender === "female" ? DEFAULT_FEMALE_TUTEE_PHOTO : DEFAULT_MALE_TUTEE_PHOTO;
  }
}

router.post("/", async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { role, profile_id } = user;
  const table = role === "tutor" ? "tutors" : "tutees";

  try {
    const [rows] = await db.promise().query(`SELECT gender FROM ${table} WHERE id = ?`, [profile_id]);
    const gender = rows[0]?.gender || "male";
    const defaultPhoto = getDefaultPhoto(role, gender);

    await db.promise().query(
      `UPDATE ${table} SET photo = ? WHERE id = ?`,
      [defaultPhoto, profile_id]
    );

    res.json({ message: "Photo reset to default", photo: defaultPhoto, role, gender });
  } catch (err) {
    console.error("Error resetting photo:", err);
    res.status(500).json({ error: "Failed to reset photo" });
  }
});

module.exports = router;
