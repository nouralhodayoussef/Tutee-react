// server/routes/check-username.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'Both names are required' });
  }

  const query = `
    SELECT * FROM tutees WHERE first_name = ? AND last_name = ?
    UNION
    SELECT * FROM tutors WHERE first_name = ? AND last_name = ?
  `;

  db.query(query, [firstName, lastName, firstName, lastName], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});

module.exports = router;
