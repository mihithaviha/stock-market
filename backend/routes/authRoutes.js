const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { sendOtpEmail } = require('../services/emailService');

const generateToken = (userId, plan_type) => {
  return jwt.sign({ userId, plan_type }, JWT_SECRET, { expiresIn: '30d' });
};

router.post('/check', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ exists: false });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await User.create({ email, password });
    const token = generateToken(user._id, user.plan_type);

    res.status(201).json({ user: { id: user._id, email: user.email, plan_type: user.plan_type }, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    const token = generateToken(user._id, user.plan_type);
    res.status(200).json({ user: { id: user._id, email: user.email, plan_type: user.plan_type }, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const passport = require('../config/passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tradezy.vercel.app';

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/auth?error=google_failed` }), (req, res) => {
  // Successful authentication
  const token = generateToken(req.user._id, req.user.plan_type);
  // Redirect to frontend with token in the URL params
  res.redirect(`${FRONTEND_URL}/?token=${token}`);
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user: { id: user._id, email: user.email, plan_type: user.plan_type, ...user._doc } });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Cache for OTPs (In a real app, use Redis or DB with TTL)
const otpCache = {};

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'If this email exists, an OTP will be sent.' }); // Security obscure

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpCache[email] = { code: otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 mins

    await sendOtpEmail(email, user.first_name || 'Trader', otp);
    res.status(200).json({ success: true, message: 'OTP dispatched' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    const record = otpCache[email];
    if (!record || record.code !== otp || Date.now() > record.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword; // Mongoose will automatically hash it
    await user.save();
    
    delete otpCache[email]; // clear used otp
    
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
