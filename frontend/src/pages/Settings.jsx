import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { Settings as SettingsIcon, Bell, Shield, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [alertTime, setAlertTime] = useState('17:00');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Password Reset States
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  // Fetch preferences on load
  useEffect(() => {
     api.get(`/user/preferences`)
          .then(res => {
             if (res.data) {
                if (res.data.alert_time) setAlertTime(res.data.alert_time);
                if (res.data.first_name) setFirstName(res.data.first_name);
                if (res.data.last_name) setLastName(res.data.last_name);
                if (res.data.phone) setPhone(res.data.phone);
                if (res.data.address) setAddress(res.data.address);
             }
          }).catch(console.error);
  }, [user]);

  const handleSave = async () => {
     setIsSaving(true);
     try {
       await api.post('http://localhost:5000/api/user/preferences', { 
         alert_time: alertTime,
         first_name: firstName,
         last_name: lastName,
         phone,
         address 
       }, { headers: { 'x-user-id': user?.id || 'mock-id' } });
       alert('Preferences saved successfully!');
     } catch(e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleRequestOtp = async () => {
    setPwdMsg("Sending OTP...");
    try {
      const res = await api.post('/auth/forgot-password', { email: user?.email });
      setOtpSent(true);
      setPwdMsg("OTP sent to your email!");
    } catch (e) {
      setPwdMsg(e.response?.data?.error || "Error dispatching OTP");
    }
  };

  const handleResetPassword = async () => {
    setPwdMsg("Verifying...");
    try {
      await api.post('/auth/reset-password', { email: user?.email, otp, newPassword });
      setPwdMsg("Password changed successfully!");
      setTimeout(() => {
        setShowPwdModal(false);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setPwdMsg('');
      }, 2000);
    } catch (e) {
      setPwdMsg(e.response?.data?.error || "Invalid OTP or error");
    }
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
         {/* Identity */}
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200"><UserIcon size={20} className="text-indigo-400"/> Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 focus:border-blue-500 focus:outline-none" placeholder="Jane"/>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 focus:border-blue-500 focus:outline-none" placeholder="Doe"/>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 focus:border-blue-500 focus:outline-none" placeholder="+91 9876543210"/>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 focus:border-blue-500 focus:outline-none" placeholder="City, Country"/>
               </div>
            </div>
         </div>

         {/* Security */}
         <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200"><Shield size={20} className="text-blue-400"/> Account Security</h2>
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-400">
                 {(firstName ? firstName.charAt(0) : user?.email?.charAt(0))?.toUpperCase() || 'U'}
               </div>
               <div>
                  <div className="font-medium text-slate-200">{user?.email || 'mock@example.com'}</div>
                  <div className="text-sm text-slate-500">Standard User Account</div>
               </div>
            </div>
            <div className="mt-6 flex justify-end">
               <button onClick={() => setShowPwdModal(true)} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition-colors font-medium">Change Password</button>
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

      {/* Password Reset Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Reset Password</h3>
            {pwdMsg && <div className="mb-4 text-sm font-semibold p-2 bg-slate-800 rounded text-amber-400">{pwdMsg}</div>}
            
            {!otpSent ? (
               <div>
                  <p className="text-sm text-slate-400 mb-4">We will send a 6-digit confirmation code to your email.</p>
                  <div className="flex gap-3">
                     <button onClick={() => setShowPwdModal(false)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium">Cancel</button>
                     <button onClick={handleRequestOtp} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium">Send Code</button>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Enter 6-Digit OTP</label>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100" />
                  </div>
                  <div className="flex gap-3 mt-2">
                     <button onClick={() => setShowPwdModal(false)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium">Cancel</button>
                     <button onClick={handleResetPassword} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium">Update</button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;
