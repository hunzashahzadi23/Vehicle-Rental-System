import { Search, Car } from 'lucide-react';

export default function HeroSection({ search, setSearch }) {
  return (
    <section className="relative pt-32 pb-24 text-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-green-500/10 dark:bg-green-500/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-green-300/20 dark:bg-green-300/5 blur-[80px] pointer-events-none" />

      <div className="container relative z-10 max-w-4xl mx-auto px-6">
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-sm font-bold tracking-wider uppercase border border-green-200 dark:border-green-800/50 mb-6 shadow-sm">
            <Car className="w-4 h-4" /> Karwan Marketplace
          </span>
        </div>
        
        <h1 className="fade-up text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-green-700 to-green-500 dark:from-green-300 dark:to-green-500 bg-clip-text text-transparent" style={{ animationDelay: '0.2s', lineHeight: 1.1 }}>
          Drive Your Dream<br />Vehicle Today
        </h1>
        
        <p className="fade-up text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10" style={{ animationDelay: '0.3s' }}>
          Escrow-protected rentals with tiered insurance. Browse verified vehicles from trusted owners across the city.
        </p>

        {/* Search bar */}
        <div className="fade-up max-w-2xl mx-auto relative group" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
          </div>
          <input
            id="search-input"
            className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm focus:shadow-md focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="Search by brand, model or license plate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="absolute right-2 top-2 bottom-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
