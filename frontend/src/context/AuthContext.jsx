import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check URL query parameters for JWT on load (OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      localStorage.setItem('tradezy_token', tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch 'Me' user profile on startup if token exists
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('tradezy_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        const data = res.data;
        if (data && data.user) {
          setUser(data.user);
          setIsAdmin(data.user.email === 'viharinimihitha@gmail.com');
        } else {
          localStorage.removeItem('tradezy_token');
        }
      } catch (e) {
        console.error("Fetch me failed", e);
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const signUp = async (email, password) => {
    try {
      const res = await api.post('/auth/register', { email, password });
      const data = res.data;
      
      localStorage.setItem('tradezy_token', data.token);
      setUser(data.user);
      setIsAdmin(data.user.email === 'viharinimihitha@gmail.com');
      return { data: { user: data.user }, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error || e.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      localStorage.setItem('tradezy_token', data.token);
      setUser(data.user);
      setIsAdmin(data.user.email === 'viharinimihitha@gmail.com');
      return { data: { user: data.user }, error: null };
    } catch (e) {
      return { data: null, error: e.response?.data?.error || e.message };
    }
  };

  const signOut = () => {
    localStorage.removeItem('tradezy_token');
    setUser(null);
    setIsAdmin(false);
    return Promise.resolve();
  };

  const updateUserPlan = (newPlan) => {
    if (user) {
      setUser({ ...user, plan_type: newPlan });
      // In a real scenario, you'd also post this to /api/user/preferences to persist it in DB
    }
  };

  const signInWithGoogle = () => {
    // Redirect browser directly to the Express Google Auth Route
    const API_URL = import.meta.env.VITE_API_BASE || 'https://stock-market-bm5j.onrender.com/api';
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, signUp, signIn, signInWithGoogle, signOut, updateUserPlan }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
