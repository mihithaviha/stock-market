import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});
const API_URL = import.meta.env.VITE_API_URL || 'https://stock-market-bm5j.onrender.com/api/auth';

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
        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.user) {
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
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      localStorage.setItem('tradezy_token', data.token);
      setUser(data.user);
      setIsAdmin(data.user.email === 'viharinimihitha@gmail.com');
      return { data: { user: data.user }, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  };

  const signIn = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('tradezy_token', data.token);
      setUser(data.user);
      setIsAdmin(data.user.email === 'viharinimihitha@gmail.com');
      return { data: { user: data.user }, error: null };
    } catch (e) {
      return { data: null, error: e };
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
    window.location.href = `${API_URL}/google`;
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, signUp, signIn, signInWithGoogle, signOut, updateUserPlan }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
