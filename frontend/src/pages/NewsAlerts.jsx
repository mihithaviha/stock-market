import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Newspaper, BellRing, TrendingUp, TrendingDown } from 'lucide-react';

const NewsAlerts = () => {
  const { user } = useAuth();
  const { livePrices, subscribeToTicker } = useWebSocket();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get(`/news`);
        setNews(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [user]);

  useEffect(() => {
    if (news.length > 0) {
       news.forEach(item => {
          if (Array.isArray(item.relatedTickers)) {
             item.relatedTickers.slice(0, 3).forEach(t => subscribeToTicker(t));
          }
       });
    }
  }, [news, subscribeToTicker]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <header className="mb-10 border-b border-slate-200 dark:border-slate-800 pb-6 flex items-start justify-between transition-colors">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl transition-colors"><Newspaper className="text-indigo-600 dark:text-indigo-400 transition-colors" size={32}/></div>
              News & Alerts
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Curated real-time market updates triggered by your active holdings.</p>
        </div>
        <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors">
           <BellRing size={20} className="animate-pulse" /> <span className="hidden sm:inline">Active Monitoring</span>
        </div>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
           <div className="h-40 bg-slate-200 dark:bg-slate-900 rounded-2xl animate-pulse transition-colors"></div><div className="h-40 bg-slate-200 dark:bg-slate-900 rounded-2xl animate-pulse transition-colors"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-slate-500 text-center py-10 transition-colors">No recent news available for your portfolio.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
           {news.map((item, i) => (
             <a key={i} href={item.link} target="_blank" rel="noreferrer" className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xl group">
                <div className="flex justify-between items-start mb-2">
                   <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 transition-colors">{item.publisher}</div>
                   {item.relatedTickers && item.relatedTickers.length > 0 && (
                      <div className="flex gap-2">
                         {item.relatedTickers.slice(0, 2).map((ticker, idx) => {
                            const price = livePrices[ticker];
                            return (
                               <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                                  {ticker}
                                  {price ? <span className="text-indigo-600 dark:text-indigo-400 ml-1 transition-colors">₹{price.toFixed(2)}</span> : <span className="text-slate-500 font-normal ml-1">...</span>}
                               </div>
                            )
                         })}
                      </div>
                   )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug flex-1">{item.title}</h3>
                <div className="mt-4 text-sm font-medium text-slate-500 flex justify-between items-center transition-colors">
                   <span>{new Date(item.providerPublishTime * 1000).toLocaleString()}</span>
                   <span className="text-blue-600 dark:text-blue-500 group-hover:underline transition-colors">Read Article &rarr;</span>
                </div>
             </a>
           ))}
        </div>
      )}
    </div>
  );
};
export default NewsAlerts;
