import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext.jsx';
import { useForm } from '../../hooks/useCustom.js';
import Button from '../../components/UI/Button.jsx';
import Input from '../../components/UI/Input.jsx';
import { useState } from 'react';
import AuthShell from '../../components/AuthShell.jsx';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const { form, handleChange } = useForm({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    
    const result = await login(form.email, form.password);
    setLoading(false);
    
    if (result.success) {
      const role = result.user.role;
      navigate(role === 'Admin' ? '/admin' : role === 'Lessor' ? '/owner' : '/renter', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to your account">
      <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <Button
          id="login-submit"
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center mt-8 text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/register" className="font-bold text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
