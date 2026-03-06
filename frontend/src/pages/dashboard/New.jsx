import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import ProvisioningProgress from '../../components/ProvisioningProgress';
import SeatUsageBar from '../../components/SeatUsageBar';
import { Monitor, Cpu, HardDrive, Wifi, AlertTriangle } from 'lucide-react';

export default function DashboardNew() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [provisioning, setProvisioning] = useState(false);
  const [vmId, setVmId] = useState(null);
  const [seatUsage, setSeatUsage] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { steps, status } = useSSE(vmId);

  useEffect(() => {
    api.get('/org').then(res => {
      setSeatUsage(res.data.seatUsage);
      setOrg(res.data.org);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Check for valid subscription
  const hasValidSubscription = org?.subscription && ['active', 'trialing'].includes(org.subscription.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!hasValidSubscription) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Subscription Required</h2>
        <p className="text-gray-600 mb-6">You need an active subscription to provision a cloud environment.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700"
        >
          Choose a Plan
        </button>
      </div>
    );
  }

  const handleProvision = async () => {
    setError('');
    setProvisioning(true);
    try {
      const res = await api.post('/vms');
      setVmId(res.data.vm.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to provision environment');
      setProvisioning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">New Environment</h2>

      {seatUsage && (
        <div className="mb-6">
          <SeatUsageBar used={seatUsage.used} limit={seatUsage.limit} />
        </div>
      )}

      {!provisioning ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center">
              <Monitor className="w-7 h-7 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ubuntu Desktop</h3>
              <p className="text-sm text-gray-500">XFCE desktop with xrdp, noVNC, and dev tools</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Cpu className="w-4 h-4" /> {user?.org?.plan === 'ARMY' ? '8 vCPU' : user?.org?.plan === 'TEAM' ? '4 vCPU' : '2 vCPU'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <HardDrive className="w-4 h-4" /> {user?.org?.plan === 'ARMY' ? '32 GB RAM' : user?.org?.plan === 'TEAM' ? '16 GB RAM' : '8 GB RAM'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Wifi className="w-4 h-4" /> noVNC + RDP
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <button
            onClick={handleProvision}
            disabled={seatUsage && seatUsage.available <= 0}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seatUsage && seatUsage.available <= 0 ? 'No seats available — Upgrade Plan' : 'Provision Environment'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-lg font-semibold mb-6">Provisioning your environment...</h3>
          <ProvisioningProgress steps={steps} status={status} />
          {status === 'ready' && (
            <div className="mt-6">
              <a
                href="/dashboard"
                className="inline-block bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700"
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
