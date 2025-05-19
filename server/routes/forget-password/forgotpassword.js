const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const nodemailer = require('nodemailer');

router.post('/', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const query = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
  db.query(query, [otp, expires, email], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(500).json({ error: 'Email not found or DB error' });

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter error:', error);
      } else {
        console.log('Email transporter ready');
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Tutee - Your Reset Code',
      html: `<p>Your password reset code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Email send error:', err);
        return res.status(500).json({ error: 'Email failed to send' });
      }
      res.status(200).json({ message: 'OTP sent' });
    });
  });
});

module.exports = router;
