const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  const query = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';

  db.query(query, [token, expires, email], (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.status(500).json({ error: 'Email not found or database error' });
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // ✅ Debug line to confirm environment variable
    console.log("Sending email using:", process.env.EMAIL_USER);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Tutee - Password Reset',
      html: `<p>You requested a password reset.</p>
             <p>Click this <a href="${process.env.BASE_URL}/reset-password?token=${token}">link</a> to reset your password. This link is valid for 1 hour.</p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Email send error:", err);
        return res.status(500).json({ error: 'Email failed to send' });
      }
      res.status(200).json({ message: 'Reset email sent' });
    });
  });
});

module.exports = router;
