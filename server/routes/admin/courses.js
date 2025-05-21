const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/courses', (req, res) => {
  const { university_id, major_id } = req.query;

  if (!university_id || !major_id) {
    return res.status(400).json({ error: 'university_id and major_id are required' });
  }

  const sql = `
    SELECT id, course_code, course_name 
    FROM courses 
    WHERE university_id = ? AND major_id = ?
    ORDER BY course_name
  `;
  db.query(sql, [university_id, major_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

module.exports = router;
