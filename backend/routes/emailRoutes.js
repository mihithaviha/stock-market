const express = require('express');
const router = express.Router();
const { 
  sendWelcomeEmail, 
  sendLoginAlert, 
  sendGeneralNotification, 
  sendOtpEmail 
} = require('../services/emailService');

// POST /api/emails/send-welcome-email
router.post('/send-welcome-email', async (req, res) => {
  const { userEmail, userName, tempPassword } = req.body;
  if (!userEmail || !userName) {
    return res.status(400).json({ error: 'Missing required fields: userEmail and userName' });
  }

  try {
    // This pushes to our lightweight queue instantly
    await sendWelcomeEmail(userEmail, userName, tempPassword);
    res.status(200).json({ success: true, message: 'Welcome email queued successfully.' });
  } catch (error) {
    console.error("Welcome email error:", error);
    res.status(500).json({ error: 'Failed to queue welcome email.' });
  }
});

// POST /api/emails/send-login-alert
router.post('/send-login-alert', async (req, res) => {
  const { userEmail, userName, metadata } = req.body;
  if (!userEmail || !userName || !metadata?.time) {
    return res.status(400).json({ error: 'Missing required fields: userEmail, userName, and metadata' });
  }

  try {
    await sendLoginAlert(userEmail, userName, metadata);
    res.status(200).json({ success: true, message: 'Login alert queued successfully.' });
  } catch (error) {
    console.error("Login alert error:", error);
    res.status(500).json({ error: 'Failed to queue login alert.' });
  }
});

// POST /api/emails/send-notification
router.post('/send-notification', async (req, res) => {
  const { userEmail, userName, title, messageHtml } = req.body;
  if (!userEmail || !userName || !title || !messageHtml) {
    return res.status(400).json({ error: 'Missing required fields: userEmail, userName, title, and messageHtml' });
  }

  try {
    await sendGeneralNotification(userEmail, userName, title, messageHtml);
    res.status(200).json({ success: true, message: 'Notification queued successfully.' });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ error: 'Failed to queue notification.' });
  }
});

// POST /api/emails/send-otp
router.post('/send-otp', async (req, res) => {
  const { userEmail, userName, otpCode } = req.body;
  if (!userEmail || !userName || !otpCode) {
    return res.status(400).json({ error: 'Missing required fields: userEmail, userName, and otpCode' });
  }

  try {
    await sendOtpEmail(userEmail, userName, otpCode);
    res.status(200).json({ success: true, message: 'OTP queued successfully.' });
  } catch (error) {
    console.error("OTP error:", error);
    res.status(500).json({ error: 'Failed to queue OTP email.' });
  }
});

module.exports = router;
