const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.post("/", (req, res) => {
  const { requestId, action, date, time } = req.body;

  if (!requestId || !["accept", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid action or missing requestId" });
  }

  const updateRequestedQuery = `
    UPDATE requested_sessions
    SET status = ?
    WHERE id = ?
  `;

  if (action === "accept") {
    if (!date || !time) {
      return res.status(400).json({ error: "Missing date or time for acceptance" });
    }

    const scheduledDateTime = `${date} ${time}:00`;
    const roomLink = `https://tutee.live/session/${Math.random().toString(36).substring(2, 10)}`;

    const insertScheduledQuery = `
      INSERT INTO scheduled_sessions (request_id, scheduled_date, room_link, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    db.query(insertScheduledQuery, [requestId, scheduledDateTime, roomLink], (err1) => {
      if (err1) {
        console.error("❌ Failed to insert scheduled session:", err1);
        return res.status(500).json({ error: "Insert failed" });
      }

      db.query(updateRequestedQuery, ["accepted", requestId], (err2) => {
        if (err2) {
          console.error("❌ Failed to update request status:", err2);
          return res.status(500).json({ error: "Failed to accept request" });
        }

        return res.status(200).json({ success: true, room_link: roomLink });
      });
    });
  } else if (action === "reject") {
    const updateRequestedQuery = `
      UPDATE requested_sessions
      SET status = 'rejected'
      WHERE id = ?
    `;
  
    db.query(updateRequestedQuery, [requestId], (err, result) => {
      if (err) {
        console.error("❌ Failed to update request status:", err);
        return res.status(500).json({ error: "Reject failed" });
      }
  
      if (result.affectedRows === 0) {
        console.warn("⚠️ Reject failed: requestId not found");
        return res.status(404).json({ error: "Request not found" });
      }
  
      return res.status(200).json({ success: true });
    });
  }
  
});

module.exports = router;
