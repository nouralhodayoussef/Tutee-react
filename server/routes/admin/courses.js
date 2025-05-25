const express = require('express');
const db = require('../../config/db'); 
const router = express.Router(); 

router.get('/courses', (req, res) => {
  const university_id = Number(req.query.university_id);
  const major_id = Number(req.query.major_id);

  let sql = `
    SELECT courses.id, course_code, course_name, universities.university_name
    FROM courses
    JOIN universities ON courses.university_id = universities.id
    WHERE 1 = 1
  `;
  const params = [];

  if (university_id) {
    sql += ' AND courses.university_id = ?';
    params.push(university_id);
  }

  if (major_id) {
    sql += ' AND courses.major_id = ?';
    params.push(major_id);
  }

  sql += ' ORDER BY course_name';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
