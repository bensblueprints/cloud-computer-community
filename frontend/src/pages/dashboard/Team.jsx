import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SeatUsageBar from '../../components/SeatUsageBar';
import { UserPlus, Trash2, ArrowUpCircle } from 'lucide-react';

export default function Team() {
  const { api, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [seatUsage, setSeatUsage] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [membersRes, orgRes] = await Promise.all([
        api.get('/org/members'),
        api.get('/org')
      ]);
      setMembers(membersRes.data.members);
      setSeatUsage(orgRes.data.seatUsage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/org/invite', { email: inviteEmail });
      setInviteEmail('');
      setShowInvite(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite');
    }
  }

  async function handleRemove(userId) {
    if (!confirm('Remove this member? Their VM will be stopped.')) return;
    try {
      await api.delete(`/org/members/${userId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  const isOwner = user?.orgRole === 'OWNER';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Management</h2>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      {seatUsage && (
        <div className="mb-6 max-w-md">
          <SeatUsageBar used={seatUsage.used} limit={seatUsage.limit} />
        </div>
      )}

      {showInvite && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-md">
          <h3 className="font-semibold mb-3">Invite Team Member</h3>
          <form onSubmit={handleInvite}>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-3">{error}</div>}
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-brand-500"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700">Send Invite</button>
              <button type="button" onClick={() => setShowInvite(false)} className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {seatUsage && seatUsage.available <= 0 && isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <ArrowUpCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">All seats are filled</p>
            <a href="/dashboard/billing" className="text-sm text-yellow-600 hover:text-yellow-700 underline">Upgrade your plan</a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">VM Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Active</th>
              {isOwner && <th className="px-6 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{member.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                <td className="px-6 py-4 text-sm">
                  {member.vms.length > 0 ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${member.vms[0].status === 'RUNNING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {member.vms[0].status}
                    </span>
                  ) : <span className="text-gray-400 text-xs">No VM</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : '—'}
                </td>
                {isOwner && (
                  <td className="px-6 py-4 text-right">
                    {member.orgRole !== 'OWNER' && (
                      <button onClick={() => handleRemove(member.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
