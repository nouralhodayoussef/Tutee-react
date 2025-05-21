// server/routes/admin/repeat-booking-rate.js
const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  let dateCondition = '';
  const range = req.query.range;
  if (range === 'month') {
    dateCondition = "AND MONTH(scheduled_date) = MONTH(CURDATE()) AND YEAR(scheduled_date) = YEAR(CURDATE())";
  } else if (range === '6months') {
    dateCondition = "AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }

  const totalSql = `
    SELECT COUNT(DISTINCT tutee_id) as total_tutees
    FROM scheduled_sessions WHERE 1 ${dateCondition}
  `;
  const repeatSql = `
    SELECT COUNT(*) as repeat_tutees FROM (
      SELECT tutee_id FROM scheduled_sessions WHERE 1 ${dateCondition}
      GROUP BY tutee_id HAVING COUNT(*) > 1
    ) as sub
  `;
  db.query(totalSql, (err, totalRes) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.query(repeatSql, (err2, repeatRes) => {
      if (err2) return res.status(500).json({ error: 'Server error' });
      const total = totalRes[0].total_tutees || 0;
      const repeat = repeatRes[0].repeat_tutees || 0;
      res.json({
        repeatCount: repeat,
        totalCount: total,
        rate: total === 0 ? 0 : Math.round((repeat / total) * 100)
      });
    });
  });
});
module.exports = router;
