const express = require('express');
const router = express.Router();
const db = require('../../config/db');

router.post('/', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing fields' });

  const query = 'SELECT reset_token, reset_token_expires FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'Invalid email' });

    const { reset_token, reset_token_expires } = results[0];
    if (reset_token === otp && new Date() < new Date(reset_token_expires)) {
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  });
});

module.exports = router;