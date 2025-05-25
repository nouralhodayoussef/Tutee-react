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
    SELECT DISTINCT tutors.id, tutors.first_name, tutors.last_name, tutors.photo,
           majors.major_name, universities.university_name,
           tutors.price_per_hour,
           (
             SELECT ROUND(AVG(tr2.stars), 1)
             FROM scheduled_sessions ss2
             JOIN session_slots sl2 ON ss2.slot_id = sl2.id
             JOIN tutor_availability ta2 ON sl2.availability_id = ta2.id
             JOIN tutor_ratings tr2 ON tr2.scheduled_session_id = ss2.id
             WHERE ta2.tutor_id = tutors.id
           ) AS avg_rating
    FROM tutors
    LEFT JOIN majors ON tutors.major_id = majors.id
    LEFT JOIN universities ON tutors.university_id = universities.id
    LEFT JOIN tutor_skills ts ON tutors.id = ts.tutor_id
    LEFT JOIN skills s ON s.id = ts.skill_id
    WHERE 1 = 1
  `;

  const params = [];

  // Filters
  if (major && major !== '0') {
    sql += ' AND tutors.major_id = ?';
    params.push(major);
  }

  if (university && university !== '0') {
    sql += ' AND tutors.university_id = ?';
    params.push(university);
  }

  if (skills) {
    const skillList = skills.split(',').map(s => s.trim());
    sql += ` AND s.skill_name IN (${skillList.map(() => '?').join(',')})`;
    params.push(...skillList);
  }

  if (search) {
    const likeSearch = `%${search}%`;
    sql += `
      AND (
        tutors.first_name LIKE ? OR
        tutors.last_name LIKE ? OR
        CONCAT(tutors.first_name, ' ', tutors.last_name) LIKE ? OR
        s.skill_name LIKE ?
      )
    `;
    params.push(likeSearch, likeSearch, likeSearch, likeSearch);
  }

  sql += ' AND tutors.price_per_hour BETWEEN ? AND ?';
  params.push(minPrice, maxPrice);

  // ✅ Remove LIMIT/OFFSET so frontend handles pagination
  sql += `
    GROUP BY tutors.id
    ORDER BY avg_rating ${ratingSort === 'asc' ? 'ASC' : 'DESC'}
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ Error fetching tutors:', err);
      return res.status(500).json({ error: 'Failed to fetch tutors' });
    }
    res.json(results);
  });
});

module.exports = router;
