// server/routes/admin/active-users.js
const express = require('express');
const db = require('../../config/db');
const router = express.Router();

// GET /api/admin/active-users?range=month|6months|all
router.get('/', (req, res) => {
  let dateCondition = '';
  const range = req.query.range;
  if (range === 'month') {
    dateCondition = "AND MONTH(ss.scheduled_date) = MONTH(CURDATE()) AND YEAR(ss.scheduled_date) = YEAR(CURDATE())";
  } else if (range === '6months') {
    dateCondition = "AND ss.scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
  }

  // Unique tutees/tutors with at least one session in period
  const tuteesSql = `
    SELECT COUNT(DISTINCT ss.tutee_id) as active_tutees
    FROM scheduled_sessions ss WHERE 1 ${dateCondition}
  `;
  const tutorsSql = `
    SELECT COUNT(DISTINCT ss.tutor_id) as active_tutors
    FROM scheduled_sessions ss WHERE 1 ${dateCondition}
  `;
  db.query(tuteesSql, (err, tuteeRes) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.query(tutorsSql, (err2, tutorRes) => {
      if (err2) return res.status(500).json({ error: 'Server error' });
      res.json({
        activeTutees: tuteeRes[0].active_tutees,
        activeTutors: tutorRes[0].active_tutors
      });
    });
  });
});
module.exports = router;
