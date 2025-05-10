const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const tutorId = req.session.user.profile_id;

  try {
    const [courses] = await db.promise().query(
      `SELECT c.id, c.course_code, c.course_name
       FROM tutor_courses tc
       JOIN courses c ON tc.course_id = c.id
       WHERE tc.tutor_id = ?`,
      [tutorId]
    );
    res.json(courses);
  } catch (err) {
    console.error('Error fetching tutor courses:', err);
    res.status(500).json({ error: 'Failed to fetch tutor courses' });
  }
});

module.exports = router;