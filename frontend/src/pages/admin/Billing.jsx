import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import StatsCard from '../../components/StatsCard';
import { DollarSign, TrendingUp, X, Pause, Play, XCircle, RotateCcw, FileText, CreditCard } from 'lucide-react';

export default function AdminBilling() {
  const { api } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [billingDetails, setBillingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    const res = await api.get('/admin/orgs');
    setOrgs(res.data.orgs);
  }

  async function openDetails(org) {
    setSelectedOrg(org);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/billing/${org.id}`);
      setBillingDetails(res.data);
    } catch (err) {
      setBillingDetails({ error: err.response?.data?.error || 'Failed to load' });
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleAction(action) {
    if (!selectedOrg) return;
    setActionLoading(action);
    try {
      if (action === 'cancel') {
        if (!confirm('Cancel this subscription immediately?')) { setActionLoading(null); return; }
        await api.post(`/admin/billing/${selectedOrg.id}/cancel`);
      } else if (action === 'pause') {
        await api.post(`/admin/billing/${selectedOrg.id}/pause`);
      } else if (action === 'resume') {
        await api.post(`/admin/billing/${selectedOrg.id}/resume`);
      }
      alert(`Subscription ${action}d successfully`);
      await fetchOrgs();
      await openDetails(selectedOrg);
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRefund(chargeId, amount) {
    const refundAmount = prompt(`Refund amount in USD (max $${amount}):`, amount);
    if (!refundAmount) return;
    try {
      const res = await api.post(`/admin/billing/refund/${chargeId}`, { amount: parseFloat(refundAmount) });
      alert(`Refund of $${res.data.refund.amount} issued`);
      await openDetails(selectedOrg);
    } catch (err) {
      alert(err.response?.data?.error || 'Refund failed');
    }
  }

  const planPrices = { SOLO: 17, TEAM: 79, ARMY: 299 };
  const activeSubscriptions = orgs.filter(o => o.subscription?.status === 'active' || o.subscription?.status === 'trialing');
  const mrr = activeSubscriptions.reduce((sum, o) => sum + (planPrices[o.plan] || 0), 0);
  const arr = mrr * 12;

  const statusColors = {
    active: 'text-green-400',
    trialing: 'text-blue-400',
    canceling: 'text-yellow-400',
    canceled: 'text-red-400',
    past_due: 'text-orange-400',
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Revenue & Subscriptions</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="MRR" value={`$${mrr}`} icon={DollarSign} color="green" />
        <StatsCard label="ARR" value={`$${arr}`} icon={TrendingUp} color="blue" />
        <StatsCard label="Active Subs" value={activeSubscriptions.length} icon={CreditCard} color="purple" />
        <StatsCard label="Total Orgs" value={orgs.length} icon={FileText} color="yellow" />
      </div>

      <h3 className="text-lg font-semibold mb-4">All Subscriptions</h3>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Org</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Renewal</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orgs.filter(o => o.subscription).map(org => (
              <tr key={org.id} className="hover:bg-gray-750 cursor-pointer" onClick={() => openDetails(org)}>
                <td className="px-4 py-3 text-sm font-medium">{org.name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{org.owner?.email || '—'}</td>
                <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/50 text-purple-400">{org.plan}</span></td>
                <td className="px-4 py-3 text-sm">${planPrices[org.plan] || 0}/mo</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${statusColors[org.subscription.status] || 'text-gray-400'}`}>
                    {org.subscription.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {org.subscription.renewsAt ? new Date(org.subscription.renewsAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-purple-400 hover:text-purple-300 text-xs">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Billing Details Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedOrg(null); setBillingDetails(null); }} />
          <div className="relative w-[500px] bg-gray-800 border-l border-gray-700 p-6 overflow-auto">
            <button onClick={() => { setSelectedOrg(null); setBillingDetails(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">{selectedOrg.name}</h3>
            <p className="text-sm text-gray-400 mb-6">{selectedOrg.owner?.email}</p>

            {detailsLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div></div>
            ) : billingDetails?.error ? (
              <div className="text-red-400 text-sm">{billingDetails.error}</div>
            ) : billingDetails && (
              <>
                {/* Subscription Info */}
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className={`text-sm font-medium ${statusColors[billingDetails.subscription?.status] || 'text-gray-400'}`}>
                      {billingDetails.subscription?.status || 'none'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Plan</span>
                    <span className="text-sm">{selectedOrg.plan}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-400">Stripe ID</span>
                    <span className="text-xs font-mono text-gray-500">{billingDetails.subscription?.stripeId || '—'}</span>
                  </div>
                  {billingDetails.subscription?.renewsAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Renews</span>
                      <span className="text-sm">{new Date(billingDetails.subscription.renewsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-6">
                  {(billingDetails.subscription?.status === 'active' || billingDetails.subscription?.status === 'trialing') && (
                    <>
                      <button onClick={() => handleAction('pause')} disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50">
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                      <button onClick={() => handleAction('cancel')} disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {billingDetails.subscription?.status === 'canceling' && (
                    <button onClick={() => handleAction('resume')} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                </div>

                {/* Payment History */}
                {billingDetails.charges && billingDetails.charges.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Payment History</h4>
                    <div className="space-y-2 mb-6">
                      {billingDetails.charges.map(ch => (
                        <div key={ch.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">${ch.amount} {ch.currency.toUpperCase()}</div>
                            <div className="text-xs text-gray-500">{new Date(ch.date).toLocaleDateString()} {ch.brand && `• ${ch.brand} ****${ch.last4}`}</div>
                            {ch.refunded && <div className="text-xs text-orange-400 mt-0.5">Refunded: ${ch.refundedAmount}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${ch.status === 'succeeded' ? 'text-green-400' : 'text-red-400'}`}>{ch.status}</span>
                            {ch.status === 'succeeded' && !ch.refunded && (
                              <button onClick={(e) => { e.stopPropagation(); handleRefund(ch.id, ch.amount); }}
                                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 px-2 py-1 rounded bg-orange-900/30">
                                <RotateCcw className="w-3 h-3" /> Refund
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Invoices */}
                {billingDetails.invoices && billingDetails.invoices.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Invoices</h4>
                    <div className="space-y-2">
                      {billingDetails.invoices.map(inv => (
                        <div key={inv.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm">${inv.amount} — {inv.status}</div>
                            <div className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</div>
                          </div>
                          {inv.pdf && (
                            <a href={inv.pdf} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300">
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {billingDetails.isManual && (
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-400">
                    This is a manually created subscription (no Stripe billing). Payment history not available.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
