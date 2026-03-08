import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import VMCard from '../../components/VMCard';
import { Plus, AlertTriangle, X, Bug, RefreshCw, Cpu, Server, HardDrive, CheckCircle, Zap, Users, UserPlus, Trash2, ExternalLink } from 'lucide-react';

function PasswordWarning({ onDismiss }) {
  const [copied, setCopied] = useState(false);

  const copyPassword = () => {
    navigator.clipboard.writeText('cloudcode123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800">Update your VM password</h3>
          <p className="text-sm text-amber-700 mt-1 mb-3">
            Your cloud environment was created with a default password. For security, please change it.
          </p>
          <div className="flex items-center gap-3 bg-amber-100 rounded-lg px-3 py-2">
            <div>
              <span className="text-xs text-amber-600">Default Password:</span>
              <span className="ml-2 font-mono font-semibold text-amber-900">cloudcode123</span>
            </div>
            <button
              onClick={copyPassword}
              className="text-xs text-amber-700 hover:text-amber-900 underline"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            To change: Open terminal &rarr; Run <code className="bg-amber-100 px-1 rounded">passwd</code>
          </p>
        </div>
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const plans = [
  {
    name: "Solo",
    price: 17,
    specs: { ram: "8GB", cpu: "2 vCPU", storage: "40GB NVMe" },
    features: ["1 User", "noVNC + RDP + SSH", "Pre-installed Dev Tools", "24/7 Uptime"],
  },
  {
    name: "Team",
    price: 79,
    specs: { ram: "16GB", cpu: "4 vCPU", storage: "80GB NVMe" },
    features: ["5 Users", "noVNC + RDP + SSH", "Team Dashboard", "Priority Support"],
    popular: true,
  },
  {
    name: "Army",
    price: 299,
    specs: { ram: "32GB", cpu: "8 vCPU", storage: "160GB NVMe" },
    features: ["25 Users", "noVNC + RDP + SSH", "Admin Console", "Dedicated Support"],
  },
];

function SelectPlanPrompt({ onSelectPlan, loading }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-cyan-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select a plan to create your cloud environment</p>
        <p className="text-sm text-emerald-600 mt-2">3-day free trial on all plans</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 border-2 transition-all ${
              plan.popular
                ? "border-cyan-500 bg-cyan-50/50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
              <Cpu className="w-3 h-3" /> {plan.specs.cpu}
              <span>·</span>
              <Server className="w-3 h-3" /> {plan.specs.ram}
              <span>·</span>
              <HardDrive className="w-3 h-3" /> {plan.specs.storage}
            </div>
            <div className="mt-4 mb-4">
              <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan(plan.name)}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
                plan.popular
                  ? "bg-cyan-500 text-white hover:bg-cyan-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {loading ? "Loading..." : "Start 3-Day Trial"}
            </button>
          </div>
        ))}
      </div>
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

function ManageUsersModal({ vm, onClose, api, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchData();
  }, [vm.id]);

  async function fetchData() {
    try {
      const [usersRes, membersRes] = await Promise.all([
        api.get(`/vms/${vm.id}/users`),
        api.get('/org/members')
      ]);
      setUsers(usersRes.data.vmUsers || []);
      setOrgMembers(membersRes.data.members || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser() {
    if (!selectedUser) return;
    setAdding(true);
    try {
      await api.post(`/vms/${vm.id}/users`, { userId: selectedUser });
      await fetchData();
      setSelectedUser('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveUser(userId) {
    if (!confirm('Remove this user from the VM?')) return;
    setRemoving(userId);
    try {
      await api.delete(`/vms/${vm.id}/users/${userId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove user');
    } finally {
      setRemoving(null);
    }
  }

  // Filter out members who already have access
  const availableMembers = orgMembers.filter(m => !users.find(u => u.userId === m.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-bold">Manage VM Access</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          </div>
        ) : (
          <>
            {/* Add User */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Team Member</label>
              <div className="flex gap-2">
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select a member...</option>
                  {availableMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
                <button
                  onClick={handleAddUser}
                  disabled={!selectedUser || adding}
                  className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>

            {/* Current Users */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Access ({users.length})</h4>
              <div className="space-y-2">
                {users.map(vmUser => (
                  <div key={vmUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{vmUser.user.name}</div>
                      <div className="text-xs text-gray-500">{vmUser.user.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Username: <span className="font-mono">{vmUser.linuxUsername}</span>
                        {vmUser.status === 'PROVISIONING' && (
                          <span className="ml-2 text-yellow-600">Setting up...</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(vmUser.userId)}
                      disabled={removing === vmUser.userId}
                      className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No users have access to this VM yet.
                  </div>
                )}
              </div>
            </div>
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showPwWarning, setShowPwWarning] = useState(() => {
    return sessionStorage.getItem('cc-pw-warning-dismissed') !== 'true';
  });
  const [managingVM, setManagingVM] = useState(null);
  const pollIntervalRef = useRef(null);

  const isOwner = user?.orgRole === 'OWNER';

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

  async function fetchOrg() {
    try {
      const res = await api.get('/org');
      setOrg(res.data.org);
    } catch (err) {
      // User might not have an org yet, that's ok
      setOrg(null);
    }
  }

  async function handleSelectPlan(planName) {
    setCheckoutLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan: planName });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchVMs();
    fetchOrg();
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

  async function handleRename(vmId, newName) {
    const res = await api.patch(`/vms/${vmId}`, { name: newName });
    await fetchVMs();
    return res.data;
  }

  function handleManageUsers(vm) {
    setManagingVM(vm);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Show plan selection if user has no subscription
  const hasSubscription = org?.subscription && ['active', 'trialing'].includes(org.subscription.status);
  const plan = org?.plan || 'SOLO';
  const isSharedPlan = plan === 'TEAM' || plan === 'ARMY';

  if (!hasSubscription && !org?.plan && vms.length === 0) {
    return <SelectPlanPrompt onSelectPlan={handleSelectPlan} loading={checkoutLoading} />;
  }

  if (vms.length === 0) {
    // Team members on shared plans see a different message
    if (isSharedPlan && !isOwner) {
      return (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Waiting for Team Environment</h2>
          <p className="text-gray-600 mb-6">Your team owner is setting up the shared environment. You'll see it here once it's ready.</p>
        </div>
      );
    }

    // Owners can create environments
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
    sessionStorage.setItem('cc-pw-warning-dismissed', 'true');
  };

  const hasProvisioning = vms.some(vm => vm.status === 'PROVISIONING');

  // Separate personal VMs from shared/team VMs
  const personalVMs = vms.filter(vm => !vm.isShared);
  const sharedVMs = vms.filter(vm => vm.isShared);

  return (
    <div>
      {showDebug && <DebugPanel vms={vms} onClose={() => setShowDebug(false)} />}
      {managingVM && <ManageUsersModal vm={managingVM} onClose={() => setManagingVM(null)} api={api} onRefresh={fetchVMs} />}
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

      {/* Header with refresh */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>
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
        </div>
      </div>

      {/* Team Environments Section */}
      {sharedVMs.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-gray-900">Team Servers</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-medium border border-cyan-200">
              {plan}
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedVMs.map(vm => (
              <VMCard
                key={vm.id}
                vm={vm}
                onAction={handleAction}
                onRename={handleRename}
                onManageUsers={handleManageUsers}
              />
            ))}
          </div>
        </div>
      )}

      {/* Personal Environments Section - Only for owners or SOLO plan users */}
      {personalVMs.length > 0 && (isOwner || !isSharedPlan) && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-semibold text-gray-900">Servers</h3>
            </div>
            {hasSubscription && !isSharedPlan && isOwner && (
              <Link
                to="/dashboard/new"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
                New Environment
              </Link>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalVMs.map(vm => (
              <VMCard
                key={vm.id}
                vm={vm}
                onAction={handleAction}
                onRename={handleRename}
                onManageUsers={handleManageUsers}
              />
            ))}
          </div>
        </div>
      )}

      {/* Go High Level CRM Button */}
      {org?.ghlLocationId && (
        <div className="mb-10 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Go High Level CRM</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your contacts, pipelines, and automations</p>
            </div>
            <a
              href={`https://app.gohighlevel.com/location/${org.ghlLocationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open CRM
            </a>
          </div>
        </div>
      )}

      {/* Show empty state only if both sections are empty */}
      {personalVMs.length === 0 && sharedVMs.length === 0 && (
        <div className="text-center py-20">
          {isSharedPlan && !isOwner ? (
            <>
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-cyan-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Waiting for Team Environment</h2>
              <p className="text-gray-600">Your team owner is setting up the shared environment. You'll see it here once it's ready.</p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
