import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Activity, LogOut, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalHoldings: 0, totalValue: 0, systemHealth: 'Online' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get(`/admin/stats`);
        setStats(res.data);
      } catch (e) {
        console.error("Error fetching admin stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg"><Shield className="text-indigo-400" size={28}/></div>
             <div>
               <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
               <p className="text-sm text-slate-400 mt-1">Platform management and analytics</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-rose-400">
            <LogOut size={16} /> End Session
          </button>
        </header>

        {loading ? (
           <div className="animate-pulse flex gap-6">
             <div className="h-32 w-1/3 bg-slate-900 rounded-2xl"></div>
             <div className="h-32 w-1/3 bg-slate-900 rounded-2xl"></div>
             <div className="h-32 w-1/3 bg-slate-900 rounded-2xl"></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5">
              <div className="p-4 bg-blue-500/10 rounded-xl"><Users className="text-blue-500" size={32} /></div>
              <div>
                <div className="text-slate-400 text-sm font-medium">Active Users</div>
                <div className="text-3xl font-bold mt-1 text-slate-100">{stats.totalUsers}</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 rounded-xl"><Activity className="text-emerald-500" size={32} /></div>
              <div>
                <div className="text-slate-400 text-sm font-medium">Total Active Holdings</div>
                <div className="text-3xl font-bold mt-1 text-slate-100">{stats.totalHoldings}</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-5">
              <div className="p-4 bg-amber-500/10 rounded-xl"><DollarSign className="text-amber-500" size={32} /></div>
              <div>
                <div className="text-slate-400 text-sm font-medium">Platform AUM</div>
                <div className="text-3xl font-bold mt-1 text-slate-100">₹{stats.totalValue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-10 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-slate-200">System Services</h2>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
               <span className="font-medium">Live Market Data API (Yahoo)</span>
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold">Healthy</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
               <span className="font-medium">Cron Jobs (Automation)</span>
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold">Running</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
               <span className="font-medium">Supabase Database</span>
               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold">Healthy</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
