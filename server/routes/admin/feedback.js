// server/routes/admin/feedback.js
const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET all feedback
router.get('/all-feedback', (req, res) => {
  db.query('SELECT * FROM feedback ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch feedback.' });
    res.json(rows);
  });
});

// DELETE feedback by id
router.delete('/delete-feedback/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM feedback WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete feedback.' });
    res.json({ success: true });
  });
});

module.exports = router;
