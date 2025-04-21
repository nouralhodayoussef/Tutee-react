const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  const query = `
    SELECT u.email
    FROM users u
    WHERE u.id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch dropdown email:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ email: results[0].email });
  });
});

module.exports = router;
