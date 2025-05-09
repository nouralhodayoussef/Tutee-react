const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.get('/', async (req, res) => {
    const user = req.session?.user;

    if (!user || user.role !== 'tutor') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const tutorId = user.profile_id;

    try {
        const [rows] = await db.promise().query(
            `SELECT 
  ss.id AS session_id,
  CONCAT(tu.first_name, ' ', tu.last_name) AS tutee_name,
  tu.photo AS tutee_photo,
  c.course_code,
  c.course_name,
  DATE_FORMAT(CONCAT(ss.scheduled_date, ' ', sl.slot_time), '%W, %M %e at %l:%i %p') AS schedule,
  ss.room_link,
  ss.scheduled_date,
  GROUP_CONCAT(m.file_path) AS materials
FROM scheduled_sessions ss
JOIN tutees tu ON ss.tutee_id = tu.id
JOIN courses c ON ss.course_id = c.id
JOIN session_slots sl ON ss.slot_id = sl.id
LEFT JOIN materials m ON m.scheduled_session_id = ss.id
WHERE ss.tutor_id = ? AND ss.scheduled_date >= CURDATE()
GROUP BY ss.id
ORDER BY ss.scheduled_date ASC;
`,
            [tutorId]
        );

        const formatted = rows.map(session => {
            // Handle Drive link formatting
            if (session.tutee_photo?.includes('drive.google.com')) {
                const match = session.tutee_photo.match(/[-\w]{25,}/);
                const fileId = match ? match[0] : '';
                session.tutee_photo = `https://drive.google.com/uc?export=view&id=${fileId}`;
            }

            // Parse materials to array
            session.materials = session.materials ? session.materials.split(',') : [];

            return session;
        });

        res.json({ bookedSessions: formatted });
    } catch (err) {
        console.error('❌ Error fetching booked sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

module.exports = router;
