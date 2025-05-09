const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/:id', (req, res) => {
  const tutorId = req.params.id;

  const basicInfoQuery = `
    SELECT CONCAT(t.first_name, ' ', t.last_name) AS name,
           t.photo,
           t.description AS bio
    FROM tutors t
    WHERE t.id = ?
  `;

  const tuteeCountQuery = `
    SELECT COUNT(DISTINCT ss.tutee_id) AS tutee_count
    FROM scheduled_sessions ss
    JOIN session_slots sl ON ss.slot_id = sl.id
    JOIN tutor_availability ta ON sl.availability_id = ta.id
    WHERE ta.tutor_id = ?
  `;

  const courseCountQuery = `
    SELECT COUNT(DISTINCT ss.course_id) AS course_count
    FROM scheduled_sessions ss
    JOIN session_slots sl ON ss.slot_id = sl.id
    JOIN tutor_availability ta ON sl.availability_id = ta.id
    WHERE ta.tutor_id = ?
  `;

  const avgRatingQuery = `
    SELECT ROUND(AVG(tr.stars), 1) AS avg_rating
    FROM tutor_ratings tr
    JOIN scheduled_sessions ss ON tr.scheduled_session_id = ss.id
    JOIN session_slots sl ON ss.slot_id = sl.id
    JOIN tutor_availability ta ON sl.availability_id = ta.id
    WHERE ta.tutor_id = ?
  `;

  const skillsQuery = `
    SELECT s.skill_name
    FROM tutor_skills ts
    JOIN skills s ON ts.skill_id = s.id
    WHERE ts.tutor_id = ?
  `;

  const coursesQuery = `
    SELECT DISTINCT c.id, c.course_code, c.course_name
    FROM tutor_courses tc
    JOIN courses c ON tc.course_id = c.id
    WHERE tc.tutor_id = ?
  `;

  const reviewsQuery = `
    SELECT 
      CONCAT(tutee.first_name, ' ', tutee.last_name) AS reviewer,
      tutee.photo AS photo,
      tr.stars AS rating,
      tr.description AS comment
    FROM tutor_ratings tr
    JOIN scheduled_sessions ss ON tr.scheduled_session_id = ss.id
    JOIN session_slots sl ON ss.slot_id = sl.id
    JOIN tutor_availability ta ON sl.availability_id = ta.id
    JOIN tutees tutee ON ss.tutee_id = tutee.id
    WHERE ta.tutor_id = ?
  `;

  db.query(basicInfoQuery, [tutorId], (err, basicResult) => {
    if (err || !basicResult || basicResult.length === 0) {
      return res.status(500).json({ error: 'Tutor not found' });
    }

    const tutor = basicResult[0];

    db.query(tuteeCountQuery, [tutorId], (err, tuteeCountRes) => {
      if (err || !tuteeCountRes || tuteeCountRes.length === 0) {
        return res.status(500).json({ error: 'Failed to get tutee count' });
      }

      const tuteeCount = tuteeCountRes[0].tutee_count || 0;

      db.query(courseCountQuery, [tutorId], (err, courseCountRes) => {
        if (err || !courseCountRes || courseCountRes.length === 0) {
          return res.status(500).json({ error: 'Failed to get course count' });
        }

        const courseCount = courseCountRes[0].course_count || 0;

        db.query(avgRatingQuery, [tutorId], (err, ratingRes) => {
          if (err || !ratingRes || ratingRes.length === 0) {
            return res.status(500).json({ error: 'Failed to get rating' });
          }

          const avgRating = ratingRes[0].avg_rating ?? 'N/A';

          db.query(skillsQuery, [tutorId], (err, skillRows) => {
            if (err || !skillRows) {
              return res.status(500).json({ error: 'Failed to get skills' });
            }

            db.query(coursesQuery, [tutorId], (err, courseRows) => {
              if (err || !courseRows) {
                return res.status(500).json({ error: 'Failed to get courses' });
              }

              db.query(reviewsQuery, [tutorId], (err, reviewsRes) => {
                if (err || !reviewsRes) {
                  return res.status(500).json({ error: 'Failed to get reviews' });
                }

                const response = {
                  name: tutor.name,
                  photo: tutor.photo,
                  bio: tutor.bio,
                  tutee_count: tuteeCount,
                  course_count: courseCount,
                  avg_rating: avgRating,
                  skills: skillRows.map((s) => s.skill_name),
                  courses: courseRows.map((c) => ({
                    id: c.id,
                    course_code: c.course_code,
                    course_name: c.course_name,
                  })),
                  reviews: reviewsRes.map((r) => ({
                    reviewer: r.reviewer,
                    photo: r.photo,
                    rating: r.rating,
                    comment: r.comment,
                  })),
                };

                return res.json(response);
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
