import { Link } from "react-router-dom";
import { Cloud, Monitor, Zap, Server, ArrowRight } from "lucide-react";

export function BlogBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <Zap className="w-4 h-4" />
        <span>Free Go High Level CRM + Stable Cloud Dev Environments — Install Claude Code Easily</span>
        <Link to="/#pricing" className="underline font-bold hover:opacity-80">Start Free Trial</Link>
      </div>
    </div>
  );
}

export function BlogNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <BlogBanner />
      <div className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">CloudCode</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition">Home</Link>
            <Link to="/about" className="text-sm text-slate-400 hover:text-white transition">About</Link>
            <Link to="/blog" className="text-sm text-slate-400 hover:text-white transition">Blog</Link>
            <Link to="/blog/claude" className="text-sm text-slate-400 hover:text-white transition">Skills Library</Link>
            <a href="/#pricing" className="text-sm text-slate-400 hover:text-white transition">Pricing</a>
            <a href="/#faq" className="text-sm text-slate-400 hover:text-white transition">FAQ</a>
            <Link to="/login" className="text-sm text-slate-300 hover:text-white px-3 py-1.5 transition">Login</Link>
            <Link to="/register?ref=blog" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25">
              Get Started Free
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function DevEnvironmentAd() {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Cloud Dev Environment</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Run Ubuntu Desktop in Your Browser</h3>
        <p className="text-sm text-slate-400 mb-4">
          Full cloud computer with Claude Code, VS Code, Cursor, and all dev tools pre-installed.
          Access from any device. 2-minute setup.
        </p>

        {/* Screenshot mockup */}
        <div className="relative rounded-xl overflow-hidden border border-slate-700 mb-4">
          <div className="bg-slate-800 px-3 py-2 flex items-center gap-2 border-b border-slate-700">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-slate-500">cloudcode.space — Ubuntu Desktop</span>
          </div>
          <div className="bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 p-4">
            {/* Desktop mockup */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { name: "Claude Code", color: "from-cyan-400 to-blue-600" },
                { name: "VS Code", color: "from-blue-500 to-indigo-600" },
                { name: "Terminal", color: "from-slate-600 to-slate-700" },
                { name: "Cursor", color: "from-purple-500 to-pink-600" },
              ].map(app => (
                <div key={app.name} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 bg-gradient-to-br ${app.color} rounded-xl flex items-center justify-center`}>
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-400">{app.name}</span>
                </div>
              ))}
            </div>
            {/* Terminal preview */}
            <div className="bg-black/60 rounded-lg p-3 font-mono text-xs">
              <div className="text-emerald-400">user@cloudcode:~$ claude</div>
              <div className="text-slate-500 mt-1">Claude Code v1.0.17 (Anthropic)</div>
              <div className="text-cyan-400 mt-1">/sales-page</div>
              <div className="text-slate-500 mt-1">Generating your sales page...</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-emerald-400">$</span>
                <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {["Claude Code + VS Code + Cursor pre-installed", "8GB-32GB RAM, NVMe storage", "Access from any browser, any device", "Free Go High Level CRM included"].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
              <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Link
          to="/#pricing"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition"
        >
          Start 3-Day Free Trial
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-center text-xs text-slate-500 mt-2">From $17/mo. Cancel anytime.</p>
      </div>
    </div>
  );
}

export function BlogFooter() {
  return (
    <footer className="border-t border-slate-800/50 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-slate-500">CloudCode by Benjamin Tate</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link to="/" className="hover:text-white transition">Home</Link>
          <Link to="/blog" className="hover:text-white transition">Blog</Link>
          <Link to="/blog/claude" className="hover:text-white transition">Skills Library</Link>
          <a href="/#pricing" className="hover:text-white transition">Pricing</a>
          <Link to="/register" className="hover:text-white transition">Sign Up</Link>
        </div>
      </div>
    </footer>
  );
}
