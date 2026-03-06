import { Link, useNavigate } from "react-router-dom";
import { Monitor, Zap, Shield, Users, Server, Code, Cloud, Cpu, HardDrive, CheckCircle, Star, ArrowRight, Play, Mail } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const features = [
  { icon: Monitor, title: "Ubuntu Desktop", desc: "Full XFCE desktop accessible from your browser. No installs, no VPN required." },
  { icon: Zap, title: "2-Minute Setup", desc: "Your cloud environment deploys in under 2 minutes, fully configured and ready." },
  { icon: Code, title: "Dev Tools Pre-installed", desc: "Claude Code, VS Code, Cursor, Node.js, Python, Docker — all ready to use." },
  { icon: Shield, title: "Enterprise Security", desc: "Encrypted connections, isolated VMs, and SOC 2 compliant infrastructure." },
  { icon: Cloud, title: "Access Anywhere", desc: "Work from any device with a browser. Your desktop follows you everywhere." },
  { icon: Users, title: "Team Collaboration", desc: "Invite teammates, share environments, and manage access from one dashboard." },
];

const plans = [
  {
    name: "Solo",
    price: 17,
    priceId: "price_solo",
    seats: 1,
    specs: { ram: "8GB", cpu: "2 vCPU", storage: "40GB NVMe" },
    features: ["1 Cloud Desktop", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "24/7 Uptime", "Email Support"],
    cta: "Start 3-Day Trial"
  },
  {
    name: "Team",
    price: 79,
    priceId: "price_team",
    seats: 5,
    specs: { ram: "16GB", cpu: "4 vCPU", storage: "80GB NVMe" },
    features: ["5 Cloud Desktops", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "Team Dashboard", "Priority Support", "SSO Integration"],
    popular: true,
    cta: "Start 3-Day Trial"
  },
  {
    name: "Army",
    price: 299,
    priceId: "price_army",
    seats: 25,
    specs: { ram: "32GB", cpu: "8 vCPU", storage: "160GB NVMe" },
    features: ["25 Cloud Desktops", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "Admin Console", "Dedicated Support", "Custom Branding", "API Access"],
    cta: "Start 3-Day Trial"
  },
];

const testimonials = [
  { name: "Alex Chen", role: "Senior Developer @ Stripe", text: "CloudCode replaced our local dev machines. The consistency across the team is incredible.", avatar: "AC" },
  { name: "Sarah Miller", role: "CTO @ StartupXYZ", text: "We onboard new engineers in 10 minutes now. No more 2-day setup processes.", avatar: "SM" },
  { name: "James Wilson", role: "Freelance Developer", text: "I can code from my iPad at a coffee shop with the same power as my desktop.", avatar: "JW" },
];

const faqs = [
  { q: "What tools come pre-installed?", a: "Every environment includes Claude Code, VS Code, Cursor, Node.js 20, Python 3.12, Docker, Git, and more. You can install anything else you need." },
  { q: "Can I access my desktop from any device?", a: "Yes! CloudCode works in any modern browser. Access from Windows, Mac, Linux, iPad, or even your phone." },
  { q: "How secure is my data?", a: "Your VM is completely isolated. All connections are encrypted. We never access your code or data." },
  { q: "How does the 3-day trial work?", a: "Start your trial by choosing a plan. Your card is saved but you won't be charged for 3 days. Cancel anytime before the trial ends to avoid charges." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no commitments. Cancel anytime from your dashboard." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (planName) => {
    // If not logged in, go to register first
    if (!user) {
      navigate("/register");
      return;
    }
    // If logged in, go directly to checkout
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">CloudCode</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-300 hover:text-white px-4 py-2 transition">Login</Link>
                <Link to="/register" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center px-4 relative">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 text-sm mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-slate-300">Now with Claude Code & Cursor pre-installed</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Your Dev Machine</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">In The Cloud</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Spin up a powerful Ubuntu desktop in seconds. Code from anywhere with VS Code, Claude Code, and all your tools pre-configured.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
            >
              {user ? "Go to Dashboard" : "Start Building"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <a href="#pricing" className="inline-flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition">
              <Play className="w-5 h-5" />
              View Pricing
            </a>
          </div>

          <p className="text-sm text-emerald-400 mb-16">3-day free trial • Cancel anytime • No commitment</p>

          {/* Terminal Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-slate-900/90 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-xs text-slate-500">cloudcode@ubuntu-desktop:~</span>
              </div>
              <div className="p-6 font-mono text-sm text-left">
                <div className="text-emerald-400">$ claude --version</div>
                <div className="text-slate-400 mt-1">Claude Code v1.0.17 (Anthropic)</div>
                <div className="text-emerald-400 mt-3">$ code --version</div>
                <div className="text-slate-400 mt-1">1.96.0</div>
                <div className="text-emerald-400 mt-3">$ node --version && python3 --version</div>
                <div className="text-slate-400 mt-1">v20.18.0</div>
                <div className="text-slate-400">Python 3.12.3</div>
                <div className="text-emerald-400 mt-3">$ docker --version</div>
                <div className="text-slate-400 mt-1">Docker version 27.3.1</div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-emerald-400">$</span>
                  <span className="w-2 h-5 bg-cyan-400 animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-sm text-slate-500 mt-1">Developers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">99.9%</div>
            <div className="text-sm text-slate-500 mt-1">Uptime SLA</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">&lt;2min</div>
            <div className="text-sm text-slate-500 mt-1">Deploy Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">24/7</div>
            <div className="text-sm text-slate-500 mt-1">Support</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Ship</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">A complete development environment, accessible from anywhere.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-slate-400 text-lg mb-2">Start with a 3-day free trial. Cancel anytime.</p>
            <p className="text-emerald-400 text-sm mb-8">Your card won't be charged until after the trial ends</p>

            <div className="inline-flex items-center bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${billingPeriod === "monthly" ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${billingPeriod === "yearly" ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Yearly <span className="text-emerald-400 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-6 ${plan.popular ? "bg-gradient-to-b from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/50" : "bg-slate-900/50 border border-slate-800/50"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs">
                  <Cpu className="w-3 h-3" /> {plan.specs.cpu}
                  <span className="text-slate-600">·</span>
                  <Server className="w-3 h-3" /> {plan.specs.ram}
                  <span className="text-slate-600">·</span>
                  <HardDrive className="w-3 h-3" /> {plan.specs.storage}
                </div>
                <div className="mt-4 mb-4">
                  <span className="text-4xl font-bold">${billingPeriod === "yearly" ? Math.round(plan.price * 0.8) : plan.price}</span>
                  <span className="text-slate-500">/mo</span>
                  {billingPeriod === "yearly" && <div className="text-emerald-400 text-xs mt-1">billed yearly</div>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.name)}
                  className={`w-full text-center py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25"
                      : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  {plan.cta}
                </button>
                <p className="text-center text-xs text-slate-500 mt-2">3 days free, then ${billingPeriod === "yearly" ? Math.round(plan.price * 0.8) : plan.price}/mo</p>
              </div>
            ))}

            {/* Enterprise Card */}
            <div className="relative rounded-2xl p-6 bg-gradient-to-b from-purple-500/10 to-pink-600/10 border border-purple-500/30">
              <h3 className="text-2xl font-bold">Enterprise</h3>
              <div className="flex items-center gap-2 mt-2 text-slate-400 text-xs">
                <Cpu className="w-3 h-3" /> Custom
                <span className="text-slate-600">·</span>
                <Server className="w-3 h-3" /> Unlimited
                <span className="text-slate-600">·</span>
                <HardDrive className="w-3 h-3" /> Custom
              </div>
              <div className="mt-4 mb-4">
                <span className="text-2xl font-bold">Custom</span>
                <div className="text-slate-400 text-xs mt-1">tailored to your needs</div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Unlimited Desktops
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Dedicated Infrastructure
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Custom SLA
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  On-premise Option
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  24/7 Phone Support
                </li>
              </ul>
              <a
                href="mailto:cloudcode@advancedmarketing.co"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition"
              >
                <Mail className="w-4 h-4" />
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by Developers</h2>
            <p className="text-slate-400 text-lg">Join thousands of developers shipping faster with CloudCode</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-900/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-800/50 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition"
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className={`text-2xl text-slate-500 transition ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-slate-900/90 rounded-3xl border border-slate-800/50 p-12">
              <h2 className="text-4xl font-bold mb-4">Ready to Code From Anywhere?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Get your cloud desktop running in under 2 minutes. Start your 3-day free trial today.
              </p>
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">CloudCode</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="mailto:cloudcode@advancedmarketing.co" className="hover:text-white transition">Support</a>
            </div>
            <div className="text-sm text-slate-600">
              © {new Date().getFullYear()} CloudCode. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
