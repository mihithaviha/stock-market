require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log("Testing auth with:", process.env.EMAIL_USER);
    if(process.env.EMAIL_PASS) {
      transporter.options.auth.pass = process.env.EMAIL_PASS.replace(/\s+/g, '');
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: 'Test Email Direct',
      text: 'This is a raw test email to see if it even reaches the inbox.',
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}

testEmail();
