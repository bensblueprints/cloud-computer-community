import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Download, RefreshCw, Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function RemoteAccessPanel({ vmId, subdomain }) {
  const { api } = useAuth();
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSsh, setShowSsh] = useState(false);
  const [showRdp, setShowRdp] = useState(false);
  const [showVnc, setShowVnc] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedSsh, setCopiedSsh] = useState(false);

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

  const copySshCommand = () => {
    copyText(credentials.sshCommand);
    setCopiedSsh(true);
    setTimeout(() => setCopiedSsh(false), 2000);
  };

  if (loading) return <div className="text-sm text-gray-500 mt-3">Loading credentials...</div>;
  if (!credentials) return <div className="text-sm text-red-500 mt-3">Failed to load credentials</div>;

  const host = `${subdomain}.cloudcode.space`;

  return (
    <div className="mt-3 space-y-4 text-sm">
      {/* SSH Section - Highlighted */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-semibold text-xs uppercase tracking-wide">SSH Access</span>
        </div>
        <div className="bg-black/50 rounded p-2 font-mono text-xs text-gray-300 flex items-center justify-between">
          <code>{credentials.sshCommand}</code>
          <button
            onClick={copySshCommand}
            className="ml-2 text-gray-400 hover:text-green-400 transition-colors"
          >
            {copiedSsh ? <span className="text-green-400 text-xs">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div>
            <span className="text-gray-500">Host:</span>
            <span className="text-gray-300 ml-1 font-mono">{credentials.sshHost}</span>
          </div>
          <div>
            <span className="text-gray-500">Port:</span>
            <span className="text-gray-300 ml-1 font-mono">{credentials.sshPort}</span>
          </div>
          <div>
            <span className="text-gray-500">User:</span>
            <span className="text-gray-300 ml-1 font-mono">{credentials.sshUsername}</span>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <span className="text-gray-500">Password:</span>
          <span className="text-gray-300 ml-1 font-mono">
            {showSsh ? credentials.sshPassword : '********'}
          </span>
          <button onClick={() => setShowSsh(!showSsh)} className="ml-1 text-gray-400 hover:text-gray-200">
            {showSsh ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
          </button>
          <button onClick={() => copyText(credentials.sshPassword)} className="ml-1 text-gray-400 hover:text-gray-200">
            <Copy className="w-3 h-3 inline" />
          </button>
        </div>
      </div>

      {/* RDP & VNC Section */}
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
