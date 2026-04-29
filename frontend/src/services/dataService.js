const API_BASE = 'http://localhost:4000/api';

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const vehicleFromCsv = (v) => ({
  vehicleID: v.vehicle_id || v.vehicleID || '',
  license: v.vehicle_number || v.license || '',
  brand: v.brand || '',
  model: v.model || '',
  ownerID: v.owner_id || v.ownerID || '',
  ownerName: v.owner_name || v.ownerName || '',
  vehicleType: v.vehicle_type || v.vehicleType || 'Car',
  ratePerDay: toNum(v.rate_per_day ?? v.ratePerDay, 5000),
  verificationStatus: v.verification_status || v.verificationStatus || 'Pending',
  available: String(v.available ?? '1') === '1' || v.available === true,
  fuelType: v.fuelType || 'Petrol',
  transmission: v.transmission || 'Automatic',
  seats: toNum(v.seats, 5),
  year: toNum(v.year, 2022),
  isLuxury: String(v.is_luxury ?? '0') === '1' || v.isLuxury === true,
  description: v.description || '',
  image: v.image || '',
});

const userFromCsv = (u) => ({
  id: u.user_id || u.id || '',
  name: u.name || '',
  email: u.email || '',
  password: u.password || '',
  role: u.role || 'Customer',
  cnic: u.cnic || '',
  phone: u.phone || '',
  address: u.address || '',
  trustScore: toNum(u.trust_score ?? u.trustScore, 3.0),
  walletAvailable: toNum(u.wallet_available ?? u.walletAvailable, 0),
  walletLocked: toNum(u.wallet_locked ?? u.walletLocked, 0),
  favorites: Array.isArray(u.favorites) ? u.favorites : [],
  reviews: Array.isArray(u.reviews) ? u.reviews : [],
});

const userToCsvPatch = (updates) => {
  const out = {};
  if ('name' in updates) out.name = updates.name;
  if ('email' in updates) out.email = updates.email;
  if ('password' in updates) out.password = updates.password;
  if ('role' in updates) out.role = updates.role;
  if ('cnic' in updates) out.cnic = updates.cnic;
  if ('phone' in updates) out.phone = updates.phone;
  if ('address' in updates) out.address = updates.address;
  if ('trustScore' in updates) out.trust_score = updates.trustScore;
  if ('walletAvailable' in updates) out.wallet_available = updates.walletAvailable;
  if ('walletLocked' in updates) out.wallet_locked = updates.walletLocked;
  return out;
};

const vehicleToCsv = (v) => ({
  vehicle_id: v.vehicleID,
  vehicle_number: v.license || v.licensePlate || '',
  owner_name: v.ownerName || '',
  owner_id: v.ownerID || '',
  vehicle_type: v.vehicleType || 'Car',
  brand: v.brand || '',
  model: v.model || '',
  rate_per_day: v.ratePerDay ?? 0,
  verification_status: v.verificationStatus || 'Pending',
  available: v.available ? 1 : 0,
  fuelType: v.fuelType || '',
  transmission: v.transmission || '',
  seats: v.seats ?? '',
  year: v.year ?? '',
  is_luxury: v.isLuxury ? 1 : 0,
  description: v.description || '',
  image: v.image || '',
});

const vehicleToCsvPatch = (updates) => {
  const out = {};
  if ('vehicleID' in updates) out.vehicle_id = updates.vehicleID;
  if ('license' in updates) out.vehicle_number = updates.license;
  if ('ownerName' in updates) out.owner_name = updates.ownerName;
  if ('ownerID' in updates) out.owner_id = updates.ownerID;
  if ('vehicleType' in updates) out.vehicle_type = updates.vehicleType;
  if ('brand' in updates) out.brand = updates.brand;
  if ('model' in updates) out.model = updates.model;
  if ('ratePerDay' in updates) out.rate_per_day = updates.ratePerDay;
  if ('verificationStatus' in updates) out.verification_status = updates.verificationStatus;
  if ('available' in updates) out.available = updates.available ? 1 : 0;
  if ('fuelType' in updates) out.fuelType = updates.fuelType;
  if ('transmission' in updates) out.transmission = updates.transmission;
  if ('seats' in updates) out.seats = updates.seats;
  if ('year' in updates) out.year = updates.year;
  if ('isLuxury' in updates) out.is_luxury = updates.isLuxury ? 1 : 0;
  if ('description' in updates) out.description = updates.description;
  if ('image' in updates) out.image = updates.image;
  return out;
};

// ── OOPS Models ───────────────────────────────────────────────────
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

// ── Init & Seeding ───────────────────────────────────────────────
export async function initData() {
  await apiFetch('/health');
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API error');
  return data;
}

// ── Vehicles ──────────────────────────────────────────────────────
export const getVehicles = async () => {
  const rows = await apiFetch('/vehicles');
  return rows.map(vehicleFromCsv);
};

export const updateVehicle = async (vehicleID, updates) => {
  await apiFetch(`/vehicles/${vehicleID}`, {
    method: 'PATCH',
    body: JSON.stringify(vehicleToCsvPatch(updates)),
  });
};

export const addVehicle = async (vehicle) => {
  const all = await getVehicles();
  const nextID = `VC-${String(all.length + 1).padStart(4, '0')}`;
  const newVeh = { 
    ...vehicle, 
    vehicleID: nextID, 
    verificationStatus: 'Pending', 
    available: true 
  };
  // We use PUT /api/vehicles to overwrite the whole list with the new item
  const rows = [...all, newVeh];
  await apiFetch('/vehicles', {
    method: 'PUT',
    body: JSON.stringify(rows)
  });
  return newVeh;
};

export const getVerifiedVehicles = async () => {
  const all = await getVehicles();
  return all.filter(v => v.verificationStatus === 'Approved' || v.verificationStatus === 'Verified');
};

// ── Users ─────────────────────────────────────────────────────────
export const getUsers = async () => {
  const rows = await apiFetch('/users');
  return rows.map(userFromCsv);
};

export const findUserById = async (id) => {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
};

export const findUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find(u => u.email === email) || null;
};

export const updateUser = async (id, updates) => {
  await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(userToCsvPatch(updates)),
  });
};

// ── Auth ──────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  return await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = async (userData) => {
  return await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// ── Bookings ──────────────────────────────────────────────────────
export const getBookings = async () => {
  return await apiFetch('/bookings');
};

export const addBooking = async (booking) => {
  const bookings = await getBookings();
  const newID = `B-${String(bookings.length + 1).padStart(4, '0')}`;
  const newBooking = { ...booking, bookingID: newID, status: booking.status || 'Pending Approval', rentDate: booking.rentDate || new Date().toISOString().slice(0, 10) };
  await apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify(newBooking),
  });
  return newBooking;
};

export const updateBooking = async (bookingID, updates) => {
  await apiFetch(`/bookings/${bookingID}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const getBookingsByCustomer = async (id) => (await getBookings()).filter(b => b.customerID === id);
export const getBookingsByOwner = async (id) => (await getBookings()).filter(b => b.ownerID === id);

// ── Audit & Transactions ──────────────────────────────────────────
export const auditLog = async (userID, actionType, result) => {
  const log = { timestamp: new Date().toISOString(), userID, actionType, result };
  await apiFetch('/audit', {
    method: 'POST',
    body: JSON.stringify(log),
  });
};

export const getMarketplaceStats = async () => {
  const v = await getVehicles();
  const u = await getUsers();
  return {
    verifiedVehicles: v.filter(x => x.verificationStatus === 'Approved' || x.verificationStatus === 'Verified').length,
    availableNow: v.filter(x => x.available).length,
    luxuryFleet: v.filter(x => x.isLuxury).length,
    activeOwners: new Set(u.filter(x => x.role === 'Lessor').map(x => x.id)).size,
  };
};

// ── Backward Compatibility Shims ──────────────────────────────────
export const adjustTrustScore = async (id, delta) => {
  const u = await findUserById(id);
  if (u) await updateUser(id, { trustScore: Math.max(0, Math.min(5, u.trustScore + delta)) });
};
export const saveReview = async (targetId, userIdOrRating, ratingOrComment, commentArg) => {
  const rating = typeof commentArg === 'undefined' ? userIdOrRating : ratingOrComment;
  const comment = typeof commentArg === 'undefined' ? ratingOrComment : commentArg;
  const reviewerId = typeof commentArg === 'undefined' ? null : userIdOrRating;
  const newRev = new Review(targetId, reviewerId, rating, comment);
  await apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(newRev),
  });
};
export const FavManager = {
  getFavorites: async (id) => {
    const rows = await apiFetch('/favorites');
    return rows.filter(f => f.userID === id);
  },
  toggle: async (vId, uId) => {
    const rows = await apiFetch('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ userID: uId, vehicleID: vId }),
    });
    return rows;
  }
};

export const ReviewManager = {
  forUser: async (userId) => {
    const rows = await apiFetch('/reviews');
    return rows.filter(r => r.userId === userId);
  },
};

export const toggleFavorite = async (vehicleId, userId) => FavManager.toggle(vehicleId, userId);

export const saveVehicles = async (vehicles) => {
  await apiFetch('/vehicles', {
    method: 'PUT',
    body: JSON.stringify((vehicles || []).map(vehicleToCsv)),
  });
};

export const getPendingVehicles = async () =>
  (await getVehicles()).filter(v => v.verificationStatus === 'Pending');

export const getDisputedBookings = async () =>
  (await getBookings()).filter(b => b.status === 'Disputed');

export const getPendingInspectionBookings = async () =>
  (await getBookings()).filter(b => b.status === 'Pending Inspection');

export const getAuditLog = async () => {
  return await apiFetch('/audit');
};

export const addTransaction = async (userID, type, amount, note = '') => {
  const txn = {
    id: `TX-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userID,
    type,
    amount: Number(amount) || 0,
    description: note,
  };
  await apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(txn),
  });
};

export const getTransactionsByUser = async (userID) => {
  const rows = await apiFetch('/transactions');
  return rows.filter(t => t.userID === userID);
};

export const calculateDeposit = (isLuxury, insurance) => {
  if (insurance === 'Premium') return isLuxury ? 0 : 5000;
  return 50000;
};

export const calculateSurcharge = (baseCost, insurance) =>
  insurance === 'Premium' ? (Number(baseCost) || 0) * 0.15 : 0;

export const TrustSystem = {
  updateScore: async (userId, delta) => {
    const user = await findUserById(userId);
    if (!user) return;
    const updated = Math.max(0, Math.min(5, (user.trustScore || 0) + delta));
    await updateUser(userId, { trustScore: updated });
  },
};

export const verifyVehicleOwnership = async (vehicleNumber, ownerCnic) => {
  await apiFetch('/vehicles/verify', {
    method: 'POST',
    body: JSON.stringify({ vehicleNumber, ownerCnic }),
  });
  return true;
};

// NEW: Favorites with user-specific fetching
export const getUserFavorites = async (userId) => {
  try {
    return await apiFetch(`/favorites/${userId}`);
  } catch (e) {
    return [];
  }
};

// NEW: Video upload endpoint
export const uploadVideo = async (bookingId, videoType, videoPath) => {
  return await apiFetch('/videos/upload', {
    method: 'POST',
    body: JSON.stringify({ bookingId, videoType, videoPath }),
  });
};

// NEW: Dispute management
export const createDispute = async (bookingId, reason) => {
  return await apiFetch('/disputes/create', {
    method: 'POST',
    body: JSON.stringify({ bookingId, reason }),
  });
};

export const resolveDispute = async (bookingId, verdict, notes) => {
  return await apiFetch('/disputes/resolve', {
    method: 'POST',
    body: JSON.stringify({ bookingId, verdict, notes }),
  });
};

// NEW: Booking state transitions
export const approveBooking = async (bookingId, ownerChecklist) => {
  return await apiFetch(`/bookings/${bookingId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ ownerChecklist }),
  });
};

export const completePickup = async (bookingId, pickupVideoPath) => {
  return await apiFetch(`/bookings/${bookingId}/complete-pickup`, {
    method: 'POST',
    body: JSON.stringify({ pickupVideoPath }),
  });
};

export const completeReturn = async (bookingId, returnVideoPath, customerChecklist) => {
  return await apiFetch(`/bookings/${bookingId}/complete-return`, {
    method: 'POST',
    body: JSON.stringify({ returnVideoPath, customerChecklist }),
  });
};

export const submitRating = async (bookingId, ratedBy, rating, review) => {
  return await apiFetch(`/bookings/${bookingId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ ratedBy, rating, review }),
  });
};

export const inspectBooking = async (bookingId, inspectionNotes, approved) => {
  return await apiFetch(`/bookings/${bookingId}/inspect`, {
    method: 'POST',
    body: JSON.stringify({ inspectionNotes, approved: String(approved) }),
  });
};
