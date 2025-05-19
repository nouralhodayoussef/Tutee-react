const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// POST /api/visitor/feedback
router.post('/feedback', (req, res) => {
  const { firstName, lastName, email, phoneNumber, universityName, description } = req.body;

  if (!firstName || !email || !description) {
    return res.status(400).json({ error: 'First name, email, and feedback are required.' });
  }

  const sql = `
    INSERT INTO feedback (first_name, last_name, email, phone_number, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [firstName, lastName, email, phoneNumber, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.status(201).json({ message: 'Feedback submitted successfully!' });
    }
  );
});

module.exports = router;
