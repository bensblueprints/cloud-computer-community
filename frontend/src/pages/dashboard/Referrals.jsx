import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Copy, Check, DollarSign, Users, TrendingUp, Gift, MousePointerClick, ArrowRight, Globe, Link2 } from 'lucide-react';
import useIsDark from '../../hooks/useIsDark';

export default function Referrals() {
  const { api } = useAuth();
  const dark = useIsDark();
  const [data, setData] = useState(null);
  const [codeData, setCodeData] = useState(null);
  const [selectedPage, setSelectedPage] = useState(() => {
    try { return localStorage.getItem('cc-ref-dest') || 'register'; } catch { return 'register'; }
  });
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState('');

  const LANDING_PAGES = [
    { id: 'register', label: 'Registration Page', path: '/register' },
    { id: 'home', label: 'Homepage', path: '/' },
    { id: 'for-developers', label: 'For Developers', path: '/for/developers' },
    { id: 'for-save', label: 'SaaS Savings', path: '/for/save' },
    { id: 'for-power', label: 'Lightweight & Powerful', path: '/for/power' },
    { id: 'for-agencies', label: 'For Agencies', path: '/for/agencies' },
    { id: 'for-remote', label: 'Remote Work', path: '/for/remote' },
    { id: 'blog-claude', label: 'Skills Blog Index', path: '/blog/claude' },
  ];

  useEffect(() => {
    Promise.all([
      api.get('/referrals/my-code').then(r => r.data),
      api.get('/referrals/stats').then(r => r.data)
    ]).then(([code, stats]) => {
      setCodeData(code);
      setData(stats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Build the share URL based on selected landing page
  const getShareUrl = () => {
    if (!codeData?.code) return '';
    const code = codeData.code;
    const base = 'https://cloudcode.space';

    const page = LANDING_PAGES.find(p => p.id === selectedPage);
    let dest = page ? page.path : '/register';

    // Use the redirect route for tracking
    if (dest === '/register') {
      return `${base}/r/${code}`;
    }
    return `${base}/r/${code}?to=${encodeURIComponent(dest)}`;
  };

  const shareUrl = getShareUrl();

  useEffect(() => {
    try { localStorage.setItem('cc-ref-dest', selectedPage); } catch {}
  }, [selectedPage]);

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build a tracked referral link from any pasted cloudcode.space URL
  const getCustomShareUrl = () => {
    if (!customUrl.trim() || !codeData?.code) return '';
    const code = codeData.code;
    const base = 'https://cloudcode.space';
    let path = customUrl.trim();
    // Strip domain if they pasted a full URL
    path = path.replace(/^https?:\/\/(www\.)?cloudcode\.space/i, '');
    // Ensure it starts with /
    if (!path.startsWith('/')) path = '/' + path;
    // Remove any existing ref param
    path = path.replace(/[?&]ref=[^&]*/g, '').replace(/\?$/, '');
    if (path === '/register' || path === '/') {
      return path === '/register' ? `${base}/r/${code}` : `${base}/r/${code}?to=${encodeURIComponent(path)}`;
    }
    return `${base}/r/${code}?to=${encodeURIComponent(path)}`;
  };

  const customShareUrl = getCustomShareUrl();

  const copyCustomLink = () => {
    if (customShareUrl) {
      navigator.clipboard.writeText(customShareUrl);
      setCopiedCustom(true);
      setTimeout(() => setCopiedCustom(false), 2000);
    }
  };

  const requestPayout = async () => {
    setRequesting(true);
    setPayoutMsg('');
    try {
      const res = await api.post('/referrals/request-payout');
      setPayoutMsg(`Payout request for $${res.data.payout.amount} submitted!`);
      const stats = await api.get('/referrals/stats');
      setData(stats.data);
    } catch (err) {
      setPayoutMsg(err.response?.data?.error || 'Payout request failed');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Affiliate Program</h2>
        <p className={`${dark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Earn 20% commission on every referral for 365 days. Paid via bank transfer at $100 threshold.</p>
      </div>

      {/* Share Link */}
      <div className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 mb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Your Referral Link</h3>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Share this link to earn 20% of every payment your referrals make</p>
          </div>
        </div>

        {/* Landing Page Selector */}
        <div className="mb-3">
          <label className={`block text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>
            <Globe className="w-3.5 h-3.5 inline mr-1" />
            Send visitors to:
          </label>
          <select
            value={selectedPage}
            onChange={e => setSelectedPage(e.target.value)}
            className={`w-full ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent`}
          >
            {LANDING_PAGES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className={`flex-1 ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-lg px-4 py-3 text-sm font-mono`}
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-brand-700 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Code: <span className="font-mono font-bold">{codeData?.code}</span></p>
      </div>

      {/* Custom URL Builder */}
      <div className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 mb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Custom Link Builder</h3>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Paste any cloudcode.space URL to create a tracked referral link for it</p>
          </div>
        </div>
        <div className="mb-3">
          <input
            type="text"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            placeholder="Paste a URL — e.g. cloudcode.space/blog/claude/sales-page or /for/developers"
            className={`w-full ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          />
        </div>
        {customShareUrl && (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={customShareUrl}
              className={`flex-1 ${dark ? 'bg-purple-900/30 border-purple-700 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'} border rounded-lg px-4 py-3 text-sm font-mono`}
            />
            <button
              onClick={copyCustomLink}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              {copiedCustom ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCustom ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Link Clicks', value: data?.totalClicks || 0, icon: MousePointerClick, color: 'text-purple-600 bg-purple-100' },
          { label: 'Total Referrals', value: data?.totalReferrals || 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Active', value: data?.activeReferrals || 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Total Earned', value: `$${(data?.totalEarned || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-100' },
          { label: 'Available Balance', value: `$${(data?.pendingBalance || 0).toFixed(2)}`, icon: DollarSign, color: 'text-amber-600 bg-amber-100' }
        ].map((stat, i) => (
          <div key={i} className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-5`}>
            <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion Rate */}
      {(data?.totalClicks > 0 || data?.totalReferrals > 0) && (
        <div className={`${dark ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-800' : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'} rounded-xl border p-4 mb-6 flex items-center gap-4`}>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Conversion Rate</p>
            <p className={`text-xs ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              {data?.totalClicks > 0
                ? `${((data.totalReferrals / data.totalClicks) * 100).toFixed(1)}% of link clicks convert to signups`
                : 'Share your link to start tracking conversions'}
            </p>
          </div>
        </div>
      )}

      {/* Payout Section */}
      <div className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Request Payout</h3>
            <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Minimum threshold: ${codeData?.payoutThreshold || 100}. Paid via bank transfer.</p>
          </div>
          <button
            onClick={requestPayout}
            disabled={requesting || !data?.canRequestPayout}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {requesting ? 'Requesting...' : 'Request Payout'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {payoutMsg && (
          <p className={`text-sm mt-3 ${payoutMsg.includes('submitted') ? 'text-emerald-600' : 'text-red-500'}`}>{payoutMsg}</p>
        )}
      </div>

      {/* Referrals List */}
      <div className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden mb-6`}>
        <div className={`px-6 py-4 border-b ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Your Referrals</h3>
        </div>
        {data?.referrals?.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className={`divide-y ${dark ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {data?.referrals?.map(r => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{r.referredUser.name}</p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{r.referredUser.email} &middot; {r.referredUser.plan} plan</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">${r.totalEarned.toFixed(2)}</p>
                  <p className={`text-xs ${r.status === 'ACTIVE' ? 'text-emerald-500' : r.status === 'PENDING' ? 'text-amber-500' : 'text-gray-400'}`}>
                    {r.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      {data?.payouts?.length > 0 && (
        <div className={`${dark ? 'bg-gray-900/80 backdrop-blur border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
            <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Payout History</h3>
          </div>
          <div className={`divide-y ${dark ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {data.payouts.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>${p.amount.toFixed(2)}</p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                  p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className={`mt-8 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-xl border p-6`}>
        <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'} mb-4`}>How It Works</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Pick a Landing Page', desc: 'Select which page to send your audience to from the dropdown above.' },
            { step: '2', title: 'Share Your Link', desc: 'Copy and share your unique referral link to friends, clients, or your audience.' },
            { step: '3', title: 'They Sign Up & Pay', desc: 'When they subscribe to any plan, you earn 20% of every payment they make.' },
            { step: '4', title: 'Get Paid', desc: 'Once you hit $100, request a payout. We pay via bank transfer.' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">{item.step}</div>
              <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'} text-sm`}>{item.title}</p>
              <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400 text-center">
          Commission: 20% of all payments &middot; Valid for 365 days per referral &middot; Minimum payout: $100 &middot; Click tracking included
        </div>
      </div>
    </div>
  );
}
