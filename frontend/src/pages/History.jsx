import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, TrendingUp, TrendingDown, Clock, Activity, Target, Award } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/history', {
          headers: { 'x-user-id': user?.id || 'mock-id' }
        });
        setHistory(res.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchHistory();
  }, [user]);

  const totalRealizedPnL = history.reduce((acc, h) => acc + ((h.sell_price - h.buy_price) * h.quantity), 0);
  const totalTrades = history.length;
  const winningTrades = history.filter(h => (h.sell_price - h.buy_price) > 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
  const bestTrade = history.reduce((best, h) => {
    const pnl = (h.sell_price - h.buy_price) * h.quantity;
    return pnl > best.pnl ? { ticker: h.ticker || h.stock_name, pnl } : best;
  }, { ticker: '-', pnl: 0 });

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-500/20 rounded-lg"><HistoryIcon className="text-indigo-400" size={28}/></div>
             <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
           </div>
           <p className="text-slate-400 mt-1">Review your past investments and total realized profit.</p>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex flex-col justify-center">
              <div className="text-slate-400 font-medium text-sm flex items-center gap-2"><Target size={16}/> Win Rate</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{winRate}%</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex flex-col justify-center">
              <div className="text-slate-400 font-medium text-sm flex items-center gap-2"><Award size={16}/> Best Trade</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{bestTrade.ticker} <span className="text-sm font-medium">({bestTrade.pnl > 0 ? '+' : ''}₹{bestTrade.pnl.toFixed(2)})</span></div>
           </div>
           <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex flex-col justify-center">
              <div className="text-slate-400 font-medium text-sm flex items-center gap-2"><Activity size={16}/> Net Realized PnL</div>
              <div className={`text-2xl font-bold flex items-center gap-1 mt-1 ${totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {totalRealizedPnL >= 0 ? '+' : ''}₹{totalRealizedPnL.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-5 font-semibold">Stock Name</th>
                  <th className="p-5 font-semibold text-right">Qty</th>
                  <th className="p-5 font-semibold text-right">Buy Price</th>
                  <th className="p-5 font-semibold text-right">Sell Price</th>
                  <th className="p-5 font-semibold text-right">Realized PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((h, idx) => {
                  const pnl = (h.sell_price - h.buy_price) * h.quantity;
                  const pnlPct = ((h.sell_price - h.buy_price) / h.buy_price) * 100;
                  const isProfitable = pnl >= 0;
                  
                  return (
                    <tr key={h.id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-100 text-lg">{h.ticker}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                           <Clock size={12}/> Sold {new Date(h.created_at || Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-5 text-right font-medium text-slate-300">{h.quantity}</td>
                      <td className="p-5 text-right text-slate-400">₹{h.buy_price.toFixed(2)}</td>
                      <td className="p-5 text-right font-medium text-slate-200">₹{h.sell_price.toFixed(2)}</td>
                      <td className="p-5 text-right">
                        <div className={`font-bold text-lg flex items-center justify-end gap-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfitable ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                          ₹{Math.abs(pnl).toFixed(2)}
                        </div>
                        <div className={`text-sm font-medium mt-0.5 ${isProfitable ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                          {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-medium">No history found. Your closed positions will appear here.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default History;
