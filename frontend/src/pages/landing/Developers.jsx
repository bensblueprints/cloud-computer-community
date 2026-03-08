import { Link } from 'react-router-dom';
import {
  Cloud, ArrowRight, Code, Terminal, Monitor, Laptop, GitBranch,
  Cpu, Zap, Globe, CheckCircle2, Timer, Boxes, Braces
} from 'lucide-react';

const features = [
  { icon: Code, title: 'Cursor IDE + VS Code', desc: 'Both editors pre-installed and configured. Open your project and start coding instantly.', color: 'from-cyan-400 to-blue-500' },
  { icon: Terminal, title: 'Claude Code CLI', desc: 'AI-powered coding assistant right in your terminal. 500+ skills for every workflow.', color: 'from-violet-400 to-purple-500' },
  { icon: Cpu, title: '4 AI Models Built In', desc: 'Mistral, Llama, Qwen, and Gemma accessible from the terminal for code assistance.', color: 'from-emerald-400 to-green-500' },
  { icon: Boxes, title: 'Full Linux Environment', desc: 'Ubuntu Desktop with Docker, Git, Node.js, Python, and everything you need. Zero config.', color: 'from-orange-400 to-red-500' },
  { icon: Laptop, title: 'Code From Any Device', desc: 'iPad, Chromebook, hotel lobby, coffee shop. Your full dev environment in any browser.', color: 'from-pink-400 to-rose-500' },
  { icon: GitBranch, title: 'Git, Node, Python, Docker', desc: 'All major runtimes and tools pre-installed. No version manager headaches.', color: 'from-amber-400 to-yellow-500' },
];

const stats = [
  { value: '0 min', label: 'To start coding' },
  { value: '4', label: 'AI models included' },
  { value: '500+', label: 'Claude Code skills' },
  { value: '24/7', label: 'Uptime & access' },
];

const tools = [
  'Cursor IDE', 'VS Code', 'Claude Code', 'Node.js 20', 'Python 3.12',
  'Docker', 'Git', 'Vim/Neovim', 'tmux', 'Google Chrome', 'Firefox', 'Telegram',
];

export default function Developers() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">CloudCode</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition">Login</Link>
            <Link to="/register" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-slate-300 mb-6">
          <Timer className="w-4 h-4 text-cyan-400" />
          0 minutes to start coding
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Your dev environment,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">everywhere.</span>
          <br />Pre-configured and ready to code.
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          A full Ubuntu cloud desktop with Cursor IDE, Claude Code CLI, 4 AI models, and every tool you need.
          Access it from any browser on any device. No setup. No installs. Just code.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            Start Coding Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-sm text-slate-500">Plans start at $17/mo</span>
        </div>
      </div>

      {/* Code block preview */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
            <span className="text-xs text-slate-500 ml-2">terminal</span>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed">
            <p className="text-slate-500"># Your CloudCode environment is ready</p>
            <p><span className="text-emerald-400">$</span> cursor .</p>
            <p className="text-slate-500"># Cursor IDE opens with your project</p>
            <p><span className="text-emerald-400">$</span> claude "build a REST API with auth"</p>
            <p className="text-cyan-400">Building your API with Express + JWT...</p>
            <p><span className="text-emerald-400">$</span> docker compose up -d</p>
            <p className="text-slate-500"># Everything just works. No setup needed.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Everything a Developer Needs</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">Pre-installed, pre-configured, and accessible from any browser.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
              <div className={`w-10 h-10 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-installed tools */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-center mb-6">Pre-installed & Ready</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {tool}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
          <Braces className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Built by Developers, for Developers</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Join hundreds of developers who ditched local setup headaches for a cloud dev environment that just works.
            Indie hackers, freelancers, and teams ship faster with CloudCode.
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <svg key={n} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ))}
          </div>
          <p className="text-sm text-slate-500">"I literally code from my iPad now. CloudCode changed everything."</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Stop configuring. Start building.</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Your full dev environment deploys in under 2 minutes. Cursor, Claude Code, Docker, and everything else — ready to go.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Get Your Cloud Dev Environment
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-500 mt-3">3-day free trial. Cancel anytime.</p>
      </div>
    </div>
  );
}
