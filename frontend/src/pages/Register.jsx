import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cloud, Gift } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const { register, api } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const ref = searchParams.get('ref') || (() => { try { return localStorage.getItem('cc-ref'); } catch { return null; } })();

  // Validate referral code on mount
  useEffect(() => {
    if (ref) {
      fetch(`/api/referrals/validate/${ref}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) setReferrerName(data.referrerName);
        })
        .catch(() => {});
    }
  }, [ref]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, ref || undefined);

      // If a plan was selected, go straight to Stripe checkout
      if (plan) {
        try {
          const res = await api.post('/billing/checkout', { plan });
          if (res.data.url) {
            window.location.href = res.data.url;
            return;
          }
        } catch (checkoutErr) {
          console.error('Checkout redirect failed:', checkoutErr);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">
            {plan ? `Sign up to start your ${plan} plan` : 'Start building in the cloud'}
          </p>
        </div>

        {ref && referrerName && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Gift className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">
              Referred by <span className="font-bold text-white">{referrerName}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Your name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? (plan ? 'Setting up...' : 'Creating account...') : (plan ? 'Create Account & Continue' : 'Create Account')}
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
