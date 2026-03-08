import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Zap, Users, Mail, BarChart3, MessageSquare, Calendar,
  Globe, Phone, Bot, Megaphone, ShoppingCart, FileText,
  ExternalLink, ChevronRight, Star, CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'CRM & Contact Management',
    desc: 'Manage unlimited contacts, track deals through custom pipelines, and never lose a lead again.',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Megaphone,
    title: 'Funnels & Landing Pages',
    desc: 'Drag-and-drop funnel builder. Create landing pages, opt-in forms, and sales pages in minutes.',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Mail,
    title: 'Email Marketing',
    desc: 'Send broadcasts, build automations, and nurture leads with built-in email campaigns.',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    icon: MessageSquare,
    title: 'SMS & Chat',
    desc: 'Two-way SMS, live chat widget, Facebook Messenger, Instagram DMs — all in one inbox.',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    icon: Calendar,
    title: 'Booking & Calendars',
    desc: 'Appointment scheduling with round-robin, group bookings, and automated reminders.',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    icon: Bot,
    title: 'Workflow Automations',
    desc: 'If-this-then-that automations for follow-ups, task assignments, pipeline movements, and more.',
    color: 'bg-rose-100 text-rose-600'
  },
  {
    icon: Globe,
    title: 'Website Builder',
    desc: 'Full website builder with blog, membership areas, and custom domains.',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    icon: Phone,
    title: 'Phone System',
    desc: 'Built-in calling, call tracking, voicemail drops, and call recording.',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: BarChart3,
    title: 'Reporting & Analytics',
    desc: 'Track ad spend, conversion rates, appointment show rates, and revenue attribution.',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: ShoppingCart,
    title: 'Invoicing & Payments',
    desc: 'Send invoices, accept payments via Stripe, and manage subscriptions.',
    color: 'bg-teal-100 text-teal-600'
  },
  {
    icon: Star,
    title: 'Reputation Management',
    desc: 'Automate review requests to Google and Facebook. Monitor and respond to reviews.',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: FileText,
    title: 'Communities',
    desc: 'Build a private community with courses, groups, and discussion channels for your clients.',
    color: 'bg-pink-100 text-pink-600'
  },
];

export default function CRM() {
  const { api, user } = useAuth();
  const [activating, setActivating] = useState(false);
  const [org, setOrg] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useState(() => {
    api.get('/org').then(res => {
      setOrg(res.data.org);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const hasGHL = org?.ghlLocationId;

  const handleActivate = async () => {
    setActivating(true);
    try {
      await api.post('/org/activate-crm');
      const res = await api.get('/org');
      setOrg(res.data.org);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate CRM');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Go High Level CRM</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          A full marketing and sales platform included free with your CloudCode plan. Everything you need to run an agency — CRM, funnels, email, SMS, automations, and more.
        </p>
      </div>

      {/* Action Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 mb-10 text-center">
        {hasGHL ? (
          <>
            <p className="text-sm text-indigo-700 font-medium mb-3">Your CRM is active and ready to use</p>
            <a
              href="https://client.advancedmarketing.co"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
            >
              Open CRM Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-xs text-indigo-400 mt-2">client.advancedmarketing.co</p>
          </>
        ) : (
          <>
            <p className="text-sm text-indigo-700 font-medium mb-3">Activate your free CRM account</p>
            <button
              onClick={handleActivate}
              disabled={activating}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {activating ? 'Activating...' : 'Activate CRM'}
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-indigo-400 mt-2">One click setup — no extra charge</p>
          </>
        )}
      </div>

      {/* Features Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Everything Included</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className={`w-10 h-10 ${f.color} rounded-lg flex items-center justify-center mb-3`}>
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Value Comparison */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-8 sm:p-10 mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">What You Would Pay Separately</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            { tool: 'CRM (HubSpot/Salesforce)', price: '$50-300/mo' },
            { tool: 'Email Marketing (Mailchimp)', price: '$20-100/mo' },
            { tool: 'Funnel Builder (ClickFunnels)', price: '$97-297/mo' },
            { tool: 'SMS Marketing (Twilio)', price: '$50-200/mo' },
            { tool: 'Booking Software (Calendly)', price: '$12-20/mo' },
            { tool: 'Reputation Management', price: '$50-100/mo' },
            { tool: 'Website Builder (Wix/Squarespace)', price: '$16-40/mo' },
            { tool: 'Automation (Zapier)', price: '$20-100/mo' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-4 px-4 border-b border-gray-100 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-base font-medium text-gray-800">{item.tool}</span>
              </div>
              <span className="text-lg font-semibold text-red-400 line-through">{item.price}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 pt-6 border-t-2 border-gray-200">
          <p className="text-gray-500 text-lg">Total if purchased separately:</p>
          <p className="text-3xl sm:text-4xl font-bold text-red-400 line-through mt-1">$315 - $1,157/mo</p>
          <p className="text-3xl sm:text-4xl font-bold text-emerald-600 mt-3">Included FREE with CloudCode</p>
          <p className="text-gray-400 text-sm mt-2">Starting at just $17/mo</p>
        </div>
      </div>

      {/* Bottom CTA */}
      {hasGHL && (
        <div className="text-center">
          <a
            href="https://client.advancedmarketing.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
          >
            Open CRM Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
