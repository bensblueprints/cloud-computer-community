import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Maximize2, Copy, RotateCcw, X, Keyboard } from 'lucide-react';

export default function Console() {
  const { vmid } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rfbRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [vmName, setVmName] = useState('');

  useEffect(() => {
    let rfb = null;

    async function connect() {
      try {
        const res = await api.get(`/novnc/${vmid}/token`);
        const { token, wsUrl, proxmox, type, vncPassword } = res.data;

        const RFB = (await import('@novnc/novnc/lib/rfb')).default;

        // Use the appropriate password based on VM type
        const password = type === 'lxc' ? (vncPassword || 'clawdbot123') : (proxmox?.ticket || '');

        rfb = new RFB(canvasRef.current, `${wsUrl}?token=${token}`, {
          credentials: { password },
          wsProtocols: ['binary'],
        });

        rfbRef.current = rfb;

        rfb.scaleViewport = true;
        rfb.resizeSession = true;

        rfb.addEventListener('connect', () => setStatus('connected'));
        rfb.addEventListener('disconnect', () => setStatus('disconnected'));
        rfb.addEventListener('credentialsrequired', (e) => {
          console.log('Credentials required, sending password');
          rfb.sendCredentials({ password });
        });

        setVmName(`VM ${vmid}`);
      } catch (err) {
        console.error('noVNC connection error:', err);
        setStatus('error');
      }
    }

    connect();

    return () => {
      if (rfb) rfb.disconnect();
    };
  }, [vmid, api]);

  const sendCtrlAltDel = () => rfbRef.current?.sendCtrlAltDel();
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  const handleReconnect = () => {
    setStatus('connecting');
    window.location.reload();
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-8 bg-gray-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-semibold">Cloud Computer</span>
          <span className="text-gray-400 text-xs">{vmName}</span>
          <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigator.clipboard.readText().then(t => rfbRef.current?.clipboardPasteFrom(t))} className="text-gray-400 hover:text-white p-1" title="Clipboard Sync">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white p-1" title="Fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={sendCtrlAltDel} className="text-gray-400 hover:text-white p-1" title="Ctrl+Alt+Del">
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReconnect} className="text-gray-400 hover:text-white p-1" title="Reconnect">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white p-1" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 relative">
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm">Connecting...</p>
            </div>
          </div>
        )}
        {status === 'disconnected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <p className="text-white text-lg mb-4">Connection lost</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleReconnect} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700">Reconnect</button>
                <button onClick={() => navigate('/dashboard')} className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Close</button>
              </div>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 text-lg mb-4">Failed to connect to VM</p>
              <button onClick={() => navigate('/dashboard')} className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
