const express = require("express");
const router = express.Router();
const db = require("../../config/db");
const sendEmail = require("../../utils/sendEmail");

router.post("/", async (req, res) => {
  const { tutor_id, ranges, session_ids, reason } = req.body;
  const user = req.session?.user;

//   if (!user || user.role !== "tutor" || user.profile_id !== tutor_id) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }
  if (!Array.isArray(session_ids) || !Array.isArray(ranges) || session_ids.length === 0) {
    return res.status(400).json({ error: "Missing sessions or ranges." });
  }

  try {
    // Get session info for email notifications
    const [sessions] = await db.promise().query(
      `SELECT 
         ss.id,
         ss.scheduled_date,
         sl.slot_time,
         tutees.first_name AS tutee_first_name,
         tutees.last_name AS tutee_last_name,
         tutees.user_id AS tutee_user_id,
         users.email AS tutee_email
       FROM scheduled_sessions ss
       JOIN session_slots sl ON ss.slot_id = sl.id
       JOIN tutees ON ss.tutee_id = tutees.id
       JOIN users ON tutees.user_id = users.id
       WHERE ss.id IN (${session_ids.map(() => '?').join(',')})`,
      session_ids
    );

    // Bulk update status
    await db.promise().query(
      `UPDATE scheduled_sessions SET status = 'cancelled' WHERE id IN (${session_ids.map(() => '?').join(',')})`,
      session_ids
    );

    // Log each cancellation
    for (const sid of session_ids) {
      await db.promise().query(
        `INSERT INTO cancelled_sessions (scheduled_session_id, canceled_by_role, reason_note)
         VALUES (?, 'tutor', ?)`,
        [sid, reason || "Tutor removed time slot"]
      );
    }

    // Remove the availability ranges
    for (const r of ranges) {
      // delete by day, time, and tutor_id
      await db.promise().query(
        `DELETE FROM tutor_availability
         WHERE tutor_id = ? AND day_id = ? AND start_time = ? AND end_time = ?`,
        [tutor_id, r.day_id, r.start, r.end]
      );
    }

    // Email each tutee
    for (const session of sessions) {
      await sendEmail({
        to: session.tutee_email,
        subject: "Tutoring Session Cancelled",
        text: `Dear ${session.tutee_first_name} ${session.tutee_last_name},\n\nYour tutoring session scheduled for ${session.scheduled_date} at ${session.slot_time.slice(0,5)} has been cancelled due to tutor's schedule update.\n\n– Tutee Team`
      });
    }

    return res.json({ message: "Sessions cancelled, time slot removed, emails sent." });
  } catch (err) {
    console.error("❌ Bulk cancel failed:", err);
    return res.status(500).json({ error: "Error cancelling sessions." });
  }
});

module.exports = router;
