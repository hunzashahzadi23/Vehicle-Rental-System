import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateDeposit, calculateSurcharge } from '../services/dataService.js';
import { X, Fuel, Calendar, Users, Settings2, PlayCircle, AlertTriangle, BadgeCheck } from 'lucide-react';

export default function VehicleModal({ vehicle, onClose, onBook, currentUser }) {
  const [insurance, setInsurance]             = useState('Basic');
  const [days, setDays]                       = useState(3);
  const [pickupVideoPath, setPickupVideoPath] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();

  if (!vehicle) return null;

  const base     = vehicle.ratePerDay * days;
  const sur      = insurance === 'Premium' ? base * 0.15 : 0;
  const total    = base + sur;
  const deposit  = calculateDeposit(vehicle.isLuxury, insurance);
  const charged  = total + deposit;
  const canAfford = currentUser ? (currentUser.walletAvailable || 0) >= charged : true;
  const blocked   = vehicle.isLuxury && currentUser && (currentUser.trustScore || 3) < 2;

  const pkr = (n) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl relative fade-up">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="h-56 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{vehicle.brand} {vehicle.model}</h2>
            <p className="text-green-300 font-bold text-lg">{pkr(vehicle.ratePerDay)}<span className="text-sm font-normal text-green-200 ml-1">/day</span></p>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            {vehicle.isLuxury && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-md">
                Luxury
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
              vehicle.verificationStatus === 'Verified' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              vehicle.verificationStatus === 'Pending'  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                          'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>{vehicle.verificationStatus}</span>
          </div>
        </div>

        <div className="p-6">
          {/* Spec chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {vehicle.fuelType && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <Fuel className="w-4 h-4 text-green-500" /> {vehicle.fuelType}
              </div>
            )}
            {vehicle.year && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-green-500" /> {vehicle.year}
              </div>
            )}
            {vehicle.seats && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <Users className="w-4 h-4 text-green-500" /> {vehicle.seats} seats
              </div>
            )}
            {vehicle.transmission && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <Settings2 className="w-4 h-4 text-green-500" /> {vehicle.transmission}
              </div>
            )}
          </div>

          {vehicle.description && (
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{vehicle.description}</p>
          )}

          <div className="h-px bg-border mb-6" />

          {/* Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Insurance */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Insurance Tier</label>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 mb-3">
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${insurance === 'Basic' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setInsurance('Basic')}>
                  Standard
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${insurance === 'Premium' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setInsurance('Premium')}>
                  Premium Shield
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-muted-foreground font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-slate-700">Tier</th>
                      <th className="py-2 px-3 border-b border-r border-slate-200 dark:border-slate-700">Fee</th>
                      <th className="py-2 px-3 border-b border-slate-200 dark:border-slate-700">Deposit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={insurance === 'Basic' ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                      <td className="py-2 px-3 border-b border-r border-slate-200 dark:border-slate-800 font-bold">Standard</td>
                      <td className="py-2 px-3 border-b border-r border-slate-200 dark:border-slate-800">Rs. 0</td>
                      <td className="py-2 px-3 border-b border-slate-200 dark:border-slate-800">Rs. 50,000</td>
                    </tr>
                    <tr className={insurance === 'Premium' ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-green-600 dark:text-green-400">Premium Shield</td>
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">15% of cost</td>
                      <td className="py-2 px-3 border-slate-200 dark:border-slate-800">Rs. 5,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Rental Duration</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setDays(d => Math.max(1, d - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-lg font-medium">-</button>
                <div className="w-12 text-center text-xl font-bold">{days}</div>
                <button onClick={() => setDays(d => d + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-lg font-medium">+</button>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {/* Booking Flow Info */}
          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex gap-3 items-start fade-in">
            <PlayCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300">How it works</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                After you request this booking, the owner must approve it. Your deposit will be held in escrow. You will only provide the pickup video link once you actually receive the vehicle.
              </p>
            </div>
          </div>

          {/* PKR Price Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Price Breakdown (PKR)</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{pkr(vehicle.ratePerDay)}/day × {days} days</span>
                <span className="font-medium">{pkr(base)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Insurance ({insurance}){insurance === 'Premium' ? ' +15%' : ''}</span>
                <span className={`font-medium ${sur > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                  {sur > 0 ? `+${pkr(sur)}` : 'Included'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border mt-2">
                <span>Total Rental Cost</span>
                <span>{pkr(total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">Security Deposit ({vehicle.isLuxury ? 'Luxury' : 'Standard'})</span>
                <span className={deposit === 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-500 font-medium'}>
                  {deposit === 0 ? 'Waived' : `${pkr(deposit)} locked`}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="font-bold">Total Required Now</span>
              <span className="text-2xl font-extrabold text-green-600 dark:text-green-500">{pkr(charged)}</span>
            </div>
            {currentUser && (
              <div className="mt-2 text-xs text-muted-foreground text-right">
                Your Wallet: <span className={canAfford ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>{pkr(currentUser.walletAvailable || 0)}</span>
              </div>
            )}
          </div>

          {/* Warnings — only shown to Customer role */}
          {currentUser?.role === 'Customer' && blocked && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 mb-4 text-sm text-red-600 dark:text-red-400 font-medium flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Your Trust Score ({currentUser?.trustScore?.toFixed(1)}) is below 2.0. Luxury rentals are restricted.
            </div>
          )}
          {currentUser?.role === 'Customer' && !canAfford && !blocked && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 mb-4 text-sm text-red-600 dark:text-red-400 font-medium flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Insufficient funds. You need {pkr(charged)} but have {pkr(currentUser.walletAvailable || 0)}.
            </div>
          )}

          {currentUser?.role === 'Customer' && vehicle.available ? (
            <button
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                blocked || !canAfford
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]'
              }`}
              disabled={blocked || !canAfford}
              onClick={() => onBook({ vehicle, days, insurance, deposit, total })}>
              {blocked ? 'Blocked — Low Trust Score' : !canAfford ? 'Insufficient Funds' : (
                <><BadgeCheck className="w-5 h-5 inline mr-2" /> Request Booking & Lock Escrow</>
              )}
            </button>
          ) : !currentUser ? (
            <button onClick={() => navigate('/login')} className="block w-full py-4 text-center rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              Login to Rent
            </button>
          ) : currentUser?.role === 'Customer' && !vehicle.available ? (
            <button className="w-full py-4 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed" disabled>Currently Unavailable</button>
          ) : (
            <button className="w-full py-4 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed" disabled>
              {currentUser?.role === 'Lessor' ? 'Owners cannot rent' : 'View Only'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
