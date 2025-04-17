const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /findcourse/options => fetch majors and universities
router.get('/options', (req, res) => {
  const getMajors = 'SELECT id, major_name FROM majors';
  const getUniversities = 'SELECT id, university_name FROM universities';

  db.query(getMajors, (err, majors) => {
    if (err) return res.status(500).json({ error: 'Error fetching majors' });

    db.query(getUniversities, (err, universities) => {
      if (err) return res.status(500).json({ error: 'Error fetching universities' });

      return res.status(200).json({ majors, universities });
    });
  });
});

module.exports = router;
