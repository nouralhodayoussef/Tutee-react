// server/routes/verify-otp.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /verify-otp
router.post('/', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [result] = await db.promise().query(
      'SELECT * FROM otp_verifications WHERE email = ? AND otp = ?',
      [email, otp]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid, delete it
    await db.promise().query(
      'DELETE FROM otp_verifications WHERE email = ?',
      [email]
    );

    res.status(200).json({ verified: true });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;