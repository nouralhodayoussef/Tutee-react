const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { firstName, lastName, description, selectedMajor, selectedUniversity, pricePerHour } = req.body;

  const updates = [];
  const params = [];

  if (firstName) {
    updates.push('first_name = ?');
    params.push(firstName);
  }
  if (lastName) {
    updates.push('last_name = ?');
    params.push(lastName);
  }
  if (description) {
    updates.push('description = ?');
    params.push(description);
  }
  if (selectedMajor) {
    updates.push('major_id = ?');  // Use the ID directly
    params.push(selectedMajor);
  }
  if (selectedUniversity) {
    updates.push('university_id = ?');  // Use the ID directly
    params.push(selectedUniversity);
  }
  if (pricePerHour !== undefined) {
    updates.push('price_per_hour = ?');
    params.push(pricePerHour);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  const sql = `UPDATE tutors SET ${updates.join(', ')} WHERE id = ?`;
  params.push(tutorId);

  db.query(sql, params, (err) => {
    if (err) {
      console.error('Update failed:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    res.status(200).json({ message: 'Profile updated' });
  });
});

module.exports = router;
