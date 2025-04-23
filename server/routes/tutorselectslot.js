// server/routes/tutorselectslot.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.post('/', (req, res) => {
  const { requestId, date, time } = req.body;

  if (!requestId || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const scheduledDateTime = `${date} ${time}:00`; // e.g. "2025-04-23 14:00:00"
  const roomLink = `https://tutee.live/session/${Math.random().toString(36).substring(2, 10)}`;

  const insertQuery = `
    INSERT INTO scheduled_sessions (request_id, scheduled_date, room_link, created_at, updated_at)
    VALUES (?, ?, ?, NOW(), NOW())
  `;

  const updateStatusQuery = `
    UPDATE requested_sessions SET status = 'accepted' WHERE id = ?
  `;

  db.query(insertQuery, [requestId, scheduledDateTime, roomLink], (err) => {
    if (err) return res.status(500).json({ error: 'Insert failed' });

    db.query(updateStatusQuery, [requestId], (err2) => {
      if (err2) return res.status(500).json({ error: 'Status update failed' });

      return res.status(200).json({ success: true, room_link: roomLink });
    });
  });
});

module.exports = router;
