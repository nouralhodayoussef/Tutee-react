const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Adjust credentials if needed
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',           // Or your XAMPP MySQL password
  database: 'tutee-db'
});

db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to MySQL');

  db.query('SELECT id, password FROM users', async (err, users) => {
    if (err) throw err;

    for (const user of users) {
      // Skip already-bcrypt-hashed passwords
      if (user.password.startsWith('$2')) {
        console.log(`🔒 User ${user.id} already hashed — skipped`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id],
        (err) => {
          if (err) {
            console.error(`❌ Failed to update user ${user.id}`, err);
          } else {
            console.log(`✅ User ${user.id} password hashed`);
          }
        }
      );
    }

    console.log('✅ Done hashing all users.');
    db.end();
  });
});
