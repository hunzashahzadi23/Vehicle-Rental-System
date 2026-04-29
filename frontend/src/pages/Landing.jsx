import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import Navbar from '../components/Navbar.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import VehicleModal from '../components/VehicleModal.jsx';
import HeroSection from '../components/HeroSection.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  getVehicles, getMarketplaceStats,
  addBooking, updateVehicle, auditLog
} from '../services/dataService.js';
import { useToast } from '../store/ToastContext.jsx';
import { ShieldCheck, Shield, Video, SlidersHorizontal, X } from 'lucide-react';

export default function Landing() {
  const { currentUser, refreshUser, isFavorite, addToFavorites, removeFromFavorites } = useApp();
  const { showToast } = useToast();
  const [vehicles, setVehicles]         = useState([]);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [fuelFilter, setFuelFilter]     = useState('All');
  const [transFilter, setTransFilter]   = useState('All');
  const [minPrice, setMinPrice]         = useState(0);
  const [maxPrice, setMaxPrice]         = useState(50000);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({ verifiedVehicles: 0, availableNow: 0, luxuryFleet: 0, activeOwners: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const v = await getVehicles();
      const s = await getMarketplaceStats();
      setVehicles(v);
      setStats(s);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  const types = ['All', 'Car', 'Bike', 'Truck'];
  const fuels = ['All', 'Petrol', 'Diesel', 'Hybrid', 'Electric'];
  const trans = ['All', 'Manual', 'Automatic'];

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.brand?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) || v.licensePlate?.toLowerCase().includes(q);
    const matchType   = typeFilter === 'All' || v.vehicleType === typeFilter;
    const matchFuel   = fuelFilter === 'All' || v.fuelType === fuelFilter;
    const matchTrans  = transFilter === 'All' || v.transmission === transFilter;
    const matchPrice  = v.ratePerDay >= minPrice && v.ratePerDay <= maxPrice;
    const isVerified  = v.verificationStatus === 'Verified' || v.verificationStatus === 'Approved';
    return matchSearch && matchType && matchFuel && matchTrans && matchPrice && isVerified;
  });

  const handleToggleFavorite = async (vehicleId) => {
    if (!currentUser) {
      showToast('Please login to add favorites', 'info');
      navigate('/login');
      return;
    }
    if (isFavorite(vehicleId)) {
      await removeFromFavorites(vehicleId);
      showToast('Removed from favorites', 'success');
    } else {
      await addToFavorites(vehicleId);
      showToast('Added to favorites!', 'success');
    }
  };

  const handleBook = async ({ vehicle, days, insurance, deposit, total }) => {
    if (!currentUser) {
      showToast('Please login to book a vehicle', 'info');
      navigate('/login');
      return;
    }
    await addBooking({
      vehicleID: vehicle.vehicleID, customerID: currentUser.id,
      ownerID: vehicle.ownerID || '', duration: days, cost: total,
      insurance, deposit, status: 'PendingApproval',
      pickupVideoPath: '', returnVideoPath: '',
    });
    await auditLog(currentUser.id, 'BOOKING_CREATE', `Requested booking for ${vehicle.brand} ${vehicle.model} for ${days} days @ Rs.${total.toLocaleString('en-PK')}`);
    showToast(`Requested booking for ${vehicle.brand} ${vehicle.model}! Awaiting owner approval.`, 'success');
    setSelected(null);
    const [v, s] = await Promise.all([getVehicles(), getMarketplaceStats()]);
    setVehicles(v);
    setStats(s);
    await refreshUser();
  };

  const statCards = [
    { val: stats.verifiedVehicles, label: 'Verified Vehicles' },
    { val: stats.availableNow,     label: 'Available Now' },
    { val: stats.luxuryFleet,      label: 'Luxury Fleet' },
    { val: stats.activeOwners,     label: 'Active Owners' },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />

      <HeroSection search={search} setSearch={setSearch} />

      {/* Stats */}
      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="glass-card p-6 text-center fade-up">
                <div className="text-3xl font-bold text-green-600 dark:text-green-500 mb-1">{s.val}</div>
                <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Bar + Grid */}
      <section className="pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Type Tabs + Filter Toggle */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {types.map(t => (
                <button key={t} id={`filter-${t.toLowerCase()}`}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    typeFilter === t
                      ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSidebarOpen(prev => !prev)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold hover:border-green-500 transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <SlidersHorizontal className="w-4 h-4 text-green-500" />
              Advanced Filters
            </button>

            <span className="text-sm text-muted-foreground font-medium">
              Showing {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Advanced Filter Sidebar Panel */}
          {sidebarOpen && (
            <div className="mb-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 fade-up">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 hidden" />

              {/* Fuel Type */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Engine / Fuel</label>
                <div className="flex flex-col gap-1">
                  {fuels.map(f => (
                    <button key={f} onClick={() => setFuelFilter(f)}
                      className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${fuelFilter === f ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >{f}</button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Transmission</label>
                <div className="flex flex-col gap-1">
                  {trans.map(t => (
                    <button key={t} onClick={() => setTransFilter(t)}
                      className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${transFilter === t ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Price Range: <span className="text-green-600">Rs.{minPrice.toLocaleString('en-PK')}</span> – <span className="text-green-600">Rs.{maxPrice.toLocaleString('en-PK')}</span>/day
                </label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Min</span>
                    <input type="range" min={0} max={50000} step={500} value={minPrice}
                      onChange={e => setMinPrice(Number(e.target.value))}
                      className="w-full accent-green-500 mt-1" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Max</span>
                    <input type="range" min={0} max={50000} step={500} value={maxPrice}
                      onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-green-500 mt-1" />
                  </div>
                </div>
                <button onClick={() => { setFuelFilter('All'); setTransFilter('All'); setMinPrice(0); setMaxPrice(50000); }}
                  className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-semibold">
                  <X className="w-3 h-3" /> Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Vehicle Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <SkeletonLoader key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200 dark:border-slate-800">
              <EmptyState type="search" title="No vehicles found" message="Try adjusting your search or filters." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(v => (
                <VehicleCard
                  key={v.vehicleID}
                  vehicle={v}
                  onClick={() => setSelected(v)}
                  onToggleFavorite={currentUser?.role === 'Customer' ? handleToggleFavorite : null}
                  isFavorite={isFavorite(v.vehicleID)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Karwan?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Pakistan's most secure and transparent vehicle rental platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck className="w-10 h-10 text-green-500 mb-4" />, title: 'Escrow Protection', desc: 'Your deposit is held safely in the Karwan vault until your return is cleared.' },
              { icon: <Shield className="w-10 h-10 text-green-500 mb-4" />,      title: 'Tiered Insurance',   desc: 'Choose Basic or Premium coverage. Luxury + Premium waives most deposits.' },
              { icon: <Video className="w-10 h-10 text-green-500 mb-4" />,       title: 'Video Audit System', desc: 'Upload pickup/return videos. Admins resolve disputes with full transparency.' },
            ].map((f, i) => (
              <div key={f.title} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-green-600 dark:bg-green-900/20" />
        <div className="container relative z-10 mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to List Your Vehicle?</h2>
          <p className="text-green-100 text-lg mb-10">Join as a Vehicle Owner and start earning PKR today on our secure platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser ? (
              <Link to={currentUser.role === 'Lessor' ? '/owner' : currentUser.role === 'Admin' ? '/admin' : '/renter'}
                className="px-8 py-4 bg-white text-green-700 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register?role=Lessor" className="px-8 py-4 bg-white text-green-700 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl">
                  Become an Owner
                </Link>
                <Link to="/login" className="px-8 py-4 bg-green-700/50 hover:bg-green-700/70 text-white border border-green-500/50 font-bold rounded-xl transition-colors backdrop-blur-md">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {selected && (
        <VehicleModal
          vehicle={selected}
          currentUser={currentUser}
          onClose={() => setSelected(null)}
          onBook={currentUser?.role === 'Customer' ? handleBook : () => navigate('/login')}
        />
      )}
    </div>
  );
}
