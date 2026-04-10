import axios from 'axios';

const isProd = import.meta.env.PROD;
const api = axios.create({
  baseURL: isProd ? 'https://stock-market-bm5j.onrender.com/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api')
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tradezy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
