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
        setIsAdmin(parsed.email === 'admin@portfoliopro.com');
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === 'admin@portfoliopro.com');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === 'admin@portfoliopro.com');
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    if (isMock) {
      return new Promise(resolve => setTimeout(() => {
        const u = { id: 'mock-id-123', email };
        setUser(u);
        setIsAdmin(email === 'admin@portfoliopro.com');
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
        const u = { id: 'mock-id-123', email };
        setUser(u);
        setIsAdmin(email === 'admin@portfoliopro.com');
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

  return (
    <AuthContext.Provider value={{ user, isAdmin, signUp, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
