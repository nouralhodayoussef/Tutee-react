const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

router.post('/', async (req, res) => {
  const {
    firstName, lastName, email, password, gender, dob,
    universityId, majorId, role
  } = req.body;

  console.log('📥 Incoming register payload:', {
    firstName, lastName, email, gender, dob, universityId, majorId, role
  });

  const universityIdInt = parseInt(universityId);
  const majorIdInt = parseInt(majorId);

  if (isNaN(universityIdInt) || isNaN(majorIdInt)) {
    return res.status(400).json({ error: 'Invalid university or major ID' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Transaction failed' });

    db.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error('❌ Insert user failed:', err);
          return db.rollback(() => res.status(500).json({ error: 'Insert user failed' }));
        }

        const userId = result.insertId;
        const targetTable = role === 'tutee' ? 'tutees' : 'tutors';

        console.log(`🧾 Inserting into ${targetTable} with userId ${userId}`);

        db.query(
          `INSERT INTO ${targetTable} (user_id, first_name, last_name, dob, gender, university_id, major_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, firstName, lastName, dob, gender, universityIdInt, majorIdInt],
          (err2) => {
            if (err2) {
              console.error('❌ Insert profile failed:', err2);
              return db.rollback(() => res.status(500).json({ error: 'Insert profile failed' }));
            }

            db.commit((err3) => {
              if (err3) {
                console.error('❌ Commit failed:', err3);
                return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
              }

              console.log('✅ Registration successful');
              res.status(200).json({ success: true });
            });
          }
        );
      }
    );
  });
});

module.exports = router;
