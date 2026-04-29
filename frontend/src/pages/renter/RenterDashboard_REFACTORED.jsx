import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { useRenterData, useModal } from '../../hooks/useCustom.js';
import Navbar from '../../components/Navbar.jsx';
import Tabs from '../../components/UI/Tabs.jsx';
import StatCard from '../../components/UI/StatCard.jsx';
import Button from '../../components/UI/Button.jsx';
import Input from '../../components/UI/Input.jsx';
import Card from '../../components/UI/Card.jsx';
import VehicleCard from '../../components/VehicleCard.jsx';
import TrustMeter from '../../components/TrustMeter.jsx';
import WalletWidget from '../../components/WalletWidget.jsx';
import LiveMetadata from '../../components/LiveMetadata.jsx';
import ChecklistModal from '../../components/ChecklistModal.jsx';
import RatingModal from '../../components/RatingModal.jsx';
import { updateBooking, auditLog, getVehicles, submitRating, completePickup, activateBooking, completeReturn, updateUser, addTransaction } from '../../services/dataService.js';
import { useToast } from '../../store/ToastContext.jsx';
import { Play, Activity, Clock, DollarSign, List, Heart, Star, Video, X, Camera, Shield, CheckCircle, LayoutDashboard, Wallet, Upload, Search, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from 'lucide-react';

export default function RenterDashboard() {
  const { currentUser, topUpWallet, userFavorites, addToFavorites, removeFromFavorites, isFavorite, submitBookingRating } = useApp();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { bookings, transactions, vehicles, loading } = useRenterData(currentUser?.id);
  
  const [tab, setTab] = useState('overview');
  const [topUpAmt, setTopUpAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [allVehicles, setAllVehicles] = useState([]);
  const [favoriteVehicles, setFavoriteVehicles] = useState([]);
  
  const pickupModal = useModal();
  const returnModal = useModal();
  const ratingModal = useModal();

  // FIXED: 2-step pickup flow — PickupCompleted → Active
  const handlePickup = async (videoUrl) => {
    const booking = pickupModal.data;
    if (!videoUrl) { showToast('Please provide a pickup video URL.', 'error'); return; }
    try {
      // Step 1: complete_pickup → PickupCompleted
      await completePickup(booking.bookingID, videoUrl, currentUser.id);
      // Step 2: activate_booking → Active
      await activateBooking(booking.bookingID, currentUser.id);
      await auditLog(currentUser.id, 'PICKUP_COMPLETED', `Pickup & activation for ${booking.bookingID}`);
      showToast('Vehicle picked up! Rental is now Active.', 'success');
      pickupModal.close();
      window.location.reload();
    } catch (e) {
      showToast(`Pickup error: ${e.message}`, 'error');
    }
  };

  // FIXED: call completeReturn API (routes through C++ engine)
  const handleReturn = async ({ checklist, dentDescription, videoUrl }) => {
    const booking = returnModal.data;
    if (!videoUrl) { showToast('Return video is required.', 'error'); return; }
    try {
      const checklistStr = JSON.stringify({ checklist, dentDescription });
      await completeReturn(booking.bookingID, videoUrl, checklistStr, currentUser.id);
      await auditLog(currentUser.id, 'RETURN_COMPLETED', `Return for ${booking.bookingID}`);
      showToast('Vehicle returned! Awaiting owner inspection.', 'success');
      returnModal.close();
      window.location.reload();
    } catch (e) {
      showToast(`Return error: ${e.message}`, 'error');
    }
  };

  const handleRating = async (rating, comment) => {
    try {
      await submitBookingRating(ratingModal.data.bookingID, 'customer', rating, comment);
      showToast('Rating submitted!', 'success');
      ratingModal.close();
      window.location.reload();
    } catch (e) {
      showToast('Error submitting rating', 'error');
    }
  };

  useEffect(() => {
    async function loadVehicles() {
      const vehList = await getVehicles();
      setAllVehicles(vehList);
      // Fix: match vehicleID as string against favorites array (handles both object and string formats)
      const favIds = (userFavorites || []).map(f => typeof f === 'string' ? f : f?.vehicleID || '');
      const favVehicles = vehList.filter(v => favIds.includes(v.vehicleID));
      setFavoriteVehicles(favVehicles);
    }
    loadVehicles();
  }, [userFavorites]);

  if (!currentUser) return <div className="min-h-screen bg-background text-text pt-24 px-6 text-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const activeBookings = bookings.filter(b => b.status === 'Active' || b.status === 'PickupCompleted');
  const pendingApproval = bookings.filter(b => b.status === 'PendingApproval');
  const awaitingPickup = bookings.filter(b => b.status === 'Approved' || b.status === 'PickupScheduled');
  const pendingInspection = bookings.filter(b => b.status === 'PendingInspection' || b.status === 'ReturnCompleted');
  // FIXED: History includes Completed + Resolved + ReturnCompleted + PendingInspection (vehicles already returned)
  const completedBookings = bookings.filter(b =>
    b.status === 'Completed' || b.status?.startsWith('Resolved') ||
    b.status === 'ReturnCompleted' || b.status === 'PendingInspection'
  );

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmt);
    if (!amt || amt <= 0) { showToast('Please enter a valid amount', 'error'); return; }
    try {
      await topUpWallet(amt);
      showToast(`Rs. ${amt.toLocaleString('en-PK')} deposited!`, 'success');
      setTopUpAmt('');
    } catch (e) { showToast('Error during top-up', 'error'); }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmt);
    if (!amt || amt <= 0) { showToast('Please enter a valid amount', 'error'); return; }
    if (amt > (currentUser?.walletAvailable || 0)) { showToast('Insufficient available balance', 'error'); return; }
    try {
      const newBal = (currentUser.walletAvailable || 0) - amt;
      await updateUser(currentUser.id, { walletAvailable: newBal });
      await addTransaction(currentUser.id, 'WITHDRAWAL', amt, `Withdrawal -Rs.${amt.toLocaleString('en-PK')}`);
      await auditLog(currentUser.id, 'WALLET_WITHDRAW', `Withdrew Rs.${amt.toLocaleString('en-PK')}`);
      showToast(`Rs. ${amt.toLocaleString('en-PK')} withdrawn successfully!`, 'success');
      setWithdrawAmt('');
      window.location.reload();
    } catch (e) { showToast('Error during withdrawal', 'error'); }
  };

  const tabs = [
    { key: 'overview',  label: 'Overview',   icon: LayoutDashboard },
    { key: 'bookings',  label: 'My Rentals', icon: List },
    { key: 'wallet',    label: 'Wallet',     icon: Wallet },
    { key: 'favorites', label: 'Favorites',  icon: Heart },
    { key: 'reviews',   label: 'Reviews',    icon: Star },
    { key: 'history',   label: 'History',    icon: Clock },
  ];

  const statusColors = {
    'PendingApproval': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'Approved': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'PickupScheduled': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'PickupCompleted': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'Active': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    'ReturnScheduled': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'ReturnCompleted': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'PendingInspection': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    'Completed': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    'Disputed': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16 max-w-7xl">
        <div className="fade-up mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full mb-3">
              <Shield className="w-3.5 h-3.5" /> Renter Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
                {currentUser?.name?.split(' ')[0]}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">Manage your rentals, wallet, favorites, and reputation.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Trust Score</p>
              <p className={`text-lg font-black ${(currentUser?.trustScore || 3) >= 4 ? 'text-green-600' : (currentUser?.trustScore || 3) >= 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                {(currentUser?.trustScore || 3.0).toFixed(1)}/5.0
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Balance</p>
              <p className="text-lg font-black text-emerald-600">Rs. {Math.round(currentUser?.walletAvailable || 0).toLocaleString('en-PK')}</p>
            </div>
          </div>
        </div>

        <Tabs tabs={tabs} current={tab} onChange={setTab} />
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="fade-up mt-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatCard value={pendingApproval.length} label="Pending Appr." color="amber" icon={Clock} />
              <StatCard value={activeBookings.length} label="Active" color="green" icon={Activity} />
              <StatCard value={awaitingPickup.length} label="Awaiting Pickup" color="blue" icon={Play} />
              <StatCard value={pendingInspection.length} label="In Transit" color="purple" icon={Clock} />
              <StatCard value={completedBookings.length} label="Completed" color="slate" icon={List} />
              <StatCard value={`Rs. ${Math.round(currentUser?.walletAvailable || 0).toLocaleString('en-PK')}`} label="Wallet" color="emerald" icon={DollarSign} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <TrustMeter score={currentUser?.trustScore || 3.0} size={160} />
                <div className="text-center mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reputation</p>
                  <p className="text-sm font-bold">{(currentUser?.trustScore || 3) >= 4 ? 'Trusted Renter' : (currentUser?.trustScore || 3) >= 2 ? 'Good Standing' : 'Under Review'}</p>
                </div>
              </Card>

              <Card className="lg:col-span-2 p-6">
                <WalletWidget available={currentUser?.walletAvailable || 0} locked={currentUser?.walletLocked || 0} />
                <div className="mt-4 flex gap-2">
                  <Input name="topUp" type="number" placeholder="Amount" value={topUpAmt} onChange={(e) => setTopUpAmt(e.target.value)} prefix="Rs. " className="flex-1" />
                  <Button variant="primary" onClick={handleTopUp}>Top Up</Button>
                </div>
              </Card>
            </div>

            {pendingApproval.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Awaiting Owner Approval</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingApproval.map(b => {
                    const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                    return (
                      <Card key={b.bookingID} className="border-t-2 border-t-amber-500 opacity-80">
                        <Card.Header title={`${v?.brand} ${v?.model}`} subtitle={`${b.bookingID} · Requested on ${b.rentDate || 'TBD'}`} />
                        <Card.Body>
                           <p className="text-sm text-muted-foreground italic mb-4">Waiting for owner to verify and approve the rental request...</p>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {awaitingPickup.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Play className="w-5 h-5 text-blue-500" /> Ready for Pickup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {awaitingPickup.map(b => {
                    const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                    return (
                      <Card key={b.bookingID} className="border-t-2 border-t-blue-500">
                        <Card.Header title={`${v?.brand} ${v?.model}`} subtitle={`${b.bookingID} · Approved by owner`} />
                        <Card.Body>
                           <p className="text-sm text-muted-foreground mb-4">The owner has approved your request. Please verify the vehicle condition from owner's checklist and upload pickup video.</p>
                           <Button variant="primary" className="w-full" onClick={() => pickupModal.open(b)}>
                             <Video className="w-4 h-4 mr-2" /> Complete Pickup & Verify
                           </Button>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {activeBookings.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-green-500" /> Active Rentals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBookings.map(b => {
                    const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                    return (
                      <Card key={b.bookingID} className="border-t-2 border-t-green-500">
                        <Card.Header title={`${v?.brand} ${v?.model}`} subtitle={`${b.bookingID} · ${b.duration} days`} />
                        <Card.Body>
                          <LiveMetadata vehicleId={b.vehicleID} />
                          {b.status === 'Active' && (
                            <Button variant="primary" size="sm" className="w-full mt-4" onClick={() => returnModal.open(b)}>
                              <Upload className="w-4 h-4 mr-1" /> Return Vehicle
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {activeBookings.length === 0 && awaitingPickup.length === 0 && pendingApproval.length === 0 && (
              <Card className="text-center p-12">
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No active rentals. Visit the marketplace!</p>
                <Button onClick={() => navigate('/market')}>Browse Vehicles</Button>
              </Card>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><List className="w-5 h-5 text-green-500" /> My Rental History</h3>
            {bookings.length === 0 ? (
              <Card className="text-center p-12"><p className="text-muted-foreground">No bookings yet.</p></Card>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="border border-slate-200 dark:border-slate-800">
                      <Card.Header
                        title={`${v?.brand} ${v?.model}`}
                        subtitle={`${b.bookingID} · ${b.rentDate || 'TBD'} · ${b.duration} days`}
                        action={<span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${statusColors[b.status] || statusColors.Completed}`}>{b.status}</span>}
                      />
                      <Card.Body className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded"><p className="text-xs text-muted-foreground">Cost</p><p className="font-bold">{`Rs. ${Math.round(b.cost || 0).toLocaleString('en-PK')}`}</p></div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded"><p className="text-xs text-muted-foreground">Insurance</p><p className="font-bold">{b.insurance || 'N/A'}</p></div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded"><p className="text-xs text-muted-foreground">Deposit</p><p className="font-bold">{`Rs. ${Math.round(b.deposit || 0).toLocaleString('en-PK')}`}</p></div>
                      </Card.Body>
                      <Card.Footer>
                        {b.status === 'Approved' && <Button variant="primary" size="sm" onClick={() => pickupModal.open(b)}><Play className="w-4 h-4 mr-1" /> Pick Up</Button>}
                        {b.status === 'Active' && <Button variant="primary" size="sm" onClick={() => returnModal.open(b)}><Upload className="w-4 h-4 mr-1" /> Return</Button>}
                        {(b.status === 'Completed' || b.status?.startsWith('Resolved')) && !b.customerRated && <Button variant="secondary" size="sm" onClick={() => ratingModal.open(b)}><Star className="w-4 h-4 mr-1" /> Rate</Button>}
                      </Card.Footer>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* WALLET TAB */}
        {tab === 'wallet' && (
          <div className="fade-up mt-8 space-y-8">
            <WalletWidget available={currentUser?.walletAvailable || 0} locked={currentUser?.walletLocked || 0} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Card */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-green-500" /> Deposit Funds
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Add money to your Karwan wallet for rentals.</p>
                <div className="flex gap-3">
                  <Input type="number" placeholder="Amount" value={topUpAmt} onChange={(e) => setTopUpAmt(e.target.value)} prefix="Rs. " className="flex-1" />
                  <Button variant="primary" onClick={handleTopUp}>
                    <ArrowDownToLine className="w-4 h-4 mr-1" /> Deposit
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[1000, 5000, 10000, 50000].map(q => (
                    <button key={q} onClick={() => setTopUpAmt(String(q))} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors text-muted-foreground hover:text-green-600">
                      Rs. {q.toLocaleString('en-PK')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdraw Card */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <ArrowUpFromLine className="w-5 h-5 text-blue-500" /> Withdraw Funds
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Transfer available balance to your bank account.</p>
                <div className="flex gap-3">
                  <Input type="number" placeholder="Amount" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} prefix="Rs. " className="flex-1" />
                  <Button variant="secondary" onClick={handleWithdraw}>
                    <ArrowUpFromLine className="w-4 h-4 mr-1" /> Withdraw
                  </Button>
                </div>
                <p className="text-[0.65rem] text-muted-foreground mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Available: Rs. {Math.round(currentUser?.walletAvailable || 0).toLocaleString('en-PK')} · Locked funds cannot be withdrawn.
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" /> Recent Transactions
              </h3>
              {(transactions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(transactions || []).slice(-10).reverse().map((t, i) => (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold">{t.description || t.type}</p>
                        <p className="text-xs text-muted-foreground">{t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}</p>
                      </div>
                      <span className={`text-sm font-bold ${t.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-green-600'}`}>
                        {t.type === 'WITHDRAWAL' ? '-' : '+'}Rs. {Math.abs(t.amount || 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAVORITES TAB */}
        {tab === 'favorites' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Saved Vehicles
            </h3>
            {favoriteVehicles.length === 0 ? (
              <Card className="text-center p-12">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No favorite vehicles yet. Browse the marketplace!</p>
                <Button onClick={() => navigate('/market')}>Browse Vehicles</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteVehicles.map(v => (
                  <VehicleCard
                    key={v.vehicleID}
                    vehicle={v}
                    isFavorited={true}
                    onToggleFavorite={() => { removeFromFavorites(v.vehicleID).then(() => window.location.reload()); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === 'reviews' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" /> My Reviews
            </h3>
            {completedBookings.length === 0 ? (
              <Card className="text-center p-12">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No reviews yet. Complete a rental to leave a review.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedBookings.filter(b => b.customerRated).map(b => {
                  const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="p-6">
                      <Card.Header title={`${v?.brand || ''} ${v?.model || ''}`} subtitle={b.bookingID} />
                      <Card.Body>
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= b.customerRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                          ))}
                          <span className="text-sm font-bold ml-1">{b.customerRating}/5</span>
                        </div>
                        {b.customerReview && <p className="text-sm text-muted-foreground italic">"{b.customerReview}"</p>}
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" /> Rental History
            </h3>
            {completedBookings.length === 0 ? (
              <Card className="text-center p-12">
                <p className="text-muted-foreground">No completed rentals yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedBookings.map(b => {
                  const v = vehicles.find(x => x.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="border border-slate-200 dark:border-slate-800 p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-xs text-muted-foreground">VEHICLE</p><p className="font-bold">{v?.brand} {v?.model}</p></div>
                        <div><p className="text-xs text-muted-foreground">BOOKING</p><p className="font-bold">{b.bookingID}</p></div>
                        <div><p className="text-xs text-muted-foreground">COST</p><p className="font-bold text-green-600">Rs. {Math.round(b.cost).toLocaleString('en-PK')}</p></div>
                        <div><p className="text-xs text-muted-foreground">STATUS</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>{b.status}</span>
                        </div>
                      </div>
                      {(b.status === 'Completed' || b.status?.startsWith('Resolved')) && !b.customerRated && (
                        <div className="mt-3">
                          <Button variant="secondary" size="sm" onClick={() => ratingModal.open(b)}>
                            <Star className="w-4 h-4 mr-1" /> Rate This Rental
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODALS */}
      {pickupModal.isOpen && pickupModal.data && (
        <ChecklistModal 
          title="Vehicle Pickup Verification"
          subtitle="Verify the owner's inspection and upload your proof video."
          readOnly={true}
          requireVideo={true}
          initialData={(() => {
            try {
              if (!pickupModal.data.ownerChecklist) return null;
              return typeof pickupModal.data.ownerChecklist === 'string' ? JSON.parse(pickupModal.data.ownerChecklist) : pickupModal.data.ownerChecklist;
            } catch (e) {
              console.error("Failed to parse checklist", e);
              return null;
            }
          })()}
          onClose={pickupModal.close}
          onSubmit={({ videoUrl }) => handlePickup(videoUrl)}
        />
      )}

      {returnModal.isOpen && returnModal.data && (
        <ChecklistModal 
          title="Return Vehicle"
          subtitle="Report vehicle condition and upload return video."
          requireVideo={true}
          onClose={returnModal.close}
          onSubmit={handleReturn}
        />
      )}

      {ratingModal.isOpen && ratingModal.data && (
        <RatingModal 
          booking={ratingModal.data}
          onClose={ratingModal.close}
          onSubmit={handleRating}
        />
      )}
    </div>
  );
}