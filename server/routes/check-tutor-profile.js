const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;

  const query = `
    SELECT price_per_hour,
      (SELECT COUNT(*) FROM tutor_courses WHERE tutor_id = ?) AS course_count
    FROM tutors
    WHERE id = ?
  `;

  db.query(query, [tutorId, tutorId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const { price_per_hour, course_count } = results[0];
    const needsProfileCompletion = (price_per_hour <= 0 || course_count === 0);

    return res.json({ needsProfileCompletion });
  });
});

module.exports = router;
