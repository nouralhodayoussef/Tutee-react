// server/routes/login.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const router = express.Router();

// POST /login
router.post('/', (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    if (results.length === 0) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    // Save session info
    req.session.user = {
      id: user.id,
      role: user.role,
    };

    // Remember Me
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.expires = false; // until browser closes
    }

    return res.status(200).json({
      message: 'Login successful',
      user_id: user.id,
      role: user.role,
    });
  });
});

module.exports = router;
