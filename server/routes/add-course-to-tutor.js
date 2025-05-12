const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    // Check if the course exists
    const [courseRows] = await db.promise().query(
      'SELECT id FROM courses WHERE id = ?',
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already assigned
    const [existing] = await db.promise().query(
      'SELECT * FROM tutor_courses WHERE tutor_id = ? AND course_id = ?',
      [tutorId, courseId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Course already assigned to this tutor' });
    }

    // Add to tutor_courses
    const [result] = await db.promise().query(
      'INSERT INTO tutor_courses (tutor_id, course_id) VALUES (?, ?)',
      [tutorId, courseId]
    );

    if (result.affectedRows === 1) {
      res.json({ message: 'Course successfully added to tutor' });
    } else {
      res.status(500).json({ error: 'Insert failed' });
    }
  } catch (err) {
    console.error('Error adding course to tutor:', err);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

module.exports = router;
