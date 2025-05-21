const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/courses', (req, res) => {
  const { university_id, major_id } = req.query;

  let sql = '';
  const params = [];

  if (university_id && major_id) {
    sql = `
      SELECT id, course_code, course_name
      FROM courses
      WHERE university_id = ? AND major_id = ?
      ORDER BY course_name
    `;
    params.push(university_id, major_id);
  } else {
    // No filter: show university_name too
    sql = `
      SELECT courses.id, course_code, course_name, universities.university_name
      FROM courses
      JOIN universities ON courses.university_id = universities.id
      ORDER BY course_name
    `;
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

module.exports = router;
