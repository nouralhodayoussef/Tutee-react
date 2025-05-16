const express = require("express");
const db = require("../config/db");
const router = express.Router();
router.get("/whoami", (req, res) => {
  res.json(req.session?.user || { error: "no session or not logged in" });
});
router.get("/:roomLink/access", async (req, res) => {
  const user = req.session?.user;
  const { roomLink } = req.params;

  console.log("📡 Incoming /access check");
  console.log("roomLink:", roomLink);
  console.log("user:", user);

  console.log("🧠 Validating access to room_link:", roomLink);
  console.log("Current session user:", user);

  if (!user || !user.profile_id || !user.role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = `
    SELECT 
      ss.id AS session_id,
      ss.room_link,
      ss.tutee_id,
      ss.tutor_id,
      tutees.first_name AS tutee_first_name,
      tutees.last_name AS tutee_last_name,
      tutees.photo AS tutee_photo,
      tutors.first_name AS tutor_first_name,
      tutors.last_name AS tutor_last_name,
      tutors.photo AS tutor_photo
    FROM scheduled_sessions ss
    JOIN tutees ON ss.tutee_id = tutees.id
    JOIN tutors ON ss.tutor_id = tutors.id
    WHERE ss.room_link = ? AND (ss.tutee_id = ? OR ss.tutor_id = ?)
  `;

  try {
    const [rows] = await db
      .promise()
      .query(query, [roomLink, user.profile_id, user.profile_id]);

    if (rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({
      allowed: true,
      session: rows[0],
      currentUserRole: user.role,
    });
  } catch (err) {
    console.error("❌ Error in session access route:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
