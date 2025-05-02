const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /tutor/update-availability
router.post('/', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tutorId = req.session.user.profile_id;
  const { availability } = req.body;

  if (!Array.isArray(availability) || availability.length === 0) {
    return res.status(400).json({ error: 'Availability data is invalid or empty.' });
  }

  // Step 1: Delete old availability and slots
  const deleteOld = `
    DELETE sa, av FROM session_slots sa
    JOIN tutor_availability av ON sa.availability_id = av.id
    WHERE av.tutor_id = ?
  `;

  db.query(deleteOld, [tutorId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to clear old availability.' });

    // Step 2: Insert new availability
    const insertAvailability = `
      INSERT INTO tutor_availability (tutor_id, day_id, start_time, end_time)
      VALUES ?
    `;

    const availabilityData = availability.map(a => [tutorId, a.day_id, a.start_time, a.end_time]);

    db.query(insertAvailability, [availabilityData], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to insert availability.' });

      // Step 3: Fetch new availability IDs
      const availabilityIdsQuery = `
        SELECT id, start_time, end_time FROM tutor_availability
        WHERE tutor_id = ?
      `;

      db.query(availabilityIdsQuery, [tutorId], (err, availabilityRows) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve availability IDs.' });

        const slotInserts = [];

        for (const row of availabilityRows) {
          const start = parseInt(row.start_time.split(':')[0]);
          const end = parseInt(row.end_time.split(':')[0]);
          for (let h = start; h < end; h++) {
            slotInserts.push([
              row.id,
              `${h.toString().padStart(2, '0')}:00:00`,
              60,
            ]);
          }
        }

        // Step 4: Insert session slots
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
        start: row.start_time.slice(0, 5), // HH:MM
        end: row.end_time.slice(0, 5)
      });
    }

    res.json({ availability: grouped });
  });
});

module.exports = router;
