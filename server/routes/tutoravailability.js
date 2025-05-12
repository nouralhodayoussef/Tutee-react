const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /tutor/availability
router.post('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { availability } = req.body;

  if (!Array.isArray(availability) || availability.length === 0) {
    return res.status(400).json({ error: 'Availability data is invalid or empty.' });
  }

  const deleteOld = `
    DELETE sa, av FROM session_slots sa
    JOIN tutor_availability av ON sa.availability_id = av.id
    WHERE av.tutor_id = ?
  `;

  db.query(deleteOld, [tutorId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to clear old availability.' });

    const insertAvailability = `
      INSERT INTO tutor_availability (tutor_id, day_id, start_time, end_time)
      VALUES ?
    `;
    const availabilityData = availability.map(a => [tutorId, a.day_id, a.start_time, a.end_time]);

    db.query(insertAvailability, [availabilityData], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to insert availability.' });

      const availabilityIdsQuery = `
        SELECT id, day_id, start_time, end_time FROM tutor_availability
        WHERE tutor_id = ?
      `;

      db.query(availabilityIdsQuery, [tutorId], (err, availabilityRows) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve availability IDs.' });

        const slotInserts = [];

        for (const row of availabilityRows) {
          const startHour = parseInt(row.start_time.split(':')[0], 10);
          const endHour = parseInt(row.end_time.split(':')[0], 10);
          for (let h = startHour; h < endHour; h++) {
            slotInserts.push([
              row.id,
              `${h.toString().padStart(2, '0')}:00:00`,
              60,
            ]);
          }
        }

        const insertSlots = `
          INSERT INTO session_slots (availability_id, slot_time, duration_minutes)
          VALUES ?
        `;

        db.query(insertSlots, [slotInserts], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to insert session slots.' });

          return res.status(200).json({ message: 'Availability updated successfully.' });
        });
      });
    });
  });
});

// GET /tutor/availability
router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;

  const sql = `
    SELECT day_id, start_time, end_time
    FROM tutor_availability
    WHERE tutor_id = ?
    ORDER BY day_id, start_time
  `;

  db.query(sql, [tutorId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const grouped = {};
    for (let row of results) {
      const day = row.day_id;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push({
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5)
      });
    }

    res.json({ availability: grouped });
  });
});

// GET /tutor/availability/slots?tutorId=123
router.get('/slots', (req, res) => {
  const tutorId = req.query.tutorId;

  if (!tutorId) {
    return res.status(400).json({ error: 'Missing tutorId in query' });
  }

  const availabilityQuery = `
    SELECT 
      av.day_id, 
      ss.slot_time 
    FROM tutor_availability av
    JOIN session_slots ss ON ss.availability_id = av.id
    WHERE av.tutor_id = ?
    ORDER BY av.day_id, ss.slot_time
  `;

  const bookedQuery = `
    SELECT 
      DATE_FORMAT(ss.scheduled_date, '%Y-%m-%d') AS date,
      TIME_FORMAT(s.slot_time, '%H:%i') AS time
    FROM scheduled_sessions ss
    JOIN session_slots s ON ss.slot_id = s.id
    JOIN tutor_availability a ON s.availability_id = a.id
    WHERE a.tutor_id = ? AND ss.status != 'cancelled'
  `;

  db.query(availabilityQuery, [tutorId], (err, availabilityResults) => {
    if (err) return res.status(500).json({ error: 'Database error while fetching slots.' });

    const grouped = {};
    availabilityResults.forEach(row => {
      const day = row.day_id;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(row.slot_time.slice(0, 5)); // "HH:MM"
    });

    db.query(bookedQuery, [tutorId], (err, bookedResults) => {
      if (err) return res.status(500).json({ error: 'Database error while fetching booked sessions.' });

      res.json({ slots: grouped, booked: bookedResults });
    });
  });
});

module.exports = router;
