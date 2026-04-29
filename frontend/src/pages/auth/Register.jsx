import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { useForm } from '../../hooks/useCustom.js';
import Button from '../../components/UI/Button.jsx';
import Input from '../../components/UI/Input.jsx';
import { User, UserPlus, Shield } from 'lucide-react';
import AuthShell from '../../components/AuthShell.jsx';

const ROLES = ['Customer', 'Lessor', 'Admin'];
const ROLE_DESC = {
  Customer: 'Rent vehicles. Manage wallet, bookings & trust score.',
  Lessor: 'List your vehicles. Earn from rentals. Manage your fleet.',
  Admin: 'Verify listings, resolve disputes. Full platform oversight.',
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('Customer');
  const { form, handleChange } = useForm({
    name: '', email: '', password: '', phone: '', address: '', cnic: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const preRole = searchParams.get('role');
    if (preRole && ROLES.includes(preRole)) setRole(preRole);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));

    const result = await register({
      role, name: form.name, email: form.email, password: form.password,
      phone: form.phone, address: form.address, cnic: form.cnic
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Registration failed.');
      return;
    }
    navigate(role === 'Admin' ? '/admin' : role === 'Lessor' ? '/owner' : '/renter', { replace: true });
  };

  return (
    <AuthShell title="Create Your Account" subtitle="Join the Karwan ecosystem" maxWidth="max-w-lg">
      <div className="mb-8">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">I am a...</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map(r => {
            const isSelected = role === r;
            const icons = { Customer: User, Lessor: UserPlus, Admin: Shield };
            const Icon = icons[r];

            return (
              <button
                key={r}
                id={`role-${r.toLowerCase()}`}
                onClick={() => setRole(r)}
                type="button"
                className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {r}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">{ROLE_DESC[role]}</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">Fill in your details</span></div>
      </div>

      <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="reg-name" label="Full Name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
          <Input id="reg-cnic" label="CNIC" name="cnic" placeholder="12345-6789012-3" value={form.cnic} onChange={handleChange} required />
        </div>

        <Input id="reg-email" label="Email Address" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
        <Input id="reg-password" label="Password" type="password" name="password" placeholder="Min. 7 characters" value={form.password} onChange={handleChange} minLength={7} required />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="reg-phone" label="Phone" name="phone" placeholder="03XX-XXXXXXX" value={form.phone} onChange={handleChange} required />
          <Input id="reg-address" label="Address" name="address" placeholder="City, Area" value={form.address} onChange={handleChange} required />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <Button id="register-submit" type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center mt-8 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-green-600 dark:text-green-500 hover:text-green-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
