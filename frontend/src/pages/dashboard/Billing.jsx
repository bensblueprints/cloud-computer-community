import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Check } from 'lucide-react';

const plans = [
  { name: 'SOLO', label: 'Solo', price: 19, seats: 1, features: ['8GB RAM / 2 vCPU / 40GB SSD', '1 Cloud Environment', 'noVNC + RDP access', 'Email support'] },
  { name: 'TEAM', label: 'Team', price: 79, seats: 5, features: ['16GB RAM / 4 vCPU / 80GB SSD', '5 Cloud Environments', 'Team management', 'Priority support'], popular: true },
  { name: 'ARMY', label: 'Army', price: 299, seats: 25, features: ['32GB RAM / 8 vCPU / 160GB SSD', '25 Cloud Environments', 'Full team management', 'Dedicated support'] },
];

export default function Billing() {
  const { api, user } = useAuth();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/org').then(res => setOrg(res.data.org)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(plan) {
    try {
      const res = await api.post('/billing/subscribe', { plan });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start checkout');
    }
  }

  async function handlePortal() {
    try {
      const res = await api.get('/billing/portal');
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to open billing portal');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Billing</h2>

      {org && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-xl font-bold">{org.plan}</p>
              <p className="text-sm text-gray-600">{org.seatLimit} seats</p>
            </div>
            {org.subscription && (
              <button onClick={handlePortal} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                Manage Billing
              </button>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = org?.plan === plan.name;
          return (
            <div key={plan.name} className={`bg-white rounded-xl p-6 border-2 ${plan.popular ? 'border-brand-500' : 'border-gray-200'}`}>
              {plan.popular && <span className="text-xs font-semibold text-brand-600 uppercase">Most Popular</span>}
              <h4 className="text-xl font-bold mt-1">{plan.label}</h4>
              <div className="mt-3">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{plan.seats} {plan.seats === 1 ? 'seat' : 'seats'}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={isCurrent}
                className={`w-full mt-6 py-2.5 rounded-lg font-semibold text-sm ${
                  isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' :
                  plan.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
