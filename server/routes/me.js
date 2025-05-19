const express = require('express');
const router = express.Router();

// GET /me
router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Return just the session info: id, role, profile_id
  // You can extend this if you need more info
  return res.json({
    id: req.session.user.id,
    role: req.session.user.role,
    profile_id: req.session.user.profile_id
  });
});

module.exports = router;
