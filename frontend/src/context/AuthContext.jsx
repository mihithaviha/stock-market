import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMock } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock) {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAdmin(parsed.email === 'viharinimihitha@gmail.com');
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === 'viharinimihitha@gmail.com');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === 'viharinimihitha@gmail.com');
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    if (isMock) {
      return new Promise(resolve => setTimeout(() => {
        const u = { id: email, email, plan_type: 'FREE' };
        setUser(u);
        setIsAdmin(email === 'viharinimihitha@gmail.com');
        localStorage.setItem('mockUser', JSON.stringify(u));
        resolve({ data: { user: u }, error: null });
      }, 800));
    }
    return supabase.auth.signUp({ email, password });
  };

  const signIn = async (email, password) => {
    if (isMock) {
      if (email === 'fail@auth.com') return { error: new Error("Invalid credentials") };
      return new Promise(resolve => setTimeout(() => {
        const u = { id: email, email, plan_type: 'FREE' };
        // Check if there was an existing mock user with premium
        const existing = localStorage.getItem('mockUser');
        if(existing) {
           const parsed = JSON.parse(existing);
           if(parsed.email === email && parsed.plan_type) u.plan_type = parsed.plan_type;
        }
        setUser(u);
        setIsAdmin(email === 'viharinimihitha@gmail.com');
        localStorage.setItem('mockUser', JSON.stringify(u));
        resolve({ data: { user: u }, error: null });
      }, 800));
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = () => {
    if (isMock) {
      localStorage.removeItem('mockUser');
      setUser(null);
      setIsAdmin(false);
      return Promise.resolve();
    }
    return supabase.auth.signOut();
  };

  const updateUserPlan = (newPlan) => {
    if (user) {
      const u = { ...user, plan_type: newPlan };
      setUser(u);
      localStorage.setItem('mockUser', JSON.stringify(u));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, signUp, signIn, signOut, updateUserPlan }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
