const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?',
      [hashed, email],
      (err, result) => {
        if (err) {
          console.error('DB update error:', err);
          return res.status(500).json({ error: 'Failed to update password' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // First get user id and role
        db.query('SELECT id, role FROM users WHERE email = ?', [email], (err2, users) => {
          if (err2 || users.length === 0) {
            console.error('Failed to fetch user role:', err2);
            return res.status(200).json({ message: 'Password updated successfully' });
          }

          const user = users[0];
          let roleTable = null;

          if (user.role === 'tutee') roleTable = 'tutees';
          else if (user.role === 'tutor') roleTable = 'tutors';
          else if (user.role === 'admin') roleTable = 'admins';

          if (!roleTable) {
            // Role not recognized, send generic email
            sendEmail('User', '', email, res);
            return;
          }

          // Fetch first_name and last_name from role table
          db.query(
            `SELECT first_name, last_name FROM ${roleTable} WHERE user_id = ?`,
            [user.id],
            (err3, results) => {
              if (err3 || results.length === 0) {
                console.error('Failed to fetch user info from role table:', err3);
                sendEmail('User', '', email, res);
                return;
              }

              const { first_name, last_name } = results[0];
              sendEmail(first_name, last_name, email, res);
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to send email
function sendEmail(firstName, lastName, email, res) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: `"Tutee Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Tutee Password Was Changed',
    html: `
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your Tutee account password has been <strong>successfully changed</strong>.</p>
      <p>We are sending this notice to ensure the privacy and security of your Tutee account. If you authorized this change, no further action is necessary.</p>
      <hr />
      <p>If you did not authorize this change, please change your Tutee password immediately, and consider changing your email password as well to ensure your account's security.</p>
      <br />
      <p>Cheers,<br />The Tutee Team</p>
    `,
  };

  transporter.sendMail(mailOptions, (mailErr) => {
    if (mailErr) {
      console.error('Failed to send password change email:', mailErr);
    }
    // Respond with success regardless of email send result
    return res.status(200).json({ message: 'Password updated successfully' });
  });
}

module.exports = router;
