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
import { updateBooking, auditLog, getVehicles, submitRating } from '../../services/dataService.js';
import { useToast } from '../../store/ToastContext.jsx';
import { Play, Activity, Clock, DollarSign, List, Heart, Star, Video, X, Camera, Shield, CheckCircle, LayoutDashboard, Wallet, Upload, Search } from 'lucide-react';

export default function RenterDashboard() {
  const { currentUser, topUpWallet, userFavorites, addToFavorites, removeFromFavorites, isFavorite, submitBookingRating } = useApp();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { bookings, transactions, vehicles, loading } = useRenterData(currentUser?.id);
  
  const [tab, setTab] = useState('overview');
  const [topUpAmt, setTopUpAmt] = useState('');
  const [allVehicles, setAllVehicles] = useState([]);
  const [favoriteVehicles, setFavoriteVehicles] = useState([]);
  
  const pickupModal = useModal();
  const returnModal = useModal();
  const ratingModal = useModal();

  const handlePickup = async (videoUrl) => {
    const booking = pickupModal.data;
    try {
      await updateBooking(booking.bookingID, { 
        status: 'Active', 
        pickupVideoPath: videoUrl,
        pickupAt: new Date().toISOString() 
      });
      showToast('Vehicle picked up! Rental is now active.', 'success');
      pickupModal.close();
      window.location.reload(); 
    } catch (e) {
      showToast('Error during pickup', 'error');
    }
  };

  const handleReturn = async ({ checklist, dentDescription, videoUrl }) => {
    const booking = returnModal.data;
    try {
      await updateBooking(booking.bookingID, { 
        status: 'ReturnCompleted', 
        returnVideoPath: videoUrl,
        customerChecklist: JSON.stringify({ checklist, dentDescription }),
        returnAt: new Date().toISOString() 
      });
      showToast('Vehicle returned! Awaiting owner inspection.', 'success');
      returnModal.close();
      window.location.reload();
    } catch (e) {
      showToast('Error during return', 'error');
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
      const favVehicles = vehList.filter(v => isFavorite(v.vehicleID));
      setFavoriteVehicles(favVehicles);
    }
    loadVehicles();
  }, [userFavorites, isFavorite]);

  if (!currentUser) return <div className="min-h-screen bg-background text-text pt-24 px-6 text-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  const activeBookings = bookings.filter(b => b.status === 'Active' || b.status === 'PickupCompleted');
  const pendingApproval = bookings.filter(b => b.status === 'PendingApproval');
  const awaitingPickup = bookings.filter(b => b.status === 'Approved' || b.status === 'PickupScheduled');
  const pendingInspection = bookings.filter(b => b.status === 'PendingInspection' || b.status === 'ReturnCompleted');
  const completedBookings = bookings.filter(b => b.status === 'Completed' || b.status?.startsWith('Resolved'));

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmt);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    try {
      await topUpWallet(amt);
      showToast(`Rs. ${amt.toLocaleString('en-PK')} deposited!`, 'success');
      setTopUpAmt('');
    } catch (e) {
      showToast('Error during top-up', 'error');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'bookings', label: 'My Rentals', icon: List },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'favorites', label: 'Favorites', icon: Heart },
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
        <div className="fade-up mb-8">
          <h1 className="text-4xl font-extrabold mb-2">Welcome back, <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0]}</span></h1>
          <p className="text-muted-foreground">Manage your rentals, wallet, favorites, and reputation.</p>
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
          <div className="fade-up mt-8">
            <WalletWidget available={currentUser?.walletAvailable || 0} locked={currentUser?.walletLocked || 0} />
            <div className="mt-8">
               <h3 className="text-lg font-bold mb-4">Top Up Wallet</h3>
               <div className="flex gap-4">
                 <Input type="number" placeholder="Enter amount" value={topUpAmt} onChange={(e) => setTopUpAmt(e.target.value)} prefix="Rs. " className="flex-1" />
                 <Button variant="primary" onClick={handleTopUp}>Deposit Funds</Button>
               </div>
            </div>
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