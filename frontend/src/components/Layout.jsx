import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, LogOut, TrendingUp, Newspaper, BookOpen, Settings as SettingsIcon, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Chatbot from './Chatbot';
import { handleRazorpayPayment } from '../utils/RazorpayCheckout';

const Layout = () => {
  const { signOut, user, updateUserPlan } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpgrade = () => {
     handleRazorpayPayment(user, () => {
        updateUserPlan('PREMIUM');
     });
  };

  const navLinkClass = ({ isActive }) => 
    `flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-sm ${isActive ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'}`;

  const mobileNavLinkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-500/80' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}`;

  const NavLinks = ({ mobile = false }) => {
    const ClassToUse = mobile ? mobileNavLinkClass : navLinkClass;
    return (
      <>
        <NavLink to="/" end className={ClassToUse} onClick={() => setIsMobileMenuOpen(false)}>
          <LayoutDashboard size={mobile ? 20 : 18} /><span>Dashboard</span>
        </NavLink>
        <NavLink to="/portfolio" className={ClassToUse} onClick={() => setIsMobileMenuOpen(false)}>
          <Briefcase size={mobile ? 20 : 18} /><span>Portfolio</span>
        </NavLink>
        <NavLink to="/market-trends" className={ClassToUse} onClick={() => setIsMobileMenuOpen(false)}>
          <TrendingUp size={mobile ? 20 : 18} /><span>Market Trends</span>
        </NavLink>
        <NavLink to="/news-alerts" className={ClassToUse} onClick={() => setIsMobileMenuOpen(false)}>
          <Newspaper size={mobile ? 20 : 18} /><span>News</span>
        </NavLink>
        <NavLink to="/learn-stocks" className={ClassToUse} onClick={() => setIsMobileMenuOpen(false)}>
          <BookOpen size={mobile ? 20 : 18} /><span>Learn</span>
        </NavLink>
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="h-10 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Tradezy Logo" className="h-full w-auto object-contain drop-shadow-md" />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>

            {/* Actions: Theme Toggle, Upgrade, User */}
            <div className="flex items-center gap-2 md:gap-4">
              
              <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="hidden sm:flex items-center gap-3">
                {user?.plan_type === 'PREMIUM' ? (
                   <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20 transition-colors">
                     Premium
                   </span>
                ) : (
                   <button onClick={handleUpgrade} className="cursor-pointer text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                     Upgrade
                   </button>
                )}
                
                <button onClick={signOut} title="Sign Out" className="p-2 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 top-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 overflow-y-auto transition-colors">
          <div className="p-4 flex flex-col gap-2">
            <NavLinks mobile={true} />
            
            <div className="my-4 border-t border-slate-200 dark:border-slate-800/80"></div>
            
            <button onClick={() => { setIsMobileMenuOpen(false); navigate('/portfolio?addStock=true'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-emerald-500 dark:hover:text-emerald-400 font-medium text-left">
              <PlusCircle size={20} className="text-emerald-600 dark:text-emerald-500" /><span>Add Stock</span>
            </button>
            <NavLink to="/settings" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <SettingsIcon size={20} /><span>Settings</span>
            </NavLink>
            <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition-colors text-left">
              <LogOut size={20} /><span>Sign Out</span>
            </button>

            {!user?.plan_type || user?.plan_type !== 'PREMIUM' ? (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 flex flex-col gap-3 transition-colors">
                 <div className="text-sm text-blue-900 dark:text-blue-100 font-medium">Unlock advanced insights and higher limits.</div>
                 <button onClick={handleUpgrade} className="w-full text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors">
                   Upgrade to Premium
                 </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-[#0a0f1c] relative flex flex-col transition-colors duration-200">
        <div className="flex-1">
          <Outlet />
        </div>
        
        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 p-6 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500/80" />
              <span>&copy; {new Date().getFullYear()} Tradezy.</span>
            </div>
            <div className="flex gap-6">
              <span className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors">Support</span>
            </div>
          </div>
        </footer>

        <Chatbot />
      </main>
    </div>
  );
};

export default Layout;
