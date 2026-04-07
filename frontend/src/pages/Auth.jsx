import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Password
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('https://stock-market-bm5j.onrender.com/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setIsLogin(data.exists);
      setStep(2);
    } catch(err) {
       console.error("Checking email failed, defaulting to Sign Up.", err);
       setIsLogin(false);
       setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        try {
          await fetch('https://stock-market-bm5j.onrender.com/api/emails/send-login-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userEmail: email, 
              userName: email.split('@')[0],
              metadata: { time: new Date().toLocaleString(), device: 'Web Browser', location: 'Unknown' }
            })
          });
        } catch (mailErr) {}
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Check your email for the confirmation link or log in if auto-confirmed!');
        
        try {
          await fetch('https://stock-market-bm5j.onrender.com/api/emails/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userEmail: email, 
              userName: email.split('@')[0]
            })
          });
        } catch (mailErr) {}
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-50 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {step === 2 && (
           <button onClick={() => setStep(1)} className="absolute top-8 left-8 text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft size={24} />
           </button>
        )}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-3xl font-bold tracking-tight">
             <TrendingUp className="text-blue-500" size={32} />
             <span>Tradezy</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 text-center text-slate-200">
          {step === 1 ? 'Unlock your portfolio' : isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                placeholder="you@example.com"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center mt-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 gap-2"
            >
              {loading ? 'Checking...' : 'Continue'} {!loading && <ArrowRight size={18} />}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={useAuth().signInWithGoogle}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 border border-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div className="text-sm text-center text-slate-400 mb-4 bg-slate-950/50 py-2 rounded-xl border border-slate-800/50">
               {email}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center mt-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Processing...' : isLogin ? 'Secure Log In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
