import { Link } from 'react-router-dom';
import {
  Cloud, ArrowRight, CheckCircle2, XCircle, DollarSign,
  TrendingDown, Sparkles, Calculator, Layers, Zap
} from 'lucide-react';
import SEO from '../../components/SEO';

const comparisons = [
  { tool: 'CRM & Sales Pipeline', example: 'HubSpot / Salesforce', theirPrice: '$50 - $300', included: true },
  { tool: 'Funnel & Landing Page Builder', example: 'ClickFunnels', theirPrice: '$97 - $297', included: true },
  { tool: 'Email Marketing', example: 'Mailchimp / ConvertKit', theirPrice: '$20 - $100', included: true },
  { tool: 'SMS Marketing', example: 'Twilio / SlickText', theirPrice: '$50 - $200', included: true },
  { tool: 'Booking & Scheduling', example: 'Calendly Pro', theirPrice: '$12 - $20', included: true },
  { tool: 'Cloud Computer / VPS', example: 'AWS / DigitalOcean', theirPrice: '$50 - $200', included: true },
  { tool: 'IDE & Code Editor', example: 'Cursor Pro', theirPrice: '$20', included: true },
  { tool: 'AI Coding Tools', example: 'GitHub Copilot / ChatGPT', theirPrice: '$20 - $200', included: true },
  { tool: 'Reputation Management', example: 'Birdeye / Podium', theirPrice: '$50 - $100', included: true },
  { tool: 'Website Builder', example: 'Squarespace / Wix', theirPrice: '$16 - $40', included: true },
  { tool: 'Automation Platform', example: 'Zapier / Make', theirPrice: '$20 - $100', included: true },
  { tool: 'Community Platform', example: 'Circle / Mighty Networks', theirPrice: '$39 - $99', included: true },
];

const stats = [
  { value: '$1,157+', label: 'Typical monthly SaaS spend' },
  { value: '$17', label: 'CloudCode monthly price' },
  { value: '98%', label: 'Savings on tools' },
  { value: '12+', label: 'Tools replaced' },
];

export default function SaasSavings() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="Replace $1,000+/mo in SaaS Tools — CloudCode Savings Calculator"
        description="Stop paying for 12+ separate SaaS subscriptions. CloudCode bundles CRM, cloud hosting, AI tools, code editors, and more into one $17/mo subscription. Save over $13,000/year."
        path="/for/save"
      />
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
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 text-sm text-emerald-400 mb-6">
              <TrendingDown className="w-4 h-4" />
              Save over $1,100/month
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Replace{' '}
              <span className="text-red-400 line-through">$1,157/mo</span>{' '}
              in subscriptions.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pay $17.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8">
              CRM, funnel builder, email marketing, SMS, booking, cloud computer, IDE, AI tools, and more.
              One subscription. Everything included. Stop juggling 12 different bills.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-emerald-500/25"
            >
              Start Saving Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-3">3-day free trial. Cancel anytime.</p>
          </div>
          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop"
              alt="Business savings and financial planning"
              className="rounded-2xl border border-slate-800 shadow-2xl shadow-emerald-500/10 w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price comparison table */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">The Real Cost of Running a Business</h2>
            <p className="text-slate-400 text-center mt-2">Here is what you are paying for separately right now</p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 sm:px-8 py-3 bg-slate-800/50 text-sm font-medium text-slate-400 border-b border-slate-800">
            <div className="col-span-4">Tool</div>
            <div className="col-span-3 hidden sm:block">Example</div>
            <div className="col-span-3 sm:col-span-3 text-right">Their Price</div>
            <div className="col-span-5 sm:col-span-2 text-right">CloudCode</div>
          </div>

          {/* Table rows */}
          {comparisons.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 sm:px-8 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition items-center">
              <div className="col-span-4 text-sm font-medium text-slate-200">{item.tool}</div>
              <div className="col-span-3 hidden sm:block text-sm text-slate-500">{item.example}</div>
              <div className="col-span-3 sm:col-span-3 text-right">
                <span className="text-red-400 line-through text-sm">{item.theirPrice}</span>
              </div>
              <div className="col-span-5 sm:col-span-2 text-right">
                <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Included
                </span>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-slate-400">Total if purchased separately:</p>
                <p className="text-3xl font-bold text-red-400 line-through">$444 - $1,676/mo</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-slate-400">CloudCode price:</p>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">$17/mo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">One Subscription. Everything Included.</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">No add-ons, no tiers, no surprises. Every plan includes all of these.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, title: 'Go High Level CRM', desc: 'The $297/mo marketing platform — CRM, funnels, email, SMS, automations. All included.', color: 'from-emerald-400 to-green-500' },
            { icon: Layers, title: 'Cloud Computer', desc: 'Full Ubuntu desktop with up to 32GB RAM. Access from any browser, anywhere.', color: 'from-cyan-400 to-blue-500' },
            { icon: Sparkles, title: 'AI Tools Built In', desc: '4 AI models plus Claude Code CLI with 500+ skills for coding and business.', color: 'from-violet-400 to-purple-500' },
            { icon: Zap, title: 'Full App Suite', desc: 'Chrome, Firefox, Telegram, Cursor IDE, VS Code, and the entire Linux ecosystem.', color: 'from-amber-400 to-orange-500' },
          ].map((f, i) => (
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

      {/* Business workspace image */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <img
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=500&fit=crop"
          alt="Business analytics dashboard on laptop screen"
          className="rounded-2xl border border-slate-800 w-full object-cover h-64 sm:h-80"
        />
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
          <Calculator className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Do the Math</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-4">
            The average small business spends $500-$1,500/month on SaaS tools before they even make their first dollar.
            CloudCode gives you everything for the price of a single lunch.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400 line-through">$13,884</p>
              <p className="text-xs text-slate-500">Typical annual spend</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">$204</p>
              <p className="text-xs text-slate-500">CloudCode annual cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Stop overpaying for software.</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Get a cloud computer, Go High Level CRM, AI tools, and an entire business toolkit for $17/mo.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Start Your Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
