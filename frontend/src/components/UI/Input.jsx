import React from 'react';

/**
 * Reusable Input Component
 * 
 * Usage:
 * <Input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
 * <Input type="password" label="Password" error="Password is required" />
 * <Input label="Amount" prefix="Rs. " type="number" />
 */
export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  prefix,
  suffix,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-text">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-slate-50 dark:bg-slate-900/50 
            border border-slate-200 dark:border-slate-800
            text-text placeholder-muted-foreground
            focus:border-green-500 focus:ring-1 focus:ring-green-500 
            outline-none transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${prefix ? 'pl-12' : ''}
            ${suffix ? 'pr-12' : ''}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
