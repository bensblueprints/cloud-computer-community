import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Cloud, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function MagicLogin() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No token provided");
      return;
    }

    fetch(`/api/auth/magic-login?token=${encodeURIComponent(token)}`, {
      credentials: "include"
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
        } else {
          const data = await res.json();
          setError(data.error || "Invalid or expired link");
          setStatus("error");
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
            <Cloud className="w-7 h-7 text-white" />
          </div>
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Logging you in...</h1>
            <p className="text-slate-400">Verifying your magic link.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">You're logged in!</h1>
            <p className="text-slate-400 mb-6">Redirecting to your dashboard...</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Link expired or invalid</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
              >
                Log In with Password
              </Link>
              <Link
                to="/blog/claude"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                Back to Skills Library
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
