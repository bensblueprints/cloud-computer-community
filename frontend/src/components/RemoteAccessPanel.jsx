import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RemoteAccessPanel({ vmId, subdomain }) {
  const { api } = useAuth();
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRdp, setShowRdp] = useState(false);
  const [showVnc, setShowVnc] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, [vmId]);

  async function fetchCredentials() {
    setLoading(true);
    try {
      const res = await api.get(`/vms/${vmId}/credentials`);
      setCredentials(res.data);
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setResetting(true);
    try {
      await api.post(`/vms/${vmId}/reset-password`);
      await fetchCredentials();
    } finally {
      setResetting(false);
    }
  }

  async function downloadRdp() {
    const res = await api.get(`/vms/${vmId}/rdp-file`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subdomain}.rdp`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const copyText = (text) => navigator.clipboard.writeText(text);

  if (loading) return <div className="text-sm text-gray-500 mt-3">Loading credentials...</div>;
  if (!credentials) return <div className="text-sm text-red-500 mt-3">Failed to load credentials</div>;

  const host = `${subdomain}.cloudcode.space`;

  return (
    <div className="mt-3 space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">RDP Host</p>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{host}</span>
            <button onClick={() => copyText(host)} className="text-gray-400 hover:text-gray-600"><Copy className="w-3 h-3" /></button>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">RDP Port</p>
          <span className="font-mono text-xs">{credentials.rdpPort}</span>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">Username</p>
          <span className="font-mono text-xs">{credentials.rdpUsername}</span>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">RDP Password</p>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{showRdp ? credentials.rdpPassword : '********'}</span>
            <button onClick={() => setShowRdp(!showRdp)} className="text-gray-400 hover:text-gray-600">
              {showRdp ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button onClick={() => copyText(credentials.rdpPassword)} className="text-gray-400 hover:text-gray-600"><Copy className="w-3 h-3" /></button>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">VNC Host</p>
          <span className="font-mono text-xs">{host}</span>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">VNC Password</p>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{showVnc ? credentials.vncPassword : '********'}</span>
            <button onClick={() => setShowVnc(!showVnc)} className="text-gray-400 hover:text-gray-600">
              {showVnc ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button onClick={() => copyText(credentials.vncPassword)} className="text-gray-400 hover:text-gray-600"><Copy className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={downloadRdp} className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
          <Download className="w-3 h-3" /> Download .rdp
        </button>
        <button
          onClick={resetPassword}
          disabled={resetting}
          className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} /> Reset Passwords
        </button>
      </div>
    </div>
  );
}
