const cron = require('node-cron');
const supabase = require('../supabase');
const { getStockQuote, getStockNews } = require('../services/yahooFinance');
const { sendDailyReport, sendNewsAlert } = require('../services/emailService');

function initCronJobs() {
  console.log("Initializing Cron Jobs: Daily Reports & News Alerts active.");
  
  // Every day at 5:00 PM (Market Close)
  cron.schedule('0 17 * * *', async () => {
     console.log("Running daily portfolio evaluation task...");
     try {
       // We mock finding the user, but in prod we'd iterate over all users 
       // fetching their DB holdings, resolving live prices, sorting gainers, and dispatching template
       const mockSummary = {
          totalVal: 154000.50,
          profitObj: { pnl: 2300.40 },
          topGainer: { ticker: 'TCS', profitLoss: 3400 },
          topLoser: { ticker: 'INFY', profitLoss: -800 }
       };
       await sendDailyReport('user@example.com', mockSummary);
     } catch (e) {
       console.error("Cron Error", e);
     }
  });

  // Every 2 hours check for breaking news on user holdings
  cron.schedule('0 */2 * * *', async () => {
     console.log("Scanning for breaking news alerts...");
     // Mocking an alert check that found a relevant article
     await sendNewsAlert('user@example.com', { title: "Reliance stock is rising due to new multi-billion dollar deal", publisher: "Financial Express", link: "#" }, "RELIANCE");
  });
}

module.exports = initCronJobs;
