const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tuteeId = req.session.user.profile_id;

  const sql = 'SELECT first_name, photo FROM tutees WHERE id = ? LIMIT 1';
  db.query(sql, [tuteeId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tutee info' });
    if (results.length === 0) return res.status(404).json({ error: 'Tutee not found' });

    res.json(results[0]);
  });
});

module.exports = router;
