// server/routes/admin/unrated-sessions.js
const express = require("express");
const db = require("../../config/db");
const router = express.Router();

router.get("/", (req, res) => {
  let dateCondition = "";
  const range = req.query.range;
  if (range === "month") {
    dateCondition =
      "AND MONTH(ss.scheduled_date) = MONTH(CURDATE()) AND YEAR(ss.scheduled_date) = YEAR(CURDATE())";
  } else if (range === "6months") {
    dateCondition =
      "AND ss.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }

  const sql = `
  SELECT 
    ss.id, 
    ss.scheduled_date, 
    tutees.first_name AS tutee_first, 
    tutees.last_name AS tutee_last,
    tutors.first_name AS tutor_first, 
    tutors.last_name AS tutor_last,
    c.course_code,
    c.course_name
  FROM scheduled_sessions ss
  JOIN tutees ON ss.tutee_id = tutees.id
  JOIN tutors ON ss.tutor_id = tutors.id
  JOIN courses c ON ss.course_id = c.id
  WHERE ss.status = 'completed'
    AND ss.id NOT IN (SELECT scheduled_session_id FROM tutee_ratings)
    AND ss.id NOT IN (SELECT scheduled_session_id FROM tutor_ratings)
    ${dateCondition}
  ORDER BY ss.scheduled_date DESC
  LIMIT 20
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(results);
  });
});
module.exports = router;
