import React from 'react';

/**
 * Reusable Card Component
 * 
 * Usage:
 * <Card>
 *   <Card.Header title="Profile" />
 *   <Card.Body>Content here</Card.Body>
 * </Card>
 * 
 * Or simple:
 * <Card className="p-6">Simple card content</Card>
 */
export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`glass-card rounded-xl border border-slate-200 dark:border-slate-800 
        ${hover ? 'hover:shadow-lg hover:border-green-500/50 transition-all' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-green-600 dark:text-green-400" />}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 ${className}`}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
