const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.post('/', (req, res) => {
  const { tutor_id, ranges } = req.body;
  if (!tutor_id || !Array.isArray(ranges) || ranges.length === 0) {
    return res.status(400).json({ error: 'Missing tutor_id or ranges' });
  }

  // Build WHERE clause for ranges
  const rangeClauses = [];
  const params = [tutor_id, new Date().toISOString().slice(0, 10)];
  for (const range of ranges) {
    // Use avail.day_id for day, slots.slot_time for time
    rangeClauses.push(
      `(avail.day_id = ? AND slots.slot_time >= ? AND slots.slot_time < ?)`
    );
    params.push(range.day_id, range.start, range.end);
  }
  const whereRanges = rangeClauses.join(' OR ');

  const sql = `
    SELECT 
      s.id AS session_id,
      s.scheduled_date,
      avail.day_id,
      slots.slot_time,
      tutees.first_name AS tutee_first_name,
      tutees.last_name AS tutee_last_name,
      courses.course_code,
      courses.course_name
    FROM scheduled_sessions s
    JOIN session_slots slots ON s.slot_id = slots.id
    JOIN tutor_availability avail ON slots.availability_id = avail.id
    JOIN tutees ON s.tutee_id = tutees.id
    JOIN courses ON s.course_id = courses.id
    WHERE s.tutor_id = ?
      AND s.status != 'cancelled'
      AND s.scheduled_date >= ?
      AND (${whereRanges})
    ORDER BY s.scheduled_date, slots.slot_time
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    return res.json({ sessions: results });
  });
});

module.exports = router;
