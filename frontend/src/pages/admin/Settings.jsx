import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const { api } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(res => setSettings(res.data.settings)).catch(console.error);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <AdminLayout><div className="text-gray-400">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Platform Settings</h2>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Proxmox Template VMID</label>
          <input
            type="number"
            value={settings.proxmoxTemplateId}
            onChange={e => setSettings({ ...settings, proxmoxTemplateId: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Ubuntu Desktop template ID in Proxmox</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Auto-Suspend Timeout (minutes)</label>
          <input
            type="number"
            value={settings.autoSuspendMinutes}
            onChange={e => setSettings({ ...settings, autoSuspendMinutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Stop idle VMs after N minutes of inactivity</p>
        </div>

        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="rounded border-gray-600 bg-gray-700 text-purple-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-300">Maintenance Mode</span>
              <p className="text-xs text-gray-500">Shows banner on all user pages, blocks provisioning</p>
            </div>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </AdminLayout>
  );
}
