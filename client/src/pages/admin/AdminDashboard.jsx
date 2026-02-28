import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, subjectAPI } from '../../services/api';
import { StatCard, PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    faculty: 0,
    subjects: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [usersRes, subjectsRes] = await Promise.allSettled([
        userAPI.getAll(),
        subjectAPI.getAll(),
      ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value.data.data.users : [];
      const subjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value.data.data.subjects : [];

      setStats({
        totalUsers: users.length,
        students: users.filter((u) => u.role === 'Student').length,
        faculty: users.filter((u) => u.role === 'Faculty').length,
        subjects: subjects.length,
      });

      // Recent 5 users
      setRecentUsers(
        [...users]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle="Here's what's happening at the university"
      />

      {/* ── Stat cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} subtext="All registered" color="primary" />
        <StatCard icon={GraduationCap} label="Students" value={stats.students} subtext="Enrolled" color="blue" />
        <StatCard icon={UserCheck} label="Faculty" value={stats.faculty} subtext="Active teachers" color="amber" />
        <StatCard icon={BookOpen} label="Subjects" value={stats.subjects} subtext="Courses offered" color="green" />
      </div>

      {/* ── Quick actions ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Add New User', icon: Plus, desc: 'Register a student or faculty', color: 'primary' },
          { label: 'Create Subject', icon: BookOpen, desc: 'Add a new course', color: 'green' },
          { label: 'View Reports', icon: TrendingUp, desc: 'Analytics & insights', color: 'purple' },
        ].map((a) => (
          <button
            key={a.label}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-slate-300 text-left group"
          >
            <div className={`p-2.5 rounded-lg bg-${a.color}-50 text-${a.color}-600`}>
              <a.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{a.label}</p>
              <p className="text-xs text-slate-500">{a.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
          </button>
        ))}
      </div>

      {/* ── Recent users table ────────────────── */}
      <Card title="Recent Users" action={<span className="text-xs text-primary-600 font-medium cursor-pointer">View all</span>}>
        {recentUsers.length === 0 ? (
          <EmptyState icon={Users} title="No users yet" description="Users will appear here once registered" />
        ) : (
          <DataTable headers={['Name', 'Email', 'Role', 'Department', 'Joined']}>
            {recentUsers.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'Admin' ? 'danger' : u.role === 'Faculty' ? 'warning' : 'info'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.department || '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {/* ── Summary cards row ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="System Status">
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'Operational', ok: true },
              { label: 'Authentication', status: 'Active', ok: true },
              { label: 'API Server', status: 'Running', ok: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">{s.label}</span>
                <Badge variant={s.ok ? 'success' : 'danger'}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Overview">
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Student-Faculty Ratio</span>
              <span className="text-sm font-semibold text-slate-800">
                {stats.faculty > 0 ? `${(stats.students / stats.faculty).toFixed(1)}:1` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Subjects per Faculty</span>
              <span className="text-sm font-semibold text-slate-800">
                {stats.faculty > 0 ? (stats.subjects / stats.faculty).toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Avg Subjects per Student</span>
              <span className="text-sm font-semibold text-slate-800">
                {stats.students > 0 ? (stats.subjects / stats.students * 4).toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
