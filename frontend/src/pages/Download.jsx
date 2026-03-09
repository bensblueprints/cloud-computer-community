import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, Server, ExternalLink } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        else setPurchase(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load purchase');
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-gray-100">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/" className="text-cyan-400 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
          <p className="text-gray-400">Your purchase was successful. A confirmation email has been sent to <strong className="text-white">{purchase.email}</strong>.</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">{purchase.productName}</h2>
          <p className="text-gray-400 text-sm mb-6">Downloads remaining: {purchase.downloadsRemaining}</p>
          <a
            href={`${API}/api/offers/download/${purchase.downloadToken}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25"
          >
            <Download className="w-5 h-5" />
            Download Now
          </a>
        </div>

        {purchase.bumpAdded && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Cloud VPS is Being Set Up!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Your SOLO plan VPS is being provisioned. Check your email for setup instructions.
            </p>
            <Link
              to="/setup-password"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium text-sm"
            >
              Set Up Your Password <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
