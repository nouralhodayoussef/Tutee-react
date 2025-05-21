const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.post('/', async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'tutee') return res.status(401).json({ error: 'Unauthorized' });

  const tuteeId = user.profile_id;
  const { scheduled_session_id, stars } = req.body;

  if (!scheduled_session_id || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    // Check if this session belongs to the tutee and is completed
    const [[session]] = await db.promise().query(
      `SELECT id FROM scheduled_sessions WHERE id = ? AND tutee_id = ? AND status = 'completed'`,
      [scheduled_session_id, tuteeId]
    );
    if (!session) return res.status(403).json({ error: 'Not allowed.' });

    // Check if a rating already exists in tutor_ratings
    const [[existing]] = await db.promise().query(
      `SELECT id FROM tutor_ratings WHERE scheduled_session_id = ?`,
      [scheduled_session_id]
    );
    if (existing) return res.status(409).json({ error: 'Already rated.' });

    // Insert rating into tutor_ratings
    await db.promise().query(
      `INSERT INTO tutor_ratings (scheduled_session_id, stars) VALUES (?, ?)`,
      [scheduled_session_id, stars]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error rating tutor:', err);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

module.exports = router;
