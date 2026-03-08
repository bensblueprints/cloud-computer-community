import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const DashboardIndex = lazy(() => import('./pages/dashboard/Index'));
const DashboardNew = lazy(() => import('./pages/dashboard/New'));
const Team = lazy(() => import('./pages/dashboard/Team'));
const Billing = lazy(() => import('./pages/dashboard/Billing'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Server = lazy(() => import('./pages/dashboard/Server'));
const DashboardTerminal = lazy(() => import('./pages/dashboard/Terminal'));
const Referrals = lazy(() => import('./pages/dashboard/Referrals'));
const Console = lazy(() => import('./pages/Console'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminOrgs = lazy(() => import('./pages/admin/Orgs'));
const AdminVMs = lazy(() => import('./pages/admin/VMs'));
const AdminProxmox = lazy(() => import('./pages/admin/Proxmox'));
const AdminBilling = lazy(() => import('./pages/admin/Billing'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const About = lazy(() => import('./pages/About'));
const GoHighLevel = lazy(() => import('./pages/GoHighLevel'));
const DashboardCRM = lazy(() => import('./pages/dashboard/CRM'));
const MagicLogin = lazy(() => import('./pages/MagicLogin'));
const Blog = lazy(() => import('./pages/blog/Blog'));
const BlogIndex = lazy(() => import('./pages/blog/BlogIndex'));
const BlogPost = lazy(() => import('./pages/blog/BlogPost'));
const LandingDevelopers = lazy(() => import('./pages/landing/Developers'));
const LandingSaasSavings = lazy(() => import('./pages/landing/SaasSavings'));
const LandingLightweight = lazy(() => import('./pages/landing/Lightweight'));
const LandingAgencies = lazy(() => import('./pages/landing/Agencies'));
const LandingRemoteWork = lazy(() => import('./pages/landing/RemoteWork'));
const ReferralRedirect = lazy(() => import('./pages/ReferralRedirect'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || user.siteRole !== 'ADMIN') return <Navigate to="/admin/login" replace />;
  return <div className="dark">{children}</div>;
}

const MatrixBackground = lazy(() => import('./components/MatrixBackground'));
const LofiCoder = lazy(() => import('./components/LofiCoder'));

const THEME_OPTIONS = [
  { id: 'off', label: 'Off', desc: 'Clean default look', preview: 'bg-gray-100', icon: null },
  { id: 'classic', label: 'Classic Matrix', desc: 'Green rain + lofi coder', preview: 'bg-green-900', icon: '</>' },
  { id: 'neon', label: 'Neon Purple', desc: 'Purple rain + lofi coder', preview: 'bg-purple-900', icon: '</>' },
  { id: 'pink', label: 'Pink Vibes', desc: 'Pink rain + lofi coder', preview: 'bg-pink-900', icon: '</>' },
];

function ThemePickerDropdown({ matrixTheme, setMatrixTheme }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-lg transition ${
          matrixTheme !== 'off'
            ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title="Background theme"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden" style={{ zIndex: 9999 }}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Background Theme</p>
            <p className="text-xs text-gray-500">Choose your vibe</p>
          </div>
          <div className="p-2 space-y-1">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setMatrixTheme(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                  matrixTheme === opt.id
                    ? 'bg-purple-50 border border-purple-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${opt.preview} ${
                  opt.id === 'classic' ? 'shadow-[inset_0_0_12px_rgba(0,255,65,0.4)]' :
                  opt.id === 'neon' ? 'shadow-[inset_0_0_12px_rgba(200,0,255,0.4)]' :
                  opt.id === 'pink' ? 'shadow-[inset_0_0_12px_rgba(255,105,180,0.4)]' : ''
                }`}>
                  {opt.icon && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`text-xs font-mono ${
                        opt.id === 'classic' ? 'text-green-400' :
                        opt.id === 'neon' ? 'text-purple-400' :
                        'text-pink-400'
                      }`}>
                        {opt.icon}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
                {matrixTheme === opt.id && (
                  <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardLayout({ children }) {
  const { user, logout, api } = useAuth();
  const location = useLocation();
  const [org, setOrg] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [matrixTheme, setMatrixTheme] = React.useState(() => {
    try { return localStorage.getItem('cc-matrix-theme') || 'off'; } catch { return 'off'; }
  });

  React.useEffect(() => {
    try { localStorage.setItem('cc-matrix-theme', matrixTheme); } catch {}
  }, [matrixTheme]);

  React.useEffect(() => {
    api.get('/org').then(res => {
      setOrg(res.data.org);
    }).catch(() => {});
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const hasSubscription = org?.subscription && ['active', 'trialing'].includes(org.subscription.status);
  const plan = org?.plan || 'SOLO';
  const isSharedPlan = plan === 'TEAM' || plan === 'ARMY';
  const isOwner = user?.orgRole === 'OWNER';

  const isMatrix = matrixTheme !== 'off';
  const themeColors = {
    classic: { bg: 'bg-[#0a0a0a]', header: 'bg-[#0d0d0d]/90 border-green-900/50', title: 'text-green-400', nav: 'bg-green-900/40 text-green-300', lofi: 'green' },
    neon: { bg: 'bg-[#0a0010]', header: 'bg-[#12001a]/90 border-purple-900/50', title: 'text-purple-400', nav: 'bg-purple-900/40 text-purple-300', lofi: 'purple' },
    pink: { bg: 'bg-[#1a0510]', header: 'bg-[#1a0810]/90 border-pink-900/50', title: 'text-pink-400', nav: 'bg-pink-900/40 text-pink-300', lofi: 'pink' },
  };
  const tc = themeColors[matrixTheme] || {};
  const bgClass = isMatrix ? tc.bg : 'bg-gray-50';
  const headerBg = isMatrix ? tc.header : 'bg-white border-gray-200';
  const headerText = isMatrix ? 'text-gray-200' : 'text-gray-600';
  const headerTitle = isMatrix ? tc.title : 'text-brand-700';
  const activeNavBg = isMatrix ? tc.nav : 'bg-brand-50 text-brand-700';
  const navHover = isMatrix ? 'hover:text-gray-200 hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-50';

  const navItems = [
    { path: '/dashboard', label: 'My Servers' },
    { path: '/dashboard/server', label: 'Server' },
    { path: '/dashboard/terminal', label: 'Terminal' },
    ...(hasSubscription && !isSharedPlan ? [{ path: '/dashboard/new', label: 'New Environment' }] : []),
    ...(isSharedPlan ? [{ path: '/dashboard/team', label: 'Team' }] : []),
    { path: '/dashboard/crm', label: 'CRM' },
    { path: '/dashboard/billing', label: 'Billing' },
    { path: '/dashboard/referrals', label: 'Referrals' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  return (
    <div className={`min-h-screen ${bgClass} relative`}>
      {isMatrix && (
        <Suspense fallback={null}>
          <MatrixBackground theme={matrixTheme} />
          <LofiCoder variant={tc.lofi} />
        </Suspense>
      )}
      <header className={`${headerBg} border-b relative z-50 ${isMatrix ? 'backdrop-blur-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className={`text-xl font-bold ${headerTitle}`}>Cloud Computer</h1>
              <nav className="hidden md:flex gap-1">
                {navItems.map(item => (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? activeNavBg
                        : `${headerText} ${navHover}`
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ThemePickerDropdown matrixTheme={matrixTheme} setMatrixTheme={setMatrixTheme} />
              <span className={`hidden sm:block text-sm ${headerText}`}>{user?.name}</span>
              <button
                onClick={logout}
                className={`hidden md:block text-sm ${isMatrix ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-md ${isMatrix ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${isMatrix ? 'border-white/10 bg-black/80 backdrop-blur-md' : 'border-gray-200 bg-white'}`}>
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? activeNavBg
                      : `${headerText} ${navHover}`
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className={`border-t ${isMatrix ? 'border-white/10' : 'border-gray-200'} px-4 py-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${headerText}`}>{user?.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        {children}
      </main>
    </div>
  );
}

function RefCapture() {
  const [searchParams] = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return [params];
  }, []);
  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      try { localStorage.setItem('cc-ref', ref); } catch {}
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <RefCapture />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          <Route path="/about" element={<About />} />
          <Route path="/magic-login" element={<MagicLogin />} />
          <Route path="/crm" element={<GoHighLevel />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/claude" element={<BlogIndex />} />
          <Route path="/blog/claude/:skillSlug" element={<BlogPost />} />

          <Route path="/for/developers" element={<LandingDevelopers />} />
          <Route path="/for/save" element={<LandingSaasSavings />} />
          <Route path="/for/power" element={<LandingLightweight />} />
          <Route path="/for/agencies" element={<LandingAgencies />} />
          <Route path="/for/remote" element={<LandingRemoteWork />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardIndex /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/new" element={<ProtectedRoute><DashboardLayout><DashboardNew /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute><DashboardLayout><Team /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/server" element={<ProtectedRoute><DashboardLayout><Server /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/terminal" element={<ProtectedRoute><DashboardLayout><DashboardTerminal /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/referrals" element={<ProtectedRoute><DashboardLayout><Referrals /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/crm" element={<ProtectedRoute><DashboardLayout><DashboardCRM /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />

          <Route path="/console/:vmid" element={<ProtectedRoute><Console /></ProtectedRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/orgs" element={<AdminRoute><AdminOrgs /></AdminRoute>} />
          <Route path="/admin/vms" element={<AdminRoute><AdminVMs /></AdminRoute>} />
          <Route path="/admin/proxmox" element={<AdminRoute><AdminProxmox /></AdminRoute>} />
          <Route path="/admin/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          <Route path="/r/:code" element={<ReferralRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
