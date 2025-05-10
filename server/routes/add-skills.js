const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { skillId } = req.body;

  try {
    await db.promise().query(
      'INSERT IGNORE INTO tutor_skills (tutor_id, skill_id) VALUES (?, ?)',
      [tutorId, skillId]
    );
    res.status(200).json({ message: 'Skill added' });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

module.exports = router;
