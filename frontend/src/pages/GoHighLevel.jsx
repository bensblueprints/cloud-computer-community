import { Link } from 'react-router-dom';
import {
  Zap, Users, Mail, BarChart3, MessageSquare, Calendar,
  Globe, Phone, Bot, Megaphone, ShoppingCart, FileText,
  ArrowRight, Star, CheckCircle2, Cloud
} from 'lucide-react';

const features = [
  { icon: Users, title: 'CRM & Contact Management', desc: 'Manage unlimited contacts, track deals through custom pipelines, and never lose a lead again.', color: 'bg-blue-100 text-blue-600' },
  { icon: Megaphone, title: 'Funnels & Landing Pages', desc: 'Drag-and-drop funnel builder. Create landing pages, opt-in forms, and sales pages in minutes.', color: 'bg-purple-100 text-purple-600' },
  { icon: Mail, title: 'Email Marketing', desc: 'Send broadcasts, build automations, and nurture leads with built-in email campaigns.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: MessageSquare, title: 'SMS & Chat', desc: 'Two-way SMS, live chat widget, Facebook Messenger, Instagram DMs — all in one inbox.', color: 'bg-cyan-100 text-cyan-600' },
  { icon: Calendar, title: 'Booking & Calendars', desc: 'Appointment scheduling with round-robin, group bookings, and automated reminders.', color: 'bg-amber-100 text-amber-600' },
  { icon: Bot, title: 'Workflow Automations', desc: 'If-this-then-that automations for follow-ups, task assignments, pipeline movements, and more.', color: 'bg-rose-100 text-rose-600' },
  { icon: Globe, title: 'Website Builder', desc: 'Full website builder with blog, membership areas, and custom domains.', color: 'bg-indigo-100 text-indigo-600' },
  { icon: Phone, title: 'Phone System', desc: 'Built-in calling, call tracking, voicemail drops, and call recording.', color: 'bg-green-100 text-green-600' },
  { icon: BarChart3, title: 'Reporting & Analytics', desc: 'Track ad spend, conversion rates, appointment show rates, and revenue attribution.', color: 'bg-orange-100 text-orange-600' },
  { icon: ShoppingCart, title: 'Invoicing & Payments', desc: 'Send invoices, accept payments via Stripe, and manage subscriptions.', color: 'bg-teal-100 text-teal-600' },
  { icon: Star, title: 'Reputation Management', desc: 'Automate review requests to Google and Facebook. Monitor and respond to reviews.', color: 'bg-yellow-100 text-yellow-600' },
  { icon: FileText, title: 'Communities', desc: 'Build a private community with courses, groups, and discussion channels for your clients.', color: 'bg-pink-100 text-pink-600' },
];

export default function GoHighLevel() {
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
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          A Full Marketing Platform.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Included Free.</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Every CloudCode plan comes with a Go High Level CRM account — the same platform agencies pay $297/month for. CRM, funnels, email, SMS, automations, communities, and more. No extra charge.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
        >
          Start Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-500 mt-3">Plans start at $17/mo — includes cloud computer + CRM</p>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Everything You Get</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <div className={`w-10 h-10 ${f.color} rounded-lg flex items-center justify-center mb-3`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Value Comparison */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">What You Would Pay Separately</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { tool: 'CRM (HubSpot/Salesforce)', price: '$50-300/mo' },
              { tool: 'Email Marketing (Mailchimp)', price: '$20-100/mo' },
              { tool: 'Funnel Builder (ClickFunnels)', price: '$97-297/mo' },
              { tool: 'SMS Marketing (Twilio)', price: '$50-200/mo' },
              { tool: 'Booking Software (Calendly)', price: '$12-20/mo' },
              { tool: 'Reputation Management', price: '$50-100/mo' },
              { tool: 'Website Builder', price: '$16-40/mo' },
              { tool: 'Automation (Zapier)', price: '$20-100/mo' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 px-4 border-b border-slate-800 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-base font-medium text-slate-200">{item.tool}</span>
                </div>
                <span className="text-lg font-semibold text-red-400 line-through">{item.price}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 pt-8 border-t-2 border-slate-700">
            <p className="text-slate-400 text-lg">Total if purchased separately:</p>
            <p className="text-3xl sm:text-5xl font-bold text-red-400 line-through mt-2">$315 - $1,157/mo</p>
            <p className="text-3xl sm:text-5xl font-bold text-emerald-400 mt-4">Included FREE with CloudCode</p>
            <p className="text-slate-500 text-base mt-3">Starting at just $17/mo</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to build your agency?</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Get a cloud computer, Go High Level CRM, AI models, 500+ Claude Code skills, and a community — all for $17/mo.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Create Your Account
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
