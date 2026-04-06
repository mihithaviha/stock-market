const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mocked');
const supabase = require('../supabase');
const { attachUserId } = require('../middleware/authMiddleware');

const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/create-checkout-session', attachUserId, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
               name: 'Premium Plan (Real-Time)',
               description: 'Real-time WebSocket market polling, unrestricted portfolio stocks length, and premium learn area'
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/portfolio?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${YOUR_DOMAIN}/portfolio?canceled=true`,
      metadata: {
         userId: req.userId
      }
    });

    res.json({ url: session.url });
  } catch (err) {
      console.error("Stripe error:", err);
      // Fallback local mock simulation when Stripe isn't fully configured
      if (err.message && err.message.includes('mocked')) {
         return res.json({ url: `${YOUR_DOMAIN}/portfolio?mock_success=true&user_id=${req.userId}`});
      }
      res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// A webhook route must ideally use body-parser raw, but for now we parse the simple JSON structure
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
   const sig = req.headers['stripe-signature'];
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mocked';
   let event;
   
   try {
     // Verify signature
     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
   } catch (err) {
     console.error('Webhook Error:', err.message);
     // Note: If no REAL stripe secret is set, we bypass signature fail natively if we want a mock fallback.
     // In prod, below return ensures no unauthorized hacks to subscription mapping.
     if (!process.env.STRIPE_WEBHOOK_SECRET) {
         event = { type: 'checkout.session.completed', data: { object: { metadata: { userId: 'mocked' } } } };
     } else {
         return res.status(400).send(`Webhook Error: ${err.message}`);
     }
   }
   
   // Handle the event
   if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      
      try {
         // Update user to PREMIUM
         const { error } = await supabase.from('users').update({ plan_type: 'PREMIUM', stripe_customer_id: session.customer }).eq('id', userId);
         if (error) console.error("Could not upgrade user to premium:", error.message);
         // Insert logs etc...
      } catch (dbErr) {
         console.log("Local mock DB bypass for webhook hit");
      }
   }
   
   res.status(200).send('Webhook handled');
});

// Upgrade route specifically to handle mock local dev flows
router.post('/mock-upgrade', attachUserId, async (req, res) => {
   try {
     const { userId } = req;
     await supabase.from('users').update({ plan_type: 'PREMIUM' }).eq('id', userId);
     res.json({ success: true, message: 'Upgraded to Premium (Mock)' });
   } catch (e) {
     res.status(500).json({ error: "Failed upgrade" });
   }
});

module.exports = router;
