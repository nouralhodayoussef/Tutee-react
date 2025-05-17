const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /tutor/dashboard
router.get('/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;

  try {
    // Get tutor ID + info
    const [tutorRows] = await db.promise().query(
      'SELECT id, first_name, photo FROM tutors WHERE user_id = ?',
      [userId]
    );
    if (tutorRows.length === 0) return res.status(404).json({ error: 'Tutor not found' });

    const tutorId = tutorRows[0].id;
    const firstName = tutorRows[0].first_name;
    const photo = tutorRows[0].photo;

    // Get next upcoming session
    const [nextSessionRows] = await db.promise().query(
      `
        SELECT 
    c.course_code,
    c.course_name,
    CONCAT(t.first_name, ' ', t.last_name) AS tutee_name,
    t.photo AS tutee_photo,
    DATE_FORMAT(ss.scheduled_date, '%W, %M %e') AS scheduled_date,
    TIME_FORMAT(sl.slot_time, '%h:%i %p') AS slot_time,
    CONCAT(ss.scheduled_date, ' ', sl.slot_time) AS session_start
  FROM scheduled_sessions ss
  JOIN session_slots sl ON ss.slot_id = sl.id
  JOIN tutees t ON ss.tutee_id = t.id
  JOIN courses c ON ss.course_id = c.id
  WHERE ss.tutor_id = ?
    AND ss.status = 'scheduled'
    AND (
      TIMESTAMP(CONCAT(ss.scheduled_date, ' ', sl.slot_time)) > NOW()
      OR (
        TIMESTAMP(CONCAT(ss.scheduled_date, ' ', sl.slot_time)) <= NOW()
        AND TIMESTAMP(DATE_ADD(CONCAT(ss.scheduled_date, ' ', sl.slot_time), INTERVAL 1 HOUR)) > NOW()
      )
    )
  ORDER BY ss.scheduled_date ASC, sl.slot_time ASC
  LIMIT 1
      `,
      [tutorId]
    );

    // Get previous tutees with avg rating
    const [tuteeRows] = await db.promise().query(
      `
      SELECT 
        CONCAT(t.first_name, ' ', t.last_name) AS name,
        t.photo,
        u.university_name,
        m.major_name,
        COUNT(ss.id) AS session_count,
        ROUND(AVG(r.stars), 1) AS avg_rating
      FROM scheduled_sessions ss
      JOIN tutees t ON ss.tutee_id = t.id
      LEFT JOIN tutee_ratings r ON r.scheduled_session_id = ss.id
      LEFT JOIN universities u ON t.university_id = u.id
      LEFT JOIN majors m ON t.major_id = m.id
      WHERE ss.tutor_id = ?
      GROUP BY t.id
      `,
      [tutorId]
    );
    

    // Get active courses
    const [courseRows] = await db.promise().query(
      `
      SELECT DISTINCT c.course_code, c.course_name
      FROM scheduled_sessions ss
      JOIN courses c ON ss.course_id = c.id
      WHERE ss.tutor_id = ?
      `,
      [tutorId]
    );
    console.log("🧪 Tutees to frontend:", tuteeRows);

    // Final response
    res.status(200).json({
      firstName,
      photo,
      nextSession: nextSessionRows[0] || null,
      tutees: tuteeRows,
      courses: courseRows,
    });

  } catch (err) {
    console.error('❌ Error in /tutor/dashboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
