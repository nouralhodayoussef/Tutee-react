const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /tutor/info
router.get('/info', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  const query = `
    SELECT t.first_name, t.photo
    FROM tutors t
    WHERE t.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(404).json({ error: 'Tutor not found' });

    res.status(200).json(results[0]);
  });
});

// GET /tutor/home
router.get('/home', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  // First, get the tutor.id from tutors table
  const getTutorIdQuery = 'SELECT id FROM tutors WHERE user_id = ?';
  db.query(getTutorIdQuery, [userId], (err, tutorResults) => {
    if (err || tutorResults.length === 0) {
      return res.status(500).json({ error: 'Could not find tutor ID' });
    }

    const tutorId = tutorResults[0].id;
    console.log("🎯 Correct tutorId:", tutorId);

    const bookedSessionsQuery = `
  SELECT 
  c.course_code AS course_code,
  c.course_name AS course_name,
  CONCAT(t.first_name, ' ', t.last_name) AS tutee_name,
    t.photo AS tutee_photo,

  DATE_FORMAT(s.scheduled_date, '%W, %M %e') AS date,
  TIME_FORMAT(s.scheduled_date, '%h:%i%p') AS time
FROM scheduled_sessions s
JOIN requested_sessions r ON r.id = s.request_id
JOIN courses c ON c.id = r.course_id
JOIN tutees t ON t.id = r.tutee_id
WHERE r.tutor_id = ?
  AND r.status = 'accepted'
  AND s.scheduled_date >= CURDATE()
ORDER BY s.scheduled_date ASC
LIMIT 1;

    `;


    const previousTuteesQuery = `
  SELECT DISTINCT 
    CONCAT(t.first_name, ' ', t.last_name) AS name,
    m.major_name AS major,
    u.university_name AS university
  FROM scheduled_sessions s
  JOIN requested_sessions r ON s.request_id = r.id
  JOIN tutees t ON t.id = r.tutee_id
  JOIN majors m ON t.major_id = m.id
  JOIN universities u ON t.university_id = u.id
  WHERE r.tutor_id = ?;
`;

    const activeCoursesQuery = `
      SELECT DISTINCT c.course_code
      FROM scheduled_sessions s
      JOIN requested_sessions r ON r.id = s.request_id
      JOIN courses c ON c.id = r.course_id
      WHERE r.tutor_id = ?;
    `;

    db.query(bookedSessionsQuery, [tutorId], (err, upcoming) => {
      if (err) return res.status(500).json({ error: 'Error loading upcoming session' });
      console.log("📅 Upcoming session:", upcoming);

      db.query(previousTuteesQuery, [tutorId], (err, tutees) => {
        if (err) return res.status(500).json({ error: 'Error loading previous tutees' });
        console.log("👥 Previous tutees:", tutees);

        db.query(activeCoursesQuery, [tutorId], (err, courses) => {
          if (err) return res.status(500).json({ error: 'Error loading active courses' });
          console.log("📘 Active courses:", courses);
          console.log("📦 Final API Response:", {
            upcomingSession: upcoming[0] || null,
            previousTutees: tutees,
            activeCourses: courses.map(row => row.course_code)
          });

          return res.status(200).json({
            booked_sessions: upcoming.length ? [{
              course_code: upcoming[0].course_code,
              course_name: upcoming[0].course_name,
              schedule: `${upcoming[0].date} at ${upcoming[0].time}`,
              tutee_name: upcoming[0].tutee_name,
              tutee_photo: upcoming[0].tutee_photo,
            }] : [],
            previousTutees: tutees,
            activeCourses: courses.map(row => row.course_code),
          });

        });
      });
    });
  });
});

module.exports = router;
