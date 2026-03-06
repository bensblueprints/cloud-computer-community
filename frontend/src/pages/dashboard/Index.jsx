import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import VMCard from '../../components/VMCard';
import { Plus, AlertTriangle, X, Bug, RefreshCw } from 'lucide-react';

function PasswordWarning({ onDismiss }) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-amber-800">Update your VM password</h3>
        <p className="text-sm text-amber-700 mt-1">
          Your cloud environment was created with a default password. For security, open a terminal in your VM and run <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">passwd</code> to change it.
        </p>
      </div>
      <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function DebugPanel({ vms, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Debug Information</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2">VM States</h4>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(vms, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2">Polling Info</h4>
            <p className="text-sm text-gray-600">
              Auto-refresh: {vms.some(vm => vm.status === 'PROVISIONING') ? 'Active (every 3s)' : 'Inactive'}
            </p>
            <p className="text-sm text-gray-600">
              VMs in provisioning: {vms.filter(vm => vm.status === 'PROVISIONING').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardIndex() {
  const { api } = useAuth();
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showPwWarning, setShowPwWarning] = useState(() => {
    return localStorage.getItem('cc-pw-warning-dismissed') !== 'true';
  });
  const pollIntervalRef = useRef(null);

  async function fetchVMs() {
    try {
      const res = await api.get('/vms');
      setVms(res.data.vms);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchVMs();
  }, []);

  // Real-time polling for PROVISIONING VMs
  useEffect(() => {
    const hasProvisioning = vms.some(vm => vm.status === 'PROVISIONING');
    
    if (hasProvisioning) {
      // Start polling every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchVMs();
      }, 3000);
    } else {
      // Stop polling when no VMs are provisioning
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [vms.map(vm => vm.status).join(',')]);

  async function handleAction(vmId, action) {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this environment?')) return;
        await api.delete(`/vms/${vmId}`);
      } else {
        await api.post(`/vms/${vmId}/${action}`);
      }
      await fetchVMs();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} VM`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (vms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No environments yet</h2>
        <p className="text-gray-600 mb-6">Create your first cloud environment to get started</p>
        <Link
          to="/dashboard/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700"
        >
          <Plus className="w-5 h-5" />
          Create Your First Environment
        </Link>
      </div>
    );
  }

  const dismissWarning = () => {
    setShowPwWarning(false);
    localStorage.setItem('cc-pw-warning-dismissed', 'true');
  };

  const hasProvisioning = vms.some(vm => vm.status === 'PROVISIONING');

  return (
    <div>
      {showDebug && <DebugPanel vms={vms} onClose={() => setShowDebug(false)} />}
      {showPwWarning && vms.length > 0 && <PasswordWarning onDismiss={dismissWarning} />}
      
      {/* Status Bar */}
      {hasProvisioning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
          <span className="text-sm text-yellow-700">
            VM provisioning in progress... Auto-refreshing every 3 seconds
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">My Environments</h2>
          <button
            onClick={() => setShowDebug(true)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Debug"
          >
            <Bug className="w-4 h-4" />
          </button>
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVMs}
            className="text-gray-400 hover:text-gray-600 p-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/dashboard/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            New Environment
          </Link>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vms.map(vm => (
          <VMCard key={vm.id} vm={vm} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}
