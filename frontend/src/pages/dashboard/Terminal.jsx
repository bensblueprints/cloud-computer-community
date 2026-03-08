import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Terminal as TerminalIcon, RefreshCw, Monitor, AlertTriangle } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function DashboardTerminal() {
  const { api } = useAuth();
  const [vms, setVms] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const termRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchVMs();
    return () => disconnect();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function fetchVMs() {
    try {
      const res = await api.get('/vms');
      const runningVMs = (res.data.vms || []).filter(vm => vm.status === 'RUNNING');
      setVms(runningVMs);
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

  function disconnect() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (terminalRef.current) {
      terminalRef.current.dispose();
      terminalRef.current = null;
    }
    fitAddonRef.current = null;
  }

  async function connectToVM(vm) {
    disconnect();
    setSelectedVM(vm);
    setStatus('connecting');
    setLoading(false);

    try {
      const res = await api.get(`/ssh/${vm.vmid}/token`);
      const { token, wsUrl } = res.data;

      // Wait for DOM
      await new Promise(r => setTimeout(r, 100));
      if (!termRef.current) return;

      // Initialize xterm.js
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1a1b26',
          foreground: '#a9b1d6',
          cursor: '#c0caf5',
          selectionBackground: '#33467c',
          black: '#15161e',
          red: '#f7768e',
          green: '#9ece6a',
          yellow: '#e0af68',
          blue: '#7aa2f7',
          magenta: '#bb9af7',
          cyan: '#7dcfff',
          white: '#a9b1d6',
          brightBlack: '#414868',
          brightRed: '#f7768e',
          brightGreen: '#9ece6a',
          brightYellow: '#e0af68',
          brightBlue: '#7aa2f7',
          brightMagenta: '#bb9af7',
          brightCyan: '#7dcfff',
          brightWhite: '#c0caf5'
        }
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(termRef.current);
      fitAddon.fit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      terminal.writeln('\x1b[36mConnecting to server...\x1b[0m');

      // Connect WebSocket
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('SSH WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'data') {
            const decoded = atob(msg.data);
            terminal.write(decoded);
          } else if (msg.type === 'status') {
            if (msg.status === 'connected') {
              setStatus('connected');
              // Send initial resize
              const dims = fitAddon.proposeDimensions();
              if (dims) {
                ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
              }
            } else if (msg.status === 'error') {
              setStatus('error');
              terminal.writeln(`\x1b[31mSSH Error: ${msg.message}\x1b[0m`);
            }
          }
        } catch (e) {
          // Raw text fallback
          terminal.write(event.data);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        terminal.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
      };

      ws.onerror = () => {
        setStatus('error');
        terminal.writeln('\r\n\x1b[31mWebSocket error.\x1b[0m');
      };

      // Terminal input → WebSocket
      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'data', data: btoa(data) }));
        }
      });

      // Terminal resize → WebSocket
      terminal.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });

    } catch (err) {
      console.error('SSH connection error:', err);
      setStatus('error');
    }
  }

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
          <TerminalIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Running Servers</h2>
        <p className="text-gray-600">You don't have any running servers to connect to.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">SSH Terminal</h2>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Terminal toolbar */}
      <div className="bg-gray-900 rounded-t-xl flex items-center justify-between px-4 h-10">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4 text-gray-400" />
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
        <button
          onClick={() => selectedVM && connectToVM(selectedVM)}
          className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800"
          title="Reconnect"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal container */}
      <div className="relative bg-[#1a1b26] rounded-b-xl overflow-hidden" style={{ height: '70vh' }}>
        <div ref={termRef} className="w-full h-full p-2" />
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b26]/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">Connecting via SSH...</p>
            </div>
          </div>
        )}
        {status === 'error' && !terminalRef.current && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-lg mb-4">Failed to connect</p>
              <button onClick={() => selectedVM && connectToVM(selectedVM)} className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
