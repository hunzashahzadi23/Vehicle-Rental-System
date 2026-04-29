import { useState } from 'react';
import { X, Star } from 'lucide-react';

export default function RatingModal({ title, subtitle, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm glass-card relative fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star}
                className={`w-10 h-10 cursor-pointer transition-all ${star <= rating ? 'text-yellow-400 fill-yellow-400 hover:scale-110' : 'text-slate-300 dark:text-slate-700 hover:text-yellow-200'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-bold text-text">Review Comments (Optional)</label>
            <textarea 
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm" 
              rows="3" 
              placeholder="Leave your honest feedback..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button 
            className="w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all bg-amber-500 hover:bg-amber-600"
            onClick={() => onSubmit(rating, comment)}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
