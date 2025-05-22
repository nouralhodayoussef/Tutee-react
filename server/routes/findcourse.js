const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/options", (req, res) => {
  if (!req.session.user || req.session.user.role !== "tutee") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id;

  const tuteeQuery = `
    SELECT t.major_id, t.university_id
    FROM tutees t
    WHERE t.user_id = ?;
  `;

  db.query(tuteeQuery, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch tutee profile" });
    if (result.length === 0)
      return res.status(404).json({ error: "Tutee not found" });

    const { major_id, university_id } = result[0];

    db.query("SELECT id, major_name FROM majors", (err, majors) => {
      if (err) return res.status(500).json({ error: "Failed to fetch majors" });

      db.query(
        "SELECT id, university_name FROM universities",
        (err, universities) => {
          if (err)
            return res
              .status(500)
              .json({ error: "Failed to fetch universities" });

          res.status(200).json({
            majors,
            universities,
            selectedMajor: major_id,
            selectedUniversity: university_id,
          });
        }
      );
    });
  });
});

// 🔍 Get Tutors for Selected Major + University with Ratings
router.get("/tutors", (req, res) => {
  const { major, university } = req.query;

  if (!major || !university) {
    return res.status(400).json({ error: "Missing filters" });
  }

  const sql = `
SELECT 
  t.id AS tutor_id,
  t.first_name,
  t.last_name,
  t.photo,
  u.university_name,
  m.major_name,
  c.course_code,
  c.course_name,
  ROUND(AVG(tr_all.stars), 1) AS overall_rating,
  ROUND(AVG(tr_course.stars), 1) AS course_rating
FROM tutors t
JOIN users u2 ON t.user_id = u2.id
JOIN universities u ON t.university_id = u.id
JOIN majors m ON t.major_id = m.id
JOIN tutor_courses tc ON tc.tutor_id = t.id
JOIN courses c ON tc.course_id = c.id
LEFT JOIN scheduled_sessions ss_all ON ss_all.tutor_id = t.id
LEFT JOIN tutor_ratings tr_all ON tr_all.scheduled_session_id = ss_all.id
LEFT JOIN scheduled_sessions ss_course ON ss_course.tutor_id = t.id AND ss_course.course_id = c.id
LEFT JOIN tutor_ratings tr_course ON tr_course.scheduled_session_id = ss_course.id
WHERE c.major_id = ? AND c.university_id = ?
GROUP BY t.id, c.course_code
ORDER BY course_rating DESC
  `;

  db.query(sql, [major, university], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to fetch tutors", details: err });

    res.status(200).json(results);
  });
});

module.exports = router;
