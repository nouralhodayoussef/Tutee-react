const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.get('/', (req, res) => {
  const sql = `
    SELECT 
      tutors.id, 
      tutors.first_name, 
      tutors.last_name, 
      users.email
    FROM tutors
    JOIN users ON users.id = tutors.user_id
    ORDER BY tutors.first_name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ SQL ERROR:', err.sqlMessage); // Show real reason in terminal
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

module.exports = router;
