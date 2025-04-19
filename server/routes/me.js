const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /me
router.get('/', (req, res) => {
  console.log("SESSION CHECK:", req.session.user); // <-- ADD THIS

  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  const userInfoQuery = `
    SELECT u.email, t.first_name, t.last_name, t.university, t.major
    FROM users u
    JOIN tutees t ON u.id = t.user_id
    WHERE u.id = ?
  `;

  const sessionsQuery = `
    SELECT 
      s.date_time, 
      c.code AS course_code, 
      c.name AS course_name,
      tutor.first_name AS tutor_name,
      tutor_img.profile_image AS tutor_image
    FROM scheduled_sessions s
    JOIN courses c ON s.course_id = c.id
    JOIN tutors tutor ON s.tutor_id = tutor.user_id
    LEFT JOIN tutors tutor_img ON tutor_img.user_id = s.tutor_id
    WHERE s.tutee_id = ?
  `;

  const tutorsQuery = `
    SELECT DISTINCT
      t.first_name AS name,
      t.university,
      t.profile_image AS image,
      4.9 AS rating,
      92 AS num_tutees,
      17 AS num_courses
    FROM tutors t
    JOIN scheduled_sessions s ON s.tutor_id = t.user_id
    WHERE s.tutee_id = ?
  `;

  const coursesQuery = `
    SELECT DISTINCT c.code
    FROM courses c
    JOIN scheduled_sessions s ON s.course_id = c.id
    WHERE s.tutee_id = ?
  `;

  db.query(userInfoQuery, [userId], (err, userResult) => {
    if (err || userResult.length === 0) return res.status(500).json({ error: 'Error fetching user data' });

    db.query(sessionsQuery, [userId], (err, sessionResult) => {
      if (err) return res.status(500).json({ error: 'Error fetching sessions' });

      db.query(tutorsQuery, [userId], (err, tutorResult) => {
        if (err) return res.status(500).json({ error: 'Error fetching tutors' });

        db.query(coursesQuery, [userId], (err, courseResult) => {
          if (err) return res.status(500).json({ error: 'Error fetching courses' });

          return res.status(200).json({
            ...userResult[0],
            booked_sessions: sessionResult,
            tutors: tutorResult,
            courses: courseResult.map(c => c.code)
          });
        });
      });
    });
  });
});

module.exports = router;