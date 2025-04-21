const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid'); // session cookie name
    return res.status(200).json({ message: 'Logged out' });
  });
});

module.exports = router;
