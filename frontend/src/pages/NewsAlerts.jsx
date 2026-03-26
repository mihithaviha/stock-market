import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Newspaper, BellRing } from 'lucide-react';

const NewsAlerts = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/news', { headers: { 'x-user-id': user?.id || 'mock' } });
        setNews(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <header className="mb-10 border-b border-slate-800 pb-6 flex items-start justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl"><Newspaper className="text-indigo-400" size={32}/></div>
              News & Alerts
           </h1>
           <p className="text-slate-400 mt-1">Curated real-time market updates triggered by your active holdings.</p>
        </div>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 flex items-center gap-2 font-medium">
           <BellRing size={20} className="animate-pulse" /> Active Monitoring
        </div>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
           <div className="h-40 bg-slate-900 rounded-2xl animate-pulse"></div><div className="h-40 bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-slate-500 text-center py-10">No recent news available for your portfolio.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
           {news.map((item, i) => (
             <a key={i} href={item.link} target="_blank" rel="noreferrer" className="block p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors shadow-xl group">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">{item.publisher}</div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors leading-snug">{item.title}</h3>
                <div className="mt-4 text-sm font-medium text-slate-500 flex justify-between items-center">
                   <span>{new Date(item.providerPublishTime * 1000).toLocaleString()}</span>
                   <span className="text-blue-500 group-hover:underline">Read Article &rarr;</span>
                </div>
             </a>
           ))}
        </div>
      )}
    </div>
  );
};
export default NewsAlerts;
