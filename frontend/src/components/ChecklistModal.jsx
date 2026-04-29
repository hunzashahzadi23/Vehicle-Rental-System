import { useState } from 'react';
import { X, CheckCircle, Car, Check, XCircle } from 'lucide-react';

export const CHECKLIST_ITEMS = [
  { id: 'fuel', label: 'Fuel Level Full?' },
  { id: 'exterior', label: 'Exterior Clean?' },
  { id: 'interior', label: 'Interior Clean?' },
  { id: 'lights', label: 'Lights & Indicators OK?' },
  { id: 'tires', label: 'Tire Condition OK?' },
  { id: 'brakes', label: 'Brakes Responsive?' },
  { id: 'fluids', label: 'Fluids (Oil/Water) OK?' },
  { id: 'electronics', label: 'AC & Electronics OK?' }
];

export default function ChecklistModal({ title, subtitle, requireVideo, onClose, onSubmit, initialData = null, readOnly = false }) {
  const [checklist, setChecklist] = useState(initialData?.checklist || {
    fuel: null, exterior: null, interior: null, lights: null,
    tires: null, brakes: null, fluids: null, electronics: null
  });
  const [dentDescription, setDentDescription] = useState(initialData?.dentDescription || '');
  const [videoUrl, setVideoUrl] = useState('');

  const handleSelect = (id, val) => {
    if (readOnly) return;
    setChecklist(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = () => {
    if (requireVideo && !videoUrl) return; 
    onSubmit({ checklist, dentDescription, videoUrl });
  };

  const allAnswered = Object.values(checklist).every(v => v !== null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card relative fade-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-500" /> {title}</h2>
          <p className="text-muted-foreground text-sm mb-6">{subtitle}</p>

          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {readOnly ? "Inspection Summary" : "8-Point Verification"}
            </h3>
            {CHECKLIST_ITEMS.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-sm font-medium text-text">{item.label}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(item.id, true)}
                    disabled={readOnly}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                      checklist[item.id] === true 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:bg-slate-300'
                    }`}
                  >
                    <Check className="w-3 h-3" /> Yes
                  </button>
                  <button
                    onClick={() => handleSelect(item.id, false)}
                    disabled={readOnly}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                      checklist[item.id] === false 
                        ? 'bg-red-500 text-white shadow-sm' 
                        : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:bg-slate-300'
                    }`}
                  >
                    <XCircle className="w-3 h-3" /> No
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-bold text-text">{readOnly ? "Verification Notes" : "Additional Notes / Damage Description"}</label>
            <textarea 
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
              rows="3" 
              placeholder="Explain any 'No' answers or describe scratches..."
              value={dentDescription}
              onChange={e => !readOnly && setDentDescription(e.target.value)}
              readOnly={readOnly}
            />
          </div>

          {requireVideo && !readOnly && (
            <div className="space-y-2 mb-6">
              <label className="text-sm font-bold text-text flex items-center gap-2">Video Evidence URL <span className="text-red-500">*</span></label>
              <input 
                type="url"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                placeholder="https://youtube.com/shorts/..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-2 italic">* Upload a quick video of the car to confirm the condition.</p>
            </div>
          )}

          {!readOnly && (
            <button 
              onClick={handleSubmit}
              disabled={!allAnswered || (requireVideo && !videoUrl)}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all flex justify-center items-center gap-2 ${
                (!allAnswered || (requireVideo && !videoUrl)) ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Submit Verification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
