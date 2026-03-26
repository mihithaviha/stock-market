import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';

const AIRecommendations = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/ai/recommendations', { headers: { 'x-user-id': user?.id || 'mock' } });
        setRecs(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [user]);

  const renderIcon = (sentiment) => {
    if (sentiment === 'bullish') return <TrendingUp className="text-emerald-400 shrink-0" size={32} />;
    if (sentiment === 'bearish') return <AlertTriangle className="text-rose-400 shrink-0" size={32} />;
    return <ShieldCheck className="text-blue-400 shrink-0" size={32} />;
  };

  const renderColor = (sentiment) => {
    if (sentiment === 'bullish') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100';
    if (sentiment === 'bearish') return 'bg-rose-500/10 border-rose-500/20 text-rose-100';
    return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
  };

  const renderSignalBadge = (signal, sentiment) => {
    if (sentiment === 'bullish') return <span className="px-3 py-1 bg-emerald-500 text-emerald-950 text-xs font-black rounded-lg">{signal}</span>;
    if (sentiment === 'bearish') return <span className="px-3 py-1 bg-rose-500 text-rose-950 text-xs font-black rounded-lg">{signal}</span>;
    return <span className="px-3 py-1 bg-blue-500 text-blue-950 text-xs font-black rounded-lg">{signal}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <header className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
           <div className="p-2 bg-purple-500/20 rounded-xl"><BrainCircuit className="text-purple-400" size={32}/></div>
           AI Intelligence
        </h1>
        <p className="text-slate-400 mt-1">Smart inference engine answering: "Is my investment doing good or bad?"</p>
      </header>

      {loading ? (
        <div className="space-y-4">
           <div className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>
           <div className="h-32 bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
      ) : recs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-center">
           <div className="flex justify-center mb-4"><Info className="text-slate-500" size={48} /></div>
           <h3 className="text-xl font-bold text-slate-200">Insufficient Data</h3>
           <p className="text-slate-400 mt-2">Add stocks to your portfolio to generate AI recommendations.</p>
        </div>
      ) : (
        <div className="space-y-6">
           {recs.map((rec, i) => (
             <div key={i} className={`p-6 border rounded-3xl shadow-xl flex flex-col md:flex-row gap-6 md:items-center ${renderColor(rec.sentiment)} transition-transform hover:-translate-y-1 duration-300`}>
                <div className="flex items-center gap-4 min-w-[200px]">
                   {renderIcon(rec.sentiment)}
                   <div>
                     <div className="font-bold text-2xl">{rec.ticker}</div>
                     <div className="text-sm opacity-80">{rec.name}</div>
                   </div>
                </div>

                <div className="flex-1 border-l border-white/10 pl-0 md:pl-6">
                   <div className="mb-3">{renderSignalBadge(rec.signal, rec.sentiment)}</div>
                   <p className="font-medium text-lg leading-snug">{rec.message}</p>
                </div>

                <div className="text-right min-w-[100px]">
                   <div className="text-sm opacity-80 mb-1">Live Delta</div>
                   <div className="text-xl font-bold">{rec.dayChange > 0 ? '+' : ''}{rec.dayChange.toFixed(2)}%</div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};
export default AIRecommendations;
