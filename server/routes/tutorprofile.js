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
    SELECT COUNT(DISTINCT r.tutee_id) AS tutee_count
    FROM requested_sessions r
    WHERE r.tutor_id = ?
  `;

  const courseCountQuery = `
    SELECT COUNT(DISTINCT r.course_id) AS course_count
    FROM requested_sessions r
    WHERE r.tutor_id = ?
  `;

  const avgRatingQuery = `
    SELECT ROUND(AVG(stars), 1) AS avg_rating
    FROM ratings ra
    JOIN scheduled_sessions s ON ra.scheduled_session_id = s.id
    JOIN requested_sessions r ON s.request_id = r.id
    WHERE r.tutor_id = ?
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
      ra.stars AS rating,
      ra.description AS comment
    FROM ratings ra
    JOIN scheduled_sessions s ON ra.scheduled_session_id = s.id
    JOIN requested_sessions r ON s.request_id = r.id
    JOIN tutees tutee ON r.tutee_id = tutee.id
    WHERE r.tutor_id = ?
  `;

  db.query(basicInfoQuery, [tutorId], (err, basicResult) => {
    if (err || basicResult.length === 0)
      return res.status(500).json({ error: 'Tutor not found' });

    const tutor = basicResult[0];

    db.query(tuteeCountQuery, [tutorId], (err, tuteeCountRes) => {
      if (err) return res.status(500).json({ error: 'Failed to get tutee count' });

      db.query(courseCountQuery, [tutorId], (err, courseCountRes) => {
        if (err) return res.status(500).json({ error: 'Failed to get course count' });

        db.query(avgRatingQuery, [tutorId], (err, ratingRes) => {
          if (err) return res.status(500).json({ error: 'Failed to get rating' });

          db.query(skillsQuery, [tutorId], (err, skillRows) => {
            if (err) return res.status(500).json({ error: 'Failed to get skills' });

            db.query(coursesQuery, [tutorId], (err, courseRows) => {
              if (err) return res.status(500).json({ error: 'Failed to get courses' });

              db.query(reviewsQuery, [tutorId], (err, reviewsRes) => {
                if (err) return res.status(500).json({ error: 'Failed to get reviews' });

                const response = {
                  name: tutor.name,
                  photo: tutor.photo,
                  bio: tutor.bio,
                  tutee_count: tuteeCountRes[0].tutee_count,
                  course_count: courseCountRes[0].course_count,
                  avg_rating: ratingRes[0].avg_rating || "N/A",
                  skills: skillRows.map(s => s.skill_name),
                  courses: courseRows.map(c => ({
                    id: c.id,
                    course_code: c.course_code,
                    course_name: c.course_name,
                  })),
                  reviews: reviewsRes.map(r => ({
                    reviewer: r.reviewer,
                    photo: r.photo,
                    rating: r.rating,
                    comment: r.comment,
                  }))
                };

                console.log("✅ Sending tutor profile:", response); // For debug
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
