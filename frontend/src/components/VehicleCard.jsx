import { Fuel, Users, Settings2, Heart, Shield } from 'lucide-react';
import { useApp } from '../store/AppContext.jsx';

export default function VehicleCard({ vehicle, onClick, onToggleFavorite, isFavorite }) {
  const { currentUser, isFavorite: isFavFromContext } = useApp();
  const isVerified = vehicle.verificationStatus === 'Verified' || vehicle.verificationStatus === 'Approved';
  const isPending  = vehicle.verificationStatus === 'Pending';
  const isCustomer = !currentUser || currentUser.role === 'Customer';
  
  // Use the isFavorite prop if provided, otherwise check context
  const favoriteStatus = isFavorite !== undefined ? isFavorite : isFavFromContext(vehicle.vehicleID);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      await onToggleFavorite(vehicle.vehicleID);
    }
  };

  return (
    <div
      id={`card-${vehicle.vehicleID}`}
      className="glass-card group cursor-pointer flex flex-col h-full fade-up relative"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-800">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          {vehicle.isLuxury && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-md">
              Luxury
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider backdrop-blur-md border ${
            isVerified ? 'bg-green-500/20 text-green-300 border-green-500/30' :
            isPending  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                         'bg-red-500/20   text-red-300   border-red-500/30'
          }`}>
            {vehicle.verificationStatus}
          </span>
        </div>

        {/* Top-right — Favorite + Availability dot */}
        <div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
          {isCustomer && onToggleFavorite && (
            <button
              id={`fav-${vehicle.vehicleID}`}
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all ${favoriteStatus ? 'bg-red-500/80 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-black/40 text-white hover:bg-white/20'}`}
              title="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 ${favoriteStatus ? 'fill-current' : ''}`} />
            </button>
          )}
          <div className={`w-3 h-3 rounded-full border-2 border-white/20 ${vehicle.available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}
            title={vehicle.available ? 'Available' : 'Unavailable'} />
        </div>

        {/* PKR Price badge */}
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-green-600/90 backdrop-blur-md rounded-lg px-3 py-1 shadow-lg border border-white/10">
            <span className="text-sm font-bold text-green-100 mr-0.5">Rs.</span>
            <span className="text-xl font-extrabold text-white tracking-tight">{Number(vehicle.ratePerDay).toLocaleString('en-PK')}</span>
            <span className="text-xs font-medium text-green-100 ml-1">/day</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {vehicle.brand} {vehicle.model}
          </h3>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span>{vehicle.vehicleType}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="px-1.5 py-0.5 rounded text-[0.65rem] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
              {vehicle.licensePlate || vehicle.license}
            </span>
          </div>
        </div>

        {/* Specs chips — icons, NO emojis */}
        <div className="flex flex-wrap gap-2">
          {vehicle.fuelType && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
              <Fuel className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{vehicle.fuelType}
            </span>
          )}
          {vehicle.seats && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
              <Users className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{vehicle.seats} seats
            </span>
          )}
          {vehicle.transmission && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
              <Settings2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{vehicle.transmission}
            </span>
          )}
        </div>

        {/* Star Rating */}
        {vehicle.rating > 0 && (
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${s <= Math.round(vehicle.rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-700'}`}>★</span>
            ))}
            <span className="text-xs text-muted-foreground ml-1">({vehicle.rating?.toFixed(1)})</span>
          </div>
        )}

        {/* CTA — Role-Based */}
        <div className="mt-auto pt-2">
          {isCustomer ? (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-sm font-bold text-green-700 dark:text-green-400 transition-all group-hover:bg-green-100 dark:group-hover:bg-green-500/20">
              <span>View Details</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          ) : (
            <div className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400">
              <Shield className="w-4 h-4 mr-2" /> Fleet Status Only
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
