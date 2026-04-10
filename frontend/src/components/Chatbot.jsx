import React, { useState, useRef, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Sparkles, X, MessageSquare } from 'lucide-react';

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your PortfolioPro AI Assistant. How can I help you regarding your portfolio, market mechanics, or app support today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { 
         message: userMsg,
         systemInstruction: "You are the Customer Service and Data Assistant for an app called 'PortfolioPro'. You know about the app features: adding stocks, monitoring portfolio, real-time fetching, etc. Be professional, concise, and helpful."
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered a network error right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform hover:scale-105 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[550px] dark:bg-slate-900 bg-white border dark:border-slate-700/50 border-slate-200 rounded-2xl shadow-2xl flex flex-col font-sans z-50 overflow-hidden transform transition-all duration-200">
          {/* Header */}
          <div className="dark:bg-slate-950 bg-slate-100 p-4 border-b dark:border-slate-800 border-slate-300 flex justify-between items-center transition-colors duration-200">
            <div className="flex items-center gap-2 dark:text-white text-slate-900">
              <Bot className="text-blue-400" size={20} />
              <span className="font-bold tracking-tight">PortfolioPro Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-slate-900/50 bg-slate-50 transition-colors duration-200">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0 mt-1">
                    <Bot size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                <div className={`max-w-[80%] p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-colors duration-200 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'dark:bg-slate-800 bg-white dark:text-slate-200 text-slate-800 rounded-bl-none border dark:border-slate-700/50 border-slate-200'
                }`}>
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full dark:bg-slate-700 bg-slate-200 flex items-center justify-center flex-shrink-0 border dark:border-slate-600 border-slate-300 mt-1 transition-colors duration-200">
                    <User size={16} className="dark:text-slate-300 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0 mt-1">
                  <Bot size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="dark:bg-slate-800 bg-white dark:text-slate-400 text-slate-500 px-4 py-3 rounded-2xl rounded-bl-none border dark:border-slate-700/50 border-slate-200 flex items-center gap-1.5 h-10 transition-colors duration-200">
                  <div className="w-1.5 h-1.5 rounded-full dark:bg-slate-500 bg-slate-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full dark:bg-slate-500 bg-slate-400 animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 rounded-full dark:bg-slate-500 bg-slate-400 animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 dark:bg-slate-950 bg-white border-t dark:border-slate-800 border-slate-200 flex gap-2 transition-colors duration-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask me anything..."
              className="flex-1 dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm dark:text-white text-slate-900 outline-none transition-all placeholder:text-slate-500"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white w-10 h-10 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
