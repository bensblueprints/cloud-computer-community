import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AlertTriangle, Trash2, CreditCard, Lock } from 'lucide-react';

export default function Profile() {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/billing/cancel');
      setShowCancelModal(false);
      alert('Your subscription has been cancelled. You have 3 days to continue using your VMs before they are suspended.');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setLoading(true);
    setError('');
    try {
      await api.delete('/auth/account');
      await logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Account Information</h3>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input
                type="text"
                value={user?.org?.name || '—'}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={user?.orgRole || '—'}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 text-sm font-medium">
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        {passwordError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{passwordError}</div>
        )}
        {passwordSaved && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">Password changed successfully!</div>
        )}
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 text-sm font-medium">
            Change Password
          </button>
        </form>
      </div>

      {/* Subscription Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription
        </h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Current Plan: <span className="font-semibold text-gray-900">{user?.org?.plan || 'Free'}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCancelModal(true)}
          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
        >
          Cancel Subscription
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h3 className="font-semibold text-lg mb-2 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. All your VMs and data will be permanently deleted.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Cancel Subscription</h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to cancel your subscription? Your VMs will remain active for <strong>3 days</strong>, after which they will be suspended until you resubscribe.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-red-700">Delete Account</h3>
            <p className="text-gray-600 text-sm mb-4">
              This action cannot be undone. All your VMs, data, and subscription will be permanently deleted.
            </p>
            <p className="text-sm mb-2">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="DELETE"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
