const express2 = require('express');
const router2 = express2.Router();
const db2 = require('../config/db');

router2.get('/', async (req, res) => {
  const { universityId, majorId } = req.query;

  if (!universityId || !majorId) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  try {
    const [courses] = await db2.promise().query(
      `SELECT id, course_code, course_name
       FROM courses
       WHERE university_id = ? AND major_id = ?`,
      [universityId, majorId]
    );

    res.json(courses);
  } catch (err) {
    console.error('Error fetching filtered courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router2;
