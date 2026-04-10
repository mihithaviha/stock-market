import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const { user } = useAuth(); // Assume user.plan_type exists from new JWT logic

  useEffect(() => {
    // We connect to the backend, enforcing production URL on Vercel
    const isProd = import.meta.env.PROD;
    const backendUrl = isProd ? 'https://stock-market-bm5j.onrender.com' : (import.meta.env.VITE_API_URL || 'https://stock-market-bm5j.onrender.com');
    const newSocket = io(backendUrl);

    setSocket(newSocket);

    newSocket.on('live_prices', (prices) => {
       setLivePrices((prev) => ({ ...prev, ...prices }));
    });

    return () => newSocket.disconnect();
  }, []);

  // Helper method for components to subscribe
  const subscribeToTicker = (ticker) => {
    if (socket) {
      socket.emit('subscribe_ticker', ticker);
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, livePrices, subscribeToTicker }}>
      {children}
    </WebSocketContext.Provider>
  );
};
