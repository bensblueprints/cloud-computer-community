import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Zap, Download, Shield, Star, ChevronDown, ChevronUp, Sparkles, Clock, Users, ArrowRight, Lock, FileText, Bot, TrendingUp, Megaphone, Scale } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const SKILLS_CATEGORIES = [
  { name: 'Marketing & Sales', count: '80+', desc: 'Funnels, ads, email sequences, landing pages, sales scripts', icon: Megaphone },
  { name: 'Business Operations', count: '70+', desc: 'SOPs, hiring, finance, project management, workflows', icon: TrendingUp },
  { name: 'Content Creation', count: '60+', desc: 'Blog posts, social media, video scripts, podcasts, SEO', icon: FileText },
  { name: 'AI & Automation', count: '50+', desc: 'Prompt engineering, workflow automation, chatbot building', icon: Bot },
  { name: 'Legal & Compliance', count: '40+', desc: 'Contracts, policies, NDAs, terms of service, GDPR', icon: Scale },
  { name: 'Strategy & Growth', count: '100+', desc: 'Market research, competitor analysis, scaling playbooks', icon: Sparkles },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Agency Owner', text: 'These skills saved me hundreds of hours. I use them daily for client work and they pay for themselves every single week.', avatar: 'SM' },
  { name: 'David K.', role: 'Startup Founder', text: 'The business operations skills alone are worth 10x the price. My team runs on these now.', avatar: 'DK' },
  { name: 'Lisa T.', role: 'Freelancer', text: 'I went from spending hours on proposals to minutes. Complete game changer for my consulting business.', avatar: 'LT' },
];

const FAQ_ITEMS = [
  { q: 'What exactly do I get?', a: 'You get 400+ Claude AI skill prompts organized by category, plus 25 Moltbot Agent Build Skills. These are ready-to-use prompt templates that turn Claude into a specialized expert for any business task.' },
  { q: 'How do I use these skills?', a: 'Simply copy any skill prompt into Claude and follow the guided workflow. Each skill includes instructions, templates, and examples. No technical knowledge required.' },
  { q: 'Is there a money-back guarantee?', a: 'Yes! If you\'re not satisfied within 30 days, contact us for a full refund. No questions asked.' },
  { q: 'What is the SOLO VPS bump offer?', a: 'For $17/month, you get a full cloud Linux desktop (VPS) with GoHighLevel CRM access. It\'s your own virtual computer in the cloud, perfect for running AI agents and automations 24/7.' },
];

const VALUE_STACK = [
  { label: '400+ Claude AI Skill Prompts', value: 67 },
  { label: '25 Moltbot Agent Build Skills', value: 25 },
  { label: 'Organized Category System', value: 15 },
  { label: 'Lifetime Updates', value: 47 },
];

// Scroll animation hook
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

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

    // Add Google Fonts
    if (!document.querySelector('link[href*="Space+Grotesk"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, [priceNum]);

  const totalValue = VALUE_STACK.reduce((sum, v) => sum + v.value, 0);

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
    <div className="min-h-screen text-gray-100" style={{ fontFamily: "'Inter', sans-serif", background: '#070B14' }}>
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 70%)', animation: 'pulse 10s ease-in-out infinite 2s' }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>

      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50" style={{ background: 'rgba(7,11,20,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#818CF8' }}>
            CloudCode
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ color: '#22C55E', borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Limited Offer
            </span>
            <a href="#checkout" className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.03] cursor-pointer" style={{ background: '#6366F1', color: '#fff' }}>
              Get Access
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-8 border" style={{ color: '#A5B4FC', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)' }}>
              <Zap className="w-4 h-4" style={{ color: '#818CF8' }} />
              <span>400+ Skills + 25 Agent Builds</span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Turn Claude Into Your{' '}
              <span className="relative inline-block">
                <span style={{ background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 40%, #22C55E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Business Superpower
                </span>
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#94A3B8' }}>
              400+ ready-to-use AI skill prompts for marketing, sales, operations, content, legal, and more. Plus 25 Moltbot agent build skills to automate your workflows.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12">
              {/* Price card with glassmorphism */}
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl opacity-40 blur-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #22C55E)' }} />
                <div className="relative rounded-2xl p-7 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                  <p className="text-sm line-through mb-1" style={{ color: '#64748B' }}>${totalValue} value</p>
                  <p className="text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>${priceNum}</p>
                  <p className="text-sm font-medium mt-1.5" style={{ color: '#22C55E' }}>One-time payment</p>
                  <div className="mt-3 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>
                    Save {Math.round((1 - priceNum / totalValue) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <a
              href="#checkout"
              className="inline-flex items-center gap-2 text-lg font-bold px-10 py-4 rounded-xl transition-all duration-200 hover:scale-[1.03] cursor-pointer shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', boxShadow: '0 0 40px rgba(99,102,241,0.3)' }}
            >
              Get Instant Access <ArrowRight className="w-5 h-5" />
            </a>
            <div className="flex items-center justify-center gap-6 mt-5 text-xs" style={{ color: '#64748B' }}>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Secure checkout</span>
              <span className="flex items-center gap-1.5"><Download className="w-3 h-3" /> Instant download</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> 30-day guarantee</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="relative z-10 border-y py-6" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '400+', label: 'AI Skills', color: '#818CF8' },
              { num: '25', label: 'Agent Builds', color: '#818CF8' },
              { num: 'Instant', label: 'Download', color: '#22C55E' },
              { num: '30-Day', label: 'Guarantee', color: '#F59E0B' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.num}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#64748B' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-wider uppercase mb-3" style={{ color: '#818CF8' }}>Everything You Get</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>What's Inside the Bundle</h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKILLS_CATEGORIES.map((cat, i) => (
              <AnimatedSection key={cat.name} delay={i * 80}>
                <div
                  className="group rounded-xl p-6 border transition-all duration-300 hover:translate-y-[-2px] cursor-default"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                      <cat.icon className="w-5 h-5" style={{ color: '#818CF8' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                      <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{cat.count} skills</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{cat.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Value Stack */}
      <section className="relative z-10 py-16 px-4 sm:px-6" style={{ background: 'rgba(99,102,241,0.03)' }}>
        <div className="max-w-lg mx-auto">
          <AnimatedSection>
            <div className="text-center mb-10">
              <p className="text-sm font-semibold tracking-wider uppercase mb-3" style={{ color: '#22C55E' }}>Total Value</p>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Here's What You're Getting</h2>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {VALUE_STACK.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4" style={{ borderBottom: i < VALUE_STACK.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#22C55E' }} />
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <span className="text-sm line-through" style={{ color: '#64748B' }}>${item.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-5" style={{ background: 'rgba(99,102,241,0.08)', borderTop: '1px solid rgba(99,102,241,0.2)' }}>
                <span className="font-bold text-white">Total Value</span>
                <div className="text-right">
                  <span className="text-sm line-through mr-2" style={{ color: '#64748B' }}>${totalValue}</span>
                  <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#22C55E' }}>${priceNum}</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold tracking-wider uppercase mb-3" style={{ color: '#F59E0B' }}>Social Proof</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>What People Are Saying</h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 100}>
                <div
                  className="rounded-xl p-6 border h-full"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#CBD5E1' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: '#fff' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-xs" style={{ color: '#64748B' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Form */}
      <section id="checkout" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-3 rounded-3xl opacity-30 blur-2xl" style={{ background: 'linear-gradient(135deg, #6366F1, #22C55E)' }} />
              <div className="relative rounded-2xl p-8 border" style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Get Your Skills Bundle</h2>
                  <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>Instant download after purchase</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="offer-name" className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>Name</label>
                    <input
                      id="offer-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '48px' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="offer-email" className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                    <input
                      id="offer-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-white text-sm transition-all duration-200 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '48px' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      placeholder="you@email.com"
                    />
                  </div>

                  {/* Bump Upsell */}
                  <div
                    className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                    style={{
                      border: bumpSolo ? '2px solid #22C55E' : '2px solid rgba(255,255,255,0.08)',
                      background: bumpSolo ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                    }}
                    onClick={() => setBumpSolo(!bumpSolo)}
                    role="checkbox"
                    aria-checked={bumpSolo}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setBumpSolo(!bumpSolo); } }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                        style={{
                          background: bumpSolo ? '#22C55E' : 'transparent',
                          border: bumpSolo ? '2px solid #22C55E' : '2px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {bumpSolo && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm leading-snug">
                          YES! Add Cloud VPS + GoHighLevel CRM
                          <span className="ml-1.5 font-bold" style={{ color: '#22C55E' }}>$17/mo</span>
                        </p>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#94A3B8' }}>
                          Your own cloud Linux desktop, run AI agents 24/7, plus a full CRM to manage leads and automate marketing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full font-bold py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-base cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      color: '#fff',
                      boxShadow: '0 0 30px rgba(99,102,241,0.25)',
                      minHeight: '52px',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Processing...
                      </span>
                    ) : (
                      `Get Instant Access — $${priceNum}`
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 pt-1 text-xs" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit SSL</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 30-day guarantee</span>
                  </div>
                </form>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-2xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold tracking-wider uppercase mb-3" style={{ color: '#818CF8' }}>FAQ</p>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Common Questions</h2>
            </div>
          </AnimatedSection>

          <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
            {FAQ_ITEMS.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 60}>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
                >
                  <button
                    className="w-full text-left px-6 py-4 flex justify-between items-center transition-colors duration-200 cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ minHeight: '52px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-medium text-white text-sm pr-4" itemProp="name">{faq.q}</span>
                    <ChevronDown
                      className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                      style={{ color: '#64748B', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '200px' : '0', opacity: openFaq === i ? 1 : 0 }}
                  >
                    <div className="px-6 pb-4" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }} itemProp="text">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="relative z-10 py-16 px-4 sm:px-6 text-center">
        <AnimatedSection>
          <div className="max-w-md mx-auto rounded-2xl p-8 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(34,197,94,0.15)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <Shield className="w-7 h-7" style={{ color: '#22C55E' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>30-Day Money-Back Guarantee</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Not satisfied? Get a full refund within 30 days. No questions asked. Zero risk.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-4 sm:px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <AnimatedSection>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ready to Supercharge Your Workflow?</h2>
          <p className="mb-8 max-w-md mx-auto" style={{ color: '#94A3B8' }}>
            Join hundreds of professionals using AI skills to save hours every day.
          </p>
          <a
            href="#checkout"
            className="inline-flex items-center gap-2 text-lg font-bold px-10 py-4 rounded-xl transition-all duration-200 hover:scale-[1.03] cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', boxShadow: '0 0 40px rgba(99,102,241,0.25)' }}
          >
            Get Instant Access — ${priceNum} <ArrowRight className="w-5 h-5" />
          </a>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569' }}>
        <p>&copy; {new Date().getFullYear()} CloudCode. All rights reserved.</p>
      </footer>
    </div>
  );
}
