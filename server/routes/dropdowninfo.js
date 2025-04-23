// server/routes/dropdowninfo.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  const role = req.session.user.role;

  const query = `SELECT email FROM users WHERE id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err || result.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch email' });
    }

    return res.status(200).json({
      email: result[0].email,
      role: role // ✅ this MUST be included!
    });
  });
});

module.exports = router;
