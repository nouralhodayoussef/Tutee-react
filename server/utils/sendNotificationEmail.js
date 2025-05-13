const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendNotificationEmail({ to, subject, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"Tutee Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("📨 Booking email sent!");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Message ID:", info.messageId);
    console.log("SMTP response:", info.response); // <--- This is what we need to see

    return info;
  } catch (err) {
    console.error("❌ Failed to send booking email:", err);
    throw err;
  }
}

module.exports = sendNotificationEmail;
