import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Plus, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import AddStockModal from '../components/AddStockModal';
import toast from 'react-hot-toast';

const Portfolio = () => {
  const { user, updateUserPlan } = useAuth();
  const { livePrices, subscribeToTicker } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [financials, setFinancials] = useState({});

  useEffect(() => {
    return () => {
      setExpandedRow(null);
      setFinancials({}); // Clear prefilled data on navigate/logout
    };
  }, []);

  // Check URL for mock premium upgrade success
  useEffect(() => {
     if (location.search.includes('mock_success=true')) {
        updateUserPlan('PREMIUM');
        navigate('/portfolio', { replace: true });
     }
  }, [location]);

  useEffect(() => {
    if (location.search.includes('addStock=true')) {
      setIsModalOpen(true);
      navigate('/portfolio', { replace: true });
    }
  }, [location, navigate]);

  const fetchPortfolio = async () => {
    try {
      const res = await api.get(`/portfolio`);
      setHoldings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPortfolio();
    // No more manual 10s polling, WebSockets handles live updates!
  }, [user]);

  useEffect(() => {
    if (holdings.length > 0) {
      holdings.forEach(h => subscribeToTicker(h.ticker));
    }
  }, [holdings, subscribeToTicker]);

  const displayHoldings = holdings.map(h => {
     const lp = livePrices[h.ticker];
     return lp ? { ...h, currentPrice: lp, profitLoss: (lp - h.buy_price) * h.quantity } : h;
  });

  const handleCreateOpen = () => {
     if ((!user?.plan_type || user.plan_type === 'FREE') && displayHoldings.length >= 5) {
         alert("Free Tier limit reached. Please upgrade to Premium to add unlimited stocks!");
         return navigate('/learn-stocks');
     }
     setIsModalOpen(true);
  };

  const handleAdded = () => {
    fetchPortfolio();
  };

  const handleSell = async (holding) => {
    if (window.confirm(`Are you sure you want to exit your position in ${holding.ticker}?`)) {
      // Optimistic UI update: instantly remove from list to reflect changes visually
      setHoldings(prev => prev.filter(h => h.id !== holding.id));
      
      try {
        await api.post('http://localhost:5000/api/portfolio/sell', {
           id: holding.id,
           ticker: holding.ticker,
           sellPrice: holding.currentPrice,
           quantity: holding.quantity,
           buyPrice: holding.buy_price
        }, { headers: { 'x-user-id': user?.id || 'mock-id' } });
        toast.success(`Position in ${holding.ticker} exited successfully ✅`);
      } catch(e) { 
        console.error("Error selling stock", e); 
        toast.error('Failed to exit position');
        // If it fails, refetch to restore the correct state
        fetchPortfolio();
      }
    }
  };

  const toggleExpanded = async (ticker) => {
    if (expandedRow === ticker) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(ticker);
    if (!financials[ticker]) {
      try {
        const res = await api.get(`/stock/${ticker}/financials`);
        setFinancials(prev => ({ ...prev, [ticker]: res.data }));
      } catch (err) {
        console.error("Failed to fetch financials");
      }
    }
  };

  const totalInvested = displayHoldings.reduce((acc, h) => acc + (h.buy_price * h.quantity), 0);
  const currentVal = displayHoldings.reduce((acc, h) => acc + (h.currentPrice * h.quantity), 0);
  const totalPnL = currentVal - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Holdings</h1>
          <p className="text-slate-400 mt-1">Manage and track your individual positions live.</p>
        </div>
        <button onClick={handleCreateOpen} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl font-medium transition-colors text-white shadow-lg shadow-blue-500/20">
          <Plus size={18} /> Add Stock
        </button>
      </div>

      {loading && holdings.length === 0 ? (
        <div className="animate-pulse h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-5 font-semibold">Stock Name</th>
                  <th className="p-5 font-semibold text-right">Qty</th>
                  <th className="p-5 font-semibold text-right">Avg. Price</th>
                  <th className="p-5 font-semibold text-right">LTP</th>
                  <th className="p-5 font-semibold text-right">Day Chg %</th>
                  <th className="p-5 font-semibold text-right">PnL</th>
                  <th className="p-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayHoldings.map((h) => {
                  const pnl = h.profitLoss;
                  const pnlPct = ((h.currentPrice - h.buy_price) / h.buy_price) * 100;
                  const isProfitable = pnl >= 0;
                  
                  return (
                    <React.Fragment key={h.id}>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-slate-100 text-lg">{h.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-slate-400 truncate max-w-[150px]">{h.ticker}</span>
                            <button onClick={() => toggleExpanded(h.ticker)} className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                               <FileText size={10} /> Financials
                            </button>
                          </div>
                        </td>
                      <td className="p-5 text-right font-medium text-slate-200">{h.quantity}</td>
                      <td className="p-5 text-right text-slate-300">₹{h.buy_price.toFixed(2)}</td>
                      <td className="p-5 text-right font-medium text-slate-100">₹{h.currentPrice.toFixed(2)}</td>
                      <td className={`p-5 text-right font-semibold ${h.dayChange >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'} rounded-lg`}>
                        {h.dayChange > 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                      </td>
                      <td className="p-5 text-right">
                        <div className={`font-bold text-lg flex items-center justify-end gap-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfitable ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                          ₹{Math.abs(pnl).toFixed(2)}
                        </div>
                        <div className={`text-sm font-medium mt-0.5 ${isProfitable ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                          {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-5 text-right flex gap-2 justify-end">
                        <button onClick={() => handleSell(h)} className="text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                          Exit
                        </button>
                      </td>
                    </tr>
                    {expandedRow === h.ticker && (
                      <tr className="bg-slate-900/50">
                        <td colSpan="7" className="p-5 border-t border-slate-800/50">
                          {financials[h.ticker] ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-medium">Revenue Gr.</span>
                                {financials[h.ticker].revenueGrowth !== null ? `${(financials[h.ticker].revenueGrowth * 100).toFixed(2)}%` : 'Data Unavailable'}
                              </div>
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-medium">Profit Margin</span>
                                {financials[h.ticker].profitMargins !== null ? `${(financials[h.ticker].profitMargins * 100).toFixed(2)}%` : 'Data Unavailable'}
                              </div>
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-medium">Op Margin</span>
                                {financials[h.ticker].operatingMargins !== null ? `${(financials[h.ticker].operatingMargins * 100).toFixed(2)}%` : 'Data Unavailable'}
                              </div>
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-medium">Analyst Rec.</span>
                                <span className="uppercase text-blue-400 font-bold">{financials[h.ticker].recommendationKey || 'N/A'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-sm animate-pulse">Fetching Quarterly Results...</div>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
                {displayHoldings.length === 0 && (
                  <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-medium">No holdings found. Add a stock to get started!</td></tr>
                )}
              </tbody>
              {displayHoldings.length > 0 && (
                <tfoot className="bg-slate-950/40 border-t border-slate-800">
                  <tr>
                    <td colSpan="2" className="p-5 font-bold text-slate-200 text-lg">Portfolio Summary</td>
                    <td className="p-5 text-right text-slate-400">Total Inv:<br/><span className="text-slate-200">₹{totalInvested.toFixed(2)}</span></td>
                    <td className="p-5 text-right text-slate-400">Current Val:<br/><span className="text-slate-200">₹{currentVal.toFixed(2)}</span></td>
                    <td colSpan="2" className="p-5 text-right">
                      <div className="text-slate-400 mb-1">Total PnL</div>
                      <div className={`font-bold text-xl ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)} <span className="text-base opacity-80">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      <AddStockModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdded={handleAdded} />
    </div>
  );
};
export default Portfolio;
