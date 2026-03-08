import { Link, useNavigate } from "react-router-dom";
import { Monitor, Zap, Shield, Users, Server, Code, Cloud, Cpu, HardDrive, CheckCircle, CheckCircle2, Star, ArrowRight, Mail, Sparkles } from "lucide-react";
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
    features: ["1 User", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "Free Go High Level CRM", "500+ Claude Code Skills PDF", "24/7 Uptime", "Email Support"],
    cta: "Start 3-Day Trial"
  },
  {
    name: "Team",
    price: 79,
    priceId: "price_team",
    seats: 5,
    specs: { ram: "16GB", cpu: "4 vCPU", storage: "80GB NVMe" },
    features: ["5 Users", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "Free Go High Level CRM", "500+ Claude Code Skills PDF", "Team Dashboard", "Priority Support"],
    popular: true,
    cta: "Start 3-Day Trial"
  },
  {
    name: "Army",
    price: 299,
    priceId: "price_army",
    seats: 25,
    specs: { ram: "32GB", cpu: "8 vCPU", storage: "160GB NVMe" },
    features: ["25 Users", "noVNC + RDP + SSH Access", "Pre-installed Dev Tools", "Free Go High Level CRM", "500+ Claude Code Skills PDF", "Admin Console", "Dedicated Support"],
    cta: "Start 3-Day Trial"
  },
];

const testimonials = [
  { name: "Alex Chen", role: "Senior Developer @ Stripe", text: "CloudCode replaced our local dev machines. The Go High Level CRM alone is worth the subscription.", avatar: "AC" },
  { name: "Sarah Miller", role: "CTO @ StartupXYZ", text: "We onboard new engineers in 10 minutes now. The Claude Code skills PDF was a game-changer for our team.", avatar: "SM" },
  { name: "James Wilson", role: "Freelance Developer", text: "I run my entire business from CloudCode. The cloud desktop plus free CRM is unbeatable.", avatar: "JW" },
];

const faqs = [
  { q: "What is Go High Level and why is it free?", a: "Go High Level is a powerful all-in-one CRM, marketing automation, and sales platform that normally costs $97-$497/month. Every CloudCode plan includes a free GHL sub-account with unlimited users, funnels, automations, and more. It's our way of giving you everything you need to build and grow your business." },
  { q: "What are the 500+ Claude Code Skills?", a: "It's a comprehensive PDF guide with over 500 AI-powered coding prompts, workflows, and techniques for Claude Code. From debugging to full-stack development, deployment automation to code reviews — it's the ultimate reference for AI-assisted coding." },
  { q: "What tools come pre-installed?", a: "Every environment includes Claude Code, VS Code, Cursor, Node.js 20, Python 3.12, Docker, Git, and more. You can install anything else you need." },
  { q: "Can I access my desktop from any device?", a: "Yes! CloudCode works in any modern browser. Access from Windows, Mac, Linux, iPad, or even your phone." },
  { q: "How does the 3-day trial work?", a: "Start your trial by choosing a plan. Your card is saved but you won't be charged for 3 days. Cancel anytime before the trial ends to avoid charges." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no commitments. Cancel anytime from your dashboard." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (planName) => {
    if (!user) {
      navigate(`/register?plan=${planName}`);
      return;
    }
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
                <a href="#pricing" className="text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25">
                  Get Started
                </a>
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
        <div className="absolute top-60 right-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center px-4 relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Your Cloud Desktop</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Ready in 2 Minutes</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            A powerful cloud desktop with Claude Code, VS Code, and all dev tools pre-installed.
            <span className="text-emerald-400 font-semibold"> Replace $1,000+/mo in SaaS tools</span> with one $17/mo subscription.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href="#pricing"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </a>
          </div>

          <p className="text-sm text-emerald-400 mb-16">3-day free trial on all plans. Cancel anytime. No commitment.</p>

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
      <section id="features" className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for Serious Builders</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Enterprise-grade infrastructure, accessible from anywhere.</p>
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

      {/* Tool-by-Tool Cost Breakdown */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What You Are Paying For Separately</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">CloudCode replaces 12+ tools you are already paying for. Here is the breakdown.</p>
          </div>

          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 sm:px-8 py-4 bg-slate-800/50 text-sm font-semibold text-slate-400 border-b border-slate-800">
              <div className="col-span-4">Tool</div>
              <div className="col-span-3 hidden sm:block">Example</div>
              <div className="col-span-3 sm:col-span-3 text-right">Their Price</div>
              <div className="col-span-5 sm:col-span-2 text-right">CloudCode</div>
            </div>

            {[
              { tool: 'CRM & Sales Pipeline', example: 'HubSpot / Salesforce', price: '$50 - $300' },
              { tool: 'Funnel & Landing Pages', example: 'ClickFunnels', price: '$97 - $297' },
              { tool: 'Email Marketing', example: 'Mailchimp / ConvertKit', price: '$20 - $100' },
              { tool: 'SMS Marketing', example: 'Twilio / SlickText', price: '$50 - $200' },
              { tool: 'Booking & Scheduling', example: 'Calendly Pro', price: '$12 - $20' },
              { tool: 'Cloud Computer / VPS', example: 'AWS / DigitalOcean', price: '$50 - $200' },
              { tool: 'IDE & Code Editor', example: 'Cursor Pro', price: '$20' },
              { tool: 'AI Coding Tools', example: 'GitHub Copilot / ChatGPT', price: '$20 - $200' },
              { tool: 'Reputation Management', example: 'Birdeye / Podium', price: '$50 - $100' },
              { tool: 'Website Builder', example: 'Squarespace / Wix', price: '$16 - $40' },
              { tool: 'Automation Platform', example: 'Zapier / Make', price: '$20 - $100' },
              { tool: 'Community Platform', example: 'Circle / Mighty Networks', price: '$39 - $99' },
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 sm:px-8 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition items-center">
                <div className="col-span-4 text-sm font-medium text-slate-200">{item.tool}</div>
                <div className="col-span-3 hidden sm:block text-sm text-slate-500">{item.example}</div>
                <div className="col-span-3 sm:col-span-3 text-right">
                  <span className="text-red-400 line-through text-sm">{item.price}</span>
                </div>
                <div className="col-span-5 sm:col-span-2 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Included
                  </span>
                </div>
              </div>
            ))}

            <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-slate-400 text-lg">Total if purchased separately:</p>
                  <p className="text-4xl sm:text-5xl font-bold text-red-400 line-through">$444 - $1,676/mo</p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-slate-400 text-lg">CloudCode price:</p>
                  <p className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">$17/mo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Annual Savings Comparison */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-5xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-5 py-2 text-sm mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Stop overpaying for software</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Do the Math</h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">The average business spends $500-$1,500/month on SaaS tools. CloudCode replaces them all.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/30 rounded-3xl p-10 sm:p-16 shadow-2xl shadow-emerald-500/5">
            <div className="grid sm:grid-cols-3 gap-10 items-center">
              <div className="text-center">
                <p className="text-slate-400 text-base mb-3 uppercase tracking-wider font-semibold">Typical Annual Spend</p>
                <p className="text-6xl sm:text-7xl lg:text-8xl font-black text-red-400 line-through">$13,884</p>
                <p className="text-slate-500 text-base mt-3">CRM + hosting + AI tools + IDE + more</p>
              </div>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-base mb-3 uppercase tracking-wider font-semibold">CloudCode Annual Cost</p>
                <p className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">$204</p>
                <p className="text-emerald-400 text-base mt-3 font-semibold">Everything included. One subscription.</p>
              </div>
            </div>

            <div className="mt-14 pt-10 border-t-2 border-slate-700 text-center">
              <p className="text-slate-400 text-xl mb-4">That is a savings of</p>
              <p className="text-7xl sm:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 leading-none">$13,680</p>
              <p className="text-3xl sm:text-4xl text-slate-200 font-bold mt-4">per year</p>
              <a href="#pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-12 py-5 rounded-xl font-bold text-xl hover:opacity-90 transition shadow-2xl shadow-emerald-500/25 mt-10">
                Start Saving Now
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-slate-400 text-lg mb-2">Every plan includes <span className="text-orange-400 font-semibold">free Go High Level CRM</span> + <span className="text-cyan-400 font-semibold">500+ Claude Code Skills PDF</span></p>
            <p className="text-emerald-400 text-sm mb-8">3-day free trial. Your card won't be charged until after the trial ends.</p>

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
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${feature.includes("Go High Level") ? "text-orange-400" : feature.includes("Claude Code Skills") ? "text-purple-400" : "text-cyan-400"}`} />
                      <span className={feature.includes("Go High Level") ? "text-orange-300 font-medium" : feature.includes("Claude Code Skills") ? "text-purple-300 font-medium" : ""}>
                        {feature}
                      </span>
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
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by Builders</h2>
            <p className="text-slate-400 text-lg">Join thousands of developers and entrepreneurs shipping faster with CloudCode</p>
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
      <section id="faq" className="py-24">
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

      {/* Final CTA */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-slate-900/90 rounded-3xl border border-slate-800/50 p-12">
              <h2 className="text-4xl font-bold mb-4">Ready to Build Something Amazing?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Replace $1,000+/mo in SaaS tools with one powerful cloud desktop. Save over $13,000/year.
              </p>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/25"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-sm text-slate-500 mt-4">3-day free trial. Cancel anytime. No commitment.</p>
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
