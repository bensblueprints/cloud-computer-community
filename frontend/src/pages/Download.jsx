import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, Server, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!document.querySelector('link[href*="Space+Grotesk"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    fetch(`${API}/api/offers/purchase/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else { setPurchase(data); setShowConfetti(true); }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load purchase');
        setLoading(false);
      });
  }, [sessionId]);

  // Hide confetti after a few seconds
  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070B14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#64748B' }}>Loading your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-100" style={{ background: '#070B14' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg className="w-7 h-7" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-sm mb-4" style={{ color: '#EF4444' }}>{error}</p>
          <Link to="/" className="text-sm font-medium hover:underline" style={{ color: '#818CF8' }}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-100 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: '#070B14' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />
      </div>

      {/* Confetti particles */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
          <style>{`
            @keyframes confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
          `}</style>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#818CF8'][i % 5],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${Math.random() * 1.5}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-3 rounded-full opacity-20 blur-xl" style={{ background: '#22C55E' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle className="w-10 h-10" style={{ color: '#22C55E' }} />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Thank You!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
            Your purchase was successful. A confirmation has been sent to{' '}
            <strong className="text-white">{purchase.email}</strong>
          </p>
        </div>

        {/* Download card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-2xl opacity-20 blur-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #22C55E)' }} />
          <div
            className="relative rounded-2xl p-8 text-center border"
            style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#818CF8' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {purchase.productName}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#64748B' }}>
              {purchase.downloadsRemaining} download{purchase.downloadsRemaining !== 1 ? 's' : ''} remaining
            </p>

            {/* Progress bar for downloads */}
            <div className="w-full max-w-xs mx-auto mb-6">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(purchase.downloadsRemaining / 5) * 100}%`,
                    background: 'linear-gradient(90deg, #6366F1, #22C55E)',
                  }}
                />
              </div>
            </div>

            <a
              href={`${API}/api/offers/download/${purchase.downloadToken}`}
              className="inline-flex items-center gap-2 font-bold py-3.5 px-8 rounded-xl transition-all duration-200 hover:scale-[1.03] cursor-pointer text-base"
              style={{
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(34,197,94,0.25)',
              }}
            >
              <Download className="w-5 h-5" />
              Download Now
            </a>
          </div>
        </div>

        {/* VPS bump card */}
        {purchase.bumpAdded && (
          <div
            className="rounded-2xl p-8 text-center border mb-6"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(99,102,241,0.15)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Server className="w-6 h-6" style={{ color: '#818CF8' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your Cloud VPS is Being Set Up
            </h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#94A3B8' }}>
              Your SOLO plan VPS is being provisioned. Check your email for setup instructions and credentials.
            </p>

            {/* Steps */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {['Provisioning', 'Configuring', 'Ready'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      color: i === 0 ? '#818CF8' : '#475569',
                      border: i === 0 ? '2px solid #6366F1' : '2px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs" style={{ color: i === 0 ? '#818CF8' : '#475569' }}>{step}</span>
                  {i < 2 && <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />}
                </div>
              ))}
            </div>

            <Link
              to="/setup-password"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200 cursor-pointer"
              style={{ color: '#818CF8' }}
            >
              Set Up Your Password <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-10">
          <Link
            to="/"
            className="text-sm transition-colors duration-200 cursor-pointer"
            style={{ color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
