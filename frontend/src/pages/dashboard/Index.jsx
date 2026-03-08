import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Monitor, ExternalLink, Play, Square, RotateCcw, RefreshCw, Zap, Server, Users, ArrowUpCircle, ChevronRight, AlertTriangle, Terminal, Copy, Check, Download, BookOpen } from 'lucide-react';

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

function AiSetupGuide() {
  const [copiedGroq, setCopiedGroq] = useState(false);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedGroq(true);
    setTimeout(() => setCopiedGroq(false), 2000);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-500" />
        AI Setup Guide
      </h2>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm text-gray-600 mb-5">
          Get blazing-fast AI running on your cloud computer for free. We recommend <strong>Groq</strong> — it runs on custom LPU hardware and delivers 500+ tokens/sec, way faster than any GPU-based API.
        </p>

        {/* Groq Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Groq — Free & Lightning Fast</h3>
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">RECOMMENDED</span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">1</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Create a free Groq account</p>
                <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 underline flex items-center gap-1">
                  console.groq.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">2</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Generate an API key</p>
                <p className="text-xs text-gray-500">Go to API Keys in the left sidebar and click "Create API Key". No credit card needed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">3</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Use it everywhere — it's OpenAI-compatible</p>
                <p className="text-xs text-gray-500">Base URL: <code className="bg-orange-100 px-1.5 py-0.5 rounded text-orange-800">https://api.groq.com/openai/v1</code></p>
              </div>
            </div>
          </div>

          {/* Free Tier Specs */}
          <div className="bg-white/70 rounded-lg p-3 mb-4 border border-orange-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Free Tier Specs:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <p className="font-bold text-orange-700">500+</p>
                <p className="text-gray-500">tokens/sec</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-700">30</p>
                <p className="text-gray-500">requests/min</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-700">6,000+</p>
                <p className="text-gray-500">tokens/min</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-700">14,400</p>
                <p className="text-gray-500">requests/day</p>
              </div>
            </div>
          </div>

          {/* Available Models */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {[
              { name: 'llama-3.3-70b-versatile', desc: 'Best all-around' },
              { name: 'llama-3.1-8b-instant', desc: 'Ultra fast' },
              { name: 'mixtral-8x7b-32768', desc: '32K context' },
              { name: 'gemma2-9b-it', desc: 'Google model' },
              { name: 'qwen-qwq-32b', desc: 'Great at reasoning' },
              { name: 'deepseek-r1-distill-llama-70b', desc: 'DeepSeek reasoning' },
            ].map(m => (
              <div key={m.name} className="bg-white/60 rounded-lg p-2 border border-orange-100 text-center">
                <p className="text-xs font-semibold text-gray-800 truncate" title={m.name}>{m.name}</p>
                <p className="text-xs text-gray-400">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use in Cursor */}
        <details className="mb-4" open>
          <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-purple-700 mb-2">Use Groq in Cursor IDE</summary>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Open Cursor and go to <strong>Settings</strong> (gear icon) → <strong>Models</strong></li>
              <li>Click <strong>"Add Model"</strong> under OpenAI API Compatible</li>
              <li>Set the <strong>Base URL</strong> to: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800 text-xs">https://api.groq.com/openai/v1</code></li>
              <li>Paste your Groq API key</li>
              <li>Add model name: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800 text-xs">llama-3.3-70b-versatile</code></li>
              <li>You're done — select the model from the model dropdown when chatting</li>
            </ol>
          </div>
        </details>

        {/* Code Examples */}
        <details className="mb-4">
          <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-purple-700 mb-2">Use Groq in Your Code</summary>
          <div className="space-y-3">
            {/* Node.js */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Node.js (OpenAI SDK)</p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <p className="text-gray-500">// npm install openai</p>
                <p>{`const OpenAI = require('openai');`}</p>
                <p>{`const ai = new OpenAI({`}</p>
                <p className="pl-4">{`baseURL: 'https://api.groq.com/openai/v1',`}</p>
                <p className="pl-4">{`apiKey: process.env.GROQ_API_KEY`}</p>
                <p>{`});`}</p>
                <p className="mt-2">{`const response = await ai.chat.completions.create({`}</p>
                <p className="pl-4">{`model: 'llama-3.3-70b-versatile',`}</p>
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
                <p>{`import os`}</p>
                <p className="mt-1">{`ai = OpenAI(`}</p>
                <p className="pl-4">{`base_url="https://api.groq.com/openai/v1",`}</p>
                <p className="pl-4">{`api_key=os.environ["GROQ_API_KEY"]`}</p>
                <p>{`)`}</p>
                <p className="mt-2">{`response = ai.chat.completions.create(`}</p>
                <p className="pl-4">{`model="llama-3.3-70b-versatile",`}</p>
                <p className="pl-4">{`messages=[{"role": "user", "content": "Hello!"}]`}</p>
                <p>{`)`}</p>
                <p>{`print(response.choices[0].message.content)`}</p>
              </div>
            </div>

            {/* cURL */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">cURL</p>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <p>{`curl https://api.groq.com/openai/v1/chat/completions \\`}</p>
                <p className="pl-4">{`-H "Authorization: Bearer $GROQ_API_KEY" \\`}</p>
                <p className="pl-4">{`-H "Content-Type: application/json" \\`}</p>
                <p className="pl-4">{`-d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Hello!"}]}'`}</p>
              </div>
            </div>
          </div>
        </details>

        {/* Set env var tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Pro tip:</span> Add your API key to your environment so all tools can use it. Open a terminal and run:
          </p>
          <div className="bg-gray-900 rounded-lg p-2 font-mono text-xs text-green-400 mt-2">
            <p>{`echo 'export GROQ_API_KEY="your-key-here"' >> ~/.bashrc && source ~/.bashrc`}</p>
          </div>
        </div>

        {/* Ollama Self-Install */}
        <details className="mb-3">
          <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">Want to run AI locally? Install Ollama yourself</summary>
          <div className="mt-3 bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">
              Ollama lets you run open-source AI models locally on your VM. Note: performance depends on your plan's CPU — it will be slower than Groq.
            </p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-green-400 mb-2">
              <p>curl -fsSL https://ollama.com/install.sh | sh</p>
              <p className="text-gray-500 mt-1">ollama pull llama3.2:3b &nbsp;&nbsp;# download a model</p>
              <p className="text-gray-500">ollama run llama3.2:3b &nbsp;&nbsp;&nbsp;# start chatting</p>
            </div>
            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:text-purple-700 underline flex items-center gap-1">
              ollama.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </details>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Groq is free, no credit card required. For higher limits, Groq offers paid tiers starting at $0.</p>
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
            href="https://client.advancedmarketing.co"
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

      {/* Skills Download Card */}
      {hasSubscription && (
        <div className="mb-8 bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">500+ Claude Code Skills</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                Your free bonus — 502 AI-powered skills for Claude Code covering marketing, development, business operations, and more.
                Install them in your terminal and run commands like <code className="bg-white/80 px-1.5 py-0.5 rounded text-purple-700 text-xs">/sales-page</code> or <code className="bg-white/80 px-1.5 py-0.5 rounded text-purple-700 text-xs">/seo-audit</code>.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/api/skills/download"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download Skills Bundle (.zip)
                </a>
                <Link
                  to="/blog/claude"
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse All 502 Skills
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Setup Guide */}
      {hasSubscription && <AiSetupGuide />}

      {/* Development Partners */}
      {hasSubscription && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Development Partners
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="https://upvotethat.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition">
                  <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">UpvoteThat.com</p>
                  <p className="text-xs text-orange-600 font-medium">Reddit Marketing</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-orange-400 transition" />
              </div>
              <p className="text-xs text-gray-500">Buy upvotes and accounts for Reddit marketing campaigns. Boost your content visibility.</p>
            </a>

            <a
              href="https://leadripper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">LeadRipper.com</p>
                  <p className="text-xs text-blue-600 font-medium">Google Places Scraper</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-blue-400 transition" />
              </div>
              <p className="text-xs text-gray-500">Scrape Google Places and export leads directly to Go High Level. Build your pipeline fast.</p>
            </a>

            <a
              href="https://advancedmarketing.co"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">AdvancedMarketing.co</p>
                  <p className="text-xs text-purple-600 font-medium">20% Off for Cloud Code</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-purple-400 transition" />
              </div>
              <p className="text-xs text-gray-500">20% off any coaching or project quote. Mention you're a Cloud Code customer.</p>
            </a>
          </div>
        </div>
      )}

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
