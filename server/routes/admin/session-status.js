const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET /api/admin/session-status
router.get('/', (req, res) => {
  const range = req.query.range;
  let dateCondition = "";

  if (range === "month") {
    dateCondition = "AND MONTH(scheduled_date) = MONTH(CURDATE()) AND YEAR(scheduled_date) = YEAR(CURDATE())";
  } else if (range === "6months") {
    dateCondition = "AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }
  // If range is "all" or undefined, dateCondition remains empty

  const sql = `
    SELECT status, COUNT(*) as count
    FROM scheduled_sessions
    WHERE 1 ${dateCondition}
    GROUP BY status
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Session status error:", err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});

module.exports = router;
