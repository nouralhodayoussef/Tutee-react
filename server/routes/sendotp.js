const express = require('express');
const router = express.Router();
const db = require('../config/db');
const transporter = require('../config/email');
require('dotenv').config();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = generateOTP();

  try {
    // Delete old OTPs for this email
    await db.promise().query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    // Insert new OTP
    await db.promise().query('INSERT INTO otp_verifications (email, otp) VALUES (?, ?)', [email, otp]);

    // Send via email
    await transporter.sendMail({
      from: `"Tutee Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Tutee Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color:#E8B14F;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1>${otp}</h1>
          <p>This code will expire shortly. Please use it to complete your registration.</p>
        </div>
      `
    });

    console.log(`✅ OTP ${otp} sent to ${email}`);
    return res.status(200).json({ message: 'OTP sent successfully' });

  } catch (err) {
    console.error('❌ OTP send failed:', err);
    return res.status(500).json({ });
  }
});

module.exports = router;
