const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const transporter = require('../config/email');
const router = express.Router();

router.post('/', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  const profileId = req.session.user.profile_id;
  const userRole = req.session.user.role;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Step 1: Get email + password from users
  db.query('SELECT password, email FROM users WHERE id = ?', [userId], async (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(500).json({ error: 'User not found' });
    }

    const user = userResults[0];
    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 2: Update the password
    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      // Step 3: Get name from tutees/tutors
      const table = userRole === 'tutee' ? 'tutees' : userRole === 'tutor' ? 'tutors' : null;
      if (!table) return res.status(200).json({ message: 'Password updated (no email sent)' });

      db.query(`SELECT first_name, last_name FROM ${table} WHERE id = ?`, [profileId], (nameErr, nameResults) => {
        if (nameErr || nameResults.length === 0) {
          console.warn('Name not found for email');
          return res.status(200).json({ message: 'Password updated (email skipped)' });
        }

        const { first_name, last_name } = nameResults[0];

        // Step 4: Send confirmation email
        const mailOptions = {
          from: `"Tutee Team" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Your Tutee Password Was Changed',
          html: `
            <p>Dear ${first_name} ${last_name},</p>
            <p>Your Tutee account password has been <strong>successfully changed</strong>.</p>
            <p>We are sending this notice to ensure the privacy and security of your Tutee account. If you authorized this change, no further action is necessary.</p>
            <hr />
            <p>If you did not authorize this change, please change your Tutee password immediately, and consider changing your email password as well to ensure your account's security.</p>
            <br />
            <p>Cheers,<br />The Tutee Team</p>
          `
        };

        transporter.sendMail(mailOptions, (emailErr) => {
          if (emailErr) console.error('Failed to send email:', emailErr);
        });

        return res.status(200).json({ message: 'Password updated successfully' });
      });
    });
  });
});

module.exports = router;
