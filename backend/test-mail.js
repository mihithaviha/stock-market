require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
  },
  logger: true, // Log everything!
  debug: true
});

async function testEmail() {
  try {
    console.log("Testing auth with:", process.env.EMAIL_USER);
    const info = await transporter.sendMail({
      from: `PortfolioPro <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, 
      subject: 'Urgent: PortfolioPro System Test',
      text: 'This is a test from the backend server to diagnose the email delivery issue. If you see this, the system is working!',
    });

    console.log("\n--- RESULT ---");
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
}

testEmail();
