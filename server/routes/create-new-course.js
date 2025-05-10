const express3 = require('express');
const router3 = express3.Router();
const db3 = require('../config/db');

router3.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const tutorId = req.session.user.profile_id;
  const { courseCode, courseName, universityId, majorId } = req.body;

  try {
    // Insert new course
    const [result] = await db3.promise().query(
      'INSERT INTO courses (course_code, course_name, university_id, major_id) VALUES (?, ?, ?, ?)',
      [courseCode, courseName, universityId, majorId]
    );
    const newCourseId = result.insertId;

    // Link to tutor
    await db3.promise().query(
      'INSERT INTO tutor_courses (tutor_id, course_id) VALUES (?, ?)',
      [tutorId, newCourseId]
    );

    res.json({ message: 'New course created and linked to tutor' });
  } catch (err) {
    console.error('Error creating new course:', err);
    res.status(500).json({ error: 'Failed to create new course' });
  }
});

module.exports = router3;