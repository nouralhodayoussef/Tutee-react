const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 🔹 Get dropdown options (with tutee's selected university & major)
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

    db.query("SELECT id, major_name FROM majors ORDER BY major_name ASC", (err, majors) => {
      if (err) return res.status(500).json({ error: "Failed to fetch majors" });

      db.query(
        "SELECT id, university_name FROM universities ORDER BY university_name ASC",
        (err, universities) => {
          if (err)
            return res.status(500).json({ error: "Failed to fetch universities" });

          // Add "All" at the top
          const formattedMajors = [{ id: 0, major_name: "All Majors" }, ...majors];
          const formattedUniversities = [{ id: 0, university_name: "All Universities" }, ...universities];

          res.status(200).json({
            majors: formattedMajors,
            universities: formattedUniversities,
            selectedMajor: major_id,
            selectedUniversity: university_id,
          });
        }
      );
    });
  });
});

// 🔹 Get tutors for selected major/university/search filters
router.get("/tutors", (req, res) => {
  let { major, university, search = "" } = req.query;

  const filters = [];
  let whereClause = "WHERE 1=1";

  // Add major filter
  if (major && major !== "0") {
    whereClause += " AND c.major_id = ?";
    filters.push(major);
  }

  // Add university filter (for both course and tutor)
  if (university && university !== "0") {
    whereClause += " AND c.university_id = ?";
    filters.push(university);
    whereClause += " AND t.university_id = ?";
    filters.push(university);
  }

  search = `%${search}%`;
  filters.push(search, search);

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
    ${whereClause}
      AND (c.course_name LIKE ? OR c.course_code LIKE ?)
    GROUP BY t.id, c.id
    ORDER BY course_rating DESC;
  `;

  db.query(sql, filters, (err, results) => {
    if (err) {
      console.error("❌ Error in tutors query:", err);
      return res.status(500).json({ error: "Failed to fetch tutors", details: err });
    }

    res.status(200).json(results);
  });
});

module.exports = router;
