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
  bookings: ['bookingID','bookedVehicleID','bookedCustomerID','ownerID','rentDate','rentDuration','rentalCost','insuranceType','securityDeposit','status','pickupVideoPath','returnVideoPath','customerChecklist','ownerChecklist','dentDescription','customerRated','ownerRated','amountLocked','amountPaid','paymentDueDate','paymentPaidDate','inspectionNotes','disputeReason','adminVerdictNotes','customerRating','ownerRating','customerReview','ownerReview','createdAt','approvedAt','pickupAt','returnAt','completedAt'],
  audit_logs: ['timestamp','actorID','action','details'],
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

function normalizeCppOut(out, fields) {
  if (!out) return {};
  if (Array.isArray(out)) {
    const obj = {};
    fields.forEach((f, i) => { obj[f] = out[i]; });
    return obj;
  }
  if (typeof out === 'object') return out;
  return {};
}

function parseCsvLine(line) {
  const values = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      values.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  values.push(cur);
  return values.map(v => v.trim());
}

function quoteCsv(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

function tryParseJsonField(s) {
  if (s === undefined || s === null) return s;
  if (typeof s !== 'string') return s;
  const trimmed = s.trim();
  if (!trimmed) return '';
  // attempt to extract a JSON object substring (handle broken quoting)
  function extractJsonSubstring(str) {
    const start = str.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '{') depth++;
      else if (str[i] === '}') depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
    return null;
  }

  let candidate = extractJsonSubstring(trimmed);
  if (!candidate) {
    // fall back to removing wrapping quotes and unescaping doubled quotes
    candidate = trimmed.replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"').trim();
  } else {
    candidate = candidate.replace(/""/g, '"').replace(/\\"/g, '"').trim();
  }

  if (!candidate) return s;
  const first = candidate[0];
  if (first === '{' || first === '[') {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      return candidate;
    }
  }
  return s;
}

function normalizeBookingRow(row) {
  const r = { ...row };
  // Try to recover JSON that may have been split across multiple CSV columns
  const combined = [r.customerChecklist || '', r.ownerChecklist || '', r.dentDescription || ''].filter(Boolean).join(',');
  const parsed = tryParseJsonField(combined);
  if (parsed && typeof parsed === 'object') {
    r.customerChecklist = parsed;
    r.ownerChecklist = '';
    r.dentDescription = '';
  } else {
    ['customerChecklist', 'ownerChecklist', 'dentDescription'].forEach((f) => {
      if (r[f]) r[f] = tryParseJsonField(r[f]);
    });
  }
  return r;
}

function writeCsv(file, rows, headers) {
  const headerLine = headers.map(h => quoteCsv(h)).join(',');
  const body = rows.map((row) => headers.map((h) => quoteCsv(row[h] ?? '')).join(',')).join('\n');
  fs.writeFileSync(file, `${headerLine}\n${body}`.trimEnd(), 'utf8');
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
      // If C++ returns JSON directly (or JSON after OK|), parse it and return the object
      try {
        let payload = out;
        if (out.startsWith('OK|')) payload = out.substring(3);
        // raw JSON response
        if (payload.startsWith('{') || payload.startsWith('[')) {
          const parsed = JSON.parse(payload);
          if (code === 0) { resolve(parsed); return; }
        }
        // legacy pipe-delimited OK|a|b|c format
        if (code === 0 && out.startsWith('OK|')) {
          resolve(out.substring(3).split('|'));
          return;
        }
      } catch (e) {
        // fallthrough to error handling below
      }
      const errMessage = out.startsWith('ERR|') ? out.substring(4) : (stderr.trim() || `C++ command failed (code ${code})`);
      reject(new Error(errMessage));
    });
  });
}

function appendAudit(actorID, action, details) {
  const file = csvPath('audit_logs');
  const rows = readCsv(file);
  const entry = { timestamp: new Date().toISOString(), actorID, action, details };
  rows.push(entry);
  writeCsv(file, rows, CSV_SCHEMAS.audit_logs);
}

// JS-side validator mirroring C++ Booking::isValidStatusTransition
function isValidBookingTransition(current, next) {
  if (!current || current === next) return false;
  if (current === 'PendingApproval') return next === 'Approved' || next === 'Disputed';
  if (current === 'Approved') return next === 'PickupCompleted' || next === 'Disputed';
  if (current === 'PickupCompleted') return next === 'Active' || next === 'Disputed';
  if (current === 'Active') return next === 'ReturnCompleted' || next === 'Disputed';
  if (current === 'ReturnCompleted') return next === 'PendingInspection' || next === 'Disputed';
  if (current === 'PendingInspection') return next === 'Completed' || next === 'Disputed';
  if (current === 'Disputed') return next === 'ResolvedFavorOwner' || next === 'ResolvedFavorRenter';
  return false;
}

// Adjust user trust score helper
async function adjustUserTrust(userId, delta) {
  const file = csvPath('users');
  const rows = readCsv(file);
  const idx = rows.findIndex(r => r.user_id === userId);
  if (idx === -1) return;
  const current = parseFloat(rows[idx].trust_score) || 3.0;
  rows[idx].trust_score = String(Math.max(0, Math.min(5, current + delta)));
  writeCsv(file, rows, CSV_SCHEMAS.users);
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const out = await runCpp(['login', email, password]);
    const obj = normalizeCppOut(out, ['id','name','email','role','cnic','trustScore','walletAvailable','walletLocked']);
    res.json({ id: obj.id, name: obj.name, email: obj.email, role: obj.role, cnic: obj.cnic, trustScore: Number(obj.trustScore) || 0, walletAvailable: Number(obj.walletAvailable) || 0, walletLocked: Number(obj.walletLocked) || 0 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, name, email, password, phone, address, cnic } = req.body;
    const out = await runCpp(['register', role, name, email, password, phone, address, cnic, '100000']);
    const obj = normalizeCppOut(out, ['id','name','email','role','cnic','trustScore','walletAvailable','walletLocked']);
    res.json({ id: obj.id, name: obj.name, email: obj.email, role: obj.role, cnic: obj.cnic, trustScore: Number(obj.trustScore) || 0, walletAvailable: Number(obj.walletAvailable) || 0, walletLocked: Number(obj.walletLocked) || 0 });
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
app.get('/api/bookings', (_req, res) => {
  const rows = readCsv(csvPath('bookings'));
  res.json(rows.map(normalizeBookingRow));
});
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
    const out = await runCpp([
      'create_booking', customerID, vehicleID, ownerID, String(duration), String(cost), insurance, String(deposit), rentDate || ''
    ]);
    const obj = normalizeCppOut(out, ['bookingID','status']);
    // Audit
    appendAudit(customerID || 'SYSTEM', 'BOOKING_CREATED', `Booking ${obj.bookingID || 'UNKNOWN'} created for vehicle ${vehicleID}`);
    res.json({ bookingID: obj.bookingID, status: obj.status, ...req.body });
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
  const userBookings = rows.filter((r) => String(r.bookedCustomerID) === String(userId) || String(r.ownerID) === String(userId));
  res.json(userBookings.map(normalizeBookingRow));
});

// NEW: Get bookings by status
app.get('/api/bookings/status/:status', (req, res) => {
  const { status } = req.params;
  const rows = readCsv(csvPath('bookings'));
  const statusBookings = rows.filter((r) => r.status === status);
  res.json(statusBookings.map(normalizeBookingRow));
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
  appendAudit('SYSTEM', 'VIDEO_UPLOADED', `Video ${videoType} for ${bookingId}`);
  res.json({ ok: true, videoPath });
});

// Admin dispute resolution with financial settlement
app.post('/api/disputes/resolve', async (req, res) => {
  try {
    const { bookingId, verdict, notes, penalizeUserId } = req.body || {};
    if (!bookingId || !verdict) return res.status(400).json({ error: 'Missing required fields' });
    
    // Call C++ engine to handle wallet settlement
    const out = await runCpp(['resolve_dispute', bookingId, verdict, notes || '']);
    
    // Apply trust penalty if verdict favors owner (customer lied)
    if (verdict === 'ResolvedFavorOwner' && penalizeUserId) {
      await adjustUserTrust(penalizeUserId, -1.0);
      appendAudit('ADMIN', 'PENALTY_APPLIED', `Trust -1 for ${penalizeUserId} (dispute lost)`);
    }

    // Also restore vehicle availability
    const bookings = readCsv(csvPath('bookings'));
    const booking = bookings.find(b => b.bookingID === bookingId);
    if (booking && booking.bookedVehicleID) {
      updateById('vehicles', 'vehicle_id', booking.bookedVehicleID, { available: '1' });
    }

    appendAudit('ADMIN', 'DISPUTE_RESOLVED', `Booking ${bookingId} resolved as ${verdict}`);
    res.json({ ok: true, booking: out });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
  appendAudit('SYSTEM', 'DISPUTE_INITIATED', `Booking ${bookingId} disputed`);
  res.json({ ok: true, booking: updated });
});

// Approve booking (owner action)
app.post('/api/bookings/:id/approve', (req, res) => {
  const { ownerChecklist, actorID } = req.body || {};
  runCpp(['approve_booking', req.params.id, ownerChecklist || '', actorID || '']).then((out) => {
    const obj = normalizeCppOut(out, ['bookingID','status']);
    appendAudit(actorID || 'SYSTEM', 'BOOKING_APPROVED', `Booking ${obj.bookingID || req.params.id} approved`);
    res.json({ bookingID: obj.bookingID, status: obj.status });
  }).catch(err => res.status(400).json({ error: err.message }));
});

// NEW: Activate booking (PickupCompleted → Active)
app.post('/api/bookings/:id/activate', (req, res) => {
  const { actorID } = req.body || {};
  runCpp(['activate_booking', req.params.id]).then((out) => {
    appendAudit(actorID || 'SYSTEM', 'BOOKING_ACTIVATED', `Booking ${req.params.id} now Active`);
    res.json({ bookingID: out[0], status: out[1] });
  }).catch(err => res.status(400).json({ error: err.message }));
});

// NEW: Complete pickup (customer action)
app.post('/api/bookings/:id/complete-pickup', (req, res) => {
  const { pickupVideoPath, actorID } = req.body || {};
  runCpp(['complete_pickup', req.params.id, pickupVideoPath || '', actorID || '']).then((out) => {
    const obj = normalizeCppOut(out, ['bookingID','status']);
    appendAudit(actorID || 'SYSTEM', 'PICKUP_COMPLETED', `Pickup for ${obj.bookingID || req.params.id}`);
    res.json({ bookingID: obj.bookingID, status: obj.status });
  }).catch(err => res.status(400).json({ error: err.message }));
});

// NEW: Complete return (customer action)
app.post('/api/bookings/:id/complete-return', (req, res) => {
  const { returnVideoPath, customerChecklist, actorID } = req.body || {};
  runCpp(['complete_return', req.params.id, returnVideoPath || '', customerChecklist || '', actorID || '']).then((out) => {
    const obj = normalizeCppOut(out, ['bookingID','status','reason']);
    appendAudit(actorID || 'SYSTEM', 'RETURN_COMPLETED', `Return for ${obj.bookingID || req.params.id}`);
    res.json({ bookingID: obj.bookingID, status: obj.status, reason: obj.reason });
  }).catch(err => res.status(400).json({ error: err.message }));
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
  appendAudit(ratedBy || 'SYSTEM', 'RATING_SUBMITTED', `Rating for ${req.params.id} by ${ratedBy}`);
  res.json(updated);
});

// NEW: Admin inspection and completion
app.post('/api/bookings/:id/inspect', (req, res) => {
  const { inspectionNotes, approved, adminID } = req.body || {};
  runCpp(['inspect_booking', req.params.id, String(approved === true || approved === 'true'), inspectionNotes || '', adminID || '']).then((out) => {
    const obj = normalizeCppOut(out, ['bookingID','status']);
    appendAudit(adminID || 'ADMIN', approved === true || approved === 'true' ? 'INSPECTION_APPROVED' : 'INSPECTION_FAILED', `Inspection for ${obj.bookingID || req.params.id}: ${approved}`);
    res.json({ bookingID: obj.bookingID, status: obj.status });
  }).catch(err => res.status(400).json({ error: err.message }));
});

app.listen(4000, () => {
  console.log('Backend API running on http://localhost:4000');
});
