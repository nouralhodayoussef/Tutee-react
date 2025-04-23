const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  const profileId = req.session.user.profile_id;
  const { firstName, lastName, selectedMajor, selectedUniversity } = req.body;

  try {
    // Fetch current names
    const [tuteeRows] = await db.promise().query(
      'SELECT first_name, last_name FROM tutees WHERE id = ?',
      [profileId]
    );

    if (!tuteeRows || tuteeRows.length === 0) {
      return res.status(404).json({ error: 'Tutee not found' });
    }

    const currentFirst = tuteeRows[0].first_name;
    const currentLast = tuteeRows[0].last_name;

    const updatedFirst = firstName?.trim() || currentFirst;
    const updatedLast = lastName?.trim() || currentLast;

    // Get IDs for selected major and university
    const [[majorRow]] = await db.promise().query(
      'SELECT id FROM majors WHERE major_name = ? LIMIT 1',
      [selectedMajor]
    );
    const [[universityRow]] = await db.promise().query(
      'SELECT id FROM universities WHERE university_name = ? LIMIT 1',
      [selectedUniversity]
    );

    if (!majorRow || !universityRow) {
      return res.status(400).json({ error: 'Invalid major or university' });
    }

    // Update tutee data
    await db.promise().query(
      'UPDATE tutees SET first_name = ?, last_name = ?, major_id = ?, university_id = ? WHERE id = ?',
      [updatedFirst, updatedLast, majorRow.id, universityRow.id, profileId]
    );

    return res.status(200).json({ message: 'Tutee profile updated successfully' });
  } catch (err) {
    console.error('❌ Update error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
