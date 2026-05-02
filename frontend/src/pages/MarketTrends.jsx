import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { TrendingUp, TrendingDown, Activity, DollarSign, Search, AlertTriangle, CheckCircle } from 'lucide-react';

const MarketTrends = () => {
  const { user } = useAuth();
  const { livePrices, subscribeToTicker } = useWebSocket();
  const [trends, setTrends] = useState({ topGainers: [], topLosers: [], mostActive: [] });
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  
  // Financial Analyzer State
  const [searchTicker, setSearchTicker] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [financials, setFinancials] = useState(null);
  const [finLoading, setFinLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTicker.trim() !== '') {
        setIsSearching(true);
        try {
          const res = await api.get(`/market/search?q=${searchTicker}`);
          setSearchResults(res.data);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTicker]);

  useEffect(() => {
    const fetchTrends = async () => {
      const cached = sessionStorage.getItem('marketTrendsCache');
      if (cached) {
        setTrends(JSON.parse(cached));
        setLoading(false);
      }
      try {
        const res = await api.get(`/market/trends`);
        setTrends(res.data);
        sessionStorage.setItem('marketTrendsCache', JSON.stringify(res.data));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchTrends();
  }, []); // eslint-disable-line

  useEffect(() => {
     // Subscribe to all trend tickers to get live prices
     const allTickers = [...trends.topGainers, ...trends.topLosers, ...trends.mostActive].map(t => t.symbol);
     allTickers.forEach(t => subscribeToTicker(t));
  }, [trends, subscribeToTicker]);

  const fetchFinancials = async (ticker) => {
    if (!ticker) {
       setFinancials(null);
       return;
    }
    setFinLoading(true);
    try {
      const res = await api.get(`/stock/${ticker}/financials`);
      setFinancials(res.data);
    } catch (e) {
      setFinancials(null);
    } finally {
      setFinLoading(false);
    }
  };

  const renderList = (label, list, isBullish) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex-1 min-w-[300px] transition-colors duration-200">
       <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50 transition-colors">
         {isBullish === true && <TrendingUp className="text-emerald-500" />}
         {isBullish === false && <TrendingDown className="text-rose-500" />}
         {isBullish === null && <Activity className="text-blue-500" />}
         {label}
       </h2>
       <div className="space-y-3">
          {list.slice(0, visibleCount).map((q, i) => {
             const livePrice = livePrices[q.symbol] || q.price;
             const diff = livePrice - q.price;
             // Calculate accurate current percentage based on live price over the base open price
             // We estimate base by doing q.price / (1 + q.changePercent/100) (not perfect but gets the live shift)
             const basePrice = q.price / (1 + (q.changePercent/100));
             const liveChangePercent = basePrice > 0 ? ((livePrice - basePrice) / basePrice) * 100 : q.changePercent;
             
             return (
             <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { setSearchTicker(q.symbol); fetchFinancials(q.symbol); }}>
                <div>
                   <div className="font-bold text-slate-900 dark:text-slate-100 transition-colors">{q.symbol}</div>
                   <div className="text-xs text-slate-500 dark:text-slate-500 truncate max-w-[120px] transition-colors">{q.name || 'Company'}</div>
                </div>
                <div className="text-right">
                   <div className="font-medium text-slate-800 dark:text-slate-200 transition-colors">${livePrice.toFixed(2)}</div>
                   <div className={`text-sm font-bold ${liveChangePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} transition-colors`}>
                     {liveChangePercent > 0 ? '+' : ''}{liveChangePercent.toFixed(2)}%
                   </div>
                </div>
             </div>
          )})}
          {list.length === 0 && <div className="text-slate-500 text-sm py-4 transition-colors">No data available.</div>}
       </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Market Intelligence</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Live wall street trends and deep quarterly financial analysis.</p>
      </header>

      {loading ? (
        <div className="animate-pulse flex flex-wrap gap-6 mb-8"><div className="h-96 flex-1 min-w-[300px] bg-slate-200 dark:bg-slate-900 rounded-2xl transition-colors"></div><div className="h-96 flex-1 min-w-[300px] bg-slate-200 dark:bg-slate-900 rounded-2xl transition-colors"></div></div>
      ) : (
        <div className="mb-10">
          <div className="flex flex-wrap gap-6">
             {renderList('Top Gainers', trends.topGainers, true)}
             {renderList('Top Losers', trends.topLosers, false)}
             {renderList('Most Active', trends.mostActive, null)}
          </div>
          {(trends.topGainers.length > visibleCount || trends.topLosers.length > visibleCount || trends.mostActive.length > visibleCount) && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-xl font-medium transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors duration-200">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
             <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><DollarSign className="text-indigo-500"/> Quarterly Results Analyzer</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Check the fundamental health of any public company.</p>
           </div>
           <div className="flex gap-2 w-full md:w-auto relative">
             <div className="relative w-full md:w-72">
                 <input type="text" value={searchTicker} onChange={e => { setSearchTicker(e.target.value.toUpperCase()); setShowDropdown(true); }} placeholder="Ticker or Name (e.g. MSFT)" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-white w-full transition-colors" />
                 {isSearching && <div className="absolute right-3 top-3 text-xs text-slate-500">...</div>}
                 
                 {showDropdown && searchResults.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto transition-colors">
                     {searchResults.map(res => (
                       <div key={res.symbol} onClick={() => { setSearchTicker(res.symbol); setShowDropdown(false); fetchFinancials(res.symbol); }} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                         <div>
                           <div className="font-bold text-slate-900 dark:text-white text-sm transition-colors">{res.name}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] transition-colors">{res.symbol}</div>
                         </div>
                         <div className="text-[10px] font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md transition-colors whitespace-nowrap">
                           {res.exchDisp}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
             </div>
             <button onClick={() => { setShowDropdown(false); fetchFinancials(searchTicker); }} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-white font-medium flex items-center justify-center transition-colors">
               <Search size={20} />
             </button>
           </div>
         </div>

         {finLoading ? <div className="h-40 animate-pulse bg-slate-100 dark:bg-slate-950/50 rounded-2xl transition-colors"></div> : financials ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 rounded-2xl transition-colors">
                    <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Revenue Growth</div>
                    <div className={`text-2xl font-black ${financials.revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} transition-colors`}>
                       {(financials.revenueGrowth * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 rounded-2xl transition-colors">
                    <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Profit Margins</div>
                    <div className={`text-2xl font-black ${financials.profitMargins >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} transition-colors`}>
                       {(financials.profitMargins * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                 {financials.revenueGrowth < 0 || financials.profitMargins <= 0 ? (
                    <div className="w-full p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-4 text-rose-900 dark:text-rose-100 transition-colors">
                       <AlertTriangle className="text-rose-500 dark:text-rose-400 shrink-0" size={32} />
                       <div>
                         <h3 className="font-bold text-xl text-rose-600 dark:text-rose-400">Warning: Declining Fundamentals</h3>
                         <p className="text-sm mt-1 opacity-90">This company is struggling with negative revenue growth or poor profit yields natively in its quarterly results. High risk of capital depreciation.</p>
                       </div>
                    </div>
                 ) : (
                    <div className="w-full p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-start gap-4 text-emerald-900 dark:text-emerald-100 transition-colors">
                       <CheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0" size={32} />
                       <div>
                         <h3 className="font-bold text-xl text-emerald-600 dark:text-emerald-400">Company is Performing Strong</h3>
                         <p className="text-sm mt-1 opacity-90">Positive operational growth and excellent profit margins structurally support this company's quarterly execution.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>
         ) : (
           <div className="text-slate-500 py-8 text-center bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-slate-800/50 border-dashed transition-colors">
             {searchTicker ? `No financial data available for '${searchTicker}'.` : "Search for a company ticker to view quarterly results."}
           </div>
         )}
      </div>
    </div>
  );
};
export default MarketTrends;
