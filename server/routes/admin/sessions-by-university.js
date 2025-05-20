const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET /api/admin/sessions-by-university
router.get('/', (req, res) => {
  const range = req.query.range;
  let dateCondition = "";

  if (range === "month") {
    dateCondition = "AND MONTH(ss.scheduled_date) = MONTH(CURDATE()) AND YEAR(ss.scheduled_date) = YEAR(CURDATE())";
  } else if (range === "6months") {
    dateCondition = "AND ss.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }
  // 'all' or undefined = no filter

  const sql = `
    SELECT u.university_name, COUNT(ss.id) as session_count
    FROM scheduled_sessions ss
    JOIN tutees t ON ss.tutee_id = t.id
    JOIN universities u ON t.university_id = u.id
    WHERE 1 ${dateCondition}
    GROUP BY u.id
    ORDER BY session_count DESC
    LIMIT 10
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Sessions by university error:", err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});

module.exports = router;
