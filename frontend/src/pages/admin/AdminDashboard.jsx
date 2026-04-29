import { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import {
  getVehicles, getPendingVehicles, updateVehicle,
  getBookings, getDisputedBookings, getPendingInspectionBookings, updateBooking,
  getUsers, getAuditLog, auditLog, findUserById, adjustTrustScore
} from '../../services/dataService.js';
import { useToast } from '../../store/ToastContext.jsx';
import { ShieldCheck, Scale, Users, FileText, LayoutDashboard, CheckCircle, XCircle, Search, Video, Star, AlertTriangle, Clock } from 'lucide-react';
import InspectionModal from '../../components/InspectionModal.jsx';

export default function AdminDashboard() {
  const { currentUser } = useApp();
  const { showToast } = useToast();
  
  const [tab, setTab] = useState('overview');
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [disputedBookings, setDisputedBookings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);

  const reload = async () => {
    const [p, d, i, u, b, logs, v] = await Promise.all([
      getPendingVehicles(),
      getDisputedBookings(),
      getPendingInspectionBookings(),
      getUsers(),
      getBookings(),
      getAuditLog(),
      getVehicles()
    ]);
    setPendingVehicles(p);
    setDisputedBookings(d);
    setPendingReturns(i);
    setAllUsers(u);
    setAllBookings(b);
    setAllVehicles(v);
    setAuditLogs(logs.slice(-50).reverse());
  };

  useEffect(() => { reload(); }, [tab]);

  if (!currentUser || currentUser.role !== 'Admin') return null;

  // ── Verification Center ──
  const handleVerify = async (vehicleID, action) => {
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    
    await updateVehicle(vehicleID, { verificationStatus: status });
    await auditLog(currentUser.id, 'VEHICLE_VERIFY', `${status} vehicle ${vehicleID}`);
    showToast(`Vehicle ${vehicleID} ${status.toLowerCase()}!`, action === 'approve' ? 'success' : 'error');
    await reload();
  };

  // ── Approve Return (Pending Inspection → Completed) ──
  const handleApproveReturn = async (booking) => {
    await updateBooking(booking.bookingID, { status: 'Completed' });
    await updateVehicle(booking.vehicleID, { available: true });
    await adjustTrustScore(booking.customerID, 0.2);
    await auditLog(currentUser.id, 'RETURN_APPROVED', `Approved return for ${booking.bookingID}, trust +0.2`);
    showToast(`Return approved! Vehicle back online.`, 'success');
    await reload();
  };

  // ── Dispute Center ──
  const handleResolveDispute = async (bookingID, resolution) => {
    const bookings = await getBookings();
    const booking = bookings.find(b => b.bookingID === bookingID);
    await updateBooking(bookingID, { status: resolution === 'customer' ? 'Resolved — Customer Favored' : 'Resolved — Owner Favored' });
    if (booking) {
      if (resolution === 'customer') {
        await adjustTrustScore(booking.customerID, 0.2);
      } else {
        await adjustTrustScore(booking.customerID, -0.5);
      }
    }
    await updateVehicle(booking?.vehicleID, { available: true });
    await auditLog(currentUser.id, 'DISPUTE_RESOLVE', `${bookingID} resolved in favor of ${resolution}`);
    showToast(`Dispute ${bookingID} resolved in favor of ${resolution}!`, 'success');
    await reload();
  };

  const tabs = [
    { key: 'overview',     label: 'Overview', icon: LayoutDashboard },
    { key: 'verification', label: 'Verification', icon: ShieldCheck },
    { key: 'inspections',  label: 'Inspections', icon: CheckCircle },
    { key: 'disputes',     label: 'Disputes', icon: Scale },
    { key: 'users',        label: 'Users', icon: Users },
    { key: 'audit',        label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-text relative">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 pb-16 max-w-7xl">
        {/* Header */}
        <div className="fade-up mb-8 flex justify-between items-end flex-wrap gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Panel
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Platform{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
          </div>
          <div className="text-sm font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex gap-4">
            <div><span className="text-green-500 font-bold">●</span> System Online</div>
            <div><span className="text-blue-500 font-bold">V 2.0</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="fade-up mb-8 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0" style={{ animationDelay: '0.1s' }}>
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-max">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button 
                  key={t.key} 
                  id={`admin-tab-${t.key}`}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    tab === t.key 
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => setTab(t.key)}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {t.key === 'verification' && pendingVehicles.length > 0 && (
                    <span className="bg-amber-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full ml-1">{pendingVehicles.length}</span>
                  )}
                  {t.key === 'inspections' && pendingReturns.length > 0 && (
                    <span className="bg-blue-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full ml-1">{pendingReturns.length}</span>
                  )}
                  {t.key === 'disputes' && disputedBookings.length > 0 && (
                    <span className="bg-red-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full ml-1">{disputedBookings.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div className="fade-up">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { val: allUsers.length, label: 'Total Users', color: 'text-blue-500' },
                { val: allVehicles.length, label: 'Total Vehicles', color: 'text-green-500' },
                { val: allBookings.length, label: 'Total Bookings', color: 'text-emerald-500' },
                { val: pendingVehicles.length, label: 'Pending Review', color: 'text-amber-500' },
                { val: disputedBookings.length, label: 'Active Disputes', color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.val}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            <div className="glass-card p-6 md:p-8 mb-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> User Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['Customer', 'Lessor', 'Admin'].map(role => {
                  const count = allUsers.filter(u => u.role === role).length;
                  const colors = { 
                    Customer: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50', 
                    Lessor: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50', 
                    Admin: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' 
                  };
                  return (
                    <div key={role} className={`rounded-xl p-6 text-center border ${colors[role]}`}>
                      <div className="text-4xl font-black mb-1">{count}</div>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-80">{role}s</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-4 flex-wrap">
              {pendingVehicles.length > 0 && (
                <button 
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2" 
                  onClick={() => setTab('verification')}
                >
                  <ShieldCheck className="w-4 h-4" /> Review {pendingVehicles.length} Pending Vehicle{pendingVehicles.length > 1 ? 's' : ''}
                </button>
              )}
              {disputedBookings.length > 0 && (
                <button 
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2" 
                  onClick={() => setTab('disputes')}
                >
                  <Scale className="w-4 h-4" /> Resolve {disputedBookings.length} Dispute{disputedBookings.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ VERIFICATION CENTER ═══ */}
        {tab === 'verification' && (
          <div className="fade-up">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> Verification Center</h3>
            <p className="text-muted-foreground mb-8">Approve or reject Lessor vehicle posts before they go live on the marketplace.</p>

            {pendingVehicles.length === 0 ? (
              <div className="text-center p-16 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-80" />
                <h4 className="text-lg font-bold mb-2">All Caught Up!</h4>
                <p className="text-muted-foreground font-medium">No vehicles pending verification.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingVehicles.map(v => {
                  const owner = findUserById(v.ownerID);
                  return (
                    <div key={v.vehicleID} className="glass-card overflow-hidden flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-64 relative bg-slate-100 dark:bg-slate-800 flex-shrink-0 h-48 md:h-auto">
                        <img src={v.image} alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 md:hidden" />
                        {v.isLuxury && <span className="shimmer-luxury px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-md absolute top-3 left-3">Luxury</span>}
                      </div>
                      {/* Details */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{v.brand} {v.model}</h3>
                            <div className="text-sm text-muted-foreground">
                              {v.vehicleID} · {v.vehicleType} · {v.year} · {v.license}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        </div>
                        <p className="text-sm mb-4 line-clamp-2 text-text/80">{v.description}</p>
                        <div className="flex gap-2 flex-wrap mb-6">
                          {[
                            { label: 'Rate', val: `Rs. ${Number(v.ratePerDay).toLocaleString('en-PK')}/day` },
                            { label: 'Fuel', val: v.fuelType },
                            { label: 'Seats', val: v.seats },
                            { label: 'Owner', val: owner?.name || v.ownerID },
                          ].map(d => (
                            <span key={d.label} className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-muted-foreground">
                              {d.label}: <span className="text-text">{d.val}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-3 mt-auto">
                          <button 
                            id={`approve-${v.vehicleID}`} 
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2 flex-1 md:flex-none justify-center" 
                            onClick={() => handleVerify(v.vehicleID, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            id={`reject-${v.vehicleID}`} 
                            className="px-4 py-2 bg-slate-200 hover:bg-red-600 hover:text-white dark:bg-slate-800 dark:hover:bg-red-600 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2 flex-1 md:flex-none justify-center" 
                            onClick={() => handleVerify(v.vehicleID, 'reject')}
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ INSPECTIONS CENTER ═══ */}
        {tab === 'inspections' && (
          <div className="fade-up">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-6 h-6 text-emerald-500" /> Return Inspections</h3>
            <p className="text-muted-foreground mb-8">Review return videos and approve vehicle returns.</p>
            {pendingReturns.length === 0 ? (
              <div className="text-center p-16 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-80" />
                <h4 className="text-lg font-bold mb-2">No Pending Returns</h4>
                <p className="text-muted-foreground font-medium">All returns have been inspected.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingReturns.map(b => {
                  const v = allVehicles.find(x => x.vehicleID === b.vehicleID);
                  const customer = findUserById(b.customerID);
                  return (
                    <div key={b.bookingID} className="glass-card p-6 border-l-4 border-l-amber-500">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <div>
                          <h4 className="text-lg font-bold mb-1">{v?.brand} {v?.model}</h4>
                          <div className="text-sm text-muted-foreground">{b.bookingID} · Renter: {customer?.name || b.customerID} · Rs. {Math.round(b.cost || 0).toLocaleString('en-PK')}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Inspection</span>
                      </div>
                      {b.returnVideoPath && (
                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center gap-2"><Video className="w-4 h-4" /> Return Video</div>
                          <a href={b.returnVideoPath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-600 underline break-all">{b.returnVideoPath}</a>
                        </div>
                      )}
                      <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2" onClick={() => handleApproveReturn(b)}>
                        <CheckCircle className="w-4 h-4" /> Approve Return
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ DISPUTE CENTER ═══ */}
        {tab === 'disputes' && (
          <div className="fade-up">
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Scale className="w-6 h-6 text-red-500" /> Dispute Center</h3>
            <p className="text-muted-foreground mb-8">Compare pickup/return video evidence and resolve disputes fairly.</p>

            {disputedBookings.length === 0 ? (
              <div className="text-center p-16 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Scale className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-bold mb-2">Peaceful Platform</h4>
                <p className="text-muted-foreground font-medium">No active disputes to resolve.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {disputedBookings.map(b => {
                  const v = allVehicles.find(x => x.vehicleID === b.vehicleID);
                  const customer = findUserById(b.customerID);
                  const owner = findUserById(b.ownerID);
                  return (
                    <div key={b.bookingID} className="glass-card p-6 md:p-8 border-l-4 border-l-red-500">
                      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1 text-red-600 dark:text-red-400">Dispute: {b.bookingID}</h3>
                          <div className="text-sm text-muted-foreground">
                            {v?.brand} {v?.model} · Rented {b.rentDate} · {b.duration} days · Rs. {Math.round(b.cost || 0).toLocaleString('en-PK')}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Disputed</span>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                          <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Customer
                          </div>
                          <div className="font-bold text-lg mb-1">{customer?.name || b.customerID}</div>
                          <div className="text-sm text-muted-foreground">Trust Score: <span className="font-bold text-text">{customer?.trustScore?.toFixed(1) || 'N/A'}</span></div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4">
                          <div className="text-xs text-green-600 dark:text-green-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Owner
                          </div>
                          <div className="font-bold text-lg mb-1">{owner?.name || b.ownerID || 'Platform Vehicle'}</div>
                          <div className="text-sm text-muted-foreground">Rating: <span className="font-bold text-text">{owner?.rating?.toFixed(1) || 'N/A'}</span></div>
                        </div>
                      </div>

                      {/* Video Evidence */}
                      <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                          <Video className="w-4 h-4" /> Video Evidence Comparison
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-bold mb-2">PICKUP VIDEO</div>
                            {b.pickupVideoPath ? (
                              <a href={b.pickupVideoPath} target="_blank" rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline break-all flex items-start gap-2">
                                <Video className="w-4 h-4 flex-shrink-0 mt-0.5" /> {b.pickupVideoPath}
                              </a>
                            ) : (
                              <span className="text-sm text-red-500 font-medium flex items-center gap-1"><XCircle className="w-4 h-4" /> Not provided</span>
                            )}
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-bold mb-2">RETURN VIDEO</div>
                            {b.returnVideoPath ? (
                              <a href={b.returnVideoPath} target="_blank" rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline break-all flex items-start gap-2">
                                <Video className="w-4 h-4 flex-shrink-0 mt-0.5" /> {b.returnVideoPath}
                              </a>
                            ) : (
                              <span className="text-sm text-red-500 font-medium flex items-center gap-1"><XCircle className="w-4 h-4" /> Not provided</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Resolution buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                        <button 
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2 w-full justify-center" 
                          onClick={() => setDisputeBooking(b)}
                        >
                          <Search className="w-4 h-4" /> Review Case & Checklists
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {tab === 'users' && (
          <div className="fade-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-emerald-500" /> All Users <span className="text-muted-foreground text-lg font-normal">({allUsers.length})</span></h3>
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    {['ID', 'Name', 'Email', 'Role', 'Trust/Rating'].map(h => (
                      <th key={h} className="py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {allUsers.map(u => {
                    const roleColors = { 
                      Customer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', 
                      Lessor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', 
                      Admin: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                    };
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold whitespace-nowrap">{u.id}</td>
                        <td className="py-4 px-6 text-sm font-bold text-text whitespace-nowrap">{u.name}</td>
                        <td className="py-4 px-6 text-sm text-muted-foreground whitespace-nowrap">{u.email}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleColors[u.role]}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-yellow-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            {(u.role === 'Customer' || u.role === 'Lessor') ? <Star className="w-3.5 h-3.5 fill-yellow-400" /> : null}
                            {u.role === 'Customer' ? (u.trustScore || 0).toFixed(1) : u.role === 'Lessor' ? (u.rating || 0).toFixed(1) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ AUDIT LOG ═══ */}
        {tab === 'audit' && (
          <div className="fade-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText className="w-6 h-6 text-emerald-500" /> Audit Log <span className="text-muted-foreground text-lg font-normal">(Last 50)</span></h3>
            {auditLogs.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-muted-foreground font-medium">No audit logs recorded yet.</p>
              </div>
            ) : (
              <div className="glass-card divide-y divide-slate-200 dark:divide-slate-800/50">
                {auditLogs.map((log, i) => (
                  <div key={i} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start md:items-center gap-4 flex-wrap">
                      <span className="text-xs font-bold font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap">
                        {log.actionType}
                      </span>
                      <span className="text-sm font-medium text-text/90 break-words">{log.result}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {log.userID}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Render Modal */}
      {disputeBooking && (
        <InspectionModal 
          booking={disputeBooking}
          isAdmin={true}
          onClose={() => setDisputeBooking(null)}
          onApprove={(party) => {
            handleResolveDispute(disputeBooking.bookingID, party.toLowerCase());
            setDisputeBooking(null);
          }}
        />
      )}

    </div>
  );
}
