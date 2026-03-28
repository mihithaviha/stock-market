const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mock@gmail.com',
    pass: process.env.EMAIL_PASS || 'mockpassword',
  },
});

async function sendDailyReport(userEmail, portfolioSummary) {
  const { totalVal, profitObj, topGainer, topLoser } = portfolioSummary;
  const isUp = profitObj.pnl >= 0;
  
  const text = `Your portfolio is ${isUp ? 'up' : 'down'} by ₹${Math.abs(profitObj.pnl).toFixed(2)} today 📈\n` +
               `Top gainer: ${topGainer?.ticker || 'N/A'}\nTop loser: ${topLoser?.ticker || 'N/A'}`;
               
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

  try {
    // If we have no real creds, just log to console to simulate production
    console.log("-----------------------------------------");
    console.log(`[EMAIL DISPATCHED TO: ${userEmail}]`);
    console.log(text);
    console.log("-----------------------------------------");
    
    // Fallback logic to physically send if config is present
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock@ethereal.email') {
       await transporter.sendMail({ from: '"PortfolioPro" <alerts@portfoliopro.com>', to: userEmail, subject: 'Your Daily Portfolio Digest', text, html });
    }
  } catch(e) { console.error("Email failed:", e); }
}

async function sendNewsAlert(userEmail, newsArticle, stockTicker) {
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
  
  try {
    console.log("-----------------------------------------");
    console.log(`[NEWS ALERT TO: ${userEmail}] -> ${newsArticle.title}`);
    console.log("-----------------------------------------");
    
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock@ethereal.email') {
       await transporter.sendMail({ from: '"PortfolioPro" <alerts@portfoliopro.com>', to: userEmail, subject: `Smart Alert: ${stockTicker} is in the news`, html });
    }
  } catch(e) {
    console.warn("Email omitted or config missing:", e.message || 'No config');
  }
}

async function sendSuggestionsEmail(userEmail, trendingStocks) {
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
  
  try {
    console.log("-----------------------------------------");
    console.log(`[SUGGESTIONS EMAIL TO: ${userEmail}]`);
    console.log("-----------------------------------------");
    
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock@ethereal.email') {
       await transporter.sendMail({ from: '"PortfolioPro" <alerts@portfoliopro.com>', to: userEmail, subject: 'Your Daily Stock Suggestions', html });
    }
  } catch(e) {
    console.warn("Email omitted or config missing:", e.message || 'No config');
  }
}

module.exports = { sendDailyReport, sendNewsAlert, sendSuggestionsEmail };
