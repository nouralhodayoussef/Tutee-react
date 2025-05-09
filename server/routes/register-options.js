const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /register/options
router.get('/options', async (req, res) => {
  try {
    const [universities] = await db.promise().query('SELECT id, university_name FROM universities');

    const [majors] = await db.promise().query(`
      SELECT m.id AS major_id, m.major_name, um.university_id 
      FROM universitymajors um
      JOIN majors m ON um.major_id = m.id
    `);

    res.json({
      universities,
      majors,
    });
  } catch (error) {
    console.error('Error loading register options:', error);
    res.status(500).json({ error: 'Failed to load registration dropdown data' });
  }
});

module.exports = router;
