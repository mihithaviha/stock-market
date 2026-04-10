import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Auth from './pages/Auth';
import AdminAuth from './pages/AdminAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Portfolio from './pages/Portfolio';
import AdminDashboard from './pages/AdminDashboard';
import MarketTrends from './pages/MarketTrends';
import NewsAlerts from './pages/NewsAlerts';
import LearnStocks from './pages/LearnStocks';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/auth"} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />; // Redirect regular users away from admin panel
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" />; // Keep admins out of regular user dashboard implicitly
  }

  return children;
};

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={user && !isAdmin ? <Navigate to="/" /> : <Auth />} />
      <Route path="/admin/login" element={user && isAdmin ? <Navigate to="/admin" /> : <AdminAuth />} />

      {/* Regular User Flow */}
      <Route path="/" element={<ProtectedRoute requireAdmin={false}><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="market-trends" element={<MarketTrends />} />
        <Route path="news-alerts" element={<NewsAlerts />} />
        <Route path="learn-stocks" element={<LearnStocks />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin Flow */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}



function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '12px'
              }
            }}
          />
        </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
