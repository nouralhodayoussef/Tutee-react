const express = require("express");
const db = require("../../config/db");
const router = express.Router();

// GET /api/admin/sessions-table?range=today|week|upcoming
// GET /api/admin/sessions-explorer?range=today|week|upcoming|future
router.get("/", (req, res) => {
  let dateCondition = "";
  const range = req.query.range || "today";

  if (range === "today") {
    dateCondition = "DATE(ss.scheduled_date) = CURDATE()";
  } else if (range === "week") {
    dateCondition = "YEARWEEK(ss.scheduled_date, 1) = YEARWEEK(CURDATE(), 1)";
  } else if (range === "upcoming" || range === "future") {
    dateCondition = "ss.scheduled_date > NOW()";
  } else {
    dateCondition = "1=1";
  }

  const sql = `
    SELECT 
      ss.id,
      ss.scheduled_date,
      ss.status,
      tutees.first_name AS tutee_first,
      tutees.last_name AS tutee_last,
      tutees.photo AS tutee_photo,
      tutors.first_name AS tutor_first,
      tutors.last_name AS tutor_last,
      tutors.photo AS tutor_photo,
      c.course_code,
      c.course_name
    FROM scheduled_sessions ss
    JOIN tutees ON ss.tutee_id = tutees.id
    JOIN tutors ON ss.tutor_id = tutors.id
    JOIN courses c ON ss.course_id = c.id
    WHERE ${dateCondition}
    ORDER BY ss.scheduled_date DESC
    LIMIT 40
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(results);
  });
});


module.exports = router;
