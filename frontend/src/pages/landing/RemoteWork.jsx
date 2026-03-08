import { Link } from 'react-router-dom';
import {
  Cloud, ArrowRight, Globe, Shield, Monitor, Smartphone,
  Laptop, Lock, Wifi, MapPin, CheckCircle2, Plane,
  Coffee, Palmtree, Building
} from 'lucide-react';

const features = [
  { icon: Globe, title: 'Access From Any Browser', desc: 'Your full desktop lives in the cloud. Open any browser and you are right where you left off.', color: 'from-cyan-400 to-blue-500' },
  { icon: Monitor, title: 'Same Environment Everywhere', desc: 'Phone, tablet, laptop — your desktop looks and works the same on every device.', color: 'from-violet-400 to-purple-500' },
  { icon: Shield, title: 'Nothing Stored Locally', desc: 'Lost your laptop? No problem. Your files and apps live safely in the cloud, not on your device.', color: 'from-emerald-400 to-green-500' },
  { icon: Lock, title: 'Secure by Default', desc: 'Encrypted connections, isolated VMs. No need for a VPN. Just log in and work.', color: 'from-orange-400 to-red-500' },
  { icon: Wifi, title: 'Works on Any Connection', desc: 'Optimized streaming means hotel wifi, cafe hotspots, and mobile tethering all work great.', color: 'from-pink-400 to-rose-500' },
  { icon: MapPin, title: 'Location Independent', desc: 'Bali, Berlin, Bangkok, or your couch. Your office goes wherever you go.', color: 'from-amber-400 to-yellow-500' },
];

const locations = [
  { icon: Plane, label: 'Airport Lounges' },
  { icon: Coffee, label: 'Coffee Shops' },
  { icon: Palmtree, label: 'Beach Towns' },
  { icon: Building, label: 'Co-working Spaces' },
];

const stats = [
  { value: '0', label: 'Apps to install' },
  { value: '0', label: 'VPNs needed' },
  { value: '100%', label: 'Cloud-based' },
  { value: '24/7', label: 'Access from anywhere' },
];

const checklist = [
  'Full Ubuntu desktop in your browser',
  'Files, apps, and settings always synced',
  'Google Chrome & Firefox included',
  'Telegram for team communication',
  'Go High Level CRM for client management',
  'Cursor IDE & VS Code for development',
  '4 AI models for productivity',
  'No data on your local device',
];

export default function RemoteWork() {
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
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm text-amber-400 mb-6">
              <Plane className="w-4 h-4" />
              Work from literally anywhere
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your office lives in the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">cloud.</span>
              <br />
              <span className="text-slate-400 text-2xl sm:text-3xl">Work from Bali, Berlin, or your couch.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8">
              A full cloud desktop you can access from any browser on any device.
              Your files, your apps, your entire workspace — always there, never lost.
              No VPN, no syncing, no setup. Just log in.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-amber-500/25"
            >
              Start Working From Anywhere
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-3">Plans start at $17/mo. 3-day free trial.</p>
          </div>
          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
              alt="Digital nomad working remotely from a beautiful location"
              className="rounded-2xl border border-slate-800 shadow-2xl shadow-amber-500/10 w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Location badges */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {locations.map((l, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center hover:border-amber-500/30 transition">
              <l.icon className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">{l.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Built for the Remote Lifestyle</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">Your workspace should go where you go. CloudCode makes that happen.</p>
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

      {/* Checklist */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-center mb-6">What is Waiting for You</h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/50 border border-slate-800 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remote work lifestyle image */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <img
          src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=500&fit=crop"
          alt="Working remotely with laptop in a scenic location"
          className="rounded-2xl border border-slate-800 w-full object-cover h-64 sm:h-80"
        />
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
          <Palmtree className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Trusted by Digital Nomads Worldwide</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Remote workers, freelancers, and digital nomads use CloudCode as their portable office.
            No more worrying about losing your laptop, syncing files, or finding the right tools on the road.
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <svg key={n} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            ))}
          </div>
          <p className="text-sm text-slate-500">"I travel full-time and CloudCode is the only thing I need. My whole office is a URL."</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Take your office everywhere.</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          A full cloud desktop, CRM, AI tools, and everything you need to work from anywhere in the world. Starting at $17/mo.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Get Your Cloud Desktop
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
