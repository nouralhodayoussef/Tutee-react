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
      'DELETE FROM tutor_skills WHERE tutor_id = ? AND skill_id = ?',
      [tutorId, skillId]
    );
    res.status(200).json({ message: 'Skill removed' });
  } catch (err) {
    console.error('Error removing skill:', err);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

module.exports = router;
