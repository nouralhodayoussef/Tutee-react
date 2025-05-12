const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tuteeId = req.session.user.profile_id;

  const nameQuery = `SELECT first_name FROM tutees WHERE id = ?`;

  const nextSessionQuery = `
    SELECT 
      ss.scheduled_date,
      sl.slot_time,
      c.course_code,
      c.course_name,
      CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
      t.photo AS tutor_photo
    FROM scheduled_sessions ss
    JOIN courses c ON ss.course_id = c.id
    JOIN session_slots sl ON ss.slot_id = sl.id
    JOIN tutor_availability ta ON sl.availability_id = ta.id
    JOIN tutors t ON ta.tutor_id = t.id
    WHERE ss.tutee_id = ?
      AND ss.status = 'scheduled'
    ORDER BY ss.scheduled_date ASC, sl.slot_time ASC
    LIMIT 1
  `;

  const tutorsQuery = `
    SELECT DISTINCT
  t.id,
  CONCAT(t.first_name, ' ', t.last_name) AS name,
  t.description AS bio,
  t.photo,
  u.university_name,
  (
    SELECT COUNT(DISTINCT s2.tutee_id)
    FROM scheduled_sessions s2
    WHERE s2.tutor_id = t.id AND s2.status = 'completed'
  ) AS tutee_count,
  (
    SELECT COUNT(DISTINCT s2.course_id)
    FROM scheduled_sessions s2
    WHERE s2.tutor_id = t.id AND s2.status = 'completed'
  ) AS course_count,
  (
    SELECT ROUND(AVG(tr.stars), 1)
    FROM tutor_ratings tr
    JOIN scheduled_sessions s3 ON tr.scheduled_session_id = s3.id
    WHERE s3.tutor_id = t.id AND s3.status = 'completed'
  ) AS rating
FROM scheduled_sessions ss
JOIN tutors t ON ss.tutor_id = t.id
JOIN universities u ON t.university_id = u.id
WHERE ss.tutee_id = ?

  `;

  const coursesQuery = `
    SELECT DISTINCT c.course_code
    FROM scheduled_sessions ss
    JOIN courses c ON ss.course_id = c.id
    WHERE ss.tutee_id = ?
  `;

  db.query(nameQuery, [tuteeId], (err, nameRes) => {
    if (err || nameRes.length === 0) {
      return res.status(500).json({ error: 'Error fetching tutee name' });
    }

    const firstName = nameRes[0].first_name;

    db.query(nextSessionQuery, [tuteeId], (err, nextSessionRows) => {
      if (err) return res.status(500).json({ error: 'Error fetching next session' });
      const nextSession = nextSessionRows[0] || null;

      db.query(tutorsQuery, [tuteeId], (err, tutorRows) => {
        if (err) return res.status(500).json({ error: 'Error fetching tutors' });

        db.query(coursesQuery, [tuteeId], (err, courseRows) => {
          if (err) return res.status(500).json({ error: 'Error fetching courses' });

          const courses = courseRows.map(row => row.course_code);

          res.json({
            first_name: firstName,
            next_session: nextSession,
            tutors: tutorRows,
            courses
          });
        });
      });
    });
  });
});

module.exports = router;
