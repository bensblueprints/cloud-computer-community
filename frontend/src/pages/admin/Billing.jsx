import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import StatsCard from '../../components/StatsCard';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function AdminBilling() {
  const { api } = useAuth();
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    api.get('/admin/orgs').then(res => setOrgs(res.data.orgs)).catch(console.error);
  }, []);

  const planPrices = { SOLO: 19, TEAM: 79, ARMY: 299 };
  const activeSubscriptions = orgs.filter(o => o.subscription?.status === 'active');
  const mrr = activeSubscriptions.reduce((sum, o) => sum + (planPrices[o.plan] || 0), 0);
  const arr = mrr * 12;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Revenue & Subscriptions</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard label="Monthly Recurring Revenue" value={`$${mrr}`} icon={DollarSign} color="green" />
        <StatsCard label="Annual Recurring Revenue" value={`$${arr}`} icon={TrendingUp} color="blue" />
      </div>

      <h3 className="text-lg font-semibold mb-4">All Subscriptions</h3>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Org</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Renewal</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Stripe ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orgs.filter(o => o.subscription).map(org => (
              <tr key={org.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-sm font-medium">{org.name}</td>
                <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/50 text-purple-400">{org.plan}</span></td>
                <td className="px-4 py-3 text-sm">${planPrices[org.plan] || 0}/mo</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${org.subscription.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {org.subscription.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {org.subscription.renewsAt ? new Date(org.subscription.renewsAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500 text-xs">{org.subscription.stripeId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
