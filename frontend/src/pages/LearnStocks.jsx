import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, TrendingUp, ShieldAlert, GraduationCap, DollarSign, PieChart, Lightbulb, Bot, Send, User, X } from 'lucide-react';

const conceptsOfTheDay = [
  { title: "Bull vs. Bear Market", desc: "A Bull market is when the economy is doing well and stock prices are rising. A Bear market occurs when the economy is struggling and stocks are falling.", color: "text-amber-400", bg: "bg-amber-500/20" },
  { title: "Dividends", desc: "A dividend is a reward, cash or otherwise, that a company gives to its shareholders. It’s a way to earn passive income just by owning the stock.", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { title: "P/E Ratio", desc: "The Price-to-Earnings ratio measures a company's current share price relative to its per-share earnings. It helps determine if a stock is overvalued or undervalued.", color: "text-blue-400", bg: "bg-blue-500/20" },
  { title: "Market Capitalization", desc: "Market Cap is the total value of all a company's shares of stock. It is calculated by multiplying the price of a stock by its total number of outstanding shares.", color: "text-purple-400", bg: "bg-purple-500/20" },
  { title: "Short Selling", desc: "Short selling is an investment strategy where you borrow shares, sell them, and hope to buy them back later at a lower price to return to the lender, profiting from the difference.", color: "text-rose-400", bg: "bg-rose-500/20" },
  { title: "ETFs (Exchange Traded Funds)", desc: "An ETF is a basket of securities that trades on an exchange just like a stock. Buying an ETF automatically diversifies your investment across many companies.", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  { title: "Compound Interest", desc: "Compound interest is the interest on savings calculated on both the initial principal and the accumulated interest from previous periods.", color: "text-indigo-400", bg: "bg-indigo-500/20" }
];

const LearnStocks = () => {
  const { user } = useAuth();
  const todayConcept = conceptsOfTheDay[new Date().getDay()];

  // Tutor Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Academy AI Tutor. Ask me any basic question about the stock market, terms, or how trading works!" }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chatbot', { 
         message: userMsg,
         systemInstruction: "You are a patient, encouraging, specialized Stock Market Teacher for absolute beginners. Explain everything using extremely simple analogies. Never overwhelm the user."
      }, { headers: { 'x-user-id': user?.id || 'mock-id' } });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, my connection to the Academy network failed." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-50">
      <header className="mb-10 border-b border-slate-800 pb-6 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl"><GraduationCap className="text-emerald-400" size={32}/></div>
              Academy
           </h1>
           <p className="text-slate-400 mt-1">Master the fundamentals of the stock market.</p>
        </div>
      </header>

      <div className="mb-10 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
          <Lightbulb size={160} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className={`p-2 rounded-xl ${todayConcept.bg}`}><Lightbulb className={todayConcept.color} size={24}/></div>
             <h2 className="text-slate-300 font-bold uppercase tracking-widest text-sm">Concept of the Day</h2>
          </div>
          <h3 className="text-3xl font-bold mb-3">{todayConcept.title}</h3>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">{todayConcept.desc}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-slate-700 transition-colors">
               <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><BookOpen className="text-blue-400"/> What is a Stock?</h2>
               <p className="text-slate-300 leading-relaxed text-lg">
                 A stock (or share) represents a tiny fraction of ownership in a public company. When you buy shares of a company like Apple or Reliance, you genuinely own a small piece of that business. If the company grows and makes a profit, the value of your piece usually goes up!
               </p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-slate-700 transition-colors">
               <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><TrendingUp className="text-emerald-400"/> How the Market Works</h2>
               <p className="text-slate-300 leading-relaxed text-lg mb-4">
                 The stock market operates like a massive digital auction. Buyers and sellers trade shares constantly based on supply and demand.
               </p>
               <ul className="space-y-3 text-slate-300">
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 shrink-0"/> <strong>Demand:</strong> Good news happens (earnings are high) &rarr; More people want to buy &rarr; Price goes UP.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 mt-2 rounded-full bg-rose-500 shrink-0"/> <strong>Supply:</strong> Bad news happens &rarr; More people panic and sell &rarr; Price goes DOWN.</li>
               </ul>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 border-t-4 border-t-amber-500 border-x-slate-800 border-b-slate-800 p-8 rounded-b-3xl shadow-xl">
               <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><DollarSign className="text-amber-400"/> 3 Golden Investing Tips</h2>
               
               <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-emerald-500/10 rounded-xl"><PieChart className="text-emerald-400" size={24}/></div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-200">1. Diversify Your Holdings</h3>
                        <p className="text-slate-400 mt-1">Don't put all your eggs in one basket. Spread your investments across different sectors (Tech, Health, Finance) to minimize crippling losses.</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-blue-500/10 rounded-xl"><TrendingUp className="text-blue-400" size={24}/></div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-200">2. Think Long Term</h3>
                        <p className="text-slate-400 mt-1">The market crashes and spikes every day. Historical data proves that staying invested over 5-10 years yields much safer high percentage returns than day trading.</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-start">
                     <div className="p-3 bg-rose-500/10 rounded-xl"><ShieldAlert className="text-rose-400" size={24}/></div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-200">3. Ignore Emotional Panic</h3>
                        <p className="text-slate-400 mt-1">If your portfolio drops 5% in a day, don't blindly hit the "Exit" button in fear. Always look at the company's Quarterly Fundamentals first.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Floating AI Tutor */}
      {chatOpen ? (
        <div className="fixed bottom-6 right-6 w-[400px] h-[550px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden transform transition-all">
          <div className="p-4 bg-blue-600 border-b border-blue-700 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-3">
                <div className="bg-blue-500 rounded-full p-2"><Bot size={20} className="text-white"/></div>
                <h3 className="font-bold text-white text-lg tracking-wide">Academy Tutor</h3>
             </div>
             <button onClick={() => setChatOpen(false)} className="text-blue-200 hover:text-white transition-colors bg-blue-700/50 hover:bg-blue-700 p-1.5 rounded-full"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
             {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                      <GraduationCap size={16} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 text-[14px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-2xl rounded-bl-none border border-slate-700/50'}`}>
                    {msg.content}
                  </div>
                </div>
             ))}
             {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <GraduationCap size={16} className="text-blue-400" />
                  </div>
                  <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-bl-none border border-slate-700/50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-200"></div>
                  </div>
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="Ask me something..." className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"/>
             <button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 rounded-xl transition-colors shrink-0"><Send size={18}/></button>
          </form>
        </div>
      ) : (
        <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all z-50 flex items-center justify-center border-4 border-slate-950">
           <Bot size={32} />
           <div className="absolute -top-2 -right-2 bg-rose-500 w-4 h-4 rounded-full border-2 border-slate-950 animate-pulse"></div>
        </button>
      )}
    </div>
  );
};

export default LearnStocks;
