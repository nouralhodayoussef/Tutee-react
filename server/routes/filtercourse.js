const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/courses', (req, res) => {
  const { major, university, search = '' } = req.query;

  if (!major || !university) {
    return res.status(400).json({ error: 'Major and University are required' });
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
    LEFT JOIN requested_sessions rs ON rs.tutor_id = t.id AND rs.course_id = c.id
    LEFT JOIN scheduled_sessions ss ON ss.request_id = rs.id
    LEFT JOIN ratings r ON r.scheduled_session_id = ss.id
    JOIN majors m ON c.major_id = m.id
    JOIN universities u ON c.university_id = u.id
    WHERE m.major_name = ? 
      AND u.university_name = ?
      AND (
        c.course_name LIKE ?
        OR c.course_code LIKE ?
      )
    GROUP BY c.id, t.id
  `;

  db.query(sql, [major, university, likeSearch, likeSearch], (err, result) => {
    if (err) {
      console.error('❌ DB error:', err);
      return res.status(500).json({ error: 'Failed to fetch filtered courses' });
    }

    res.json(result);
  });
});

module.exports = router;
