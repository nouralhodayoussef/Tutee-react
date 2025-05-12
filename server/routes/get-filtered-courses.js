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
      `SELECT c.id, c.course_code, c.course_name
       FROM courses c
       JOIN universitymajors um 
         ON c.university_id = um.university_id 
        AND c.major_id = um.major_id
       WHERE c.university_id = ? AND c.major_id = ?`,
      [universityId, majorId]
    );

    res.json(courses);
  } catch (err) {
    console.error('Error fetching filtered courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router2;
