// server/routes/login.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

router.post('/', (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const userQuery = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  db.query(userQuery, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'User does not exist.' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'User does not exist.' });

    let profileTable = '';
    if (user.role === 'tutee') profileTable = 'tutees';
    else if (user.role === 'tutor') profileTable = 'tutors';
    else if (user.role === 'admin') profileTable = 'admins';

    const profileQuery = `SELECT id FROM ${profileTable} WHERE user_id = ? LIMIT 1`;
    db.query(profileQuery, [user.id], (err, profileResult) => {
      if (err) return res.status(500).json({ error: 'Failed to get role profile' });
      if (profileResult.length === 0) return res.status(404).json({ error: `No ${user.role} profile found.` });

      const profile_id = profileResult[0].id;

      // Store session user info
      req.session.user = {
        id: user.id,
        role: user.role,
        profile_id: profile_id
      };

      // Handle "Remember Me"
      if (remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.expires = false; // session-only cookie
      }

      // ✅ Ensure session is saved before sending response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).json({ error: 'Session save failed' });
        }

        return res.status(200).json({
          message: 'Login successful',
          user_id: user.id,
          profile_id: profile_id,
          role: user.role
        });
      });
    });
  });
});

module.exports = router;
