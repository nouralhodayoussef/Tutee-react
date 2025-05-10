const express2 = require('express');
const router2 = express2.Router();
const db2 = require('../config/db');

router2.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const tutorId = req.session.user.profile_id;
  const { courseId } = req.body;

  try {
    await db2.promise().query(
      'INSERT IGNORE INTO tutor_courses (tutor_id, course_id) VALUES (?, ?)',
      [tutorId, courseId]
    );
    res.json({ message: 'Course added to tutor' });
  } catch (err) {
    console.error('Error adding course to tutor:', err);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

module.exports = router2;