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
const Console = lazy(() => import('./pages/Console'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminOrgs = lazy(() => import('./pages/admin/Orgs'));
const AdminVMs = lazy(() => import('./pages/admin/VMs'));
const AdminProxmox = lazy(() => import('./pages/admin/Proxmox'));
const AdminBilling = lazy(() => import('./pages/admin/Billing'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const Blog = lazy(() => import('./pages/blog/Blog'));
const BlogIndex = lazy(() => import('./pages/blog/BlogIndex'));
const BlogPost = lazy(() => import('./pages/blog/BlogPost'));

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

function DashboardLayout({ children }) {
  const { user, logout, api } = useAuth();
  const location = useLocation();
  const [org, setOrg] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  const navItems = [
    { path: '/dashboard', label: 'My Servers' },
    { path: '/dashboard/server', label: 'Server' },
    { path: '/dashboard/terminal', label: 'Terminal' },
    // Only show New Environment for SOLO plans, or TEAM/ARMY owners (but they share one VM)
    ...(hasSubscription && !isSharedPlan ? [{ path: '/dashboard/new', label: 'New Environment' }] : []),
    // Only show Team for TEAM/ARMY plans
    ...(isSharedPlan ? [{ path: '/dashboard/team', label: 'Team' }] : []),
    { path: '/dashboard/billing', label: 'Billing' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-brand-700">Cloud Computer</h1>
              <nav className="hidden md:flex gap-1">
                {navItems.map(item => (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="hidden md:block text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{user?.name}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/claude" element={<BlogIndex />} />
          <Route path="/blog/claude/:skillSlug" element={<BlogPost />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardIndex /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/new" element={<ProtectedRoute><DashboardLayout><DashboardNew /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute><DashboardLayout><Team /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/server" element={<ProtectedRoute><DashboardLayout><Server /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/terminal" element={<ProtectedRoute><DashboardLayout><DashboardTerminal /></DashboardLayout></ProtectedRoute>} />
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
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
