const express = require('express');
const db = require('../../config/db');
const router = express.Router();

/**
 * GET /api/visitor/top-tutors
 * Public endpoint for homepage: fetches top 6 tutors with public info and stats.
 */
router.get('/top-tutors', (req, res) => {
  const sql = `
    SELECT
      tutors.id,
      tutors.first_name,
      tutors.last_name,
      tutors.photo,
      majors.major_name,
      universities.university_name,
      AVG(tr.stars) AS avg_rating,
      COUNT(tr.id) AS review_count
    FROM tutors
    LEFT JOIN majors ON tutors.major_id = majors.id
    LEFT JOIN universities ON tutors.university_id = universities.id
    LEFT JOIN scheduled_sessions ss ON tutors.id = ss.tutor_id
    LEFT JOIN tutor_ratings tr ON tr.scheduled_session_id = ss.id
    GROUP BY tutors.id
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 6
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results.map(t => ({
      id: t.id,
      name: `${t.first_name} ${t.last_name}`,
      subject: `${t.university_name}${t.major_name ? ' - ' + t.major_name : ''}`,
      image: t.photo || '/imgs/tutors/fallback.png',
      rating: t.avg_rating ? Math.round(t.avg_rating * 10) / 10 : 0,
      reviews: t.review_count || 0,
    })));
  });
});

module.exports = router;
