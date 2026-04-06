const nodemailer = require('nodemailer');
const {
  getWelcomeEmailHtml,
  getLoginAlertHtml,
  getGeneralNotificationHtml,
  getOtpEmailHtml
} = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mock@gmail.com',
    pass: process.env.EMAIL_PASS || 'mockpassword',
  },
});

// A lightweight asynchronous queue to process emails in the background
const emailQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (emailQueue.length > 0) {
    const emailTask = emailQueue.shift();
    try {
      await transporter.sendMail(emailTask);
      console.log(`[Email Sent] Successfully dispatched to: ${emailTask.to}`);
    } catch (error) {
      console.error(`[Email Failed] Could not dispatch to ${emailTask.to}:`, error.message);
      // Re-queue or alert admin logic can go here
      if (emailTask.retries < 3) {
        emailTask.retries++;
        emailQueue.push(emailTask);
      }
    }
    // Small delay to prevent rate-limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  isProcessingQueue = false;
};

// Queue helper
const dispatchEmail = (mailOptions) => {
  // If no real env vars, mockup log
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'mock@ethereal.email' || process.env.EMAIL_USER === 'mock@gmail.com') {
    console.log("-----------------------------------------");
    console.log(`[EMAIL DISPATCHED TO: ${mailOptions.to}]`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log("-----------------------------------------");
    return; // Mocking exit
  }

  emailQueue.push({ ...mailOptions, retries: 0 });
  processQueue();
};

/* --- EMAIL TRACKER --- */
const emailTracker = {};

const shouldSendEmail = (userEmail, type, frequency = 'once') => {
  if (!emailTracker[userEmail]) emailTracker[userEmail] = {};
  const now = Date.now();
  const lastSent = emailTracker[userEmail][type];

  if (frequency === 'once') {
    if (lastSent) return false; // Already sent ever
    emailTracker[userEmail][type] = now;
    return true;
  } else if (frequency === 'daily') {
    if (lastSent && (now - lastSent < 24 * 60 * 60 * 1000)) return false; // Already sent today
    emailTracker[userEmail][type] = now;
    return true;
  }
  return true;
};

const ownerSender = '"Viharinimihitha" <viharinimihitha@gmail.com>';

/* --- NEW EMAIL METHODS --- */

async function sendWelcomeEmail(userEmail, userName, tempPassword = null) {
  if (!shouldSendEmail(userEmail, 'welcome', 'once')) return;

  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
  const html = getWelcomeEmailHtml(userName, loginUrl, tempPassword);

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: 'Welcome to PortfolioPro! Your Account is Ready',
    html,
  });
}

async function sendLoginAlert(userEmail, userName, metadata) {
  if (!shouldSendEmail(userEmail, 'loginAlert', 'daily')) return;

  const { time, device, location } = metadata;
  const html = getLoginAlertHtml(userName, time, device, location);

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: 'Security Alert: New Login to PortfolioPro',
    html,
  });
}

async function sendGeneralNotification(userEmail, userName, title, messageHtml) {
  if (!shouldSendEmail(userEmail, 'notification_' + title, 'once')) return;

  const html = getGeneralNotificationHtml(userName, title, messageHtml);

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: title,
    html,
  });
}

async function sendOtpEmail(userEmail, userName, otpCode) {
  // OTP can be sent multiple times, but let's rate limit it to once per 5 mins?
  // Let's just bypass constraint or let them have it daily
  // Given user said "evry mail should be send once only", we do it 'once'
  if (!shouldSendEmail(userEmail, 'otp_' + otpCode, 'once')) return;

  const html = getOtpEmailHtml(userName, otpCode);

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: 'Your PortfolioPro Verification Code',
    html,
  });
}

/* --- EXISTING EMAIL METHODS (Updated to use queue) --- */

async function sendDailyReport(userEmail, portfolioSummary) {
  if (!shouldSendEmail(userEmail, 'dailyReport', 'daily')) return;

  const { totalVal, profitObj, topGainer, topLoser } = portfolioSummary;
  const isUp = profitObj.pnl >= 0;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a;">Portfolio<span style="color: #3b82f6;">Pro</span> Daily Digest</h2>
      <p style="font-size: 16px;">Hello,</p>
      <p style="font-size: 18px; font-weight: bold;">
        Your portfolio is ${isUp ? '<span style="color: #10b981;">up 📈</span>' : '<span style="color: #ef4444;">down 📉</span>'} 
        by <span style="font-size: 22px;">₹${Math.abs(profitObj.pnl).toFixed(2)}</span> today.
      </p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #334155;">Market Highlights</h3>
        <p><strong>Top Gainer:</strong> ${topGainer?.ticker || 'N/A'} <span style="color: #10b981;">(+₹${topGainer?.profitLoss?.toFixed(2) || 0})</span></p>
        <p><strong>Top Loser:</strong> ${topLoser?.ticker || 'N/A'} <span style="color: #ef4444;">(₹${topLoser?.profitLoss?.toFixed(2) || 0})</span></p>
      </div>
      
      <div style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
        Sent automatically by PortfolioPro • Total Value: ₹${totalVal.toFixed(2)}
      </div>
    </div>
  `;

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: 'Your Daily Portfolio Digest',
    html,
  });
}

async function sendNewsAlert(userEmail, newsArticle, stockTicker) {
  if (!shouldSendEmail(userEmail, 'newsAlert_' + stockTicker, 'daily')) return;

  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a;">Smart Alert: ${stockTicker}</h2>
        <p style="font-size: 16px;">Breaking news regarding a stock in your portfolio:</p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px;">
          <h3 style="color: #1e40af; margin-top: 0;">${newsArticle.title}</h3>
          <p style="color: #3b82f6;">Source: ${newsArticle.publisher}</p>
          <a href="${newsArticle.link}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Read Full Article</a>
        </div>
      </div>
  `;

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: `Smart Alert: ${stockTicker} is in the news`,
    html,
  });
}

async function sendSuggestionsEmail(userEmail, trendingStocks) {
  if (!shouldSendEmail(userEmail, 'suggestions', 'daily')) return;

  const trendingHtmlItems = trendingStocks.map(stock =>
    `<li><strong>${stock.symbol}</strong> - ${stock.name}</li>`
  ).join('');

  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a;">Portfolio<span style="color: #3b82f6;">Pro</span> Suggestions</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">We noticed you haven't added any stocks to your portfolio yet! Here are some trending stocks you might be interested in:</p>
        <ul style="background-color: #f8fafc; padding: 15px 15px 15px 35px; border-radius: 8px; margin: 20px 0;">
          ${trendingHtmlItems.length > 0 ? trendingHtmlItems : '<li><em>No trending stocks available right now.</em></li>'}
        </ul>
        <div style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
          Sent automatically by PortfolioPro
        </div>
      </div>
  `;

  dispatchEmail({
    from: ownerSender,
    to: userEmail,
    subject: 'Your Daily Stock Suggestions',
    html,
  });
}

module.exports = {
  sendDailyReport,
  sendNewsAlert,
  sendSuggestionsEmail,
  sendWelcomeEmail,
  sendLoginAlert,
  sendGeneralNotification,
  sendOtpEmail
};
