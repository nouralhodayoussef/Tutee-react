const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  const sql = `
    SELECT 
      tutees.id, 
      tutees.first_name, 
      tutees.last_name, 
      users.email,
      tutees.photo
    FROM tutees
    JOIN users ON users.id = tutees.user_id
    ORDER BY tutees.first_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching tutees:', err.sqlMessage);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

module.exports = router;
