import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Registration requires payment - redirect to pricing
export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to homepage pricing section
    window.location.href = '/#pricing';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to pricing...</p>
      </div>
    </div>
  );
}
