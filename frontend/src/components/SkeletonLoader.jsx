export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'card') {
    return (
      <div className="glass-card overflow-hidden animate-pulse-slow">
        <div className="h-40 bg-muted/30 dark:bg-muted/10 w-full" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-muted/40 dark:bg-muted/20 rounded w-2/3" />
          <div className="h-4 bg-muted/30 dark:bg-muted/10 rounded w-1/2" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-muted/30 dark:bg-muted/10 rounded-md" />
            <div className="h-6 w-16 bg-muted/30 dark:bg-muted/10 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-2 animate-pulse-slow">
        <div className="h-4 bg-muted/40 dark:bg-muted/20 rounded w-3/4" />
        <div className="h-4 bg-muted/30 dark:bg-muted/10 rounded w-1/2" />
      </div>
    );
  }

  return null;
}
