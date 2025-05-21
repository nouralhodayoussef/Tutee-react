const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET /api/admin/top-tutors?range=month|6months|all
router.get('/', (req, res) => {
  let dateCondition = '';
  const range = req.query.range;
  if (range === 'month') {
    dateCondition = "AND MONTH(ss.scheduled_date) = MONTH(CURDATE()) AND YEAR(ss.scheduled_date) = YEAR(CURDATE())";
  } else if (range === '6months') {
    dateCondition = "AND ss.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }

  const sql = `
    SELECT t.id, t.first_name, t.last_name, t.photo, t.price_per_hour, COUNT(ss.id) as session_count
    FROM scheduled_sessions ss
    JOIN tutors t ON ss.tutor_id = t.id
    WHERE 1 ${dateCondition}
    GROUP BY t.id
    ORDER BY session_count DESC
    LIMIT 5
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Top tutors error:", err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});
module.exports = router;
