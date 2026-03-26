import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Activity, DollarSign, Search, AlertTriangle, CheckCircle } from 'lucide-react';

const MarketTrends = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState({ topGainers: [], topLosers: [], mostActive: [] });
  const [loading, setLoading] = useState(true);
  
  // Financial Analyzer State
  const [searchTicker, setSearchTicker] = useState('AAPL');
  const [financials, setFinancials] = useState(null);
  const [finLoading, setFinLoading] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/market/trends', { headers: { 'x-user-id': user?.id || 'mock' } });
        setTrends(res.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchTrends();
    fetchFinancials(searchTicker);
  }, []); // eslint-disable-line

  const fetchFinancials = async (ticker) => {
    if (!ticker) return;
    setFinLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/stock/${ticker}/financials`, { headers: { 'x-user-id': user?.id || 'mock' } });
      setFinancials(res.data);
    } catch (e) {
      setFinancials(null);
    } finally {
      setFinLoading(false);
    }
  };

  const renderList = (label, list, isBullish) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex-1 min-w-[300px]">
       <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
         {isBullish === true && <TrendingUp className="text-emerald-500" />}
         {isBullish === false && <TrendingDown className="text-rose-500" />}
         {isBullish === null && <Activity className="text-blue-500" />}
         {label}
       </h2>
       <div className="space-y-3">
          {list.map((q, i) => (
             <div key={i} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { setSearchTicker(q.symbol); fetchFinancials(q.symbol); }}>
                <div>
                   <div className="font-bold text-slate-100">{q.symbol}</div>
                   <div className="text-xs text-slate-500 truncate max-w-[120px]">{q.name || 'Company'}</div>
                </div>
                <div className="text-right">
                   <div className="font-medium text-slate-200">${q.price.toFixed(2)}</div>
                   <div className={`text-sm font-bold ${q.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {q.changePercent > 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                   </div>
                </div>
             </div>
          ))}
          {list.length === 0 && <div className="text-slate-500 text-sm py-4">No data available.</div>}
       </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Market Intelligence</h1>
        <p className="text-slate-400">Live wall street trends and deep quarterly financial analysis.</p>
      </header>

      {loading ? (
        <div className="animate-pulse flex flex-wrap gap-6 mb-8"><div className="h-96 flex-1 min-w-[300px] bg-slate-900 rounded-2xl"></div><div className="h-96 flex-1 min-w-[300px] bg-slate-900 rounded-2xl"></div></div>
      ) : (
        <div className="flex flex-wrap gap-6 mb-10">
           {renderList('Top Gainers', trends.topGainers, true)}
           {renderList('Top Losers', trends.topLosers, false)}
           {renderList('Most Active', trends.mostActive, null)}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
             <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="text-indigo-500"/> Quarterly Results Analyzer</h2>
             <p className="text-slate-400 text-sm mt-1">Check the fundamental health of any public company.</p>
           </div>
           <div className="flex gap-2 w-full md:w-auto">
             <input type="text" value={searchTicker} onChange={e => setSearchTicker(e.target.value.toUpperCase())} placeholder="Ticker (e.g. MSFT)" className="bg-slate-950 border border-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:border-indigo-500 text-white w-full md:w-48" />
             <button onClick={() => fetchFinancials(searchTicker)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-white font-medium flex items-center justify-center transition-colors">
               <Search size={20} />
             </button>
           </div>
         </div>

         {finLoading ? <div className="h-40 animate-pulse bg-slate-950/50 rounded-2xl"></div> : financials ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-950 border border-slate-800/50 rounded-2xl">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Revenue Growth</div>
                    <div className={`text-2xl font-black ${financials.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {(financials.revenueGrowth * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-5 bg-slate-950 border border-slate-800/50 rounded-2xl">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Profit Margins</div>
                    <div className={`text-2xl font-black ${financials.profitMargins >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {(financials.profitMargins * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                 {financials.revenueGrowth < 0 || financials.profitMargins <= 0 ? (
                    <div className="w-full p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 text-rose-100">
                       <AlertTriangle className="text-rose-400 shrink-0" size={32} />
                       <div>
                         <h3 className="font-bold text-xl text-rose-400">Warning: Declining Fundamentals</h3>
                         <p className="text-sm mt-1 opacity-90">This company is struggling with negative revenue growth or poor profit yields natively in its quarterly results. High risk of capital depreciation.</p>
                       </div>
                    </div>
                 ) : (
                    <div className="w-full p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-emerald-100">
                       <CheckCircle className="text-emerald-400 shrink-0" size={32} />
                       <div>
                         <h3 className="font-bold text-xl text-emerald-400">Company is Performing Strong</h3>
                         <p className="text-sm mt-1 opacity-90">Positive operational growth and excellent profit margins structurally support this company's quarterly execution.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>
         ) : (
           <div className="text-slate-500 py-8 text-center bg-slate-950/30 rounded-2xl border border-slate-800/50 border-dashed">No financial data available for '{searchTicker}'.</div>
         )}
      </div>
    </div>
  );
};
export default MarketTrends;
