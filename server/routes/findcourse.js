const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/options', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  const tuteeQuery = `
    SELECT t.major_id, t.university_id
    FROM tutees t
    WHERE t.user_id = ?;
  `;

  db.query(tuteeQuery, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tutee profile' });
    if (result.length === 0) return res.status(404).json({ error: 'Tutee not found' });

    const { major_id, university_id } = result[0];

    db.query('SELECT id, major_name FROM majors', (err, majors) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch majors' });

      db.query('SELECT id, university_name FROM universities', (err, universities) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch universities' });

        res.status(200).json({
          majors,
          universities,
          selectedMajor: major_id,
          selectedUniversity: university_id,
        });
      });
    });
  });
});

module.exports = router;
