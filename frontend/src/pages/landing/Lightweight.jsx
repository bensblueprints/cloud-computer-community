import { Link } from 'react-router-dom';
import {
  Cloud, ArrowRight, Monitor, Smartphone, Tablet, Laptop,
  Cpu, HardDrive, Zap, Globe, CheckCircle2, Gauge, Wifi, MemoryStick
} from 'lucide-react';
import SEO from '../../components/SEO';

const features = [
  { icon: Globe, title: 'Works in Any Browser', desc: 'Chrome, Safari, Edge, Firefox. If it runs a browser, it runs your cloud desktop.', color: 'from-cyan-400 to-blue-500' },
  { icon: Cpu, title: 'Up to 32GB RAM', desc: 'Your cloud computer packs serious power. Run heavy apps without breaking a sweat.', color: 'from-violet-400 to-purple-500' },
  { icon: Zap, title: 'No Heavy Downloads', desc: 'Nothing installed on your device. No lag, no storage wasted, no fans spinning.', color: 'from-emerald-400 to-green-500' },
  { icon: Monitor, title: 'Full Desktop Experience', desc: 'Ubuntu Desktop with multi-monitor support, taskbar, file manager — a real computer.', color: 'from-orange-400 to-red-500' },
  { icon: Laptop, title: 'Perfect for Chromebooks', desc: 'Your $200 Chromebook becomes a development powerhouse with CloudCode.', color: 'from-pink-400 to-rose-500' },
  { icon: Wifi, title: 'Low Bandwidth Friendly', desc: 'Optimized streaming means it works even on slower connections. Just need a browser.', color: 'from-amber-400 to-yellow-500' },
];

const devices = [
  { icon: Laptop, label: 'Old Laptops', desc: 'Give that 2015 laptop new life' },
  { icon: Tablet, label: 'Tablets & iPads', desc: 'Desktop power on your tablet' },
  { icon: Smartphone, label: 'Chromebooks', desc: '$200 device, $2000 performance' },
  { icon: Monitor, label: 'Any Desktop', desc: 'Works on any computer with a browser' },
];

const specs = [
  { label: 'RAM', solo: '8 GB', team: '16 GB', army: '32 GB' },
  { label: 'CPU', solo: '2 vCPU', team: '4 vCPU', army: '8 vCPU' },
  { label: 'Storage', solo: '40 GB NVMe', team: '80 GB NVMe', army: '160 GB NVMe' },
  { label: 'OS', solo: 'Ubuntu Desktop', team: 'Ubuntu Desktop', army: 'Ubuntu Desktop' },
  { label: 'Price', solo: '$17/mo', team: '$47/mo', army: '$97/mo' },
];

export default function Lightweight() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="Lightweight Cloud Computer — Full Desktop in Any Browser"
        description="Turn any device into a powerful workstation. CloudCode runs a full Ubuntu desktop with up to 32GB RAM in your browser. Perfect for Chromebooks, tablets, and old laptops."
        path="/for/power"
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
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-400 mb-6">
              <Gauge className="w-4 h-4" />
              Desktop-class power from any device
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Turn any device into a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">powerhouse.</span>
              <br />
              <span className="text-slate-400 text-3xl sm:text-4xl">Your $200 laptop just got 32GB RAM.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8">
              CloudCode runs in your browser. Your device just displays the picture — all the heavy lifting happens on our servers.
              Chromebook, old laptop, tablet — it does not matter. You get a fast, powerful desktop.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-violet-500/25"
            >
              Upgrade Your Device Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-3">Plans start at $17/mo. 3-day free trial.</p>
          </div>
          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop"
              alt="Laptop and tablet devices showing technology"
              className="rounded-2xl border border-slate-800 shadow-2xl shadow-violet-500/10 w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Device grid */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {devices.map((d, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center hover:border-violet-500/30 transition">
              <d.icon className="w-8 h-8 text-violet-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-1">{d.label}</h3>
              <p className="text-xs text-slate-400">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Power Without the Hardware</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">All the performance runs in the cloud. Your device just needs a browser.</p>
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

      {/* Specs table */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-800">
            <h2 className="text-2xl font-bold text-center">Cloud Computer Specs</h2>
            <p className="text-slate-400 text-center mt-2">Pick the power level you need</p>
          </div>

          <div className="grid grid-cols-4 gap-0 text-sm">
            {/* Header */}
            <div className="p-4 font-medium text-slate-500 border-b border-slate-800"></div>
            <div className="p-4 font-medium text-center border-b border-slate-800 text-cyan-400">Solo</div>
            <div className="p-4 font-medium text-center border-b border-slate-800 text-violet-400">Team</div>
            <div className="p-4 font-medium text-center border-b border-slate-800 text-amber-400">Army</div>

            {specs.map((row, i) => (
              <>
                <div key={`label-${i}`} className="p-4 font-medium text-slate-400 border-b border-slate-800/50">{row.label}</div>
                <div key={`solo-${i}`} className="p-4 text-center text-slate-200 border-b border-slate-800/50">{row.solo}</div>
                <div key={`team-${i}`} className="p-4 text-center text-slate-200 border-b border-slate-800/50">{row.team}</div>
                <div key={`army-${i}`} className="p-4 text-center text-slate-200 border-b border-slate-800/50">{row.army}</div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Devices image */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <img
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=500&fit=crop"
          alt="Clean laptop workspace setup"
          className="rounded-2xl border border-slate-800 w-full object-cover h-64 sm:h-80"
        />
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
          <Zap className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3">No More Hardware Upgrades</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Stop spending $1,000+ on new laptops. CloudCode turns any device you already own into a machine with
            enterprise-grade specs. Your hardware becomes irrelevant.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-400">2 min</p>
              <p className="text-xs text-slate-500">Setup time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">0 GB</p>
              <p className="text-xs text-slate-500">Local storage used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">100%</p>
              <p className="text-xs text-slate-500">Cloud powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Your device is powerful enough.</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          If it has a browser, it can run CloudCode. Get a full Ubuntu desktop with up to 32GB RAM and fast NVMe storage.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Get Your Cloud Computer
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
