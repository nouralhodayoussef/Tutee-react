const express = require('express');
const db = require('../config/db');
const router = express.Router(); // Define the router here

router.get('/options', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id; // Get user ID from the session
  const profileId = req.session.user.profile_id; // Get profile ID (tutee's profile)

  // Query to fetch major and university info for the logged-in tutee
  const tuteeInfoQuery = `
    SELECT t.major_id, t.university_id, m.major_name, u.university_name 
    FROM tutees t
    JOIN majors m ON t.major_id = m.id
    JOIN universities u ON t.university_id = u.id
    WHERE t.user_id = ?;
  `;

  db.query(tuteeInfoQuery, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tutee data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Tutee profile not found' });
    }

    const { major_id, university_id, major_name, university_name } = result[0];

    // Fetch all available majors and universities
    const majorsQuery = 'SELECT id, major_name FROM majors';
    const universitiesQuery = 'SELECT id, university_name FROM universities';

    db.query(majorsQuery, (err, majors) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch majors' });

      db.query(universitiesQuery, (err, universities) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch universities' });

        res.status(200).json({
          majors,
          universities,
          selectedMajor: major_name,
          selectedUniversity: university_name,
        });
      });
    });
  });
});

module.exports = router; // Don't forget to export the router
