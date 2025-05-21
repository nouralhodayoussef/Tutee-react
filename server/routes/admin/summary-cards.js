const express = require("express");
const db = require("../../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const range = req.query.range;
    let dateCondition = "";
    if (range === "month") {
      dateCondition =
        "AND MONTH(scheduled_date) = MONTH(CURDATE()) AND YEAR(scheduled_date) = YEAR(CURDATE())";
    } else if (range === "6months") {
      dateCondition =
        "AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
    }
    // "all" or undefined: no filter

    // Promisified query helper
    const query = (sql) =>
      new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

    const [
      totalTutees,
      totalTutors,
      totalSessions,
      sessionsFiltered,
      completedFiltered,
      cancelledFiltered,
      avgTutorRating,
      avgTuteeRating,
      totalFeedback,
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total_tutees FROM users WHERE role = 'tutee'`),
      query(`SELECT COUNT(*) AS total_tutors FROM users WHERE role = 'tutor'`),
      query(
        `SELECT COUNT(*) AS total_sessions FROM scheduled_sessions WHERE 1 ${dateCondition}`
      ),
      query(
        `SELECT COUNT(*) AS sessions_filtered FROM scheduled_sessions WHERE 1 ${dateCondition}`
      ),
      query(
        `SELECT COUNT(*) AS completed_filtered FROM scheduled_sessions WHERE status = 'completed' ${dateCondition}`
      ),
      query(
        `SELECT COUNT(*) AS cancelled_filtered FROM scheduled_sessions WHERE status = 'cancelled' ${dateCondition}`
      ),
      query(
        `SELECT ROUND(AVG(stars),2) AS avg_tutor_rating FROM tutor_ratings WHERE stars IS NOT NULL`
      ),
      query(
        `SELECT ROUND(AVG(stars),2) AS avg_tutee_rating FROM tutee_ratings WHERE stars IS NOT NULL`
      ),
      query(`SELECT COUNT(*) AS total_feedback FROM feedback`),
    ]);
    const cancelledPercentage =
      totalSessions.total_sessions > 0
        ? (
            (cancelledFiltered.cancelled_filtered /
              totalSessions.total_sessions) *
            100
          ).toFixed(1)
        : "0.0";
    res.json({
      totalTutees: totalTutees.total_tutees,
      totalTutors: totalTutors.total_tutors,
      totalSessions: totalSessions.total_sessions,
      sessionsThisMonth: sessionsFiltered.sessions_filtered, // ← always filtered
      completedAllTime: completedFiltered.completed_filtered, // ← always filtered
      completedThisMonth: completedFiltered.completed_filtered, // ← always filtered
      cancelledAllTime: cancelledFiltered.cancelled_filtered, // ← always filtered
      cancelledThisMonth: cancelledFiltered.cancelled_filtered, // ← always filtered
      avgTutorRating: avgTutorRating.avg_tutor_rating,
      avgTuteeRating: avgTuteeRating.avg_tutee_rating,
      totalFeedback: totalFeedback.total_feedback,
      cancelledPercentage,
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
