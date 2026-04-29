import { X, Video, Shield, User, Scale } from 'lucide-react';
import Card from './UI/Card.jsx';
import Button from './UI/Button.jsx';

export default function InspectionModal({ booking, onClose, onApprove, isAdmin }) {
  if (!booking) return null;

  const customerData = typeof booking.customerChecklist === 'string' ? JSON.parse(booking.customerChecklist) : booking.customerChecklist;
  const ownerData = typeof booking.ownerChecklist === 'string' ? JSON.parse(booking.ownerChecklist) : booking.ownerChecklist;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card relative fade-up border-t-4 border-t-emerald-500">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Scale className="w-6 h-6 text-emerald-500" /> Dispute Resolution</h2>
          <p className="text-muted-foreground text-sm mb-8">Compare evidence from both parties to resolve booking <strong>{booking.bookingID}</strong></p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Owner Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Shield className="w-5 h-5 text-green-500" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Owner Submission (Pickup)</h3>
              </div>
              
              {booking.pickupVideoPath && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Pickup Video</p>
                  <a href={booking.pickupVideoPath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-2">
                    <Video className="w-4 h-4" /> View Pickup Evidence
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Checklist Items (Owner Verified)</p>
                <div className="grid grid-cols-2 gap-2">
                  {ownerData?.checklist && Object.entries(ownerData.checklist).map(([key, val]) => (
                    <div key={key} className={`text-xs p-2 rounded border flex justify-between ${val ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <span className="capitalize">{key}</span>
                      <span>{val ? 'OK' : 'FAIL'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {ownerData?.dentDescription && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Owner's Notes</p>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm italic">"{ownerData.dentDescription}"</div>
                </div>
              )}
            </div>

            {/* Customer Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Customer Submission (Return)</h3>
              </div>

              {booking.returnVideoPath && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Return Video</p>
                  <a href={booking.returnVideoPath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-2">
                    <Video className="w-4 h-4" /> View Return Evidence
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Checklist Items (Customer Reported)</p>
                <div className="grid grid-cols-2 gap-2">
                  {customerData?.checklist && Object.entries(customerData.checklist).map(([key, val]) => (
                    <div key={key} className={`text-xs p-2 rounded border flex justify-between ${val ? 'bg-blue-500/10 border-blue-500/20 text-blue-700' : 'bg-red-500/10 border-red-500/20 text-red-700'}`}>
                      <span className="capitalize">{key}</span>
                      <span>{val ? 'OK' : 'ISSUE'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {customerData?.dentDescription && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Customer's Notes</p>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm italic">"{customerData.dentDescription}"</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <p className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Final Verdict</p>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="primary" className="flex-1 md:w-64 bg-blue-600 hover:bg-blue-700" onClick={() => onApprove('Customer')}>
                Favor Customer
              </Button>
              <Button variant="primary" className="flex-1 md:w-64 bg-green-600 hover:bg-green-700" onClick={() => onApprove('Owner')}>
                Favor Owner
              </Button>
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground text-center">Favoring a party will adjust trust scores and complete the financial settlement accordingly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
