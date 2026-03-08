import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Monitor, ExternalLink, Play, Square, RotateCcw, RefreshCw, Zap, Server, Users, ArrowUpCircle, X, ChevronRight } from 'lucide-react';

const PROVISION_STEPS = [
  { key: 'Cloning template', label: 'Cloning server template', pct: 15 },
  { key: 'Starting VM', label: 'Starting virtual machine', pct: 30 },
  { key: 'Waiting for VM', label: 'Booting server', pct: 50 },
  { key: 'Configuring internet', label: 'Configuring network', pct: 65 },
  { key: 'Setting access', label: 'Setting up credentials', pct: 80 },
  { key: 'Configuring network', label: 'Configuring routing', pct: 90 },
  { key: 'complete', label: 'Server ready!', pct: 100 },
];

function ProvisioningCard({ vm, api }) {
  const [step, setStep] = useState('Cloning template');
  const [progress, setProgress] = useState(5);
  const eventSourceRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Connect to SSE for real-time provisioning updates
    const es = new EventSource(`/api/vms/${vm.id}/sse`, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.step) {
          setStep(data.step);
          const matched = PROVISION_STEPS.find(s => data.step.includes(s.key));
          if (matched) setProgress(matched.pct);
        }
        if (data.status === 'complete') {
          setProgress(100);
          setStep('complete');
        }
      } catch {}
    };

    es.onerror = () => {
      // If SSE fails, fall back to time-based estimation
      es.close();
    };

    // Fallback: estimate progress based on time (full provision ~3-5 min)
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setProgress(prev => {
        if (prev >= 95) return prev;
        // Solo ~2min, Team ~3min, Army ~5min
        const estimatedTotal = vm.templateType?.includes('army') ? 300 : vm.templateType?.includes('team') ? 180 : 120;
        const estimated = Math.min(95, (elapsed / estimatedTotal) * 100);
        return Math.max(prev, estimated);
      });
    }, 2000);

    return () => {
      es.close();
      clearInterval(timer);
    };
  }, [vm.id]);

  const currentStep = PROVISION_STEPS.find(s => step.includes(s.key)) || PROVISION_STEPS[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-600 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Setting Up Your Server</h3>
          <p className="text-sm text-gray-500">VM {vm.vmid} &middot; {vm.templateType?.replace('ubuntu-', '').toUpperCase() || 'SOLO'}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{currentStep.label}</span>
          <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1 mt-3">
        {PROVISION_STEPS.slice(0, -1).map((s, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full ${progress >= s.pct ? 'bg-cyan-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">This usually takes 2-5 minutes. You can leave this page and come back.</p>
    </div>
  );
}

function ServerCard({ vm, onAction }) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      await onAction(vm.id, action);
    } finally {
      setActionLoading(null);
    }
  };

  const planLabel = vm.templateType?.replace('ubuntu-', '').toUpperCase() || 'SOLO';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vm.status === 'RUNNING' ? 'bg-green-100' : vm.status === 'STOPPED' ? 'bg-gray-100' : 'bg-red-100'
          }`}>
            <Monitor className={`w-5 h-5 ${
              vm.status === 'RUNNING' ? 'text-green-600' : vm.status === 'STOPPED' ? 'text-gray-500' : 'text-red-500'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Cloud Server</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">VM {vm.vmid}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                vm.status === 'RUNNING' ? 'bg-green-100 text-green-700' :
                vm.status === 'STOPPED' ? 'bg-gray-100 text-gray-600' :
                vm.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {vm.status === 'RUNNING' && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />}
                {vm.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{planLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subdomain */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-mono bg-gray-50 px-3 py-1.5 rounded-lg text-gray-600 border border-gray-100">
          {vm.subdomain}.cloudcode.space
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2">
        {vm.status === 'RUNNING' && (
          <Link
            to={`/dashboard/server`}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-sm"
          >
            <Monitor className="w-4 h-4" />
            Open Console
          </Link>
        )}
        {vm.status === 'STOPPED' && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            <Play className="w-4 h-4" />
            {actionLoading === 'start' ? 'Starting...' : 'Start Server'}
          </button>
        )}
        {vm.status === 'RUNNING' && (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardIndex() {
  const { api, user } = useAuth();
  const [vms, setVms] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef(null);

  async function fetchVMs() {
    try {
      const res = await api.get('/vms');
      setVms(res.data.vms);
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrg() {
    try {
      const res = await api.get('/org');
      setOrg(res.data.org);
    } catch {
      setOrg(null);
    }
  }

  useEffect(() => {
    fetchVMs();
    fetchOrg();
  }, []);

  // Poll every 3s when VMs are provisioning
  useEffect(() => {
    const hasProvisioning = vms.some(vm => vm.status === 'PROVISIONING');
    if (hasProvisioning) {
      pollIntervalRef.current = setInterval(fetchVMs, 3000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [vms.map(vm => vm.status).join(',')]);

  async function handleAction(vmId, action) {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this server?')) return;
        await api.delete(`/vms/${vmId}`);
      } else {
        await api.post(`/vms/${vmId}/${action}`);
      }
      await fetchVMs();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const hasSubscription = org?.subscription && ['active', 'trialing'].includes(org.subscription.status);
  const plan = org?.plan || 'FREE';
  const provisioningVMs = vms.filter(vm => vm.status === 'PROVISIONING');
  const activeVMs = vms.filter(vm => vm.status !== 'PROVISIONING' && vm.status !== 'DELETED');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => { fetchVMs(); fetchOrg(); }}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Server Console */}
        <Link
          to="/dashboard/server"
          className={`flex items-center gap-3 p-4 rounded-xl border transition ${
            activeVMs.some(vm => vm.status === 'RUNNING')
              ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300'
              : 'bg-gray-50 border-gray-200 opacity-60 pointer-events-none'
          }`}
        >
          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Server Console</p>
            <p className="text-xs text-gray-500">noVNC Desktop Access</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>

        {/* Go High Level */}
        {org?.ghlLocationId ? (
          <a
            href="https://www.gohighlevel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 transition"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Go High Level</p>
              <p className="text-xs text-gray-500">CRM Dashboard</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50 border-gray-200 opacity-60">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">Go High Level</p>
              <p className="text-xs text-gray-400">Setting up...</p>
            </div>
          </div>
        )}

        {/* Billing */}
        <Link
          to="/dashboard/billing"
          className="flex items-center gap-3 p-4 rounded-xl border bg-white border-gray-200 hover:border-gray-300 transition"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {hasSubscription ? `${plan} Plan` : 'Choose a Plan'}
            </p>
            <p className="text-xs text-gray-500">
              {hasSubscription ? 'Upgrade or manage' : 'Get started'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* Provisioning VMs */}
      {provisioningVMs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
            Setting Up
          </h2>
          <div className="space-y-4">
            {provisioningVMs.map(vm => (
              <ProvisioningCard key={vm.id} vm={vm} api={api} />
            ))}
          </div>
        </div>
      )}

      {/* Active Servers */}
      {activeVMs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-500" />
            My Servers
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeVMs.map(vm => (
              <ServerCard key={vm.id} vm={vm} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No VMs at all */}
      {vms.length === 0 && hasSubscription && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your server is being set up</h2>
          <p className="text-gray-500 mb-4">It should appear here shortly. Try refreshing in a moment.</p>
          <button
            onClick={fetchVMs}
            className="inline-flex items-center gap-2 bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-cyan-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}

      {/* No subscription */}
      {vms.length === 0 && !hasSubscription && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Plan</h2>
          <p className="text-gray-500 mb-6">Choose a plan to get your cloud server running.</p>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            Choose a Plan
          </Link>
        </div>
      )}
    </div>
  );
}
