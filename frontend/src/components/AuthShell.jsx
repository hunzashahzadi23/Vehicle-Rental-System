import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, maxWidth = 'max-w-md', children }) {
  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-green-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-green-300/20 blur-[80px] pointer-events-none" />

      <div className={`w-full ${maxWidth} z-10 fade-up py-8`}>
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform duration-300">
              K
            </div>
            <span className="font-bold text-2xl tracking-tight text-text">
              Kar<span className="text-green-600 dark:text-green-500">wan</span>
            </span>
          </Link>
          <h2 className="mt-8 text-3xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>

        <div className="glass-card p-8">{children}</div>
      </div>
    </div>
  );
}
