import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { X, TrendingUp } from 'lucide-react';

const AddStockModal = ({ isOpen, onClose, onAdded }) => {
  const { user } = useAuth();
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [totalInvestment, setTotalInvestment] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingStocks, setTrendingStocks] = useState(['AAPL', 'NVDA', 'MSFT', 'RELIANCE.BSE']);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:5000/api/market/trends', { headers: { 'x-user-id': user?.id || 'mock-id' } })
        .then(res => {
          if (res.data && res.data.mostActive && res.data.mostActive.length > 0) {
            setTrendingStocks(res.data.mostActive.map(t => t.symbol).slice(0, 6));
          } else if (res.data && res.data.topGainers && res.data.topGainers.length > 0) {
            setTrendingStocks(res.data.topGainers.map(t => t.symbol).slice(0, 6));
          }
        }).catch(err => console.error(err));
    }
  }, [isOpen, user]);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setTicker(val.toUpperCase());

    if (val.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/market/search?q=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = async (symbol) => {
    setTicker(symbol);
    setSearchQuery(symbol);
    setSearchResults([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/market/${symbol}`);
      if (res.data && res.data.currentPrice) handlePriceChange(res.data.currentPrice.toString());
    } catch (err) {
      console.warn("Price fetch skipped:", err.message);
    }
  };

  const handleQuantityChange = (val) => {
    setQuantity(val);
    if (val && buyPrice) setTotalInvestment((Number(val) * Number(buyPrice)).toFixed(2));
  };

  const handlePriceChange = (val) => {
    setBuyPrice(val);
    if (val && quantity) setTotalInvestment((Number(val) * Number(quantity)).toFixed(2));
    else if (val && totalInvestment) setQuantity((Number(totalInvestment) / Number(val)).toFixed(4));
  };

  const handleTotalChange = (val) => {
    setTotalInvestment(val);
    if (val && buyPrice) setQuantity((Number(val) / Number(buyPrice)).toFixed(4));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Strict Validations per requirement
    if (!ticker || !quantity || !buyPrice) {
      setError('No empty fields allowed ❌');
      setLoading(false);
      return;
    }
    if (isNaN(Number(quantity)) || Number(quantity) <= 0 || isNaN(Number(buyPrice)) || Number(buyPrice) < 0) {
      setError('Numbers must be valid ❌');
      setLoading(false);
      return;
    }

    try {
      // Before adding to DB, optionally verify the ticker actually exists/fetch price
      try {
        await axios.get(`http://localhost:5000/api/market/${ticker}`);
      } catch (err) {
        console.warn(err.message);
        setError('Failed to fetch price ❌, Invalid ticker ❌');
        setLoading(false);
        return;
      }

      const res = await axios.post('http://localhost:5000/api/portfolio/add', {
        ticker,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice)
      }, {
        headers: { 'x-user-id': user?.id || 'mock-id' }
      });

      alert('Stock added successfully ✅');
      onAdded(res.data);
      onClose();
      setTicker(''); setQuantity(''); setBuyPrice(''); setTotalInvestment(''); setSearchQuery('');
    } catch (err) {
      console.error(err);
      setError('Failed to add stock ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">Add New Holding</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={20} /></button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/20 font-medium text-rose-500 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-400 mb-1">Search Global Stock</label>
            <input
              required type="text" value={searchQuery} onChange={handleSearch}
              placeholder="e.g. AAPL or Apple"
              className="w-full bg-slate-950 border border-slate-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {searchResults.map(res => (
                  <div key={res.symbol} onClick={() => selectStock(res.symbol)} className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-800/50 last:border-0">
                    <div>
                      <div className="font-bold text-white">{res.symbol}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">{res.name}</div>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">
                      {res.exchDisp}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching && <div className="absolute right-4 top-[38px] text-xs text-slate-500">...</div>}
          </div>

          {!searchQuery && (
            <div className="-mt-1 mb-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-blue-400" /> Trending Stocks
              </label>
              <div className="flex flex-wrap gap-2">
                {trendingStocks.map(sym => (
                  <button 
                    key={sym} 
                    type="button" 
                    onClick={() => selectStock(sym)}
                    className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-all border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Total Investment (₹)</label>
            <input
              type="number" step="0.01" value={totalInvestment} onChange={e => handleTotalChange(e.target.value)}
              placeholder="e.g. 20000"
              className="w-full bg-slate-950 border border-slate-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Avg. Buy Price</label>
              <input
                required type="number" step="0.01" value={buyPrice} onChange={e => handlePriceChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
              <input
                required type="number" step="0.0001" value={quantity} onChange={e => handleQuantityChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white bg-slate-900/50"
              />
            </div>
          </div>

          <button disabled={loading} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors">
            {loading ? 'Adding...' : 'Add Position'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AddStockModal;
