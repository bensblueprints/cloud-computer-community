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

        <hr className="border-gray-700" />
        <h3 className="text-lg font-semibold text-gray-200">Marketing Integrations</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Klaviyo API Key</label>
          <input
            type="text"
            value={settings.klaviyoApiKey || ''}
            onChange={e => setSettings({ ...settings, klaviyoApiKey: e.target.value || null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="pk_..."
          />
          <p className="text-xs text-gray-500 mt-1">Private API key for Klaviyo email automation</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">GHL Pipeline ID</label>
          <input
            type="text"
            value={settings.ghlPipelineId || ''}
            onChange={e => setSettings({ ...settings, ghlPipelineId: e.target.value || null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="Pipeline ID for lead automation"
          />
          <p className="text-xs text-gray-500 mt-1">Go High Level pipeline ID for customer tracking</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">GHL API Key</label>
          <input
            type="text"
            value={settings.ghlApiKey || ''}
            onChange={e => setSettings({ ...settings, ghlApiKey: e.target.value || null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="pit-..."
          />
          <p className="text-xs text-gray-500 mt-1">Go High Level API key for pipeline automation</p>
        </div>

        <hr className="border-gray-700" />
        <h3 className="text-lg font-semibold text-gray-200">SEO & Analytics</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Google Search Console Verification</label>
          <input
            type="text"
            value={settings.googleSearchConsole || ''}
            onChange={e => setSettings({ ...settings, googleSearchConsole: e.target.value || null })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="google-site-verification=..."
          />
          <p className="text-xs text-gray-500 mt-1">Google Search Console meta tag verification code</p>
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
