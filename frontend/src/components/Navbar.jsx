import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { LogOut, LayoutDashboard, Store } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const dashLink = currentUser?.role === 'Admin' ? '/admin' : currentUser?.role === 'Lessor' ? '/owner' : '/renter';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center">
        {/* Logo — left */}
        <Link to="/" className="flex-1 flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300">
            K
          </div>
          <span className="font-bold text-xl tracking-tight text-text">
            Kar<span className="text-green-600 dark:text-green-500">wan</span>
          </span>
        </Link>

        {/* Center links — absolutely centered */}
        <div className="flex-1 flex justify-center">
          <div className="hidden md:flex items-center gap-2">
            <Link to="/market" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
              <Store className="w-4 h-4" /> Marketplace
            </Link>
            {currentUser && (
              <Link to={dashLink} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 flex items-center justify-end gap-3 flex-shrink-0">
          <ThemeToggle />
          
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-400 text-xs font-bold">
                  {currentUser.name?.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-text">{currentUser.name?.split(' ')[0]}</span>
                <span className="px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-full border border-green-200 dark:border-green-800">
                  {currentUser.role}
                </span>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50" title="Sign Out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-text hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
