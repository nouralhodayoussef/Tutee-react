const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  console.log("🔥 DELETE route hit");

  if (!req.session.user || req.session.user.role !== 'tutor') {
    console.log("❌ Unauthorized access. Session data:", req.session.user);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { courseId } = req.body;

  console.log("📦 Request body:", req.body);
  console.log("👤 Tutor ID:", tutorId, "| 📘 Course ID:", courseId);

  if (!courseId) {
    console.log("⚠️ Missing courseId in request");
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    const [result] = await db.promise().query(
      'DELETE FROM tutor_courses WHERE tutor_id = ? AND course_id = ?',
      [tutorId, courseId]
    );

    console.log("✅ MySQL delete result:", result);

    if (result.affectedRows === 0) {
      console.log("⚠️ No rows deleted — maybe wrong IDs?");
      return res.status(404).json({ error: 'Course not found or already removed' });
    }

    res.json({ message: 'Course removed' });
  } catch (err) {
    console.error('❌ SQL Error during deletion:', err);
    res.status(500).json({ error: 'Failed to remove course' });
  }
});

module.exports = router;
