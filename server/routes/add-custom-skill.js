// routes/add-custom-skill.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { skillName } = req.body;

  if (!skillName || skillName.trim() === '') {
    return res.status(400).json({ error: 'Skill name is required' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT id FROM skills WHERE LOWER(skill_name) = LOWER(?)',
      [skillName.trim()]
    );

    let skillId;
    if (existing.length > 0) {
      skillId = existing[0].id;
    } else {
      const [result] = await db.promise().query(
        'INSERT INTO skills (skill_name) VALUES (?)',
        [skillName.trim()]
      );
      skillId = result.insertId;
    }

    await db.promise().query(
      'INSERT IGNORE INTO tutor_skills (tutor_id, skill_id) VALUES (?, ?)',
      [tutorId, skillId]
    );

    res.json({ message: 'Skill added', skill: { id: skillId, skill_name: skillName } });
  } catch (err) {
    console.error('Error adding custom skill:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
