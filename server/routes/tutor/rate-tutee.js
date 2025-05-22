const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.post('/', async (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'tutor') return res.status(401).json({ error: 'Unauthorized' });

  const { scheduled_session_id, stars, description } = req.body;

  if (!scheduled_session_id || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid input.' });
  }
  if (description && description.length > 1000) {
    return res.status(400).json({ error: 'Description too long.' });
  }

  try {
    // 1. Check session exists, belongs to tutor, and is eligible (scheduled AND in the past, or completed)
    const [[session]] = await db.promise().query(
      `SELECT ss.id, ss.status, ss.scheduled_date, sl.slot_time, sl.duration_minutes
         FROM scheduled_sessions ss
         JOIN session_slots sl ON ss.slot_id = sl.id
        WHERE ss.id = ? AND ss.tutor_id = ?`,
      [scheduled_session_id, user.profile_id]
    );
    if (!session) return res.status(403).json({ error: 'Not allowed.' });

    // Check if eligible (session must have ended)
    const scheduledEnd = new Date(`${session.scheduled_date}T${session.slot_time}`);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + (session.duration_minutes || 60));
    const now = new Date();
    if (session.status === "scheduled" && now < scheduledEnd)
      return res.status(403).json({ error: "You cannot rate before the session ends." });

    // Prevent double rating
    const [[existing]] = await db.promise().query(
      `SELECT id FROM tutee_ratings WHERE scheduled_session_id = ?`,
      [scheduled_session_id]
    );
    if (existing) return res.status(409).json({ error: 'Already rated.' });

    // Insert rating WITH description
    await db.promise().query(
      `INSERT INTO tutee_ratings (scheduled_session_id, stars, description) VALUES (?, ?, ?)`,
      [scheduled_session_id, stars, description || null]
    );

    if (session.status !== "completed") {
      await db.promise().query(
        `UPDATE scheduled_sessions SET status = 'completed' WHERE id = ?`,
        [scheduled_session_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error rating tutee:', err);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

module.exports = router;
