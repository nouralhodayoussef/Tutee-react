const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  const userInfoQuery = `
    SELECT 
      u.email,
      t.first_name,
      t.last_name,
      m.id AS major_id,
      m.major_name,
      uni.id AS university_id,
      uni.university_name
    FROM users u
    JOIN tutees t ON u.id = t.user_id
    JOIN majors m ON m.id = t.major_id
    JOIN universities uni ON uni.id = t.university_id
    WHERE u.id = ?
  `;

  db.query(userInfoQuery, [userId], (err, result) => {
    if (err || result.length === 0) return res.status(500).json({ error: 'Error fetching user data' });
    res.status(200).json(result[0]);
  });
});

module.exports = router;
