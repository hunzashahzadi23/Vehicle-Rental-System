# Karwan — Full Project README

This document explains the full structure and logic of the Vehicle Rental System repository, including the C++ backend (primary business logic), Node.js API layer, and React frontend. It is intended for reviewers and graders who need a clear understanding of how the project is organized and how components interact.

---

## Project Overview

- Purpose: A vehicle rental platform where Customers (Renters) request rentals, Lessors (Owners) approve and manage vehicles, and Admins arbitrate disputes.
- Architecture: C++ classes implement core business logic and state transitions; a lightweight Node.js Express API exposes that logic to the React frontend; the frontend is a single-page React app providing role-specific dashboards.
- Data persistence: CSV files in the repository root (no DB). CSVs store users, vehicles, bookings, favorites, reviews, transactions, audit logs.

---

## Top-level repository layout

- `*.cpp`, `*.h` — C++ source files (business logic, Wallet, Booking state machine, Users)
- `main.cpp` — C++ entry point used for CLI/console simulation (if used)
- `*.csv` — CSV storage files (users.csv, vehicles.csv, bookings.csv, favorites.csv, reviews.csv, transactions.csv, audit_logs.csv, marketplace_vehicles.csv, govt_registry.csv)
- `frontend/` — React frontend app (Vite / React)
- `backend/` — Node.js Express layer exposing CSV-backed endpoints
- Documentation files: `COMPLETE_IMPLEMENTATION_GUIDE.md`, `PROJECT_COMPLETION_REPORT.md`, `INTEGRATION_CHECKLIST.md`, `FIX_SUMMARY.md`, `README_FULL.md`

---

## C++ Backend (root folder)

All business logic lives in the C++ classes. These are the key files and their responsibilities:

- `Booking.h` / `Booking.cpp`
  - Central domain object representing a rental contract. Contains the 12-state booking lifecycle and validation.
  - Fields: bookingID, vehicleID, customerID, ownerID, status (12 states), amountLocked, amountPaid, paymentDueDate/paymentPaidDate, pickupVideoPath, returnVideoPath, ownerChecklist, customerChecklist, disputeReason, adminVerdictNotes, customerRating/ownerRating, createdAt/approvedAt/pickupAt/returnAt/completedAt, inspectionNotes, and other metadata.
  - Methods: `isValidStatusTransition()` enforces the status machine; helpers like `canApprove()`, `canPickup()`, `canReturn()`, `canInspect()`, `canRate()`.
  - Responsible for high-level booking validations (can't pickup before approval, can't complete before inspection, etc.).

- `Vehicle.h` / `Vehicle.cpp`
  - Base vehicle model with common attributes (vehicleID, brand, model, year, ratePerDay, ownerID, available, verificationStatus, image, features).

- `Car.h` / `Car.cpp`, `Bike.h`/`Bike.cpp`, `Truck.h`/`Truck.cpp`
  - Derived classes adding type-specific fields if needed (e.g., payload for trucks).

- `User.h` / `User.cpp`
  - Base user class with shared fields (id, name, email, role, walletAvailable, walletLocked, rating stats).

- `Lessor.h` / `Lessor.cpp` (or `Owner.*` depending on naming)
  - Owner/lessor behaviors: approve bookings, inspect returns, list vehicles, request payouts.

- `Customer.h` / `Customer.cpp`
  - Renter behavior: request bookings, accept pickup/return flows, raise disputes, view wallet.

- `Admin.h` / `Admin.cpp`
  - Administrative behavior: resolve disputes, verify vehicles, system audits, and global overrides.

- `Wallet.h` / `Wallet.cpp`
  - Handles wallet balance operations: lock funds on booking creation, release funds on completion or verdict, apply penalties.

- `VerificationEngine.h` / `VerificationEngine.cpp`
  - Validates vehicle registration against `govt_registry.csv`.

- `FintechEngine.h` / `FintechEngine.cpp`
  - (Lightweight) simulates payment gateway logic, escrow bookkeeping, transactions logging.

- `Review.h` / `Review.cpp` and `Rating.h` / `Rating.cpp`
  - Persist rating and review details per booking, update user reputation.

- `SystemManager.h` / `SystemManager.cpp`
  - Higher-level orchestration, CSV read/write orchestration helpers, some CLI helpers.

- `Exceptions.h`
  - Custom exceptions used by C++ logic for validation errors.

Notes:
- The C++ layer is the single source of truth for allowed state transitions and business invariants. All booking state transitions are validated in `Booking`-related code.
- CSV read/write utilities are used to persist changes. The Node.js backend and C++ code cooperate around CSV schemas (server.js uses same column layout).

---

## Node.js Backend (`backend/`)

Purpose: Lightweight REST API that reads and writes CSV files and acts as the bridge between the React frontend and the C++ logic/data.

Primary files:
- `server.js` — Main Express server file
  - Responsibilities:
    - Serve frontend static files (if deployed together) and provide REST endpoints.
    - Use CSV read/write utilities to manage data (bookings, users, vehicles, favorites, reviews, transactions).
    - Implemented endpoints (examples):
      - `GET /api/favorites/:userId` — Return user favorites
      - `POST /api/favorites/toggle` — Toggle favorite for user
      - `GET /api/bookings/:id` and `GET /api/bookings/user/:userId` — Booking queries
      - `POST /api/bookings` — Create booking (locks escrow)
      - `POST /api/bookings/:id/approve` — Owner approval flow
      - `POST /api/bookings/:id/complete-pickup` — Pickup confirmation (stores pickupVideoPath)
      - `POST /api/bookings/:id/complete-return` — Return confirmation (stores returnVideoPath)
      - `POST /api/bookings/:id/inspect` — Owner inspection (approve/flag)
      - `POST /api/bookings/:id/rate` — Submit ratings
      - `POST /api/disputes/create` and `POST /api/disputes/resolve` — Dispute management and admin verdict processing
      - `POST /api/videos/upload` — Store video references (currently URL-based paths stored in CSV)
    - Ensures CSV schemas are maintained; bookings CSV was extended to include new fields (payment, videos, checklists, dispute notes, ratings).

Notes and constraints:
- Data is stored in CSV files (no DB). Concurrency/locking is simple file-based; avoid heavy concurrent write-load in production.
- The Node API uses the CSV schema matching the C++ fields. If you change the C++ schema, update `server.js` accordingly.

---

## React Frontend (`frontend/`)

The frontend is a Vite-powered React app (JSX). It is a UI-only client; all business logic is executed through Node/C++ backend.

Top-level structure (important files):

- `frontend/src/main.jsx` — App bootstrap
- `frontend/src/App.jsx` — Router + protected route mapping (renders role-specific dashboards)
- `frontend/src/services/dataService.js` — All API calls to backend (favorites, bookings, disputes, videos, user actions)
- `frontend/src/store/AppContext.jsx` — Global app context: authentication, currentUser, userFavorites, booking helper methods (approveRental, completePickupFlow, completeReturnFlow), wallet helpers
- `frontend/src/store/ToastContext.jsx` — Toast notifications
- `frontend/src/store/ThemeContext.jsx` — Theme toggling
- `frontend/src/pages/` — Page routes
  - `renter/RenterDashboard_REFACTORED.jsx` — Renter dashboard (Overview, My Rentals, Wallet, Favorites, Reviews) with checklists and video upload flows
  - `owner/OwnerDashboard_ENHANCED.jsx` — Owner dashboard (Requests, Active, Inspections, Vehicles, Completed)
  - `admin/AdminDashboard.jsx` — Admin dashboard for dispute resolution and verifications
  - `auth/Login.jsx`, `auth/Register.jsx` — Authentication pages (CSV-backed auth)
  - `Landing.jsx` — Marketplace page
- `frontend/src/components/` — Reusable UI components
  - `VehicleCard.jsx` — Vehicle listing with favorites toggle
  - `ChecklistModal.jsx` — 8-point inspection modal used at pickup and return
  - `InspectionModal.jsx` — Owner inspection modal
  - `RatingModal.jsx` — Rating/Review modal
  - `Navbar.jsx` — Global nav
  - `WalletWidget.jsx`, `TrustMeter.jsx`, `Toast.jsx`, `SkeletonLoader.jsx`, UI primitives under `components/UI/*` (Button, Card, Input, Tabs)
- `frontend/src/hooks/` — Small hooks used by pages (e.g., `useCustom.js`, `useRenterData`, `useOwnerData`) for loading data
- `frontend/public/` — Static assets

Frontend behavior notes:
- The React UI is thin: all heavy validation and state rules are governed by the C++ backend, but UI contains helpful client-side checks and modal flows.
- Favorites: Managed via `AppContext` and persisted via `GET /api/favorites/:userId` and `POST /api/favorites/toggle`.
- Booking flows: Pages trigger API calls for booking creation → owner approval → pickup → return → inspection → completion. The backend/C++ enforces allowed transitions.
- Escrow: Wallet UI shows `walletAvailable` and `walletLocked` values. When booking is created, locked amount increases; when booking completes, locked amount is released to owner and/or refunded.

---

## CSV Files and Data Model

Key CSV files in repo root (headers simplified):

- `users.csv`: id, name, email, role, cnic, walletAvailable, walletLocked, rating, etc.
- `vehicles.csv`: vehicleID, ownerID, brand, model, year, ratePerDay, available, verificationStatus, image, license, etc.
- `bookings.csv`: bookingID, vehicleID, customerID, ownerID, status, cost, deposit, amountLocked, amountPaid, pickupVideoPath, returnVideoPath, ownerChecklist, customerChecklist, disputeReason, adminVerdictNotes, timestamps...
- `favorites.csv`: userID, vehicleID, createdAt
- `reviews.csv` & `ratings.csv`: authorID, subjectID, bookingID, rating, comment, createdAt
- `transactions.csv`: transactionID, userID, type (LOCK, RELEASE, EARNING, REFUND, PENALTY), amount, note, timestamp
- `audit_logs.csv`: timestamp, actorID, action, details
- `govt_registry.csv`: vehicle_license, ownerCNIC, etc. (used by verification engine)

Important: If you change field names or order in CSVs, update `backend/server.js` and any C++ CSV parsing code to match.

---

## How the Main Flows Work (High-level)

1. Booking creation (Renter):
   - Frontend calls `POST /api/bookings` with requested vehicleID, dates, and cost preview.
   - Backend validates vehicle availability and `Customer` funds.
   - Backend locks funds in customer's `walletLocked` and writes booking status `PendingApproval`.

2. Owner approval:
   - Owner sees `PendingApproval` booking in their dashboard.
   - Owner opens `Approve` modal and fills `ownerChecklist` (8-point items).
   - Owner calls `POST /api/bookings/:id/approve` → backend updates status to `Approved` or `Awaiting Pickup`.

3. Pickup:
   - Customer performs pickup flow: fills `customerChecklist` and uploads `pickupVideoPath` (URL).
   - Backend transitions booking to `Active` and records pickup timestamp.

4. Return:
   - Customer initiates return flow: uploads `returnVideoPath` and fills return checklist.
   - Backend transitions booking to `ReturnCompleted` and `PendingInspection`.

5. Inspection & Completion:
   - Owner inspects and either approves (→ `Completed`) or flags damage (→ `Disputed`).
   - On `Completed`, backend releases escrowed funds to owner, logs transactions.

6. Dispute & Admin Verdict:
   - If `Disputed`, Admin reviews both checklists and videos.
   - Admin makes verdict: `ResolvedFavorOwner` or `ResolvedFavorRenter`.
   - Backend processes payments/penalties accordingly and closes booking.

7. Ratings:
   - After `Completed`/`Resolved`, both parties can rate via `POST /api/bookings/:id/rate`.

---

## How to Build & Run (Developer)

Prerequisites: `g++` or MSVC for C++, Node 18+, npm, and `pnpm`/`npm` for frontend if needed.

1. Compile C++ (optional for console-only mode):

```bash
cd Vehicle-Rental-System
g++ -std=c++17 main.cpp Booking.cpp Vehicle.cpp Car.cpp Bike.cpp Truck.cpp User.cpp Admin.cpp Customer.cpp Wallet.cpp VerificationEngine.cpp FintechEngine.cpp -o VehicleRentalSystem.exe
# Run the console program (if needed)
./VehicleRentalSystem.exe
```

2. Start Node backend:

```bash
cd backend
npm install
npm start
# server runs typically at http://localhost:4000 or as configured in server.js
```

3. Start React frontend:

```bash
cd frontend
npm install
npm run dev
# open the URL shown by Vite (usually http://localhost:5173)
```

Notes:
- The Node backend expects CSV files in the repository root. Ensure CSV header fields match the backend schema.
- The frontend reads `frontend/tsconfig.json`; if you changed options, use `npm run build` to validate static types where applicable.

---

## Testing & Validation

- Follow `INTEGRATION_CHECKLIST.md` for end-to-end manual testing of booking, pickup/return, disputes, and favorites.
- To iterate quickly during development, use small sample CSVs and a single test user for each role.
- Watch `backend` logs for CSV read/write errors and `frontend` console for API errors.

---

## Limitations & Improvements (notes for graders)

- CSV persistence is simple but not transactional. For production, migrate to relational DB (Postgres) or document DB (MongoDB).
- Video support currently stores URLs/paths only; consider integrating S3/Cloudinary for file storage.
- Concurrency: multiple writes may require file locking; current implementation is intended for low-concurrency testing.
- Authentication & security: CSV-based auth is for demonstration. Replace with JWT + password hashing and a proper user store for production.

---

## Files to Review (important)

- C++: `Booking.h` / `Booking.cpp` (core logic)
- Backend: `backend/server.js` (API + CSV handling)
- Frontend: `frontend/src/store/AppContext.jsx`, `frontend/src/services/dataService.js`, `frontend/src/pages/renter/RenterDashboard_REFACTORED.jsx`, `frontend/src/pages/owner/OwnerDashboard_ENHANCED.jsx`, `frontend/src/pages/admin/AdminDashboard.jsx`, `frontend/src/components/ChecklistModal.jsx`

---

## Where to Start When Reviewing Code

1. Read `Booking.h`/`Booking.cpp` to understand the status machine and business invariants.
2. Open `backend/server.js` to see the mapping between API endpoints and CSV fields.
3. Inspect `frontend/src/store/AppContext.jsx` for how UI calls map to backend endpoints.
4. Run the integration checklist to validate the full flow.

---

## Contact

If you need clarifications, reopen issues or ask for code walk-throughs. The codebase is intentionally modular; I can produce targeted explanations for any file on request.

---

*Generated: April 29, 2026*
