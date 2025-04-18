const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  const sessionUser = req.session.user;

  if (!sessionUser || sessionUser.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tuteeId = sessionUser.profile_id;

  const tuteeNameQuery = `
    SELECT first_name
    FROM tutees
    WHERE id = ?
  `;

  const bookedSessionsQuery = `
    SELECT 
      c.course_code,
      c.course_name,
      CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
      t.photo AS tutor_photo,
      DATE_FORMAT(s.scheduled_date, '%W, %M %e at %l:%i%p') AS schedule
    FROM scheduled_sessions s
    JOIN requested_sessions r ON r.id = s.request_id
    JOIN courses c ON r.course_id = c.id
    JOIN tutors t ON r.tutor_id = t.id
    WHERE r.tutee_id = ? AND s.scheduled_date >= NOW()
    ORDER BY s.scheduled_date ASC
  `;

  const pastTutorsQuery = `
  SELECT DISTINCT
    CONCAT(t.first_name, ' ', t.last_name) AS name,
    t.description AS bio,
    t.photo
  FROM scheduled_sessions s
  JOIN requested_sessions r ON r.id = s.request_id
  JOIN tutors t ON r.tutor_id = t.id
  WHERE r.tutee_id = ?
`;


  const pastCoursesQuery = `
    SELECT DISTINCT c.course_code
    FROM scheduled_sessions s
    JOIN requested_sessions r ON r.id = s.request_id
    JOIN courses c ON r.course_id = c.id
    WHERE r.tutee_id = ?
  `;

  // Step 1: get tutee name
  db.query(tuteeNameQuery, [tuteeId], (err, nameResult) => {
    if (err || nameResult.length === 0) {
      return res.status(500).json({ error: 'Failed to get tutee name' });
    }

    const first_name = nameResult[0].first_name;

    // Step 2: get booked sessions
    db.query(bookedSessionsQuery, [tuteeId], (err, sessions) => {
      if (err) return res.status(500).json({ error: 'Error fetching future sessions' });

      // Step 3: get past tutors
      db.query(pastTutorsQuery, [tuteeId], (err, tutorRows) => {
        if (err) return res.status(500).json({ error: 'Error fetching tutors' });

        // Step 4: get past courses
        db.query(pastCoursesQuery, [tuteeId], (err, courseRows) => {
          if (err) return res.status(500).json({ error: 'Error fetching courses' });

          const courses = courseRows.map(row => row.course_code);

          // ✅ ✅ ✅ Now return everything to frontend
          res.json({
            first_name,
            booked_sessions: sessions,
            tutors: tutorRows,
            courses
          });
        });
      });
    });
  });
});

module.exports = router;
