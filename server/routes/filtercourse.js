const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/courses', (req, res) => {
  const { major_id, university_id, search = '' } = req.query;

  if (!major_id || !university_id) {
    return res.status(400).json({ error: 'Major ID and University ID are required' });
  }

  const likeSearch = `%${search}%`;

  const sql = `
    SELECT 
      c.id AS course_id,
      c.course_code,
      c.course_name,
      t.id AS tutor_id,
      t.first_name AS tutor_first,
      t.last_name AS tutor_last,
      t.photo,
      AVG(r.stars) AS avg_rating
    FROM courses c
    JOIN tutor_courses tc ON tc.course_id = c.id
    JOIN tutors t ON t.id = tc.tutor_id
    LEFT JOIN scheduled_sessions ss ON ss.tutor_id = t.id AND ss.course_id = c.id
    LEFT JOIN tutor_ratings r ON r.scheduled_session_id = ss.id
    WHERE c.major_id = ?
      AND c.university_id = ?
      AND (
        c.course_name LIKE ?
        OR c.course_code LIKE ?
      )
    GROUP BY c.id, t.id
  `;

  db.query(sql, [major_id, university_id, likeSearch, likeSearch], (err, result) => {
    if (err) {
      console.error('❌ DB error:', err);
      return res.status(500).json({ error: 'Failed to fetch filtered courses' });
    }

    res.status(200).json(result);
  });
});

module.exports = router;
