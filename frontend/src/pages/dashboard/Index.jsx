import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Monitor, ExternalLink, Play, Square, RotateCcw, RefreshCw, Zap, Server, Users, ArrowUpCircle, ChevronRight, AlertTriangle, Terminal, Key, Copy, Check, Eye, EyeOff } from 'lucide-react';

function ProvisioningCard({ vm }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const created = new Date(vm.createdAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - created) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [vm.createdAt]);

  // Real progress based on elapsed time since creation (doesn't reset on reload)
  const estimatedTotal = vm.templateType?.includes('army') ? 300 : vm.templateType?.includes('team') ? 180 : 120;
  const progress = Math.min(95, Math.round((elapsed / estimatedTotal) * 100));

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  let stepLabel = 'Cloning server template...';
  if (progress > 15) stepLabel = 'Starting virtual machine...';
  if (progress > 35) stepLabel = 'Booting server...';
  if (progress > 55) stepLabel = 'Configuring network...';
  if (progress > 75) stepLabel = 'Setting up credentials...';
  if (progress > 90) stepLabel = 'Final configuration...';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Setting Up Your Server</h3>
          <p className="text-sm text-gray-500">VM {vm.vmid} &middot; {vm.templateType?.replace('ubuntu-', '').toUpperCase() || 'SOLO'}</p>
        </div>
        <span className="text-sm font-mono text-gray-400">{minutes}:{seconds.toString().padStart(2, '0')}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{stepLabel}</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">This usually takes 2-5 minutes. You can leave this page and come back.</p>
    </div>
  );
}

function ServerCard({ vm, onAction }) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      await onAction(vm.id, action);
    } finally {
      setActionLoading(null);
    }
  };

  const planLabel = vm.templateType?.replace('ubuntu-', '').toUpperCase() || 'SOLO';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vm.status === 'RUNNING' ? 'bg-green-100' : vm.status === 'STOPPED' ? 'bg-gray-100' : 'bg-red-100'
          }`}>
            <Monitor className={`w-5 h-5 ${
              vm.status === 'RUNNING' ? 'text-green-600' : vm.status === 'STOPPED' ? 'text-gray-500' : 'text-red-500'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Cloud Server</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">VM {vm.vmid}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                vm.status === 'RUNNING' ? 'bg-green-100 text-green-700' :
                vm.status === 'STOPPED' ? 'bg-gray-100 text-gray-600' :
                vm.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {vm.status === 'RUNNING' && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />}
                {vm.status}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{planLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subdomain */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-mono bg-gray-50 px-3 py-1.5 rounded-lg text-gray-600 border border-gray-100">
          {vm.subdomain}.cloudcode.space
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2">
        {vm.status === 'RUNNING' && (
          <Link
            to={`/dashboard/server`}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-sm"
          >
            <Monitor className="w-4 h-4" />
            Open Console
          </Link>
        )}
        {vm.status === 'STOPPED' && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            <Play className="w-4 h-4" />
            {actionLoading === 'start' ? 'Starting...' : 'Start Server'}
          </button>
        )}
        {vm.status === 'RUNNING' && (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          </>
        )}
      </div>

      {/* Default credentials notice */}
      <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Default login:</span> <code className="bg-amber-100 px-1 rounded">cloudcomputer</code> / <code className="bg-amber-100 px-1 rounded">AI@123456</code> — Change via <code className="bg-amber-100 px-1 rounded">passwd</code> in terminal
        </p>
      </div>
    </div>
  );
}

function AiApiKeyCard({ api }) {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.get('/ollama/api-key')
      .then(res => setApiKey(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyKey = () => {
    if (apiKey?.apiKey) {
      navigator.clipboard.writeText(apiKey.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.post('/ollama/api-key/regenerate');
      setApiKey(res.data);
    } catch {
      alert('Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return null;

  const maskedKey = apiKey?.apiKey ? apiKey.apiKey.slice(0, 10) + '••••••••••••••••••••' : '';

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Key className="w-4 h-4 text-purple-500" />
        Free AI Models
        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">BETA</span>
      </h2>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Beta Service:</span> AI models are provided as a free bonus and are not guaranteed with your plan. You may experience performance issues during peak usage. For production workloads, we recommend using your own API keys (OpenAI, Anthropic, etc.).
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          4 AI models included free. Use from your VM terminal, in your code, or via API. OpenAI-compatible — works with any OpenAI SDK.
        </p>

        {/* Quick Start - Terminal */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-purple-900 mb-1">Quickest way — open a terminal in your VM:</p>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm mt-2">
            <p className="text-green-400">ai "How do I set up a Node.js project?"</p>
            <p className="text-gray-500 mt-1">ai chat &nbsp;&nbsp;&nbsp;# interactive mode</p>
            <p className="text-gray-500">ai models &nbsp;# see all models</p>
          </div>
        </div>

        {/* Code Examples - Tabbed */}
        <details className="mb-4" open>
          <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-purple-700 mb-2">Use in Your Code</summary>
          <div className="space-y-3">
            {/* Node.js */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Node.js (OpenAI SDK — works out of the box)</p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <p className="text-gray-500">// npm install openai</p>
                <p>{`const OpenAI = require('openai');`}</p>
                <p>{`const ai = new OpenAI({`}</p>
                <p className="pl-4">{`baseURL: 'http://ai.internal:11434/v1',`}</p>
                <p className="pl-4">{`apiKey: 'unused'  // no key needed from your VM`}</p>
                <p>{`});`}</p>
                <p className="mt-2">{`const response = await ai.chat.completions.create({`}</p>
                <p className="pl-4">{`model: 'mistral',`}</p>
                <p className="pl-4">{`messages: [{ role: 'user', content: 'Hello!' }]`}</p>
                <p>{`});`}</p>
                <p>{`console.log(response.choices[0].message.content);`}</p>
              </div>
            </div>

            {/* Python */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Python (OpenAI SDK)</p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <p className="text-gray-500"># pip install openai</p>
                <p>{`from openai import OpenAI`}</p>
                <p>{`ai = OpenAI(base_url="http://ai.internal:11434/v1", api_key="unused")`}</p>
                <p className="mt-2">{`response = ai.chat.completions.create(`}</p>
                <p className="pl-4">{`model="mistral",`}</p>
                <p className="pl-4">{`messages=[{"role": "user", "content": "Hello!"}]`}</p>
                <p>{`)`}</p>
                <p>{`print(response.choices[0].message.content)`}</p>
              </div>
            </div>

            {/* curl */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">cURL (from VM terminal)</p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <p>{`curl http://ai.internal:11434/v1/chat/completions \\`}</p>
                <p className="pl-4">{`-H "Content-Type: application/json" \\`}</p>
                <p className="pl-4">{`-d '{"model":"mistral","messages":[{"role":"user","content":"Hello!"}]}'`}</p>
              </div>
            </div>
          </div>
        </details>

        {/* Available Models */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { name: 'mistral', size: '7B', desc: 'Best all-around' },
            { name: 'llama3.2:3b', size: '3B', desc: 'Fast responses' },
            { name: 'qwen2.5:3b', size: '3B', desc: 'Good at code' },
            { name: 'gemma2:2b', size: '2B', desc: 'Fastest' },
          ].map(m => (
            <div key={m.name} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-center">
              <p className="text-sm font-semibold text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-400">{m.size} &middot; {m.desc}</p>
            </div>
          ))}
        </div>

        {/* External API Key (collapsible) */}
        <details className="mb-3">
          <summary className="text-sm font-medium text-purple-600 cursor-pointer hover:text-purple-700">API Key (for use outside your VM)</summary>
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Use this key to access AI from outside your VM (e.g. your local machine, other servers).</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 flex items-center justify-between">
                <span className="truncate">{visible ? apiKey?.apiKey : maskedKey}</span>
                <button onClick={() => setVisible(!visible)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                  {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={copyKey}
                className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition text-sm flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 font-mono">Endpoint: https://cloudcode.space/api/ollama/v1</p>
          </div>
        </details>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Unlimited usage &middot; No API key needed from your VM</p>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardIndex() {
  const { api, user } = useAuth();
  const [vms, setVms] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingCRM, setActivatingCRM] = useState(false);
  const pollIntervalRef = useRef(null);

  async function fetchVMs() {
    try {
      const res = await api.get('/vms');
      setVms(res.data.vms);
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrg() {
    try {
      const res = await api.get('/org');
      setOrg(res.data.org);
    } catch {
      setOrg(null);
    }
  }

  useEffect(() => {
    fetchVMs();
    fetchOrg();
  }, []);

  // Poll every 3s when VMs are provisioning
  useEffect(() => {
    const hasProvisioning = vms.some(vm => vm.status === 'PROVISIONING');
    if (hasProvisioning) {
      pollIntervalRef.current = setInterval(fetchVMs, 3000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [vms.map(vm => vm.status).join(',')]);

  async function handleActivateCRM() {
    setActivatingCRM(true);
    try {
      await api.post('/org/activate-crm');
      await fetchOrg();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate CRM');
    } finally {
      setActivatingCRM(false);
    }
  }

  async function handleAction(vmId, action) {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this server?')) return;
        await api.delete(`/vms/${vmId}`);
      } else {
        await api.post(`/vms/${vmId}/${action}`);
      }
      await fetchVMs();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const hasSubscription = org?.subscription && ['active', 'trialing'].includes(org.subscription.status);
  const plan = org?.plan || 'FREE';
  const provisioningVMs = vms.filter(vm => vm.status === 'PROVISIONING');
  const activeVMs = vms.filter(vm => vm.status !== 'PROVISIONING' && vm.status !== 'DELETED');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => { fetchVMs(); fetchOrg(); }}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Server Console */}
        <Link
          to="/dashboard/server"
          className={`flex items-center gap-3 p-4 rounded-xl border transition ${
            activeVMs.some(vm => vm.status === 'RUNNING')
              ? 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300'
              : 'bg-gray-50 border-gray-200 opacity-60 pointer-events-none'
          }`}
        >
          <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Server Console</p>
            <p className="text-xs text-gray-500">noVNC Desktop</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>

        {/* SSH Terminal */}
        <Link
          to="/dashboard/terminal"
          className={`flex items-center gap-3 p-4 rounded-xl border transition ${
            activeVMs.some(vm => vm.status === 'RUNNING')
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
              : 'bg-gray-50 border-gray-200 opacity-60 pointer-events-none'
          }`}
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">SSH Terminal</p>
            <p className="text-xs text-gray-500">Command Line</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>

        {/* Go High Level */}
        {org?.ghlLocationId ? (
          <a
            href="https://www.gohighlevel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 transition"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Go High Level</p>
              <p className="text-xs text-gray-500">CRM Dashboard</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
        ) : hasSubscription ? (
          <button
            onClick={handleActivateCRM}
            disabled={activatingCRM}
            className="flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 transition disabled:opacity-50 text-left"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className={`w-5 h-5 text-indigo-600 ${activatingCRM ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {activatingCRM ? 'Activating...' : 'Activate CRM'}
              </p>
              <p className="text-xs text-gray-500">Free Go High Level Account</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50 border-gray-200 opacity-60">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-500 text-sm">Go High Level</p>
              <p className="text-xs text-gray-400">Subscribe to activate</p>
            </div>
          </div>
        )}

        {/* Billing */}
        <Link
          to="/dashboard/billing"
          className="flex items-center gap-3 p-4 rounded-xl border bg-white border-gray-200 hover:border-gray-300 transition"
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {hasSubscription ? `${plan} Plan` : 'Choose a Plan'}
            </p>
            <p className="text-xs text-gray-500">
              {hasSubscription ? 'Upgrade or manage' : 'Get started'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* AI API Key Section */}
      {hasSubscription && <AiApiKeyCard api={api} />}

      {/* Provisioning VMs */}
      {provisioningVMs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
            Setting Up
          </h2>
          <div className="space-y-4">
            {provisioningVMs.map(vm => (
              <ProvisioningCard key={vm.id} vm={vm} />
            ))}
          </div>
        </div>
      )}

      {/* Active Servers */}
      {activeVMs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-500" />
            My Servers
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeVMs.map(vm => (
              <ServerCard key={vm.id} vm={vm} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No VMs at all */}
      {vms.length === 0 && hasSubscription && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your server is being set up</h2>
          <p className="text-gray-500 mb-4">It should appear here shortly. Try refreshing in a moment.</p>
          <button
            onClick={fetchVMs}
            className="inline-flex items-center gap-2 bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-cyan-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}

      {/* No subscription */}
      {vms.length === 0 && !hasSubscription && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Plan</h2>
          <p className="text-gray-500 mb-6">Choose a plan to get your cloud server running.</p>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            Choose a Plan
          </Link>
        </div>
      )}

    </div>
  );
}
