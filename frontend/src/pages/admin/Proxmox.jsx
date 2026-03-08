import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import StatsCard from '../../components/StatsCard';
import { Cpu, HardDrive, Activity, Wifi, RefreshCw, Square, Trash2, Play } from 'lucide-react';

export default function AdminProxmox() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [vms, setVMs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  async function fetchData() {
    try {
      const [statsRes, vmsRes] = await Promise.all([
        api.get('/admin/proxmox/status'),
        api.get('/admin/proxmox/vms'),
      ]);
      setStats(statsRes.data.stats);
      setVMs((vmsRes.data.vms || []).sort((a, b) => a.vmid - b.vmid));
    } catch (err) {
      console.error('Proxmox fetch error:', err);
    }
  }

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  const [actionLoading, setActionLoading] = useState(null);

  async function handleVMAction(vmid, action) {
    try {
      if (action === 'destroy') {
        if (!confirm(`DESTROY Proxmox VM ${vmid}? This is irreversible.`)) return;
      }
      setActionLoading(`${vmid}-${action}`);
      if (action === 'destroy') {
        await api.delete(`/admin/proxmox/vms/${vmid}`, { timeout: 60000 });
      } else if (action === 'stop') {
        await api.post(`/admin/proxmox/vms/${vmid}/stop`);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} VM ${vmid}`);
    } finally {
      setActionLoading(null);
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Proxmox Monitor</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600" />
            Auto-refresh (30s)
          </label>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard label="CPU Usage" value={`${Math.round((stats.cpu || 0) * 100)}%`} icon={Cpu} color="blue" />
          <StatsCard label="RAM Usage" value={`${formatBytes(stats.memory?.used)} / ${formatBytes(stats.memory?.total)}`} icon={HardDrive} color="green" />
          <StatsCard label="Disk" value={`${formatBytes(stats.rootfs?.used)} / ${formatBytes(stats.rootfs?.total)}`} icon={Activity} color="yellow" />
          <StatsCard label="Uptime" value={stats.uptime ? `${Math.floor(stats.uptime / 86400)}d` : 'N/A'} icon={Wifi} color="purple" />
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">VMs on Node</h3>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">VMID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">CPU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">RAM</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Disk</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Uptime</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {vms.map(vm => (
              <tr key={vm.vmid} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-sm font-mono">{vm.vmid}</td>
                <td className="px-4 py-3 text-sm">{vm.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${vm.status === 'running' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {vm.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{vm.cpu ? `${Math.round(vm.cpu * 100)}%` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{vm.mem ? formatBytes(vm.mem) : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{vm.maxdisk ? formatBytes(vm.maxdisk) : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{vm.uptime ? `${Math.floor(vm.uptime / 3600)}h` : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    {vm.status === 'running' && (
                      <button onClick={() => handleVMAction(vm.vmid, 'stop')}
                        disabled={!!actionLoading}
                        className="p-1 text-yellow-400 hover:text-yellow-300 disabled:opacity-50" title="Stop">
                        {actionLoading === `${vm.vmid}-stop` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}
                    {vm.vmid >= 500 && (
                      <button onClick={() => handleVMAction(vm.vmid, 'destroy')}
                        disabled={!!actionLoading}
                        className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50" title="Destroy">
                        {actionLoading === `${vm.vmid}-destroy` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
