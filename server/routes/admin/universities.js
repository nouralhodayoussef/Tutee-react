const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/universities', (req, res) => {
  db.query('SELECT id, university_name FROM universities ORDER BY university_name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

module.exports = router;
