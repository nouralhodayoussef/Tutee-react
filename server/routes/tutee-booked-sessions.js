const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  const user = req.session?.user;

  if (!user || user.role !== 'tutee') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tuteeId = user.profile_id;

  try {
    const [rows] = await db.promise().query(
      `SELECT 
  ss.id AS session_id,
  CONCAT(t.first_name, ' ', t.last_name) AS tutor_name,
  t.photo AS tutor_photo,
  tu.photo AS tutee_photo,
  c.course_code,
  c.course_name,
  DATE_FORMAT(CONCAT(ss.scheduled_date, ' ', sl.slot_time), '%Y-%m-%d %H:%i:%s') AS scheduled_datetime,
  ss.room_link
FROM scheduled_sessions ss
JOIN session_slots sl ON ss.slot_id = sl.id
JOIN tutors t ON ss.tutor_id = t.id
JOIN tutees tu ON ss.tutee_id = tu.id
JOIN courses c ON ss.course_id = c.id
WHERE ss.tutee_id = ?
ORDER BY ss.scheduled_date ASC, sl.slot_time ASC;`,
      [tuteeId]
    );

    const formatted = rows.map(session => {
      // Handle Drive photo formatting if needed
      if (session.tutor_photo?.includes('drive.google.com')) {
        const match = session.tutor_photo.match(/[-\w]{25,}/);
        const fileId = match ? match[0] : '';
        session.tutor_photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
      return session;
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Error fetching tutee booked sessions:', err);
    res.status(500).json({ error: 'Failed to fetch booked sessions' });
  }
});

module.exports = router;
