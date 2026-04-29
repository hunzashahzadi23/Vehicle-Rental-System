import { SearchX, Inbox } from 'lucide-react';

export default function EmptyState({ type = 'search', title, message, action }) {
  const Icon = type === 'search' ? SearchX : Inbox;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center fade-in">
      <div className="w-20 h-20 bg-muted/30 dark:bg-muted/10 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-muted-foreground opacity-60" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-text">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
