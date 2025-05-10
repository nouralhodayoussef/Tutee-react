const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;

  try {
    // Fetch tutor basic info
    const [tutorResult] = await db.promise().query(`
      SELECT 
        t.first_name, 
        t.last_name, 
        t.photo, 
        t.description,
        t.price_per_hour,
        t.major_id,
        t.university_id,
        m.major_name, 
        u.university_name
      FROM tutors t
      LEFT JOIN majors m ON t.major_id = m.id
      LEFT JOIN universities u ON t.university_id = u.id
      WHERE t.id = ?
      LIMIT 1
    `, [tutorId]);

    if (tutorResult.length === 0) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const tutor = tutorResult[0];

    // Fetch all universities
    const [universities] = await db.promise().query('SELECT id, university_name FROM universities');

    // Fetch all majors
    const [majors] = await db.promise().query('SELECT id AS major_id, major_name FROM majors');

    // ✅ Fetch tutor's current skills
    const [skills] = await db.promise().query(
      `SELECT s.id, s.skill_name 
       FROM tutor_skills ts
       JOIN skills s ON ts.skill_id = s.id
       WHERE ts.tutor_id = ?`,
      [tutorId]
    );

    // Return combined data
    res.json({
      ...tutor,
      universities,
      majors,
      selectedUniversityId: tutor.university_id,
      selectedMajorId: tutor.major_id,
      skills
    });

  } catch (err) {
    console.error('Error fetching tutor profile:', err);
    return res.status(500).json({ error: 'Failed to fetch tutor profile data' });
  }
});

module.exports = router;
