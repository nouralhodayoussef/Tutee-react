const express = require("express");
const db = require("../config/db");
const router = express.Router();

// GET /tutor/requests
router.get("/requests", (req, res) => {
  if (!req.session.user || req.session.user.role !== "tutor") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id;

  const getTutorIdQuery = `SELECT id, photo FROM tutors WHERE user_id = ?`;
  db.query(getTutorIdQuery, [userId], (err, tutorResults) => {
    if (err || tutorResults.length === 0) {
      return res.status(500).json({ error: "Tutor not found" });
    }

    const tutorId = tutorResults[0].id;
    const tutorPhoto = tutorResults[0].photo;

    const requestQuery = `
      SELECT 
        r.id AS request_id,
        r.status,
        c.course_code,
        c.course_name,
        t.first_name AS tutee_first_name,
        t.last_name AS tutee_last_name,
        t.photo AS tutee_photo
      FROM requested_sessions r
      JOIN courses c ON c.id = r.course_id
      JOIN tutees t ON t.id = r.tutee_id
      WHERE r.tutor_id = ? AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `;

    db.query(requestQuery, [tutorId], async (err, requestRows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch requests" });

      const enrichedRequests = await Promise.all(
        requestRows.map(async (req) => {
          const slotsQuery = `
            SELECT session_day, session_time 
            FROM session_dates 
            WHERE request_id = ?
          `;

          const scheduledQuery = `
            SELECT scheduled_date 
            FROM scheduled_sessions 
            WHERE request_id IN (
              SELECT id FROM requested_sessions WHERE tutor_id = ?
            )
          `;

          const [slotRows, scheduledRows] = await Promise.all([
            new Promise((resolve) =>
              db.query(slotsQuery, [req.request_id], (err, rows) => resolve(rows || []))
            ),
            new Promise((resolve) =>
              db.query(scheduledQuery, [tutorId], (err, rows) => resolve(rows || []))
            ),
          ]);

          const available_slots = slotRows.map((r) => ({
            date: r.session_day,
            time: r.session_time.slice(0, 5), // "09:00"
          }));

          const scheduled_slots = scheduledRows.map((r) => {
            return new Date(r.scheduled_date).toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
          });

          return {
            id: req.request_id,
            course_code: req.course_code,
            course_name: req.course_name,
            tutee_name: `${req.tutee_first_name} ${req.tutee_last_name}`,
            tutee_photo: req.tutee_photo,
            tutor_photo: tutorPhoto,
            status: req.status,
            available_slots,
            scheduled_slots,
          };
        })
      );

      console.log("📦 Final JSON sent to frontend:", JSON.stringify(enrichedRequests, null, 2));
      return res.status(200).json(enrichedRequests);
    });
  });
});

// GET /tutor/requests/materials/:requestId
router.get("/materials/:requestId", (req, res) => {
  const { requestId } = req.params;

  const materialQuery = `
    SELECT file_path 
    FROM materials 
    WHERE request_id = ?
  `;

  db.query(materialQuery, [requestId], (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch materials:", err);
      return res.status(500).json({ error: "Database error while fetching materials" });
    }

    return res.status(200).json(results);
  });
});

module.exports = router;
