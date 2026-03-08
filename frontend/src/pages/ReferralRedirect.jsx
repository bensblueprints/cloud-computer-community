import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function ReferralRedirect() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dest = searchParams.get('to') || '/register';

  useEffect(() => {
    // Store referral code in localStorage
    try { localStorage.setItem('cc-ref', code); } catch {}

    // Track the click
    fetch('/api/referrals/track/' + encodeURIComponent(code), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dest })
    }).catch(() => {});

    // Redirect to destination with ref param
    const separator = dest.includes('?') ? '&' : '?';
    const target = dest + separator + 'ref=' + encodeURIComponent(code);
    navigate(target, { replace: true });
  }, [code, dest, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
    </div>
  );
}
