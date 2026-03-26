import React from 'react';
import { BookOpen, TrendingUp, ShieldAlert, GraduationCap, DollarSign, PieChart } from 'lucide-react';

const LearnStocks = () => {
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
    </div>
  );
};

export default LearnStocks;
