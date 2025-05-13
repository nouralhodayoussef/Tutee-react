const express = require("express");
const router = express.Router();
const db = require("../config/db");
const sendEmail = require("../utils/sendNotificationEmail"); // ✅ correct

router.post("/", async (req, res) => {
  const { sessionId } = req.body;

  const user = req.session?.user;
  if (!user || user.role !== "tutee") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT 
         ss.scheduled_date,
         s.slot_time,
         c.course_code,
         c.course_name,
         CONCAT(tu.first_name, ' ', tu.last_name) AS tutor_name,
         tutor_user.email AS tutor_email,
         CONCAT(t.first_name, ' ', t.last_name) AS tutee_name
       FROM scheduled_sessions ss
       JOIN session_slots s ON ss.slot_id = s.id
       JOIN courses c ON ss.course_id = c.id
       JOIN tutors tu ON ss.tutor_id = tu.id
       JOIN users tutor_user ON tu.user_id = tutor_user.id
       JOIN tutees t ON ss.tutee_id = t.id
       WHERE ss.id = ?`,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found." });
    }

    const session = rows[0];

    const emailText = `Hello ${session.tutor_name},

You have a new booked session on the Tutee platform.

📅 Date: ${session.scheduled_date}
⏰ Time: ${session.slot_time}
📘 Course: ${session.course_code} - ${session.course_name}
👤 Booked by: ${session.tutee_name}

Please log in to your Tutor Dashboard to view this session.

– Tutee Team`;

    await sendEmail({
      to: session.tutor_email,
      subject: "📢 New Session Booked",
      text: emailText,
    });

    console.log("📧 Email sent to tutor:", session.tutor_email);
    res.status(200).json({ message: "Tutor notified successfully." });
  } catch (err) {
    console.error("❌ Failed to notify tutor:", err);
    res.status(500).json({ error: "Email failed." });
  }
});

module.exports = router;
