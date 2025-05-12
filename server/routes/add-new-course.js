const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { universityId, majorId, courseName, courseCode } = req.body;

  if (!universityId || !majorId || !courseName || !courseCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO courses (course_code, course_name, university_id, major_id)
       VALUES (?, ?, ?, ?)`,
      [courseCode, courseName, universityId, majorId]
    );

    const newCourseId = result.insertId;

    await db.promise().query(
      `INSERT INTO tutor_courses (tutor_id, course_id) VALUES (?, ?)`,
      [tutorId, newCourseId]
    );

    res.json({ message: 'Course created and added to tutor', courseId: newCourseId });
  } catch (err) {
    console.error('Error adding new course:', err);
    res.status(500).json({ error: 'Failed to add new course' });
  }
});

module.exports = router;