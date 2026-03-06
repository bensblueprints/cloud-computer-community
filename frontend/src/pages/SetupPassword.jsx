import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Cloud } from 'lucide-react';
import axios from 'axios';

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const plan = searchParams.get('plan') || 'SOLO';
  const sessionId = searchParams.get('session_id');
  const [fetchingEmail, setFetchingEmail] = useState(false);

  useEffect(() => {
    // Check if email was passed from Stripe checkout
    const stripeEmail = searchParams.get('email');
    if (stripeEmail) {
      setEmail(stripeEmail);
      return;
    }

    // If we have a session ID, fetch the email from Stripe
    if (sessionId && !email) {
      setFetchingEmail(true);
      axios.get(`/api/billing/session/${sessionId}`)
        .then(res => {
          if (res.data.email) {
            setEmail(res.data.email);
          }
        })
        .catch(err => {
          console.error('Failed to fetch email from session:', err);
        })
        .finally(() => {
          setFetchingEmail(false);
        });
    }
  }, [searchParams, sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/setup-password', { email, password }, { withCredentials: true });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Cloud Computer!</h1>
            <p className="text-slate-400">Your cloud environment is being set up. Here's what you need to know:</p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Important: Your VM Password
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-200 text-sm mb-3">
                Your Ubuntu desktop has a default password. For security, please change it after logging in.
              </p>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Default Password</p>
                  <p className="text-white font-mono text-lg">SErver777</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('SErver777')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="text-slate-400 text-sm space-y-2">
              <p><strong className="text-white">To change your password:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Launch your cloud computer from the dashboard</li>
                <li>Open a terminal (Applications &gt; Terminal)</li>
                <li>Type <code className="bg-slate-800 px-1 rounded">passwd</code> and press Enter</li>
                <li>Follow the prompts to set a new password</li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set Your Password</h1>
          <p className="text-slate-400">Create a password to access your CloudCode dashboard</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          {plan && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-cyan-400 font-medium">
                Your {plan} plan is active! Your cloud environment is being provisioned.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              {fetchingEmail ? (
                <div className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
                  Loading your email...
                </div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${sessionId && email ? 'bg-slate-700' : ''}`}
                  placeholder="Enter the email you used at checkout"
                  required
                  readOnly={!!(sessionId && email)}
                />
              )}
              {sessionId && email && (
                <p className="text-xs text-slate-500 mt-1">Email from your checkout session</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Repeat your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-cyan-400 hover:text-cyan-300">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
