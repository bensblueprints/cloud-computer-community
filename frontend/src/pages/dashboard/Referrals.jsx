import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Copy, Check, DollarSign, Users, TrendingUp, Gift, ExternalLink, ArrowRight } from 'lucide-react';

export default function Referrals() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/referrals/my-code').then(r => r.data),
      api.get('/referrals/stats').then(r => r.data)
    ]).then(([code, stats]) => {
      setCodeData(code);
      setData(stats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (codeData?.shareUrl) {
      navigator.clipboard.writeText(codeData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const requestPayout = async () => {
    setRequesting(true);
    setPayoutMsg('');
    try {
      const res = await api.post('/referrals/request-payout');
      setPayoutMsg(`Payout request for $${res.data.payout.amount} submitted!`);
      // Refresh stats
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
        <h2 className="text-2xl font-bold text-gray-900">Affiliate Program</h2>
        <p className="text-gray-500 mt-1">Earn 20% commission on every referral for 365 days. Paid via bank transfer at $100 threshold.</p>
      </div>

      {/* Share Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Your Referral Link</h3>
            <p className="text-xs text-gray-500">Share this link to earn 20% of every payment your referrals make</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={codeData?.shareUrl || ''}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 font-mono"
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Referrals', value: data?.totalReferrals || 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Active', value: data?.activeReferrals || 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Total Earned', value: `$${(data?.totalEarned || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-100' },
          { label: 'Available Balance', value: `$${(data?.pendingBalance || 0).toFixed(2)}`, icon: DollarSign, color: 'text-amber-600 bg-amber-100' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payout Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Request Payout</h3>
            <p className="text-sm text-gray-500">Minimum threshold: ${codeData?.payoutThreshold || 100}. Paid via bank transfer.</p>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Your Referrals</h3>
        </div>
        {data?.referrals?.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.referrals?.map(r => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.referredUser.name}</p>
                  <p className="text-xs text-gray-500">{r.referredUser.email} &middot; {r.referredUser.plan} plan</p>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Payout History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.payouts.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">${p.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
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
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Link', desc: 'Send your unique referral link to friends, clients, or your audience.' },
            { step: '2', title: 'They Sign Up & Pay', desc: 'When they subscribe to any plan, you earn 20% of every payment they make.' },
            { step: '3', title: 'Get Paid', desc: 'Once you hit $100, request a payout. We pay via bank transfer.' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">{item.step}</div>
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400 text-center">
          Commission: 20% of all payments &middot; Valid for 365 days per referral &middot; Minimum payout: $100
        </div>
      </div>
    </div>
  );
}
