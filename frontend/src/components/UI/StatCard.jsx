import React from 'react';

/**
 * StatCard Component - Display a stat with icon
 * 
 * Usage:
 * <StatCard value="5" label="Active Rentals" color="green" icon={Activity} />
 * <StatCard value="Rs. 50,000" label="Wallet Balance" color="emerald" />
 */
export default function StatCard({ value, label, color = 'green', icon: Icon, className = '' }) {
  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  return (
    <div className={`glass-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-text mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
