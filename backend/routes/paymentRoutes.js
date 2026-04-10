const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
// Middleware to attach userId (pseudo imported here)
const { attachUserId } = require('../middleware/authMiddleware');

router.post('/create-order', attachUserId, async (req, res) => {
  try {
    const key_id = 'rzp_test_SaU1DVYVXU1fwJ';
    const key_secret = '3mUQC5xhTBrKNH5N4PRGnERJ';

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: 50000, // amount in smallest currency unit (paise) -> ₹500
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post('/verify', attachUserId, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const key_secret = '3mUQC5xhTBrKNH5N4PRGnERJ';

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", key_secret).update(sign.toString()).digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is successful
      try {
        await User.findByIdAndUpdate(req.userId, { plan_type: 'PREMIUM' });
      } catch (e) { console.error("Failed to upgrade in DB", e); }
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Razorpay Verify Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

module.exports = router;
