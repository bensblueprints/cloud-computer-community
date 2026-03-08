import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Maximize2, Copy, RotateCcw, Keyboard, Monitor, AlertTriangle } from 'lucide-react';

export default function DashboardServer() {
  const { api, user } = useAuth();
  const [vms, setVms] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const canvasRef = useRef(null);
  const rfbRef = useRef(null);

  useEffect(() => {
    fetchVMs();
  }, []);

  async function fetchVMs() {
    try {
      const res = await api.get('/vms');
      const runningVMs = (res.data.vms || []).filter(vm => vm.status === 'RUNNING');
      setVms(runningVMs);
      // Auto-select first running VM
      if (runningVMs.length > 0 && !selectedVM) {
        connectToVM(runningVMs[0]);
      } else if (runningVMs.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
      setLoading(false);
    }
  }

  async function connectToVM(vm) {
    // Disconnect existing connection
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }

    setSelectedVM(vm);
    setStatus('connecting');
    setLoading(false);

    try {
      const res = await api.get(`/novnc/${vm.vmid}/token`);
      const { token, wsUrl, proxmox, type, vncPassword } = res.data;

      const RFB = (await import('@novnc/novnc/lib/rfb')).default;
      const password = type === 'lxc' ? (vncPassword || 'clawdbot123') : (proxmox?.ticket || '');

      // Wait for canvas to be in DOM
      await new Promise(r => setTimeout(r, 100));
      if (!canvasRef.current) return;

      const rfb = new RFB(canvasRef.current, `${wsUrl}?token=${token}`, {
        credentials: { password },
        wsProtocols: ['binary'],
      });

      rfbRef.current = rfb;
      rfb.scaleViewport = true;
      rfb.resizeSession = true;

      rfb.addEventListener('connect', () => setStatus('connected'));
      rfb.addEventListener('disconnect', () => setStatus('disconnected'));
      rfb.addEventListener('credentialsrequired', () => {
        rfb.sendCredentials({ password });
      });
    } catch (err) {
      console.error('noVNC connection error:', err);
      setStatus('error');
    }
  }

  const sendCtrlAltDel = () => rfbRef.current?.sendCtrlAltDel();
  const toggleFullscreen = () => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  const handleReconnect = () => {
    if (selectedVM) connectToVM(selectedVM);
  };
  const handleClipboard = () => {
    navigator.clipboard.readText().then(t => rfbRef.current?.clipboardPasteFrom(t)).catch(() => {});
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rfbRef.current) rfbRef.current.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (vms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Running Servers</h2>
        <p className="text-gray-600">You don't have any running servers to connect to. Start a server from My Environments first.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Server Console</h2>
        {vms.length > 1 && (
          <select
            value={selectedVM?.id || ''}
            onChange={e => {
              const vm = vms.find(v => v.id === e.target.value);
              if (vm) connectToVM(vm);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          >
            {vms.map(vm => (
              <option key={vm.id} value={vm.id}>VM {vm.vmid} — {vm.subdomain}</option>
            ))}
          </select>
        )}
      </div>

      {/* Console toolbar */}
      <div className="bg-gray-900 rounded-t-xl flex items-center justify-between px-4 h-10">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="text-white text-sm font-medium">
            {selectedVM ? `VM ${selectedVM.vmid}` : 'Select a server'}
          </span>
          {selectedVM && (
            <span className="text-gray-500 text-xs">{selectedVM.subdomain}.cloudcode.space</span>
          )}
          <span className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            status === 'error' ? 'bg-red-500' : 'bg-gray-500'
          }`} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleClipboard} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800" title="Paste from clipboard">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800" title="Fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={sendCtrlAltDel} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800" title="Ctrl+Alt+Del">
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReconnect} className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800" title="Reconnect">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console canvas */}
      <div className="relative bg-black rounded-b-xl overflow-hidden" style={{ height: '70vh' }}>
        <div ref={canvasRef} className="w-full h-full">
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-sm">Connecting to server...</p>
              </div>
            </div>
          )}
          {status === 'disconnected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <p className="text-white text-lg mb-4">Connection lost</p>
                <button onClick={handleReconnect} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700">
                  Reconnect
                </button>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 text-lg mb-4">Failed to connect</p>
                <button onClick={handleReconnect} className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  Try Again
                </button>
              </div>
            </div>
          )}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Select a server to connect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
