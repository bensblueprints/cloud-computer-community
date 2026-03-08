import { Link } from 'react-router-dom';
import {
  Cloud, ArrowRight, CheckCircle2, Users, Mail, BarChart3,
  MessageSquare, Calendar, Globe, Bot, Megaphone, Zap,
  Sparkles, Building2, Target, TrendingUp
} from 'lucide-react';

const tools = [
  { icon: Users, title: 'CRM & Pipeline Management', desc: 'Track every lead, deal, and client through custom pipelines. Never lose a prospect again.', color: 'from-blue-400 to-indigo-500' },
  { icon: Megaphone, title: 'Funnel & Landing Pages', desc: 'Drag-and-drop builder for client landing pages, opt-in forms, and full sales funnels.', color: 'from-purple-400 to-violet-500' },
  { icon: Mail, title: 'Email Marketing', desc: 'Send broadcasts, build automations, and run campaigns for every client from one place.', color: 'from-emerald-400 to-green-500' },
  { icon: MessageSquare, title: 'SMS & Chat', desc: 'Two-way SMS, live chat, Facebook Messenger, Instagram DMs — unified inbox.', color: 'from-cyan-400 to-blue-500' },
  { icon: Calendar, title: 'Booking & Scheduling', desc: 'Appointment booking with round-robin, reminders, and calendar sync for clients.', color: 'from-amber-400 to-orange-500' },
  { icon: Bot, title: 'AI Assistants', desc: '4 AI models built in plus Claude Code CLI with 500+ skills for automating client work.', color: 'from-pink-400 to-rose-500' },
];

const agencyCosts = [
  { tool: 'Go High Level CRM', price: '$297/mo' },
  { tool: 'Cloud Hosting / VPS', price: '$50-200/mo' },
  { tool: 'AI Tools (Copilot, ChatGPT)', price: '$40-200/mo' },
  { tool: 'Code Editor (Cursor Pro)', price: '$20/mo' },
  { tool: 'Community Platform', price: '$39-99/mo' },
  { tool: 'Total before first client', price: '$446-816/mo' },
];

const stats = [
  { value: '$297', label: 'GHL CRM value included free' },
  { value: '500+', label: 'Claude Code skills for client work' },
  { value: '4', label: 'AI models at your fingertips' },
  { value: '$17', label: 'Everything starts here' },
];

export default function Agencies() {
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
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
          <Building2 className="w-4 h-4" />
          Everything to launch your agency
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Everything you need to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">start an agency.</span>
          <br />
          <span className="text-slate-400 text-3xl sm:text-4xl">For $17/month.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Most agencies spend $500+/month on tools before landing their first client.
          CloudCode gives you Go High Level CRM, a cloud workspace, AI assistants, and a community of agency builders — all in one subscription.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
        >
          Launch Your Agency
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-500 mt-3">3-day free trial. Cancel anytime.</p>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What you get */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Your Complete Agency Toolkit</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">CRM, funnels, email, SMS, AI, and cloud workspace — all included in every plan.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((f, i) => (
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

      {/* Cost comparison */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-center mb-2">The Typical Agency Startup Cost</h2>
          <p className="text-slate-400 text-center mb-8">What most new agencies pay before their first client</p>

          <div className="space-y-3 max-w-lg mx-auto">
            {agencyCosts.map((item, i) => {
              const isTotal = i === agencyCosts.length - 1;
              return (
                <div key={i} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isTotal ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/50 border border-slate-800'}`}>
                  <span className={`font-medium ${isTotal ? 'text-red-300' : 'text-slate-200'}`}>{item.tool}</span>
                  <span className={`font-semibold ${isTotal ? 'text-red-400 text-lg' : 'text-red-400 line-through'}`}>{item.price}</span>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8 pt-8 border-t border-slate-700">
            <p className="text-slate-400">With CloudCode, you pay:</p>
            <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mt-2">$17/mo</p>
            <p className="text-slate-500 mt-2">And you get everything listed above. Plus a community.</p>
          </div>
        </div>
      </div>

      {/* Agency path */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Your Path to a Profitable Agency</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '1', icon: Target, title: 'Sign Up & Set Up', desc: 'Create your account, get your cloud computer and CRM in 2 minutes. Watch the getting started guide.' },
            { step: '2', icon: TrendingUp, title: 'Land Your First Client', desc: 'Use the CRM to build funnels, run outreach, and close your first deal. AI tools help you deliver.' },
            { step: '3', icon: Sparkles, title: 'Scale with AI', desc: 'Use Claude Code skills and AI models to automate delivery. Grow without hiring a massive team.' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">{s.step}</div>
              <s.icon className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
          <Users className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Join a Community of Agency Builders</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-4">
            You are not doing this alone. CloudCode comes with access to a community of other agency owners sharing strategies,
            templates, and wins. Learn what is working right now.
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <svg key={n} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ))}
          </div>
          <p className="text-sm text-slate-500">"I went from zero to $3k/mo in 2 months using CloudCode's CRM and AI tools."</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Your agency starts today.</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Go High Level CRM, cloud workspace, AI tools, and a community — everything you need for $17/mo.
          No more excuses. No more tool shopping.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Start Your Agency Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
