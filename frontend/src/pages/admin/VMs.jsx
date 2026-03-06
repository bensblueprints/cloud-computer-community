import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import { Play, Square, RotateCcw, Trash2, Monitor } from 'lucide-react';

export default function AdminVMs() {
  const { api } = useAuth();
  const [vms, setVms] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchVMs();
  }, [filter]);

  async function fetchVMs() {
    const res = await api.get(`/admin/vms${filter ? `?status=${filter}` : ''}`);
    setVms(res.data.vms);
  }

  async function handleAction(vmId, action) {
    try {
      if (action === 'delete') {
        if (!confirm('Force delete this VM?')) return;
        await api.delete(`/admin/vms/${vmId}`);
      } else {
        await api.post(`/admin/vms/${vmId}/${action}`);
      }
      fetchVMs();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  async function bulkStopIdle() {
    if (!confirm('Stop all idle VMs?')) return;
    const idle = vms.filter(v => v.status === 'RUNNING');
    for (const vm of idle) {
      await api.post(`/admin/vms/${vm.id}/stop`).catch(() => {});
    }
    fetchVMs();
  }

  const statusColors = {
    PROVISIONING: 'bg-yellow-900/50 text-yellow-400',
    RUNNING: 'bg-green-900/50 text-green-400',
    STOPPED: 'bg-gray-700 text-gray-400',
    ERROR: 'bg-red-900/50 text-red-400',
    DELETED: 'bg-gray-800 text-gray-600',
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Virtual Machines</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">All Status</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
            <option value="PROVISIONING">Provisioning</option>
            <option value="ERROR">Error</option>
          </select>
          <button onClick={bulkStopIdle} className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-700">
            Stop All Idle
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">VMID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">IP</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Subdomain</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Created</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {vms.map(vm => (
              <tr key={vm.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-sm font-mono">{vm.vmid}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{vm.user?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[vm.status]}`}>{vm.status}</span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{vm.internalIp || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{vm.subdomain}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(vm.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    {vm.status === 'STOPPED' && (
                      <button onClick={() => handleAction(vm.id, 'start')} className="p-1 text-green-400 hover:text-green-300"><Play className="w-4 h-4" /></button>
                    )}
                    {vm.status === 'RUNNING' && (
                      <button onClick={() => handleAction(vm.id, 'stop')} className="p-1 text-yellow-400 hover:text-yellow-300"><Square className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleAction(vm.id, 'delete')} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
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
