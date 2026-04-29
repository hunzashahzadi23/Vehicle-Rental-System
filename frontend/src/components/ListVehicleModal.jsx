import { useState } from 'react';
import { X, Car, Plus, Image as ImageIcon, CheckCircle } from 'lucide-react';
import Button from './UI/Button.jsx';
import Input from './UI/Input.jsx';

export default function ListVehicleModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    ratePerDay: '',
    vehicleType: 'Car',
    fuelType: 'Petrol',
    transmission: 'Manual',
    seats: '5',
    image: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      ratePerDay: parseFloat(form.ratePerDay),
      seats: parseInt(form.seats),
      year: parseInt(form.year)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card relative fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Car className="w-6 h-6 text-blue-600" /> List New Vehicle</h2>
          <p className="text-muted-foreground text-sm mb-6">Enter your vehicle details for verification and marketplace listing.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input label="Brand / Make" name="brand" value={form.brand} onChange={handleChange} required placeholder="Toyota, Honda, etc." />
            <Input label="Model Name" name="model" value={form.model} onChange={handleChange} required placeholder="Corolla, Civic, etc." />
            <Input label="Year" name="year" type="number" value={form.year} onChange={handleChange} required />
            <Input label="License Plate / Registration" name="licensePlate" value={form.licensePlate} onChange={handleChange} required placeholder="ABC-1234" />
            <Input label="Rate Per Day (Rs.)" name="ratePerDay" type="number" value={form.ratePerDay} onChange={handleChange} required placeholder="3500" />
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text">Vehicle Type</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Truck">Truck</option>
                <option value="SUV">SUV</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text">Fuel Type</label>
              <select name="fuelType" value={form.fuelType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text">Transmission</label>
              <select name="transmission" value={form.transmission} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm">
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            <Input label="Seats" name="seats" type="number" value={form.seats} onChange={handleChange} required />
            <Input label="Image URL" name="image" value={form.image} onChange={handleChange} placeholder="https://images.unsplash.com/..." icon={ImageIcon} />
          </div>

          <div className="space-y-1.5 mb-8">
            <label className="text-sm font-bold text-text">Vehicle Description</label>
            <textarea 
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
              placeholder="Tell us about the condition, features, or rules..."
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-4 shadow-blue-500/20 shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> List Vehicle for Verification
          </Button>
        </form>
      </div>
    </div>
  );
}
