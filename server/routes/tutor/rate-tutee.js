const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.post('/', async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'tutor') return res.status(401).json({ error: 'Unauthorized' });

  const { scheduled_session_id, stars } = req.body;

  if (!scheduled_session_id || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    // Confirm this session belongs to the tutor and is completed
    const [[session]] = await db.promise().query(
      `SELECT id FROM scheduled_sessions WHERE id = ? AND tutor_id = ? AND status = 'completed'`,
      [scheduled_session_id, user.profile_id]
    );
    if (!session) return res.status(403).json({ error: 'Not allowed.' });

    // Prevent double rating
    const [[existing]] = await db.promise().query(
      `SELECT id FROM tutee_ratings WHERE scheduled_session_id = ?`,
      [scheduled_session_id]
    );
    if (existing) return res.status(409).json({ error: 'Already rated.' });

    // Insert rating
    await db.promise().query(
      `INSERT INTO tutee_ratings (scheduled_session_id, stars) VALUES (?, ?)`,
      [scheduled_session_id, stars]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error rating tutee:', err);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

module.exports = router;
