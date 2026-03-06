import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';

export default function AdminOrgs() {
  const { api } = useAuth();
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    api.get('/admin/orgs').then(res => setOrgs(res.data.orgs)).catch(console.error);
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Organizations</h2>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Org Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Seats</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Subscription</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orgs.map(org => (
              <tr key={org.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 text-sm font-medium">{org.name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{org.owner?.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/50 text-purple-400">{org.plan}</span>
                </td>
                <td className="px-4 py-3 text-sm">{org.members?.length || 0} / {org.seatLimit}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`text-xs ${org.subscription?.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>
                    {org.subscription?.status || 'None'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
