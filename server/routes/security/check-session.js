const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const { id, role, profile_id } = req.session.user;
  res.status(200).json({ id, role, profile_id });
});

module.exports = router;
