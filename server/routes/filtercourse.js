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
      (
        SELECT ROUND(AVG(tr2.stars), 1)
        FROM scheduled_sessions ss2
        JOIN session_slots sl2 ON ss2.slot_id = sl2.id
        JOIN tutor_availability ta2 ON sl2.availability_id = ta2.id
        JOIN tutor_ratings tr2 ON tr2.scheduled_session_id = ss2.id
        WHERE ta2.tutor_id = t.id
      ) AS avg_rating
    FROM courses c
    JOIN tutor_courses tc ON tc.course_id = c.id
    JOIN tutors t ON t.id = tc.tutor_id
    WHERE c.major_id = ?
      AND c.university_id = ?
      AND (
        c.course_name LIKE ?
        OR c.course_code LIKE ?
      )
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
