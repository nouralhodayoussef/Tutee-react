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

    const tutorId = req.session.user.id;

    const upcomingSessionQuery = `
    SELECT 
      c.course_code AS course_code,
      c.course_name AS course_name,
      CONCAT(t.first_name, ' ', t.last_name) AS tutee_name,
      DATE_FORMAT(s.scheduled_date, '%W, %M %e') AS date,
      TIME_FORMAT(s.scheduled_date, '%h:%i%p') AS time
    FROM scheduled_sessions s
    JOIN requested_sessions r ON r.id = s.request_id
    JOIN courses c ON c.id = r.course_id
    JOIN tutees t ON t.user_id = r.tutee_id
    WHERE r.tutor_id = ?
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
    JOIN requested_sessions r ON r.id = s.request_id
    JOIN tutees t ON t.user_id = r.tutee_id
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

    db.query(upcomingSessionQuery, [tutorId], (err, upcoming) => {
        if (err) return res.status(500).json({ error: 'Error loading upcoming session' });

        db.query(previousTuteesQuery, [tutorId], (err, tutees) => {
            if (err) return res.status(500).json({ error: 'Error loading previous tutees' });

            db.query(activeCoursesQuery, [tutorId], (err, courses) => {
                if (err) return res.status(500).json({ error: 'Error loading active courses' });

                console.log("🎓 Active course raw rows:", courses); // Debug log

                return res.status(200).json({
                    upcomingSession: upcoming[0] || null,
                    previousTutees: tutees,
                    activeCourses: courses.map(row => row['course_code']), // safer
                });
            });

        });
    });
});

module.exports = router;
//