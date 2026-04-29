import { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Tabs from '../../components/UI/Tabs.jsx';
import StatCard from '../../components/UI/StatCard.jsx';
import Button from '../../components/UI/Button.jsx';
import Card from '../../components/UI/Card.jsx';
import ChecklistModal from '../../components/ChecklistModal.jsx';
import RatingModal from '../../components/RatingModal.jsx';
import ListVehicleModal from '../../components/ListVehicleModal.jsx';
import { useOwnerData } from '../../hooks/useCustom.js';
import { getBookings, updateBooking, auditLog, inspectBooking, submitRating, addVehicle, createDispute } from '../../services/dataService.js';
import { useToast } from '../../store/ToastContext.jsx';
import { BarChart3, DollarSign, Car, AlertCircle, CheckCircle, Clock, Star, LayoutDashboard, List, X, Plus } from 'lucide-react';

export default function OwnerDashboard() {
  const { currentUser, approveRental, submitBookingRating } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  
  const [rentalRequests, setRentalRequests] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [pendingInspections, setPendingInspections] = useState([]);
  const [completedRentals, setCompletedRentals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [approvalModal, setApprovalModal] = useState({ open: false, booking: null });
  const [inspectionModal, setInspectionModal] = useState({ open: false, booking: null, approved: true });
  const [ratingModal, setRatingModal] = useState({ open: false, booking: null });
  const [listModalOpen, setListModalOpen] = useState(false);

  const { bookings, vehicles: ownerVehicles, loading } = useOwnerData(currentUser?.id);

  useEffect(() => {
    if (bookings) {
      setRentalRequests(bookings.filter(b => b.status === 'PendingApproval'));
      setActiveRentals(bookings.filter(b => b.status === 'Active' || b.status === 'PickupCompleted' || b.status === 'Approved'));
      setPendingInspections(bookings.filter(b => b.status === 'ReturnCompleted' || b.status === 'PendingInspection'));
      setCompletedRentals(bookings.filter(b => b.status === 'Completed' || b.status?.startsWith('Resolved')));

      const earnings = bookings
        .filter(b => b.status === 'Completed' || b.status?.startsWith('Resolved'))
        .reduce((sum, b) => sum + (parseFloat(b.amountPaid) || 0), 0);
      setTotalEarnings(earnings);
    }
    if (ownerVehicles) {
      setVehicles(ownerVehicles);
    }
  }, [bookings, ownerVehicles]);

  const handleApproveRequest = async (booking, ownerChecklist) => {
    try {
      await approveRental(booking.bookingID, ownerChecklist);
      showToast('Rental approved! Awaiting customer pickup.', 'success');
      await auditLog(currentUser.id, 'RENTAL_APPROVED', `Approved booking ${booking.bookingID}`);
      setApprovalModal({ open: false, booking: null });
      window.location.reload();
    } catch (e) {
      showToast('Error approving rental', 'error');
    }
  };

  const handleDeclineRequest = async (booking) => {
    try {
      await updateBooking(booking.bookingID, { status: 'Declined' });
      showToast('Rental declined.', 'info');
      await auditLog(currentUser.id, 'RENTAL_DECLINED', `Declined booking ${booking.bookingID}`);
      window.location.reload();
    } catch (e) {
      showToast('Error declining rental', 'error');
    }
  };

  const handleCompleteInspection = async (booking, inspectionNotes, approved) => {
    try {
      await inspectBooking(booking.bookingID, inspectionNotes, approved);
      await auditLog(currentUser.id, 'INSPECTION_COMPLETED', `Inspection for ${booking.bookingID}: ${approved ? 'Passed' : 'Failed'}`);
      showToast(`Inspection completed. Status: ${approved ? 'Approved' : 'Disputed'}`, 'success');
      setInspectionModal({ open: false, booking: null });
      window.location.reload();
    } catch (e) {
      showToast('Error completing inspection', 'error');
    }
  };

  const handleSubmitRating = async (booking, rating, comment) => {
    try {
      await submitBookingRating(booking.bookingID, 'owner', rating, comment);
      await auditLog(currentUser.id, 'OWNER_RATING_SUBMITTED', `Rated customer ${rating}/5`);
      showToast('Rating submitted!', 'success');
      setRatingModal({ open: false, booking: null });
    } catch (e) {
      showToast('Error submitting rating', 'error');
    }
  };

  const handleListVehicle = async (vehicleData) => {
    try {
      await addVehicle({ ...vehicleData, ownerID: currentUser.id, ownerName: currentUser.name });
      showToast('Vehicle listed successfully! Waiting for admin verification.', 'success');
      await auditLog(currentUser.id, 'VEHICLE_LISTED', `Listed ${vehicleData.brand} ${vehicleData.model}`);
      setListModalOpen(false);
      window.location.reload();
    } catch (e) {
      showToast('Error listing vehicle', 'error');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'requests', label: 'Rental Requests', icon: Clock },
    { key: 'active', label: 'Active Rentals', icon: Car },
    { key: 'inspections', label: 'Inspections', icon: CheckCircle },
    { key: 'vehicles', label: 'My Vehicles', icon: List },
    { key: 'completed', label: 'Completed', icon: List },
  ];

  if (!currentUser) return <div className="min-h-screen bg-background text-text pt-24 px-6 text-center"><p className="text-muted-foreground animate-pulse">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main className="container mx-auto px-6 pt-24 pb-16 max-w-7xl">
        <div className="fade-up mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Welcome back, <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0]}</span></h1>
            <p className="text-muted-foreground">Manage your rental listings and track earnings.</p>
          </div>
          <Button variant="primary" onClick={() => setListModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> List New Vehicle
          </Button>
        </div>

        <Tabs tabs={tabs} current={tab} onChange={setTab} />

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="fade-up mt-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value={rentalRequests.length} label="Pending Requests" color="amber" icon={Clock} />
              <StatCard value={activeRentals.length} label="Active Rentals" color="green" icon={Car} />
              <StatCard value={pendingInspections.length} label="Awaiting Inspection" color="blue" icon={CheckCircle} />
              <StatCard value={`Rs. ${Math.round(totalEarnings).toLocaleString('en-PK')}`} label="Total Earnings" color="emerald" icon={DollarSign} />
            </div>

            {rentalRequests.length > 0 && (
              <Card className="border-l-4 border-l-amber-500 p-6 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">New Rental Requests Pending</h3>
                    <p className="text-sm text-muted-foreground mb-3">You have {rentalRequests.length} customer(s) waiting for approval</p>
                    <Button size="sm" onClick={() => setTab('requests')}>Review Requests</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* RENTAL REQUESTS TAB */}
        {tab === 'requests' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="w-5 h-5" /> Pending Rental Requests</h3>
            {rentalRequests.length === 0 ? (
              <Card className="text-center p-12"><p className="text-muted-foreground">No pending requests</p></Card>
            ) : (
              <div className="space-y-4">
                {rentalRequests.map(b => {
                  const vehicle = vehicles.find(v => v.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="border-l-4 border-l-amber-500 p-6">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VEHICLE</p>
                          <p className="font-bold">{vehicle?.brand} {vehicle?.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">CUSTOMER</p>
                          <p className="font-bold text-blue-600">{b.customerID}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">RENTAL PERIOD</p>
                          <p className="font-bold">{b.duration} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">TOTAL COST</p>
                          <p className="font-bold">Rs. {Math.round(b.cost || 0).toLocaleString('en-PK')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => setApprovalModal({ open: true, booking: b })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve & Confirm
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDeclineRequest(b)}>
                          <X className="w-4 h-4 mr-1" /> Decline
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE RENTALS TAB */}
        {tab === 'active' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Car className="w-5 h-5" /> Active Rentals</h3>
            {activeRentals.length === 0 ? (
              <Card className="text-center p-12"><p className="text-muted-foreground">No active rentals</p></Card>
            ) : (
              <div className="space-y-4">
                {activeRentals.map(b => {
                  const vehicle = vehicles.find(v => v.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="border-l-4 border-l-green-500 p-6">
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VEHICLE</p>
                          <p className="font-bold">{vehicle?.brand} {vehicle?.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">RENTER</p>
                          <p className="font-bold text-blue-600">{b.customerID}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                          <p className="font-bold text-green-600">{b.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="secondary" size="sm" onClick={async () => {
                          try {
                            await createDispute(b.bookingID, 'Owner reported damage');
                            await auditLog(currentUser.id, 'DAMAGE_REPORTED', `Owner disputed booking ${b.bookingID}`);
                            showToast('Damage reported. Booking marked as Disputed.', 'warning');
                            window.location.reload();
                          } catch (e) { showToast(`Error: ${e.message}`, 'error'); }
                        }}>
                          <AlertCircle className="w-4 h-4 mr-1" /> Report Damage
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY VEHICLES TAB */}
        {tab === 'vehicles' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Car className="w-5 h-5" /> My Registered Vehicles</h3>
            {vehicles.length === 0 ? (
              <Card className="text-center p-12">
                <p className="text-muted-foreground mb-4">No vehicles listed yet.</p>
                <Button onClick={() => setListModalOpen(true)}>List Your First Vehicle</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(v => (
                  <Card key={v.vehicleID} className="overflow-hidden">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                      {v.image ? (
                        <img src={v.image} alt={v.model} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-12 h-12 text-slate-300" />
                      )}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${
                          v.verificationStatus === 'Verified' || v.verificationStatus === 'Approved' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {v.verificationStatus}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-lg">{v.brand} {v.model}</p>
                      <p className="text-sm text-muted-foreground mb-2">{v.licensePlate}</p>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-blue-600">Rs. {v.ratePerDay}/day</span>
                        <span className={v.available ? 'text-green-600' : 'text-red-600'}>
                          {v.available ? 'Available' : 'Rented'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INSPECTIONS TAB */}
        {tab === 'inspections' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Return Inspections</h3>
            {pendingInspections.length === 0 ? (
              <Card className="text-center p-12"><p className="text-muted-foreground">No pending inspections</p></Card>
            ) : (
              <div className="space-y-4">
                {pendingInspections.map(b => {
                  const vehicle = vehicles.find(v => v.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="border-l-4 border-l-blue-500 p-6">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VEHICLE</p>
                          <p className="font-bold">{vehicle?.brand} {vehicle?.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">CUSTOMER</p>
                          <p className="font-bold text-blue-600">{b.customerID}</p>
                        </div>
                      </div>
                      {b.returnVideoPath && (
                        <p className="text-sm text-muted-foreground mb-4">
                          <span className="font-bold">Return Video:</span> {b.returnVideoPath}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => setInspectionModal({ open: true, booking: b, approved: true })}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Inspect & Approve Return
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setInspectionModal({ open: true, booking: b, approved: false })}>
                          Flag Damage / Dispute
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMPLETED TAB */}
        {tab === 'completed' && (
          <div className="fade-up mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><List className="w-5 h-5" /> Completed Rentals</h3>
            {completedRentals.length === 0 ? (
              <Card className="text-center p-12"><p className="text-muted-foreground">No completed rentals</p></Card>
            ) : (
              <div className="space-y-4">
                {completedRentals.map(b => {
                  const vehicle = vehicles.find(v => v.vehicleID === b.vehicleID);
                  return (
                    <Card key={b.bookingID} className="p-6">
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VEHICLE</p>
                          <p className="font-bold">{vehicle?.brand} {vehicle?.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">RENTER</p>
                          <p className="font-bold text-blue-600">{b.customerID}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">EARNED</p>
                          <p className="font-bold text-green-600">Rs. {Math.round(b.amountPaid || 0).toLocaleString('en-PK')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                          <p className="font-bold">{b.status}</p>
                        </div>
                      </div>
                      {!b.ownerRated && (
                        <Button variant="secondary" size="sm" onClick={() => setRatingModal({ open: true, booking: b })}>
                          <Star className="w-4 h-4 mr-1" /> Rate Customer
                        </Button>
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
      {approvalModal.open && approvalModal.booking && (
        <ChecklistModal 
          title="Approve Rental Request"
          subtitle="Complete 8-point checklist for pickup condition"
          requireVideo={false}
          onClose={() => setApprovalModal({ open: false, booking: null })}
          onSubmit={({ checklist, dentDescription }) => handleApproveRequest(approvalModal.booking, JSON.stringify({ checklist, dentDescription }))}
        />
      )}

      {inspectionModal.open && inspectionModal.booking && (
        <ChecklistModal 
          title={inspectionModal.approved ? "Approve Return" : "Flag Issues"}
          subtitle={`Verifying return for ${inspectionModal.booking.bookingID}. Review customer's checklist.`}
          readOnly={true}
          requireVideo={false}
          initialData={(() => {
            try {
              if (!inspectionModal.booking.customerChecklist) return null;
              return typeof inspectionModal.booking.customerChecklist === 'string' ? JSON.parse(inspectionModal.booking.customerChecklist) : inspectionModal.booking.customerChecklist;
            } catch (e) {
              console.error("Failed to parse checklist", e);
              return null;
            }
          })()}
          onClose={() => setInspectionModal({ open: false, booking: null })}
          onSubmit={({ dentDescription }) => handleCompleteInspection(inspectionModal.booking, dentDescription, inspectionModal.approved)}
        />
      )}

      {ratingModal.open && ratingModal.booking && (
        <RatingModal 
          booking={ratingModal.booking}
          onClose={() => setRatingModal({ open: false, booking: null })}
          onSubmit={(rating, comment) => handleSubmitRating(ratingModal.booking, rating, comment)}
        />
      )}

      {listModalOpen && (
        <ListVehicleModal 
          onClose={() => setListModalOpen(false)}
          onSubmit={handleListVehicle}
        />
      )}
    </div>
  );
}
