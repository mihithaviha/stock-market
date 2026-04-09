const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { getStockQuote, getStockNews } = require('./services/yahooFinance');
const { getCache, setCache } = require('./services/redisClient');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const emailRoutes = require('./routes/emailRoutes');
const { sendGeneralNotification } = require('./services/emailService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use('/api/stripe', subscriptionRoutes);
app.use(express.json());

const passport = require('passport');
app.use(passport.initialize());

app.use('/api/emails', emailRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://viharinimihitha_db_user:8uQFnYBcNNHV25Z2@cluster0.cacoaz2.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB Connected 🔥"))
  .catch(err => console.log(err));

app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);

// sample route for Render uptime checker
app.get("/", (req, res) => {
  res.send("Server running");
});

// Background live pricing loop (10 secs)
const activeTickers = new Set();
io.on('connection', (socket) => {
  socket.on('subscribe_ticker', (ticker) => { activeTickers.add(ticker); });
});

setInterval(async () => {
  if (activeTickers.size === 0) return;
  const tickerArr = Array.from(activeTickers);
  const updates = {};
  for (const t of tickerArr) {
    // Check cache first for 10s caching layer
    let price = await getCache(`price_${t}`);
    if (!price) {
      const live = await getStockQuote(t);
      if (live) { price = live.price; await setCache(`price_${t}`, price, 10); }
    }
    if (price) updates[t] = price;
  }
  if (Object.keys(updates).length > 0) io.emit('live_prices', updates);
}, 10000);

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.status(200).json({ 
      mongoState: states[state] || state,
      uri: mongoose.connection.host || "No host resolved"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { attachUserId } = require('./middleware/authMiddleware');
const User = require('./models/User');

app.post('/api/portfolio/add', attachUserId, async (req, res) => {
  const { ticker, quantity, buyPrice } = req.body;
  if (!ticker || quantity == null || buyPrice == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const user = await User.findById(req.userId);
    user.holdings.push({ ticker: ticker.toUpperCase(), quantity, buyPrice });
    await user.save();

    // Get the newly added subdocument
    const newHolding = user.holdings[user.holdings.length - 1];

    // Fire off async email alert secretly
    sendGeneralNotification(
      user.email,
      user.first_name || 'Trader',
      `Stock Purchase Confirmation: ${ticker.toUpperCase()}`,
      `<div style="font-family:sans-serif; background:#f4f4f4; padding:20px;">
         <h2 style="color:#0f172a;">Purchase Successful 🚀</h2>
         <p>You have successfully added <strong>${quantity} shares</strong> of <strong>${ticker.toUpperCase()}</strong> to your portfolio.</p>
         <p><strong>Average Buy Price:</strong> ₹${buyPrice}</p>
         <p><strong>Total Capital Invested:</strong> ₹${(quantity * buyPrice).toFixed(2)}</p>
         <p style="color:#64748b; font-size:12px;">This is an automated transaction receipt from Tradezy.</p>
       </div>`
    ).catch(e => console.error("Email Error:", e));

    res.status(201).json({ ...newHolding.toObject(), stock_name: newHolding.ticker });
  } catch (err) {
    console.error("Add Stock DB Error:", err.message);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

app.get('/api/portfolio', attachUserId, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new Error("No user found");
    const formattedHoldings = user.holdings.map(h => ({
      ...h.toObject(),
      stock_name: h.ticker,
      buy_price: h.buyPrice,
      id: h._id
    }));
    await sendPortfolioResponse(formattedHoldings, res);
  } catch (err) {
    console.error("Portfolio fetch error:", err.message);
    res.status(200).json([]);
  }
});

async function sendPortfolioResponse(holdingsList, res) {
  const portfolioWithLivePrices = await Promise.all(holdingsList.map(async (h) => {
    const tickerSymbol = h.stock_name || h.ticker;
    const liveData = await getStockQuote(tickerSymbol);
    const currentPrice = liveData ? liveData.price : h.buy_price;
    const name = liveData ? liveData.name : tickerSymbol;
    const profitLoss = (currentPrice - h.buy_price) * h.quantity;
    const dayChange = liveData ? liveData.changePercent : 0;

    return {
      ...h,
      id: h.id,
      ticker: tickerSymbol,
      name,
      currentPrice,
      dayChange,
      profitLoss
    };
  }));
  res.status(200).json(portfolioWithLivePrices);
}

app.post('/api/portfolio/sell', attachUserId, async (req, res) => {
  const { id, ticker, sellPrice, quantity, buyPrice } = req.body;
  try {
    const user = await User.findById(req.userId);
    user.holdings = user.holdings.filter(h => h._id.toString() !== id.toString());
    await user.save();

    sendGeneralNotification(
      user.email,
      user.first_name || 'Trader',
      `Position Closed: ${ticker.toUpperCase()}`,
      `<div style="font-family:sans-serif; background:#f4f4f4; padding:20px;">
         <h2 style="color:#0f172a;">Sale Successful 💰</h2>
         <p>You have successfully closed your position of <strong>${quantity} shares</strong> in <strong>${ticker.toUpperCase()}</strong>.</p>
         <p><strong>Exit Price:</strong> ₹${sellPrice}</p>
         <p style="color:#64748b; font-size:12px;">This is an automated transaction receipt from Tradezy.</p>
       </div>`
    ).catch(e => console.error("Email Error:", e));

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to record sell transaction" });
  }
});

app.get('/api/history', attachUserId, async (req, res) => {
  // Assuming a separate History model is not used, skip for now.
  res.status(200).json([]);
});

app.get('/api/news', attachUserId, async (req, res) => {
  try {
    let tickersToSearch = ['SPY', 'QQQ', 'DIA']; // Always include market-wide news
    try {
      const { data: holdings } = await supabase.from('holdings').select('stock_name, ticker').eq('user_id', req.userId);
      if (holdings && holdings.length > 0) {
        tickersToSearch.push(...holdings.map(h => h.stock_name || h.ticker).slice(0, 3));
      } else {
        const localH = localHoldings.filter(h => h.user_id === req.userId);
        tickersToSearch.push(...localH.map(h => h.stock_name || h.ticker).slice(0, 3));
      }
    } catch (e) { }

    // Deduplicate tickers
    tickersToSearch = [...new Set(tickersToSearch)];

    const unflattenedNews = await Promise.all(tickersToSearch.map(t => getStockNews(t)));
    const news = unflattenedNews.flat().slice(0, 15);

    res.status(200).json(news);
  } catch (err) {
    if (!err?.message?.includes('fetch failed')) {
      console.error("News fetch error:", err.message);
    }
    res.status(200).json([]);
  }
});

app.get('/api/user/preferences', attachUserId, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('alert_time first_name last_name phone address');
    if (!user) throw new Error("No user found");
    res.status(200).json(user);
  } catch (e) {
    res.status(200).json({ alert_time: '17:00' });
  }
});

app.post('/api/user/preferences', attachUserId, async (req, res) => {
  const { alert_time, first_name, last_name, phone, address } = req.body;
  try {
    await User.findByIdAndUpdate(req.userId, { alert_time, first_name, last_name, phone, address });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

const { getMarketTrends, getStockFinancials, searchStocks } = require('./services/yahooFinance');

app.get('/api/market/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json([]);
  const results = await searchStocks(query);
  res.status(200).json(results || []);
});

app.get('/api/market/trends', attachUserId, async (req, res) => {
  const trends = await getMarketTrends();
  if (trends) res.status(200).json(trends);
  else res.status(500).json({ error: "Failed to fetch trends" });
});

app.get('/api/market/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const liveData = await getStockQuote(ticker);
  if (liveData) res.status(200).json({ ticker, currentPrice: liveData.price });
  else res.status(404).json({ error: 'Not found' });
});

app.get('/api/stock/:ticker/financials', attachUserId, async (req, res) => {
  const fin = await getStockFinancials(req.params.ticker.toUpperCase());
  if (fin) res.status(200).json(fin);
  else res.status(500).json({ error: "Failed to fetch financials" });
});

const { GoogleGenAI } = require('@google/genai');



app.post('/api/chatbot', attachUserId, async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'mock-key') {
      return res.status(200).json({
        reply: "I am a local AI placeholder! You'll need to add your GEMINI_API_KEY to the backend .env file to enable my true stock analysis capabilities."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction || `You are TradezyAssistant, the official AI Customer Care and Stock Expert for Tradezy.
1. Customer Care: Answer gently, apologize for issues, help users navigate the app.
2. App Knowledge: Tradezy has a Dashboard (shows news and portfolio), Portfolio (buy/sell stocks), Market Trends, Learn Stocks (educational), and History. To add a stock, users click the big "Add Stock" button in Portfolio.
3. Stock Market: Give crisp, data-driven financial advice. Never guarantee returns. Format your text nicely with bullet points and bold text for easy reading. Minimum fluff, maximum value.`,
        temperature: 0.7
      }
    });

    res.status(200).json({ reply: response.text });
  } catch (e) {
    console.error("ChatBot Error:", e.message);
    res.status(500).json({ error: "Failed to process chat query" });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    let totalHoldings = 0;
    let totalValue = 0;

    // Rough calculation on small deployments
    const allUsers = await User.find({}).select('holdings');
    allUsers.forEach(u => {
      totalHoldings += u.holdings.length;
      totalValue += u.holdings.reduce((acc, h) => acc + (h.buyPrice * h.quantity), 0) * 1.15;
    });

    res.status(200).json({
      totalUsers: usersCount,
      totalHoldings,
      totalValue,
      systemHealth: 'Online'
    });
  } catch (error) {
    res.status(200).json({
      totalUsers: 0,
      totalHoldings: 0,
      totalValue: 0,
      systemHealth: 'Degraded'
    });
  }
});

const initCronJobs = require('./jobs/cronJobs');

initCronJobs();

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Attempting to restart or please close other instances.`);
      process.exit(1);
    } else {
      console.error(err);
    }
  });
};

startServer(PORT);
