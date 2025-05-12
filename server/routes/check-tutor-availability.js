// server/routes/check-tutor-availability.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;

  const query = `SELECT COUNT(*) AS count FROM tutor_availability WHERE tutor_id = ?`;
  db.query(query, [tutorId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const count = results[0].count;
    const hasNoAvailability = count === 0;

    res.json({ hasNoAvailability });
  });
});

module.exports = router;
