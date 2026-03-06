import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DashboardIndex = lazy(() => import('./pages/dashboard/Index'));
const DashboardNew = lazy(() => import('./pages/dashboard/New'));
const Team = lazy(() => import('./pages/dashboard/Team'));
const Billing = lazy(() => import('./pages/dashboard/Billing'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Console = lazy(() => import('./pages/Console'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminOrgs = lazy(() => import('./pages/admin/Orgs'));
const AdminVMs = lazy(() => import('./pages/admin/VMs'));
const AdminProxmox = lazy(() => import('./pages/admin/Proxmox'));
const AdminBilling = lazy(() => import('./pages/admin/Billing'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

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
  const [hasSubscription, setHasSubscription] = React.useState(false);

  React.useEffect(() => {
    api.get('/org').then(res => {
      const sub = res.data.org?.subscription;
      setHasSubscription(sub && ['active', 'trialing'].includes(sub.status));
    }).catch(() => {});
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'My Environments' },
    ...(hasSubscription ? [{ path: '/dashboard/new', label: 'New Environment' }] : []),
    { path: '/dashboard/team', label: 'Team' },
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
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
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

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardIndex /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/new" element={<ProtectedRoute><DashboardLayout><DashboardNew /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute><DashboardLayout><Team /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
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
