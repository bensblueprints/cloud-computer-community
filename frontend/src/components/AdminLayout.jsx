import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Server, Activity, CreditCard, Settings, LogOut } from 'lucide-react';

const navItems = [
  { path: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/orgs', label: 'Organizations', icon: Building2 },
  { path: '/admin/vms', label: 'Virtual Machines', icon: Server },
  { path: '/admin/proxmox', label: 'Proxmox', icon: Activity },
  { path: '/admin/billing', label: 'Billing', icon: CreditCard },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">Cloud Computer</h1>
          <p className="text-xs text-purple-400 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                location.pathname === item.path
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => { document.cookie = 'token=; Max-Age=0'; navigate('/admin/login'); }}
            className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white text-sm w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
