const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const ROOT = path.resolve(__dirname, '..');
const csvPath = (name) => path.join(ROOT, `${name}.csv`);
const CPP_EXE = path.join(__dirname, 'bin', 'auth_engine.exe');
const CSV_SCHEMAS = {
  users: ['user_id', 'name', 'email', 'password', 'role', 'cnic', 'phone', 'address', 'trust_score', 'wallet_available', 'wallet_locked'],
  vehicles: ['vehicle_id', 'vehicle_number', 'owner_name', 'owner_id', 'vehicle_type', 'brand', 'model', 'rate_per_day', 'verification_status', 'available', 'fuelType', 'transmission', 'seats', 'year', 'is_luxury', 'description', 'image'],
  marketplace_vehicles: ['listing_id', 'vehicle_id', 'owner_id', 'status', 'listed_at'],
  bookings: ['bookingID', 'vehicleID', 'customerID', 'ownerID', 'duration', 'cost', 'insurance', 'deposit', 'status', 'pickupVideoPath', 'returnVideoPath', 'customerChecklist', 'ownerChecklist', 'dentDescription', 'customerRated', 'ownerRated', 'rentDate', 'amountLocked', 'amountPaid', 'paymentDueDate', 'paymentPaidDate', 'inspectionNotes', 'disputeReason', 'adminVerdictNotes', 'customerRating', 'ownerRating', 'customerReview', 'ownerReview', 'createdAt', 'approvedAt', 'pickupAt', 'returnAt', 'completedAt'],
  audit_logs: ['timestamp', 'userID', 'actionType', 'result'],
  transactions: ['id', 'timestamp', 'userID', 'type', 'amount', 'description'],
  reviews: ['id', 'vehicleID', 'userId', 'rating', 'comment', 'date'],
  favorites: ['userID', 'vehicleID', 'addedAt'],
};

function ensureCsv(name) {
  const file = csvPath(name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${CSV_SCHEMAS[name].join(',')}\n`, 'utf8');
  }
}

Object.keys(CSV_SCHEMAS).forEach(ensureCsv);

function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

function writeCsv(file, rows, headers) {
  const body = rows.map((row) => headers.map((h) => row[h] ?? '').join(',')).join('\n');
  fs.writeFileSync(file, `${headers.join(',')}\n${body}`.trimEnd(), 'utf8');
}

function updateById(name, idField, idValue, patch) {
  const file = csvPath(name);
  const rows = readCsv(file);
  const idx = rows.findIndex((r) => String(r[idField]) === String(idValue));
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  writeCsv(file, rows, CSV_SCHEMAS[name]);
  return rows[idx];
}

function runCpp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CPP_EXE, args, { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      const out = stdout.trim();
      if (code === 0 && out.startsWith('OK|')) {
        resolve(out.substring(3).split('|').filter(x => x.length > 0));
        return;
      }
      const errMessage = out.startsWith('ERR|') ? out.substring(4) : (stderr.trim() || 'C++ command failed');
      reject(new Error(errMessage));
    });
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [id, name, userEmail, role, cnic, trustScore, walletAvailable, walletLocked] = await runCpp(['login', email, password]);
    res.json({ id, name, email: userEmail, role, cnic, trustScore: Number(trustScore), walletAvailable: Number(walletAvailable), walletLocked: Number(walletLocked) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, name, email, password, phone, address, cnic } = req.body;
    const [id, outName, outEmail, outRole, outCnic, trustScore, walletAvailable, walletLocked] =
      await runCpp(['register', role, name, email, password, phone, address, cnic, '100000']);
    res.json({ id, name: outName, email: outEmail, role: outRole, cnic: outCnic, trustScore: Number(trustScore), walletAvailable: Number(walletAvailable), walletLocked: Number(walletLocked) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/vehicles/verify', async (req, res) => {
  try {
    const { vehicleNumber, ownerCnic } = req.body;
    await runCpp(['verify_vehicle', vehicleNumber, ownerCnic]);
    res.json({ verified: true });
  } catch (err) {
    res.status(400).json({ error: err.message, verified: false });
  }
});

app.get('/api/users', (_req, res) => res.json(readCsv(csvPath('users'))));
app.get('/api/vehicles', (_req, res) => res.json(readCsv(csvPath('vehicles'))));
app.get('/api/marketplace', (_req, res) => res.json(readCsv(csvPath('marketplace_vehicles'))));
app.get('/api/bookings', (_req, res) => res.json(readCsv(csvPath('bookings'))));
app.get('/api/audit', (_req, res) => res.json(readCsv(csvPath('audit_logs'))));
app.get('/api/transactions', (_req, res) => res.json(readCsv(csvPath('transactions'))));
app.get('/api/reviews', (_req, res) => res.json(readCsv(csvPath('reviews'))));
app.get('/api/favorites', (_req, res) => res.json(readCsv(csvPath('favorites'))));

app.patch('/api/users/:id', (req, res) => {
  const updated = updateById('users', 'user_id', req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.patch('/api/vehicles/:id', (req, res) => {
  const updated = updateById('vehicles', 'vehicle_id', req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(updated);
});

app.put('/api/vehicles', (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  writeCsv(csvPath('vehicles'), rows, CSV_SCHEMAS.vehicles);
  res.json({ ok: true, count: rows.length });
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { customerID, vehicleID, ownerID, duration, cost, insurance, deposit, rentDate } = req.body || {};
    const [id, status] = await runCpp([
      'create_booking', customerID, vehicleID, ownerID, String(duration), String(cost), insurance, String(deposit), rentDate || ''
    ]);
    res.json({ bookingID: id, status, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/bookings/:id', (req, res) => {
  const updated = updateById('bookings', 'bookingID', req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

app.post('/api/audit', (req, res) => {
  const rows = readCsv(csvPath('audit_logs'));
  rows.push(req.body || {});
  writeCsv(csvPath('audit_logs'), rows, CSV_SCHEMAS.audit_logs);
  res.json({ ok: true });
});

app.post('/api/transactions', (req, res) => {
  const rows = readCsv(csvPath('transactions'));
  rows.push(req.body || {});
  writeCsv(csvPath('transactions'), rows, CSV_SCHEMAS.transactions);
  res.json({ ok: true });
});

app.post('/api/reviews', (req, res) => {
  const rows = readCsv(csvPath('reviews'));
  rows.push(req.body || {});
  writeCsv(csvPath('reviews'), rows, CSV_SCHEMAS.reviews);
  res.json({ ok: true });
});

app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { userID, vehicleID } = req.body || {};
    const out = await runCpp(['toggle_favorite', userID, vehicleID]);
    // out is [userID, vehicleID1, vehicleID2, ...]
    res.json(out.map(v => ({ userID, vehicleID: v })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// NEW: Get user's favorite vehicles
app.get('/api/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const out = await runCpp(['get_favorites', userId]);
    res.json(out.map(v => ({ userID: userId, vehicleID: v })));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// NEW: Get bookings by user (customer or owner)
app.get('/api/bookings/user/:userId', (req, res) => {
  const { userId } = req.params;
  const rows = readCsv(csvPath('bookings'));
  const userBookings = rows.filter((r) => r.customerID === userId || r.ownerID === userId);
  res.json(userBookings);
});

// NEW: Get bookings by status
app.get('/api/bookings/status/:status', (req, res) => {
  const { status } = req.params;
  const rows = readCsv(csvPath('bookings'));
  const statusBookings = rows.filter((r) => r.status === status);
  res.json(statusBookings);
});

// NEW: Upload video (store path reference)
app.post('/api/videos/upload', (req, res) => {
  const { bookingId, videoType, videoPath } = req.body || {};
  if (!bookingId || !videoType || !videoPath) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const bookings = readCsv(csvPath('bookings'));
  const idx = bookings.findIndex((b) => b.bookingID === bookingId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  if (videoType === 'pickup') {
    bookings[idx].pickupVideoPath = videoPath;
  } else if (videoType === 'return') {
    bookings[idx].returnVideoPath = videoPath;
  }
  
  writeCsv(csvPath('bookings'), bookings, CSV_SCHEMAS.bookings);
  res.json({ ok: true, videoPath });
});

// NEW: Admin dispute resolution
app.post('/api/disputes/resolve', (req, res) => {
  const { bookingId, verdict, notes } = req.body || {};
  if (!bookingId || !verdict) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const validVerdicts = ['ResolvedFavorOwner', 'ResolvedFavorRenter'];
  if (!validVerdicts.includes(verdict)) {
    return res.status(400).json({ error: 'Invalid verdict' });
  }
  
  const updated = updateById('bookings', 'bookingID', bookingId, {
    status: verdict,
    adminVerdictNotes: notes || ''
  });
  
  if (!updated) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  res.json({ ok: true, booking: updated });
});

// NEW: Initiate dispute
app.post('/api/disputes/create', (req, res) => {
  const { bookingId, reason } = req.body || {};
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID required' });
  }
  
  const updated = updateById('bookings', 'bookingID', bookingId, {
    status: 'Disputed',
    disputeReason: reason || ''
  });
  
  if (!updated) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  res.json({ ok: true, booking: updated });
});

// NEW: Approve booking (owner action)
app.post('/api/bookings/:id/approve', (req, res) => {
  const { ownerChecklist } = req.body || {};
  const updated = updateById('bookings', 'bookingID', req.params.id, {
    status: 'Approved',
    ownerChecklist: ownerChecklist || '',
    approvedAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

// NEW: Complete pickup (customer action)
app.post('/api/bookings/:id/complete-pickup', (req, res) => {
  const { pickupVideoPath } = req.body || {};
  const updated = updateById('bookings', 'bookingID', req.params.id, {
    status: 'PickupCompleted',
    pickupVideoPath: pickupVideoPath || '',
    pickupAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

// NEW: Complete return (customer action)
app.post('/api/bookings/:id/complete-return', (req, res) => {
  const { returnVideoPath, customerChecklist } = req.body || {};
  const updated = updateById('bookings', 'bookingID', req.params.id, {
    status: 'ReturnCompleted',
    returnVideoPath: returnVideoPath || '',
    customerChecklist: customerChecklist || '',
    returnAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

// NEW: Submit rating and review
app.post('/api/bookings/:id/rate', (req, res) => {
  const { ratedBy, rating, review } = req.body || {};
  if (!ratedBy || rating === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const update = {};
  if (ratedBy === 'customer') {
    update.customerRating = rating;
    update.customerReview = review || '';
    update.customerRated = 'true';
  } else if (ratedBy === 'owner') {
    update.ownerRating = rating;
    update.ownerReview = review || '';
    update.ownerRated = 'true';
  }
  
  const updated = updateById('bookings', 'bookingID', req.params.id, update);
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

// NEW: Admin inspection and completion
app.post('/api/bookings/:id/inspect', (req, res) => {
  const { inspectionNotes, approved } = req.body || {};
  const newStatus = approved === 'true' ? 'Completed' : 'Disputed';
  
  const updated = updateById('bookings', 'bookingID', req.params.id, {
    status: newStatus,
    inspectionNotes: inspectionNotes || '',
    completedAt: approved === 'true' ? new Date().toISOString() : ''
  });
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json(updated);
});

app.listen(4000, () => {
  console.log('Backend API running on http://localhost:4000');
});
