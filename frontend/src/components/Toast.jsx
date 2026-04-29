import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Toast({ message, type, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to allow for the entry animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          border: 'border-green-500/30',
          text: 'text-green-800 dark:text-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/40',
          border: 'border-yellow-500/30',
          text: 'text-yellow-800 dark:text-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        };
      case 'error':
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          border: 'border-red-500/30',
          text: 'text-red-800 dark:text-red-200',
          icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          border: 'border-blue-500/30',
          text: 'text-blue-800 dark:text-blue-200',
          icon: <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-24 right-6 z-[1001] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      } ${styles.bg} ${styles.border} ${styles.text}`}
      role="alert"
    >
      {styles.icon}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button
        onClick={handleClose}
        className="ml-auto p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
      >
        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
}
