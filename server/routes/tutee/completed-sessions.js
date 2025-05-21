const express = require("express");
const router = express.Router();
const db = require("../../config/db");

router.get("/", async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== "tutee")
    return res.status(401).json({ error: "Unauthorized" });
  const tuteeId = user.profile_id;

  try {
    const [rows] = await db.promise().query(
      `
      SELECT 
  ss.id AS session_id,
  CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
  t.photo AS tutor_photo,
  tu.photo AS tutee_photo,
  c.course_code,
  c.course_name,
  DATE_FORMAT(CONCAT(ss.scheduled_date, ' ', sl.slot_time), '%Y-%m-%d %H:%i:%s') AS scheduled_datetime,
  ss.room_link,
  tr.stars AS tutor_rating
FROM scheduled_sessions ss
JOIN tutors t ON ss.tutor_id = t.id
JOIN tutees tu ON ss.tutee_id = tu.id
JOIN courses c ON ss.course_id = c.id
JOIN session_slots sl ON ss.slot_id = sl.id
LEFT JOIN tutor_ratings tr ON tr.scheduled_session_id = ss.id
WHERE ss.tutee_id = ?
  AND ss.status = 'completed'
ORDER BY ss.scheduled_date DESC
    `,
      [tuteeId]
    );

    // Handle Google Drive photos, etc if needed
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch completed sessions" });
  }
});
module.exports = router;
