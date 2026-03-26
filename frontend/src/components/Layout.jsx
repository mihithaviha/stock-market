import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, LogOut, Activity, History as HistoryIcon, TrendingUp, Newspaper, BrainCircuit, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AddStockModal from './AddStockModal';

const Layout = () => {
  const { signOut, user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 font-semibold border-l-4 border-blue-500/80 shadow-sm' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 font-medium'}`;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
      <aside className="w-72 bg-slate-900/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-6 flex items-center gap-3 text-2xl font-bold tracking-tight border-b border-slate-800/50">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20"><Activity className="text-blue-500" size={24}/></div>
          <span>Portfolio<span className="text-blue-500">Pro</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-1">
          <NavLink to="/" end className={navLinkClass}>
            <LayoutDashboard size={20} /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/portfolio" className={navLinkClass}>
            <Briefcase size={20} /><span>My Portfolio</span>
          </NavLink>
          <button onClick={() => setIsAddModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-800/80 hover:text-emerald-400 font-medium text-left">
            <PlusCircle size={20} className="text-emerald-500" /><span>Add Stock</span>
          </button>
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Market Intelligence</div>
          <NavLink to="/market-trends" className={navLinkClass}>
            <TrendingUp size={20} /><span>Market Trends</span>
          </NavLink>
          <NavLink to="/news-alerts" className={navLinkClass}>
            <Newspaper size={20} /><span>News & Alerts</span>
          </NavLink>
          <NavLink to="/ai-recommendations" className={navLinkClass}>
            <BrainCircuit size={20} className="text-purple-400"/><span>AI Recommendations</span>
          </NavLink>
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Data</div>
          <NavLink to="/history" className={navLinkClass}>
            <HistoryIcon size={20} /><span>Trade History</span>
          </NavLink>
          <NavLink to="/learn-stocks" className={navLinkClass}>
            <BookOpen size={20} /><span>Learn Stocks</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <SettingsIcon size={20} /><span>Settings</span>
          </NavLink>
        </div>
        
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="mb-3 px-4 py-2.5 bg-slate-950/80 rounded-xl text-xs font-medium text-slate-400 truncate border border-slate-800/50 shadow-inner">
            {user?.email || 'mock-user@example.com'}
          </div>
          <button onClick={signOut} className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium border border-transparent hover:border-rose-500/20">
            <LogOut size={18} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#0a0f1c] relative">
        <Outlet />
      </main>
      
      <AddStockModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdded={() => { navigate('/portfolio'); }} />
    </div>
  );
};
export default Layout;
