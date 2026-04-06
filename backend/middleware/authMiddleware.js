const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-replace-in-production';

const attachUserId = (req, res, next) => {
  // First try Bearer Token from Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userPlan = decoded.plan_type || 'FREE';
      return next();
    } catch (err) {
      console.log("JWT Verification Error:", err.message);
      return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
  }

  // Fallback to the old logic so the app doesn't break entirely if frontend isn't 100% migrated yet
  const userId = req.headers['x-user-id'] || 'mock-user-id-123';
  req.userId = userId;
  req.userPlan = 'FREE'; // Mock old users as free users
  next();
};

module.exports = { attachUserId, JWT_SECRET };
