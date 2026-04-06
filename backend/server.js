const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const supabase = require('./supabase');
const { getStockQuote, getStockNews } = require('./services/yahooFinance');
const { getCache, setCache } = require('./services/redisClient');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const emailRoutes = require('./routes/emailRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 5000;

app.use(cors());

// Webhooks must be before express.json() if they use raw parsing at router level
app.use('/api/stripe', subscriptionRoutes);

app.use(express.json());

app.use('/api/emails', emailRoutes);

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

const { attachUserId } = require('./middleware/authMiddleware');

// In-memory fallback if no valid Supabase .env is found
let localHoldings = [];
let localHistory = [];
let localPreferences = {};
let localIdCounter = 1;

app.post('/api/portfolio/add', attachUserId, async (req, res) => {
  const { ticker, quantity, buyPrice } = req.body;
  if (!ticker || quantity == null || buyPrice == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const { data, error } = await supabase
      .from('holdings')
      .insert([{ user_id: req.userId, stock_name: ticker.toUpperCase(), quantity, buy_price: buyPrice }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    if (err.message && err.message.includes('fetch failed')) {
      const newHolding = { id: localIdCounter++, user_id: req.userId, stock_name: ticker.toUpperCase(), quantity, buy_price: buyPrice };
      localHoldings.push(newHolding);
      return res.status(201).json(newHolding);
    }
    console.error("Add Stock DB Error:", err.message);
    res.status(500).json({ error: 'Failed to add stock' }); 
  }
});

app.get('/api/portfolio', attachUserId, async (req, res) => {
  try {
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', req.userId);

    if (error) throw error;
    await sendPortfolioResponse(holdings, res);
  } catch (err) {
    if (err.message && err.message.includes('fetch failed')) {
      const targetHoldings = localHoldings.filter(h => h.user_id === req.userId);
      return await sendPortfolioResponse(targetHoldings, res);
    }
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
    await supabase.from('holdings').delete().eq('id', id);
    await supabase.from('history').insert([{
       user_id: req.userId, stock_name: ticker, quantity, buy_price: buyPrice, sell_price: sellPrice
    }]);
    res.status(200).json({ success: true });
  } catch (e) {
    if (e.message && e.message.includes('fetch failed')) {
      localHoldings = localHoldings.filter(h => h.id !== id);
      localHistory.push({ id: localIdCounter++, user_id: req.userId, stock_name: ticker, quantity, buy_price: buyPrice, sell_price: sellPrice });
      return res.status(200).json({ success: true });
    }
    res.status(500).json({ error: "Failed to record sell transaction" });
  }
});

app.get('/api/history', attachUserId, async (req, res) => {
  try {
    const { data: history, error } = await supabase.from('history').select('*').eq('user_id', req.userId);
    if (error) throw error;
    
    const mapped = history.map(h => ({ ...h, ticker: h.stock_name || h.ticker }));
    res.status(200).json(mapped);
  } catch (e) {
    if (e.message && e.message.includes('fetch failed')) {
      const mapped = localHistory.filter(h => h.user_id === req.userId).map(h => ({ ...h, ticker: h.stock_name || h.ticker }));
      return res.status(200).json(mapped);
    }
    console.error("History fetch error:", e.message);
    res.status(200).json([]);
  }
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
    } catch(e) {}
    
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
      const { data, error } = await supabase.from('users').select('alert_time').eq('id', req.userId).single();
      if (error) throw error;
      res.status(200).json(data);
   } catch(e) {
      if (e.message && e.message.includes('fetch failed')) {
         return res.status(200).json(localPreferences[req.userId] || { alert_time: '17:00' });
      }
      res.status(200).json({ alert_time: '17:00' });
   }
});

app.post('/api/user/preferences', attachUserId, async (req, res) => {
   const { alert_time } = req.body;
   try {
      const { error } = await supabase.from('users').update({ alert_time }).eq('id', req.userId);
      if (error) throw error;
      res.status(200).json({ success: true });
   } catch(e) {
      if (e.message && e.message.includes('fetch failed')) {
         localPreferences[req.userId] = { ...localPreferences[req.userId], alert_time };
         return res.status(200).json({ success: true });
      }
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
  else res.status(404).json({error: 'Not found'});
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
             systemInstruction: systemInstruction || "You are a professional, easy-to-understand Stock Market AI Assistant.",
             temperature: 0.7
         }
     });

     res.status(200).json({ reply: response.text });
  } catch(e) {
     console.error("ChatBot Error:", e.message);
     res.status(500).json({ error: "Failed to process chat query" });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // Fallback logic for local mock state
    let totalHoldings = 145;
    let totalValue = 2450800.50;
    
    try {
      const { data: allHoldings } = await supabase.from('holdings').select('*');
      if (allHoldings && allHoldings.length > 0) {
        totalHoldings = allHoldings.length;
        totalValue = allHoldings.reduce((acc, h) => acc + (h.buy_price * h.quantity), 0) * 1.15; // approximate live value
      }
    } catch(e) {}
    
    res.status(200).json({
       totalUsers: usersCount || 42,
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
