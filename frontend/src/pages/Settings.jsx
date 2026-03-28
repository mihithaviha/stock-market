import React, { useState } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Bell, Moon, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [alertTime, setAlertTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences on load
  React.useEffect(() => {
     axios.get('http://localhost:5000/api/user/preferences', { headers: { 'x-user-id': user?.id || 'mock-id' } })
          .then(res => {
             if (res.data) {
                if (res.data.alert_time) setAlertTime(res.data.alert_time);
             }
          }).catch(console.error);
  }, [user]);

  const handleSave = async () => {
     setIsSaving(true);
     try {
       await axios.post('http://localhost:5000/api/user/preferences', { alert_time: alertTime }, { headers: { 'x-user-id': user?.id || 'mock-id' } });
       alert('Preferences saved successfully!');
     } catch(e) { console.error(e); } finally { setIsSaving(false); }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans text-slate-50">
      <header className="mb-10 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <div className="p-2 bg-slate-800/80 rounded-xl"><SettingsIcon className="text-slate-400" size={32}/></div>
              Preferences
           </h1>
           <p className="text-slate-400 mt-1">Manage your account settings and notification logic.</p>
        </div>
      </header>

      <div className="space-y-6">
         {/* Profile */}
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200"><Shield size={20} className="text-blue-400"/> Account Security</h2>
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-400">
                 {user?.email?.charAt(0).toUpperCase() || 'U'}
               </div>
               <div>
                  <div className="font-medium text-slate-200">{user?.email || 'mock@example.com'}</div>
                  <div className="text-sm text-slate-500">Standard User Account</div>
               </div>
            </div>
            <div className="mt-6 flex justify-end">
               <button className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition-colors font-medium">Change Password</button>
            </div>
         </div>

         {/* Notifications */}
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200"><Bell size={20} className="text-amber-400"/> Communication Alerts</h2>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                  <div>
                    <div className="font-bold text-slate-200">Daily Portfolio Email Digest</div>
                    <div className="text-sm text-slate-400">Receive an email every day with your summary PnL.</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="time" 
                      value={alertTime} 
                      onChange={(e) => setAlertTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => setEmailAlerts(!emailAlerts)} className={`w-12 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${emailAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                  <div>
                    <div className="font-bold text-slate-200">Breaking Smart News</div>
                    <div className="text-sm text-slate-400">Receive urgent emails if a stock you own crashes or surges.</div>
                  </div>
                  <button onClick={() => setNewsAlerts(!newsAlerts)} className={`w-12 h-6 rounded-full transition-colors relative ${newsAlerts ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${newsAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
               </div>
            </div>
         </div>

         <div className="flex justify-end gap-3 mt-8">
            <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors">Discard</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white font-medium flex items-center gap-2 transition-colors"><Save size={18}/> {isSaving ? 'Saving...' : 'Save Changes'}</button>
         </div>
      </div>
    </div>
  );
};
export default Settings;
