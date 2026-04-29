import { useState, useEffect } from 'react';
import {
  getBookingsByCustomer,
  getBookingsByOwner,
  getTransactionsByUser,
  getVehicles,
  FavManager,
  ReviewManager
} from '../services/dataService.js';

/**
 * useRenterData - Fetch all data needed for renter dashboard
 * 
 * Usage:
 * const { bookings, transactions, vehicles, favorites, reviews, loading, error } = useRenterData(customerId);
 */
export function useRenterData(customerId) {
  const [data, setData] = useState({
    bookings: [],
    transactions: [],
    vehicles: [],
    favorites: [],
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const [bookings, transactions, vehicles, favorites, reviews] = await Promise.all([
          getBookingsByCustomer(customerId),
          getTransactionsByUser(customerId),
          getVehicles(),
          FavManager.getFavorites(customerId),
          ReviewManager.forUser(customerId)
        ]);

        setData({
          bookings: bookings || [],
          transactions: transactions || [],
          vehicles: vehicles || [],
          favorites: Array.isArray(favorites) ? favorites.map(f => typeof f === 'string' ? f : f.vehicleID) : [],
          reviews: reviews || []
        });
        setError(null);
      } catch (err) {
        console.error('Error loading renter data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [customerId]);

  return { ...data, loading, error };
}

export function useOwnerData(ownerId) {
  const [data, setData] = useState({
    bookings: [],
    vehicles: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const [allBookings, allVehicles] = await Promise.all([
          getBookingsByOwner(ownerId), 
          getVehicles()
        ]);

        const filteredVehicles = allVehicles.filter(v => v.ownerID === ownerId);

        setData({
          bookings: allBookings || [],
          vehicles: filteredVehicles || []
        });
        setError(null);
      } catch (err) {
        console.error('Error loading owner data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ownerId]);

  return { ...data, loading, error };
}

/**
 * useForm - Simplified form state management
 * 
 * Usage:
 * const { form, setForm, reset, handleChange } = useForm({ email: '', password: '' });
 */
export function useForm(initialState) {
  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const reset = () => setForm(initialState);
  const set = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  return { form, setForm, handleChange, reset, set };
}

/**
 * useAsync - Handle async operations with loading/error state
 * 
 * Usage:
 * const { execute, loading, error, data } = useAsync(async () => {
 *   return await fetchSomething();
 * });
 */
export function useAsync(asyncFunction, immediate = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await asyncFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { execute, loading, error, data };
}

/**
 * useModal - Simple modal state management
 * 
 * Usage:
 * const { isOpen, open, close, data } = useModal();
 * 
 * <button onClick={() => open(booking)}>View</button>
 * {isOpen && <Modal data={data} onClose={close} />}
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  const open = (modalData) => {
    setData(modalData);
    setIsOpen(true);
  };

  const close = () => {
    setData(null);
    setIsOpen(false);
  };

  return {
    isOpen,
    data,
    open,
    close,
    toggle: () => setIsOpen(!isOpen)
  };
}
