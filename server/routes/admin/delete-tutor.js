const express = require('express');
const db = require('../../config/db');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.delete('/delete-tutor/:id', (req, res) => {
  const tutorId = req.params.id;
  const { reason, email } = req.body;

  if (!reason || !email) {
    return res.status(400).json({ error: 'Reason and email are required' });
  }

  // Check if the tutor has scheduled sessions
  const checkSql = `SELECT COUNT(*) AS count FROM scheduled_sessions WHERE tutor_id = ?`;
  db.query(checkSql, [tutorId], (err, result) => {
    if (err) {
      console.error('Error checking tutor sessions:', err);
      return res.status(500).json({ error: 'Internal server error during check' });
    }

    if (result[0].count > 0) {
      return res.status(400).json({ error: 'Cannot suspend tutors with scheduled sessions' });
    }

    // Proceed to delete the tutor
    const deleteSql = `DELETE FROM tutors WHERE id = ?`;
    db.query(deleteSql, [tutorId], (err2) => {
      if (err2) {
        console.error('Error deleting tutor:', err2);
        return res.status(500).json({ error: 'Internal server error during delete' });
      }

      // Send deletion email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Tutor Account Has Been Syspended',
        text: `Hello,\n\nYour account has been suspended by an admin.\nReason: ${reason}\n\nIf you believe this is a mistake, please contact support.\n\n- Tutee Admin Team`,
      };

      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error('Email send failed:', mailErr);
          return res.status(500).json({ error: 'User deleted but failed to send email.' });
        }

        console.log('Email sent:', info.response);
        return res.sendStatus(200);
      });
    });
  });
});

module.exports = router;
