const express = require('express');
const db = require('../../config/db');
const router = express.Router();

router.put('/update-course/:id', (req, res) => {
  const { id } = req.params;
  const { course_code, course_name } = req.body;

  if (!course_code || !course_name) {
    return res.status(400).json({ error: 'course_code and course_name are required' });
  }

  const sql = 'UPDATE courses SET course_code = ?, course_name = ? WHERE id = ?';
  db.query(sql, [course_code, course_name, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.sendStatus(200);
  });
});

module.exports = router;
