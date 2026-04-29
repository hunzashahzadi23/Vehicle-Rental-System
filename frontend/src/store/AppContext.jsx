import { createContext, useContext, useState, useEffect } from 'react';
import {
  initData, loginUser as loginSvc, registerUser as registerSvc,
  findUserById, updateUser, auditLog, addTransaction, TrustSystem,
  getUserFavorites, toggleFavorite, approveBooking, completePickup,
  completeReturn, submitRating, inspectBooking, createDispute
} from '../services/dataService.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState([]);

  useEffect(() => {
    async function startup() {
      await initData();
      const savedId = sessionStorage.getItem('karwan_uid');
      if (savedId) {
        const user = await findUserById(savedId);
        if (user) {
          setCurrentUser(user);
          // Load user's favorites
          const favs = await getUserFavorites(savedId);
          setUserFavorites(favs || []);
        }
      }
      setAuthLoading(false);
    }
    startup();
  }, []);

  const login = async (email, password) => {
    try {
      const user = await loginSvc(email, password);
      if (user) {
        setCurrentUser(user);
        sessionStorage.setItem('karwan_uid', user.id);
        const favs = await getUserFavorites(user.id);
        setUserFavorites(favs || []);
        await auditLog(user.id, 'LOGIN', `${user.role} login`);
        return { success: true, user };
      }
      return { success: false, error: 'Invalid email or password.' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await registerSvc(userData);
      if (result.error) return { success: false, error: result.error };
      const auth = await login(userData.email, userData.password);
      return auth;
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    if (currentUser) await auditLog(currentUser.id, 'LOGOUT', `${currentUser.role} signed out`);
    setCurrentUser(null);
    setUserFavorites([]);
    sessionStorage.removeItem('karwan_uid');
  };

  const refreshUser = async () => {
    if (currentUser) {
      const updated = await findUserById(currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  };

  // Wallet — all amounts in PKR
  const topUpWallet = async (amount) => {
    if (!currentUser) return;
    const newBal = (currentUser.walletAvailable || 0) + amount;
    await updateUser(currentUser.id, { walletAvailable: newBal });
    await addTransaction(currentUser.id, 'DEPOSIT', amount, `Wallet top-up +Rs.${amount.toLocaleString('en-PK')}`);
    await auditLog(currentUser.id, 'WALLET_TOPUP', `Deposited Rs.${amount.toLocaleString('en-PK')}`);
    await refreshUser();
  };

  const lockEscrow = async (amount) => {
    if (!currentUser) return false;
    if ((currentUser.walletAvailable || 0) < amount) return false;
    await updateUser(currentUser.id, {
      walletAvailable: (currentUser.walletAvailable || 0) - amount,
      walletLocked:    (currentUser.walletLocked    || 0) + amount,
    });
    await refreshUser();
    return true;
  };

  const releaseEscrow = async (amount) => {
    if (!currentUser) return;
    await updateUser(currentUser.id, {
      walletAvailable: (currentUser.walletAvailable || 0) + amount,
      walletLocked:    Math.max(0, (currentUser.walletLocked || 0) - amount),
    });
    await addTransaction(currentUser.id, 'ESCROW_RELEASE', amount, `Escrow released +Rs.${amount.toLocaleString('en-PK')}`);
    await refreshUser();
  };

  const increaseTrust = async (userId, amount = 0.2) => { 
    await TrustSystem.updateScore(userId, amount); 
    await refreshUser(); 
  };
  
  const decreaseTrust = async (userId, amount = 0.5) => { 
    await TrustSystem.updateScore(userId, -amount); 
    await refreshUser(); 
  };

  // NEW: Favorites management
  const addToFavorites = async (vehicleId) => {
    if (!currentUser) return false;
    try {
      const updated = await toggleFavorite(vehicleId, currentUser.id);
      setUserFavorites(updated || []);
      return true;
    } catch (e) {
      return false;
    }
  };

  const removeFromFavorites = async (vehicleId) => {
    if (!currentUser) return false;
    try {
      const updated = await toggleFavorite(vehicleId, currentUser.id);
      setUserFavorites(updated || []);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isFavorite = (vehicleId) => {
    // Handle both formats: [{vehicleID: "VC-0001"}] and ["VC-0001"]
    return userFavorites.some(f => {
      const fid = typeof f === 'string' ? f : f?.vehicleID;
      return fid === vehicleId;
    });
  };

  // NEW: Booking state transitions
  const approveRental = async (bookingId, ownerChecklist) => {
    try {
      await approveBooking(bookingId, ownerChecklist);
      await auditLog(currentUser.id, 'BOOKING_APPROVED', `Approved booking ${bookingId}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const completePickupFlow = async (bookingId, pickupVideoPath) => {
    try {
      await completePickup(bookingId, pickupVideoPath);
      await auditLog(currentUser.id, 'PICKUP_COMPLETED', `Pickup for booking ${bookingId}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const completeReturnFlow = async (bookingId, returnVideoPath, customerChecklist) => {
    try {
      await completeReturn(bookingId, returnVideoPath, customerChecklist);
      await auditLog(currentUser.id, 'RETURN_COMPLETED', `Return for booking ${bookingId}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const submitBookingRating = async (bookingId, ratedBy, rating, review) => {
    try {
      await submitRating(bookingId, ratedBy, rating, review);
      if (ratedBy === 'customer') {
        await increaseTrust(currentUser.id, 0.1);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, authLoading,
      login, register, logout, refreshUser,
      topUpWallet, lockEscrow, releaseEscrow,
      increaseTrust, decreaseTrust,
      // NEW: Favorites
      userFavorites, addToFavorites, removeFromFavorites, isFavorite,
      // NEW: Booking transitions
      approveRental, completePickupFlow, completeReturnFlow, submitBookingRating,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
