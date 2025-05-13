const express = require("express");
const router = express.Router();
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

router.post("/", async (req, res) => {
  const { sessionId, reason } = req.body;
  const user = req.session?.user;

  if (!user || !["tutor", "tutee"].includes(user.role)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT 
         ss.*, 
         s.slot_time,
         tutee_user.email AS tutee_email,
         tutor_user.email AS tutor_email,
         CONCAT(t.first_name, ' ', t.last_name) AS tutee_name,
         CONCAT(tu.first_name, ' ', tu.last_name) AS tutor_name
       FROM scheduled_sessions ss
       JOIN session_slots s ON ss.slot_id = s.id
       JOIN tutees t ON ss.tutee_id = t.id
       JOIN users tutee_user ON t.user_id = tutee_user.id
       JOIN tutors tu ON ss.tutor_id = tu.id
       JOIN users tutor_user ON tu.user_id = tutor_user.id
       WHERE ss.id = ?`,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found." });
    }

    const session = rows[0];

    // Authorization check
    if (
      (user.role === "tutor" && session.tutor_id !== user.profile_id) ||
      (user.role === "tutee" && session.tutee_id !== user.profile_id)
    ) {
      return res.status(403).json({ error: "Forbidden: Not your session" });
    }

    // 24-hour cancellation restriction
    const fullDateTime = new Date(`${session.scheduled_date}T${session.slot_time}`);
    const now = new Date();
    if (fullDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return res.status(403).json({ error: "Cannot cancel within 24 hours." });
    }

    // Update session status
    await db.promise().query(
      `UPDATE scheduled_sessions SET status = 'cancelled' WHERE id = ?`,
      [sessionId]
    );

    // Log the cancellation
    await db.promise().query(
      `INSERT INTO cancelled_sessions (scheduled_session_id, canceled_by_role, reason_note)
       VALUES (?, ?, ?)`,
      [sessionId, user.role, reason || null]
    );

    // Determine recipient and canceller full name
    const recipientEmail =
      user.role === "tutor" ? session.tutee_email : session.tutor_email;

    const recipientName =
      user.role === "tutor" ? session.tutee_name : session.tutor_name;

    const cancellerName =
      user.role === "tutor" ? session.tutor_name : session.tutee_name;

    // Send email
    await sendEmail({
      to: recipientEmail,
      subject: "Tutoring Session Cancelled",
      text: `Dear ${recipientName},\n\nThe tutoring session scheduled for ${session.scheduled_date} at ${session.slot_time} has been cancelled.\n\nReason: ${reason || "No reason provided."}\n\nCancelled by: ${cancellerName}\n\n– Tutee Team`,
    });

    return res.status(200).json({ message: "Session cancelled and email sent." });
  } catch (err) {
    console.error("❌ Cancel failed:", err);
    return res.status(500).json({ error: "Server error while cancelling session." });
  }
});

module.exports = router;
