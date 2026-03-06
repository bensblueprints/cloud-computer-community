import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import { Search, X, UserCog } from 'lucide-react';

export default function AdminUsers() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    const res = await api.get(`/admin/users?page=${page}&limit=20&search=${search}`);
    setUsers(res.data.users);
    setTotal(res.data.total);
  }

  async function openDrawer(userId) {
    const res = await api.get(`/admin/users/${userId}`);
    setSelectedUser(res.data.user);
    setDrawerOpen(true);
  }

  async function handleAction(action, data = {}) {
    if (!selectedUser) return;
    try {
      if (action === 'delete') {
        if (!confirm('Delete this user and all their VMs?')) return;
        await api.delete(`/admin/users/${selectedUser.id}`);
        setDrawerOpen(false);
      } else {
        await api.patch(`/admin/users/${selectedUser.id}`, data);
        await openDrawer(selectedUser.id);
      }
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text" placeholder="Search users..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">VMs</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-750 cursor-pointer" onClick={() => openDrawer(u.id)}>
                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                <td className="px-4 py-3 text-sm">{u.org?.plan || '—'}</td>
                <td className="px-4 py-3 text-sm">{u.vms?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.suspended ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                    {u.suspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-400">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {/* User Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-96 bg-gray-800 border-l border-gray-700 p-6 overflow-auto">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <UserCog className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                <p className="text-sm text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div><span className="text-gray-400">Role:</span> <span className="ml-2">{selectedUser.siteRole}</span></div>
              <div><span className="text-gray-400">Org:</span> <span className="ml-2">{selectedUser.org?.name || '—'}</span></div>
              <div><span className="text-gray-400">VMs:</span>
                {selectedUser.vms?.map(vm => (
                  <div key={vm.id} className="ml-4 mt-1 text-xs text-gray-400">
                    VM {vm.vmid} — {vm.status} — {vm.subdomain}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button onClick={() => handleAction('update', { suspended: !selectedUser.suspended })}
                className={`w-full py-2 rounded-lg text-sm font-medium ${selectedUser.suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                {selectedUser.suspended ? 'Unsuspend' : 'Suspend'}
              </button>
              <button onClick={() => handleAction('delete')}
                className="w-full py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
