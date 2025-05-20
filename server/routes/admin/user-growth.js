const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET /api/admin/user-growth
router.get('/', (req, res) => {
  const range = req.query.range;
  let dateCondition = "";

  if (range === "month") {
    dateCondition = "AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  } else if (range === "6months") {
    dateCondition = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }
  // "all" or undefined means no filter

  const sql = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      role,
      COUNT(*) AS count
    FROM users
    WHERE role IN ('tutee', 'tutor') ${dateCondition}
    GROUP BY month, role
    ORDER BY month;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("User growth error:", err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});

module.exports = router;
