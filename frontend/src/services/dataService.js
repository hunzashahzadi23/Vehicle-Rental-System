const API_BASE = 'http://localhost:4000/api';

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ── Financial helpers (used by VehicleModal) ──
export const calculateDeposit = (isLuxury, insuranceType) => {
  const base = isLuxury ? 15000 : 5000;
  if (insuranceType === 'Premium') return base * 2;
  if (insuranceType === 'Standard') return Math.round(base * 1.5);
  return base; // Basic
};

export const calculateSurcharge = (vehicle, days) => {
  let surcharge = 0;
  if (vehicle?.isLuxury) surcharge += 2000;
  if (days > 7) surcharge += 1000;
  return surcharge;
};

// ── Booking normalizer: maps CSV field names to consistent JS names ──
const bookingFromCsv = (b) => ({
  bookingID:         b.bookingID         || '',
  vehicleID:         b.bookedVehicleID   || b.vehicleID   || '',  // FIXED
  customerID:        b.bookedCustomerID  || b.customerID  || '',  // FIXED
  ownerID:           b.ownerID           || '',
  rentDate:          b.rentDate          || '',
  duration:          toNum(b.rentDuration   || b.duration, 0),     // FIXED
  cost:              toNum(b.rentalCost     || b.cost,     0),     // FIXED
  insurance:         b.insuranceType     || b.insurance   || 'Basic', // FIXED
  deposit:           toNum(b.securityDeposit || b.deposit, 0),    // FIXED
  status:            b.status            || '',
  pickupVideoPath:   b.pickupVideoPath   || '',
  returnVideoPath:   b.returnVideoPath   || '',
  customerChecklist: b.customerChecklist || '',
  ownerChecklist:    b.ownerChecklist    || '',
  dentDescription:   b.dentDescription   || '',
  customerRated:     b.customerRated === 'true' || b.customerRated === true,
  ownerRated:        b.ownerRated === 'true'    || b.ownerRated === true,
  amountLocked:      toNum(b.amountLocked, 0),
  amountPaid:        toNum(b.amountPaid,   0),
  inspectionNotes:   b.inspectionNotes   || '',
  disputeReason:     b.disputeReason     || '',
  adminVerdictNotes: b.adminVerdictNotes || '',
  customerRating:    toNum(b.customerRating, 0),
  ownerRating:       toNum(b.ownerRating,    0),
  customerReview:    b.customerReview    || '',
  ownerReview:       b.ownerReview       || '',
  createdAt:         b.createdAt         || '',
  approvedAt:        b.approvedAt        || '',
  pickupAt:          b.pickupAt          || '',
  returnAt:          b.returnAt          || '',
  completedAt:       b.completedAt       || '',
  paymentPaidDate:   b.paymentPaidDate   || '',
});

const vehicleFromCsv = (v) => ({
  vehicleID:          v.vehicle_id       || v.vehicleID       || '',
  license:            v.vehicle_number   || v.license         || '',
  brand:              v.brand            || '',
  model:              v.model            || '',
  ownerID:            v.owner_id         || v.ownerID         || '',
  ownerName:          v.owner_name       || v.ownerName       || '',
  vehicleType:        v.vehicle_type     || v.vehicleType     || 'Car',
  ratePerDay:         toNum(v.rate_per_day ?? v.ratePerDay, 5000),
  verificationStatus: v.verification_status || v.verificationStatus || 'Pending',
  available:          String(v.available ?? '1') === '1' || v.available === true,
  fuelType:           v.fuelType         || 'Petrol',
  transmission:       v.transmission     || 'Automatic',
  seats:              toNum(v.seats, 5),
  year:               toNum(v.year, 2022),
  isLuxury:           String(v.is_luxury ?? '0') === '1' || v.isLuxury === true,
  description:        v.description      || '',
  image:              v.image            || '',
});

const userFromCsv = (u) => ({
  id:              u.user_id    || u.id    || '',
  name:            u.name       || '',
  email:           u.email      || '',
  password:        u.password   || '',
  role:            u.role       || 'Customer',
  cnic:            u.cnic       || '',
  phone:           u.phone      || '',
  address:         u.address    || '',
  trustScore:      toNum(u.trust_score    ?? u.trustScore,    3.0),
  walletAvailable: toNum(u.wallet_available ?? u.walletAvailable, 0),
  walletLocked:    toNum(u.wallet_locked   ?? u.walletLocked,   0),
  // Derived: trust level
  trustLevel:      toNum(u.trust_score ?? u.trustScore, 3.0) >= 4 ? 'Trusted'
                 : toNum(u.trust_score ?? u.trustScore, 3.0) >= 2 ? 'Normal'
                 : 'Monitoring',
  isRestricted:    toNum(u.trust_score ?? u.trustScore, 3.0) < 2.0,
  favorites:       Array.isArray(u.favorites) ? u.favorites : [],
  reviews:         Array.isArray(u.reviews)   ? u.reviews   : [],
});

const userToCsvPatch = (updates) => {
  const out = {};
  if ('name'            in updates) out.name             = updates.name;
  if ('email'           in updates) out.email            = updates.email;
  if ('password'        in updates) out.password         = updates.password;
  if ('role'            in updates) out.role             = updates.role;
  if ('cnic'            in updates) out.cnic             = updates.cnic;
  if ('phone'           in updates) out.phone            = updates.phone;
  if ('address'         in updates) out.address          = updates.address;
  if ('trustScore'      in updates) out.trust_score      = updates.trustScore;
  if ('walletAvailable' in updates) out.wallet_available = updates.walletAvailable;
  if ('walletLocked'    in updates) out.wallet_locked    = updates.walletLocked;
  return out;
};

const vehicleToCsv = (v) => ({
  vehicle_id:          v.vehicleID,
  vehicle_number:      v.license || v.licensePlate || '',
  owner_name:          v.ownerName || '',
  owner_id:            v.ownerID   || '',
  vehicle_type:        v.vehicleType || 'Car',
  brand:               v.brand  || '',
  model:               v.model  || '',
  rate_per_day:        v.ratePerDay ?? 0,
  verification_status: v.verificationStatus || 'Pending',
  available:           v.available ? 1 : 0,
  fuelType:            v.fuelType     || '',
  transmission:        v.transmission || '',
  seats:               v.seats ?? '',
  year:                v.year  ?? '',
  is_luxury:           v.isLuxury ? 1 : 0,
  description:         v.description || '',
  image:               v.image       || '',
});

const vehicleToCsvPatch = (updates) => {
  const out = {};
  if ('vehicleID'          in updates) out.vehicle_id          = updates.vehicleID;
  if ('license'            in updates) out.vehicle_number       = updates.license;
  if ('ownerName'          in updates) out.owner_name           = updates.ownerName;
  if ('ownerID'            in updates) out.owner_id             = updates.ownerID;
  if ('vehicleType'        in updates) out.vehicle_type         = updates.vehicleType;
  if ('brand'              in updates) out.brand                = updates.brand;
  if ('model'              in updates) out.model                = updates.model;
  if ('ratePerDay'         in updates) out.rate_per_day         = updates.ratePerDay;
  if ('verificationStatus' in updates) out.verification_status  = updates.verificationStatus;
  if ('available'          in updates) out.available            = updates.available ? 1 : 0;
  if ('fuelType'           in updates) out.fuelType             = updates.fuelType;
  if ('transmission'       in updates) out.transmission         = updates.transmission;
  if ('seats'              in updates) out.seats                = updates.seats;
  if ('year'               in updates) out.year                 = updates.year;
  if ('isLuxury'           in updates) out.is_luxury            = updates.isLuxury ? 1 : 0;
  if ('description'        in updates) out.description          = updates.description;
  if ('image'              in updates) out.image                = updates.image;
  return out;
};

// ── OOP Models ────────────────────────────────────────────────────────────
export class Review {
  constructor(vehicleId, userId, rating, comment) {
    this.id        = `REV-${Date.now()}`;
    this.vehicleId = vehicleId;
    this.userId    = userId;
    this.rating    = rating;
    this.comment   = comment || '';
    this.date      = new Date().toISOString();
  }
}

export class Favorite {
  constructor(userId, vehicleId) {
    this.userId    = userId;
    this.vehicleId = vehicleId;
    this.addedAt   = new Date().toISOString();
  }
}

export class Rating {
  constructor(score, type = 'vehicle') {
    this.score     = score;
    this.type      = type;
    this.timestamp = new Date().toISOString();
  }
}

// ── Init & Health ─────────────────────────────────────────────────────────
export async function initData() { await apiFetch('/health'); }

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API error');
  return data;
}

// ── Vehicles ──────────────────────────────────────────────────────────────
export const getVehicles = async () => (await apiFetch('/vehicles')).map(vehicleFromCsv);

export const updateVehicle = async (vehicleID, updates) => {
  await apiFetch(`/vehicles/${vehicleID}`, {
    method: 'PATCH',
    body: JSON.stringify(vehicleToCsvPatch(updates)),
  });
};

export const addVehicle = async (vehicle) => {
  const all = await getVehicles();
  const nextID = `VC-${String(all.length + 1).padStart(4, '0')}`;
  const newVeh = { ...vehicle, vehicleID: nextID, verificationStatus: 'Pending', available: true };
  await apiFetch('/vehicles', { method: 'PUT', body: JSON.stringify([...all, newVeh]) });
  return newVeh;
};

export const getVerifiedVehicles = async () =>
  (await getVehicles()).filter(v => v.verificationStatus === 'Approved' || v.verificationStatus === 'Verified');

// ── Users ─────────────────────────────────────────────────────────────────
export const getUsers = async () => (await apiFetch('/users')).map(userFromCsv);

export const findUserById = async (id) => {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
};

export const findUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find(u => u.email === email) || null;
};

export const updateUser = async (id, updates) => {
  await apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(userToCsvPatch(updates)) });
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const registerUser = async (userData) =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

// ── Bookings ──────────────────────────────────────────────────────────────
export const getBookings = async () =>
  (await apiFetch('/bookings')).map(bookingFromCsv);  // FIXED: normalize all field names

export const addBooking = async (booking) => {
  const bookings = await apiFetch('/bookings');
  const newID = `B-${String(bookings.length + 1).padStart(4, '0')}`;
  const newBooking = {
    ...booking,
    bookingID: newID,
    status: booking.status || 'PendingApproval',
    rentDate: booking.rentDate || new Date().toISOString().slice(0, 10)
  };
  await apiFetch('/bookings', { method: 'POST', body: JSON.stringify(newBooking) });
  return newBooking;
};

export const updateBooking = async (bookingID, updates) => {
  await apiFetch(`/bookings/${bookingID}`, { method: 'PATCH', body: JSON.stringify(updates) });
};

// FIXED: filter by correct normalized field names
export const getBookingsByCustomer = async (id) =>
  (await getBookings()).filter(b => b.customerID === id);

export const getBookingsByOwner = async (id) =>
  (await getBookings()).filter(b => b.ownerID === id);

// FIXED: 'PendingInspection' no space
export const getPendingInspectionBookings = async () =>
  (await getBookings()).filter(b => b.status === 'PendingInspection');

export const getDisputedBookings = async () =>
  (await getBookings()).filter(b => b.status === 'Disputed');

// ── Audit & Transactions ──────────────────────────────────────────────────
// FIXED: Use server CSV_SCHEMAS.audit_logs field names: timestamp, actorID, action, details
export const auditLog = async (userID, actionType, result) => {
  const log = {
    timestamp: new Date().toISOString(),
    actorID:   userID,      // maps to CSV 'actorID'
    action:    actionType,  // maps to CSV 'action'
    details:   result,      // maps to CSV 'details'
  };
  await apiFetch('/audit', { method: 'POST', body: JSON.stringify(log) });
};

export const getAuditLog = async () => apiFetch('/audit');

export const addTransaction = async (userID, type, amount, note = '') => {
  const txn = {
    id: `TX-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userID, type,
    amount: Number(amount) || 0,
    description: note,
  };
  await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(txn) });
};

export const getTransactionsByUser = async (userID) =>
  (await apiFetch('/transactions')).filter(t => t.userID === userID);

// ── Trust & Wallet helpers ─────────────────────────────────────────────────
export const adjustTrustScore = async (id, delta) => {
  const u = await findUserById(id);
  if (u) await updateUser(id, { trustScore: Math.max(0, Math.min(5, u.trustScore + delta)) });
};

export const applyPenalty = async (userId, reason) => {
  await adjustTrustScore(userId, -1.0);
  await auditLog(userId, 'PENALTY_APPLIED', reason);
};

export const TrustSystem = {
  updateScore: async (userId, delta) => {
    const user = await findUserById(userId);
    if (!user) return;
    await updateUser(userId, { trustScore: Math.max(0, Math.min(5, (user.trustScore || 0) + delta)) });
  },
};

// ── Marketplace Stats ──────────────────────────────────────────────────────
export const getMarketplaceStats = async () => {
  const v = await getVehicles();
  const u = await getUsers();
  return {
    verifiedVehicles: v.filter(x => x.verificationStatus === 'Approved' || x.verificationStatus === 'Verified').length,
    availableNow:     v.filter(x => x.available).length,
    luxuryFleet:      v.filter(x => x.isLuxury).length,
    activeOwners:     new Set(u.filter(x => x.role === 'Lessor').map(x => x.id)).size,
  };
};

// ── Vehicles helpers ──────────────────────────────────────────────────────
export const saveVehicles = async (vehicles) => {
  await apiFetch('/vehicles', { method: 'PUT', body: JSON.stringify((vehicles || []).map(vehicleToCsv)) });
};

export const getPendingVehicles = async () =>
  (await getVehicles()).filter(v => v.verificationStatus === 'Pending');

// ── Favorites ──────────────────────────────────────────────────────────────
export const getUserFavorites = async (userId) => {
  try { return await apiFetch(`/favorites/${userId}`); } catch { return []; }
};

export const toggleFavorite = async (vehicleId, userId) =>
  FavManager.toggle(vehicleId, userId);

export const FavManager = {
  getFavorites: async (id) => (await apiFetch('/favorites')).filter(f => f.userID === id),
  toggle: async (vId, uId) =>
    apiFetch('/favorites/toggle', { method: 'POST', body: JSON.stringify({ userID: uId, vehicleID: vId }) }),
};

// ── Reviews ────────────────────────────────────────────────────────────────
export const saveReview = async (targetId, reviewerId, rating, comment) => {
  const newRev = new Review(targetId, reviewerId, rating, comment);
  await apiFetch('/reviews', { method: 'POST', body: JSON.stringify(newRev) });
};

export const ReviewManager = {
  forUser: async (userId) => (await apiFetch('/reviews')).filter(r => r.userId === userId),
};

// ── Booking State Transitions ──────────────────────────────────────────────
export const approveBooking = async (bookingId, ownerChecklist, actorID) =>
  apiFetch(`/bookings/${bookingId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ ownerChecklist, actorID }),
  });

export const completePickup = async (bookingId, pickupVideoPath, actorID) =>
  apiFetch(`/bookings/${bookingId}/complete-pickup`, {
    method: 'POST',
    body: JSON.stringify({ pickupVideoPath, actorID }),
  });

// NEW: PickupCompleted → Active
export const activateBooking = async (bookingId, actorID) =>
  apiFetch(`/bookings/${bookingId}/activate`, {
    method: 'POST',
    body: JSON.stringify({ actorID }),
  });

export const completeReturn = async (bookingId, returnVideoPath, customerChecklist, actorID) =>
  apiFetch(`/bookings/${bookingId}/complete-return`, {
    method: 'POST',
    body: JSON.stringify({ returnVideoPath, customerChecklist, actorID }),
  });

export const submitRating = async (bookingId, ratedBy, rating, review) =>
  apiFetch(`/bookings/${bookingId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ ratedBy, rating, review }),
  });

export const inspectBooking = async (bookingId, inspectionNotes, approved, adminID) =>
  apiFetch(`/bookings/${bookingId}/inspect`, {
    method: 'POST',
    body: JSON.stringify({ inspectionNotes, approved: String(approved), adminID }),
  });

// ── Dispute ───────────────────────────────────────────────────────────────
export const createDispute = async (bookingId, reason) =>
  apiFetch('/disputes/create', { method: 'POST', body: JSON.stringify({ bookingId, reason }) });

export const resolveDispute = async (bookingId, verdict, notes, penalizeUserId) =>
  apiFetch('/disputes/resolve', {
    method: 'POST',
    body: JSON.stringify({ bookingId, verdict, notes, penalizeUserId }),
  });

// ── Video ────────────────────────────────────────────────────────────────
export const uploadVideo = async (bookingId, videoType, videoPath) =>
  apiFetch('/videos/upload', { method: 'POST', body: JSON.stringify({ bookingId, videoType, videoPath }) });

// ── Government Registry ──────────────────────────────────────────────────
export const verifyVehicleOwnership = async (vehicleNumber, ownerCnic) => {
  await apiFetch('/vehicles/verify', { method: 'POST', body: JSON.stringify({ vehicleNumber, ownerCnic }) });
  return true;
};
