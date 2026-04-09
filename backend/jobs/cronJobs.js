const cron = require('node-cron');
const User = require('../models/User');
const { getStockQuote, getStockNews, getMarketTrends } = require('../services/yahooFinance');
const { sendDailyReport, sendNewsAlert, sendSuggestionsEmail } = require('../services/emailService');

function initCronJobs() {
  console.log("Initializing Cron Jobs: Daily Reports & News Alerts active.");

  // Check every minute if it is a user's chosen alert time
  cron.schedule('* * * * *', async () => {
    const nowHour = new Date().getHours().toString().padStart(2, '0');
    const nowMin = new Date().getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${nowHour}:${nowMin}`;
    
    try {
      let users = [];
      try {
         users = await User.find({});
      } catch(e) {
         console.error("Mongoose Model fetch failed in Cron:", e.message);
      }
      
      // Fallback for local testing if no database is configured
      if (users.length === 0) {
         users = [{ id: 'mock-id', email: 'viharinimihitha@gmail.com', alert_time: currentTimeStr, holdings: [] }];
      }

      const targetUsers = users.filter(u => {
          let pref = u.alert_time || '17:00';
          return pref === currentTimeStr;
      });

      if (targetUsers.length === 0) return;
      console.log(`Running daily portfolio evaluation task for ${targetUsers.length} users at ${currentTimeStr}...`);

      for (const u of targetUsers) {
        try {
          const userEmail = u.email || 'viharinimihitha@gmail.com';
          const holdings = u.holdings || [];

          if (holdings.length === 0) {
            const trends = await getMarketTrends();
            const suggestions = trends ? (trends.mostActive || trends.topGainers || []).slice(0, 3) : [];
            await sendSuggestionsEmail(userEmail, suggestions);
            continue;
          }

          let totalVal = 0;
          let totalInput = 0;
          let topGainer = null;
          let topLoser = null;

          for (const h of holdings) {
            const tickerSymbol = h.stock_name || h.ticker;
            if (!tickerSymbol) continue;

            const liveData = await getStockQuote(tickerSymbol);
            const currentPrice = liveData?.price || h.buyPrice || 0;
            const qty = h.quantity || 0;
            const buyPrice = h.buyPrice || 0; // Mongoose schema uses buyPrice camelCase!
            const pnl = (currentPrice - buyPrice) * qty;

            totalVal += currentPrice * qty;
            totalInput += buyPrice * qty;

            if (!topGainer || pnl > topGainer.profitLoss) topGainer = { ticker: tickerSymbol, profitLoss: pnl };
            if (!topLoser || (pnl < topLoser.profitLoss && pnl < 0)) topLoser = { ticker: tickerSymbol, profitLoss: pnl };
          }

          const profitObj = { pnl: totalVal - totalInput };
          await sendDailyReport(userEmail, { totalVal, profitObj, topGainer, topLoser });
        } catch (err) { console.error("Error scheduling email for user", u.id, err.message); }
      }
    } catch (e) {
      console.error("Cron Error", e);
    }
  });

  // Every 2 hours check for breaking news on user holdings
  cron.schedule('0 */2 * * *', async () => {
    console.log("Scanning for breaking news alerts...");
    try {
      let users = [];
      try {
         users = await User.find({});
      } catch(e) {}
      if (!users || users.length === 0) return;

      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
      const now = Date.now();

      for (const u of users) {
        try {
          const userEmail = u.email || 'viharinimihitha@gmail.com';
          const holdings = u.holdings || [];

          if (holdings.length === 0) continue;

          const checkedSymbols = new Set();

          for (const h of holdings) {
            const tickerSymbol = h.stock_name || h.ticker;
            if (!tickerSymbol || checkedSymbols.has(tickerSymbol)) continue;
            checkedSymbols.add(tickerSymbol);

            const newsItems = await getStockNews(tickerSymbol);
            if (!newsItems || newsItems.length === 0) continue;

            const recentNews = newsItems.find(n => {
              if (!n.providerPublishTime) return false;
              const pubTime = new Date(n.providerPublishTime).getTime();
              return (now - pubTime) < TWO_HOURS_MS;
            });

            if (recentNews) {
              await sendNewsAlert(userEmail, recentNews, tickerSymbol);
            }
          }
        } catch (err) {
          console.error("Error processing news for user", u.id, err.message);
        }
      }
    } catch (e) {
      console.error("Cron News Alert Error", e);
    }
  });
}

module.exports = initCronJobs;
