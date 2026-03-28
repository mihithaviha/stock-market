import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Activity, TrendingUp, AlertTriangle, Newspaper, TrendingDown, Wallet, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Award, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const API_URL = 'http://localhost:5000/api';
      const headers = { 'x-user-id': user?.id || 'mock-id' };
      
      const [portfolioRes, newsRes] = await Promise.all([
        axios.get(`${API_URL}/portfolio`, { headers }),
        axios.get(`${API_URL}/news`, { headers })
      ]);
      setHoldings(portfolioRes.data);
      setNews(newsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s poll 
    return () => clearInterval(interval);
  }, [user]);

  // Calculations
  const totalInvested = holdings.reduce((acc, h) => acc + (h.buy_price * h.quantity), 0);
  const currentVal = holdings.reduce((acc, h) => acc + (h.currentPrice * h.quantity), 0);
  const totalPnL = currentVal - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  // Daily Gain Mock calculation based on dayChange of individual stocks
  const dailyGain = holdings.reduce((acc, h) => {
     const val = h.currentPrice * h.quantity;
     const dayChangeAmt = val - (val / (1 + (h.dayChange/100)));
     return acc + dayChangeAmt;
  }, 0);

  // Top gainer and loser
  let topGainer = null;
  let topLoser = null;
  if (holdings.length > 0) {
    const sorted = [...holdings].sort((a,b) => {
      const aPct = ((a.currentPrice - a.buy_price)/a.buy_price);
      const bPct = ((b.currentPrice - b.buy_price)/b.buy_price);
      return bPct - aPct;
    });
    topGainer = sorted[0];
    topLoser = sorted[sorted.length-1];
  }

  // Simulate historical growth array for chart
  const generateHistory = () => {
    if (holdings.length === 0) return [];
    let hist = [];
    const now = new Date();
    // Simulate 7 data points ending at currentVal
    for(let i=6; i>=0; i--) {
      const d = new Date(now.getTime() - i*24*60*60*1000);
      const ratio = 1 - (i*0.02) + (Math.random()*0.02); // slight trend downwards as going back
      hist.push({
        name: d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
        value: i === 0 ? currentVal : parseFloat((currentVal * ratio).toFixed(2))
      });
    }
    return hist;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio Overview</h1>
        <p className="text-slate-400">Welcome back! Here's how your investments are performing.</p>
      </header>

      {loading && holdings.length === 0 ? (
        <div className="animate-pulse space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="h-32 bg-slate-900 rounded-2xl"></div><div className="h-32 bg-slate-900 rounded-2xl"></div><div className="h-32 bg-slate-900 rounded-2xl"></div><div className="h-32 bg-slate-900 rounded-2xl"></div></div>
           <div className="h-80 bg-slate-900 rounded-2xl"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5"><Wallet size={120} /></div>
              <div className="text-slate-400 text-sm font-medium mb-2">Total Invested</div>
              <div className="text-3xl font-bold">₹{totalInvested.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5"><PieChartIcon size={120} /></div>
              <div className="text-slate-400 text-sm font-medium mb-2">Current Value</div>
              <div className="text-3xl font-bold">₹{currentVal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="text-slate-400 text-sm font-medium mb-2">Total Profit / Loss</div>
              <div className={`text-3xl font-bold flex items-center gap-2 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
              <div className={`text-sm mt-1 font-medium ${totalPnL >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}% All Time
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="text-slate-400 text-sm font-medium mb-2">Today's Gain</div>
              <div className={`text-3xl font-bold flex items-center gap-2 ${dailyGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dailyGain >= 0 ? <ArrowUpRight size={28}/> : <ArrowDownRight size={28}/>}
                ₹{Math.abs(dailyGain).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col min-h-[400px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="text-blue-500"/> Portfolio Growth</h2>
              <div className="flex-1 w-full -ml-4">
                {holdings.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateHistory()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => '₹'+v} domain={['auto', 'auto']} width={80}/>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-500">Add stocks to your portfolio to view the growth chart.</div>
                )}
              </div>
            </div>

            {/* Smart Insights Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Award className="text-yellow-500"/> Smart Insights</h2>
                 {holdings.length > 0 && topGainer ? (
                   <div className="space-y-4">
                     <div className="p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
                       <div className="text-xs text-slate-400 font-medium tracking-wide uppercase mb-1">Top Performer</div>
                       <div className="flex justify-between items-center">
                         <span className="font-bold text-lg text-emerald-400">{topGainer.ticker}</span>
                         <span className="text-emerald-500 font-medium text-sm">+₹{topGainer.profitLoss.toFixed(2)}</span>
                       </div>
                     </div>
                     <div className="p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
                       <div className="text-xs text-slate-400 font-medium tracking-wide uppercase mb-1">Needs Attention</div>
                       <div className="flex justify-between items-center">
                         <span className="font-bold text-lg text-rose-400">{topLoser.ticker}</span>
                         <span className="text-rose-500 font-medium text-sm">₹{topLoser.profitLoss.toFixed(2)}</span>
                       </div>
                     </div>
                     <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-100">
                        <AlertCircle className="shrink-0 text-blue-400" size={20} />
                        <span className="text-sm">Based on market trends, <strong className="text-blue-400">{topGainer.ticker}</strong> is currently showing strong growth potential! 📈</span>
                     </div>
                   </div>
                 ) : (
                    <div className="text-slate-500 py-4">Not enough data for insights yet.</div>
                 )}
              </div>

              {/* News Alert box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-h-[500px] overflow-auto">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Newspaper className="text-indigo-400"/> Relevant News</h2>
                 <div className="space-y-4">
                   {news.length === 0 ? (
                     <div className="text-slate-500">No breaking news found for your holdings.</div>
                   ) : news.map((article, i) => (
                     <a key={i} href={article.link} target="_blank" rel="noreferrer" className="block p-4 bg-slate-950 border border-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group">
                       <div className="text-xs font-semibold text-indigo-400 mb-1">{article.publisher}</div>
                       <div className="text-sm text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</div>
                     </a>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
