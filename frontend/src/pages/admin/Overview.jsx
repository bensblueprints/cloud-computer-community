import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import StatsCard from '../../components/StatsCard';
import { Users, Server, Building2, DollarSign, Cpu, HardDrive } from 'lucide-react';

export default function AdminOverview() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users?limit=1'),
      api.get('/admin/vms'),
      api.get('/admin/orgs'),
      api.get('/admin/audit-log?limit=20'),
      api.get('/admin/proxmox/status').catch(() => ({ data: { stats: null } })),
    ]).then(([usersRes, vmsRes, orgsRes, logsRes, proxmoxRes]) => {
      const activeVMs = vmsRes.data.vms.filter(v => v.status === 'RUNNING').length;
      setStats({
        totalUsers: usersRes.data.total,
        activeVMs,
        totalOrgs: orgsRes.data.orgs.length,
        proxmox: proxmoxRes.data.stats,
      });
      setRecentLogs(logsRes.data.logs);
    }).catch(console.error);
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard label="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
            <StatsCard label="Active VMs" value={stats.activeVMs} icon={Server} color="green" />
            <StatsCard label="Total Orgs" value={stats.totalOrgs} icon={Building2} color="purple" />
            <StatsCard label="Proxmox CPU" value={stats.proxmox ? `${Math.round((stats.proxmox.cpu || 0) * 100)}%` : 'N/A'} icon={Cpu} color="yellow" />
          </div>

          {stats.proxmox && (
            <div className={`p-4 rounded-lg mb-8 border ${
              (stats.proxmox.cpu || 0) > 0.9 ? 'bg-red-900/30 border-red-700' :
              (stats.proxmox.cpu || 0) > 0.7 ? 'bg-yellow-900/30 border-yellow-700' :
              'bg-green-900/30 border-green-700'
            }`}>
              <p className="text-sm font-medium">
                Proxmox Node Health: {(stats.proxmox.cpu || 0) > 0.9 ? 'Critical' : (stats.proxmox.cpu || 0) > 0.7 ? 'Warning' : 'Healthy'}
              </p>
            </div>
          )}
        </>
      )}

      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-750 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {recentLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-sm">{log.user?.name || 'Unknown'}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{log.action}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {recentLogs.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-gray-500">No activity yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
