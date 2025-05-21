// server/routes/admin/cancellation-reasons.js
const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  let dateCondition = '';
  const range = req.query.range;
  if (range === 'month') {
    dateCondition = "AND MONTH(cs.cancelled_at) = MONTH(CURDATE()) AND YEAR(cs.cancelled_at) = YEAR(CURDATE())";
  } else if (range === '6months') {
    dateCondition = "AND cs.cancelled_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }

  const sql = `
    SELECT IFNULL(reason_note, 'No reason') as reason, COUNT(*) as count
    FROM cancelled_sessions cs
    WHERE 1 ${dateCondition}
    GROUP BY reason
    ORDER BY count DESC
    LIMIT 10
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});
module.exports = router;
