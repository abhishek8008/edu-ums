import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
  Bell,
  UserPlus,
  Link2,
} from 'lucide-react';

/* ── Navigation configs per role ────────────── */
const navByRole = {
  Admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/students', icon: GraduationCap, label: 'Students' },
    { to: '/admin/faculty', icon: UserPlus, label: 'Faculty' },
    { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/admin/assign-subject', icon: Link2, label: 'Assign Subject' },
    { to: '/admin/users', icon: Users, label: 'All Users' },
    { to: '/admin/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/admin/results', icon: BarChart3, label: 'Results' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
  ],
  Faculty: [
    { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/faculty/subjects', icon: BookOpen, label: 'My Subjects' },
    { to: '/faculty/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/faculty/results', icon: BarChart3, label: 'Results' },
    { to: '/faculty/students', icon: GraduationCap, label: 'Students' },
    { to: '/faculty/assignments', icon: Users, label: 'Assignments' },
    { to: '/faculty/notifications', icon: Bell, label: 'Notifications' },
  ],
  Student: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/student/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/student/results', icon: BarChart3, label: 'Results' },
    { to: '/student/assignments', icon: GraduationCap, label: 'Assignments' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/student/profile', icon: Users, label: 'Profile' },
  ],
};

const roleBadge = {
  Admin: 'bg-red-100 text-red-700',
  Faculty: 'bg-amber-100 text-amber-700',
  Student: 'bg-primary-100 text-primary-700',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const links = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen flex bg-surface-dark">
      {/* ── Sidebar ───────────────────────────── */}
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">UMS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Management System</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon className="h-4.5 w-4.5 shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge[user?.role] || ''}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          <div className="flex-1" />

          {/* Notification bell */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
              <ChevronDown className="hidden sm:block h-4 w-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
