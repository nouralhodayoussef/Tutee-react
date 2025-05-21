const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/majors', (req, res) => {
  db.query('SELECT id, major_name FROM majors ORDER BY major_name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

module.exports = router;
