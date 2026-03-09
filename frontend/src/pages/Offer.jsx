import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Zap, Download, Shield, Star, ChevronDown, ChevronUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const SKILLS_CATEGORIES = [
  { name: 'Marketing & Sales', count: '80+', desc: 'Funnels, ads, email sequences, landing pages' },
  { name: 'Business Operations', count: '70+', desc: 'SOPs, hiring, finance, project management' },
  { name: 'Content Creation', count: '60+', desc: 'Blog posts, social media, video scripts, podcasts' },
  { name: 'AI & Automation', count: '50+', desc: 'Prompt engineering, workflow automation, chatbots' },
  { name: 'Legal & Compliance', count: '40+', desc: 'Contracts, policies, NDAs, terms of service' },
  { name: 'Strategy & Growth', count: '100+', desc: 'Market research, competitor analysis, scaling' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Agency Owner', text: 'These skills saved me hundreds of hours. I use them daily for client work.' },
  { name: 'David K.', role: 'Startup Founder', text: 'The business operations skills alone are worth 10x the price.' },
  { name: 'Lisa T.', role: 'Freelancer', text: 'I went from spending hours on proposals to minutes. Game changer.' },
];

const FAQ_ITEMS = [
  { q: 'What exactly do I get?', a: 'You get 400+ Claude AI skill prompts organized by category, plus 25 Moltbot Agent Build Skills. These are ready-to-use prompt templates that turn Claude into a specialized expert for any business task.' },
  { q: 'How do I use these skills?', a: 'Simply copy any skill prompt into Claude and follow the guided workflow. Each skill includes instructions, templates, and examples. No technical knowledge required.' },
  { q: 'Is there a money-back guarantee?', a: 'Yes! If you\'re not satisfied within 30 days, contact us for a full refund. No questions asked.' },
  { q: 'What is the SOLO VPS bump offer?', a: 'For $17/month, you get a full cloud Linux desktop (VPS) with GoHighLevel CRM access. It\'s your own virtual computer in the cloud, perfect for running AI agents and automations 24/7.' },
];

export default function Offer() {
  const { price } = useParams();
  const priceNum = parseInt(price) || 5;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [bumpSolo, setBumpSolo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = `Get 400+ Claude AI Skills for Just $${priceNum} | CloudCode`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `Unlock 400+ Claude AI skill prompts and 25 Moltbot Agent Build Skills for only $${priceNum}. Instant download. 30-day money-back guarantee.`);
  }, [priceNum]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { value: priceNum, currency: 'USD' });
      const res = await fetch(`${API}/api/offers/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceNum, email, name, bumpSolo }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-cyan-400">CloudCode</Link>
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-pulse">
            Limited Offer
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
            <span>400+ Skills + 25 Agent Builds</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Turn Claude Into Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Business Superpower
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            400+ ready-to-use AI skill prompts for marketing, sales, operations, content, legal, and more. Plus 25 Moltbot agent build skills to automate your workflows.
          </p>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
              <p className="text-sm text-gray-400 line-through">$97 value</p>
              <p className="text-5xl font-extrabold text-white">${priceNum}</p>
              <p className="text-cyan-400 text-sm font-medium mt-1">One-time payment</p>
            </div>
          </div>
          <a href="#checkout" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold px-10 py-4 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25">
            Get Instant Access — ${priceNum}
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '400+', label: 'AI Skills' },
            { num: '25', label: 'Agent Builds' },
            { num: 'Instant', label: 'Download' },
            { num: '30-Day', label: 'Guarantee' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-cyan-400">{s.num}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What's Inside the Bundle</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKILLS_CATEGORIES.map(cat => (
              <div key={cat.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-cyan-500/10 text-cyan-400 text-sm font-bold px-3 py-1 rounded-full">{cat.count}</div>
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                </div>
                <p className="text-gray-400 text-sm">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What People Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-300 text-sm mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Form */}
      <section id="checkout" className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-center mb-2">Get Your Skills Bundle</h2>
            <p className="text-gray-400 text-center text-sm mb-6">Instant download after purchase</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="offer-name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  id="offer-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="offer-email" className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  id="offer-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="you@email.com"
                />
              </div>

              {/* Bump Upsell */}
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                  bumpSolo ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
                onClick={() => setBumpSolo(!bumpSolo)}
                role="checkbox"
                aria-checked={bumpSolo}
                tabIndex={0}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setBumpSolo(!bumpSolo); } }}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    bumpSolo ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'
                  }`}>
                    {bumpSolo && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      YES! Add a Cloud VPS + GoHighLevel CRM — <span className="text-cyan-400">$17/mo</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Get your own cloud Linux desktop, run AI agents 24/7, plus a full GoHighLevel CRM to manage leads, automate marketing, and grow your business.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 text-lg"
              >
                {loading ? 'Redirecting to checkout...' : `Get Instant Access — $${priceNum}`}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure checkout</div>
                <div className="flex items-center gap-1"><Download className="w-3 h-3" /> Instant download</div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
            {FAQ_ITEMS.map((faq, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <button
                  className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-slate-800/50 transition"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white" itemProp="name">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p className="text-gray-400 text-sm" itemProp="text">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Money-back guarantee */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-8">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">30-Day Money-Back Guarantee</h3>
          <p className="text-gray-400 text-sm">Not satisfied? Get a full refund within 30 days. No questions asked.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold mb-4">Ready to Supercharge Your Workflow?</h2>
        <p className="text-gray-400 mb-8">Join hundreds of professionals using AI skills to save hours every day.</p>
        <a href="#checkout" className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold px-10 py-4 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25">
          Get Instant Access — ${priceNum}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CloudCode. All rights reserved.</p>
      </footer>
    </div>
  );
}
