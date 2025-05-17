// BACKEND: server/routes/findtutor.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/search', (req, res) => {
  const {
    major,
    university,
    ratingSort = 'desc',
    minPrice = 0,
    maxPrice = 999,
    skills = '',
    search = ''
  } = req.query;

  let sql = `
    SELECT tutors.id, tutors.first_name, tutors.last_name, tutors.photo,
           majors.major_name, universities.university_name,
           tutors.price_per_hour,
           IFNULL(AVG(tr.stars), 0) AS avg_rating,
           COUNT(tr.id) AS rating_count
    FROM tutors
    LEFT JOIN tutor_ratings tr ON tr.scheduled_session_id IN (
      SELECT id FROM scheduled_sessions WHERE tutor_id = tutors.id
    )
    LEFT JOIN majors ON tutors.major_id = majors.id
    LEFT JOIN universities ON tutors.university_id = universities.id
    LEFT JOIN tutor_skills ts ON tutors.id = ts.tutor_id
    LEFT JOIN skills s ON s.id = ts.skill_id
    WHERE 1 = 1
  `;

  const params = [];
  if (major) {
    sql += ' AND tutors.major_id = ?';
    params.push(major);
  }
  if (university) {
    sql += ' AND tutors.university_id = ?';
    params.push(university);
  }
  if (skills) {
    const skillList = skills.split(',');
    sql += ` AND s.skill_name IN (${skillList.map(() => '?').join(',')})`;
    params.push(...skillList);
  }
  if (search) {
    sql += ' AND CONCAT(tutors.first_name, " ", tutors.last_name) LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' AND tutors.price_per_hour BETWEEN ? AND ?';
  params.push(minPrice, maxPrice);

  sql += ' GROUP BY tutors.id';
  sql += ` ORDER BY avg_rating ${ratingSort === 'asc' ? 'ASC' : 'DESC'}`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tutors' });
    res.json(results);
  });
});

module.exports = router;
