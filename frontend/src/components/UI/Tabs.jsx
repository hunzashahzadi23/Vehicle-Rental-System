import React from 'react';

/**
 * Reusable Tabs Component
 * 
 * Usage:
 * <Tabs 
 *   tabs={[
 *     { key: 'overview', label: 'Overview', icon: Dashboard },
 *     { key: 'bookings', label: 'Bookings', icon: List },
 *   ]}
 *   current="overview"
 *   onChange={(key) => setCurrentTab(key)}
 * />
 */
export default function Tabs({ tabs, current, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = current === tab.key;

        return (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200
              ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
