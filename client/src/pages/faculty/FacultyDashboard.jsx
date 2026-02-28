import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard, PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Simulated data — in production these come from API
  const stats = {
    subjects: 4,
    totalStudents: 120,
    classesToday: 3,
    avgAttendance: 82.5,
  };

  const todaySchedule = [
    { id: 1, subject: 'Data Structures', code: 'CS301', time: '09:00 - 10:00', room: 'LH-201', students: 35, status: 'Completed' },
    { id: 2, subject: 'Algorithms', code: 'CS302', time: '11:00 - 12:00', room: 'LH-105', students: 30, status: 'In Progress' },
    { id: 3, subject: 'Database Systems', code: 'CS401', time: '14:00 - 15:00', room: 'LH-301', students: 28, status: 'Upcoming' },
  ];

  const recentAttendance = [
    { id: 1, subject: 'Data Structures', date: '2026-02-27', present: 32, absent: 3, percentage: 91.4 },
    { id: 2, subject: 'Algorithms', date: '2026-02-26', present: 25, absent: 5, percentage: 83.3 },
    { id: 3, subject: 'Database Systems', date: '2026-02-26', present: 26, absent: 2, percentage: 92.9 },
    { id: 4, subject: 'Data Structures', date: '2026-02-25', present: 30, absent: 5, percentage: 85.7 },
  ];

  const statusColor = {
    'Completed': 'success',
    'In Progress': 'warning',
    'Upcoming': 'info',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle="Your teaching overview for today"
      />

      {/* ── Stats ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Subjects" value={stats.subjects} subtext="This semester" color="primary" />
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} subtext="Across all subjects" color="blue" />
        <StatCard icon={CalendarDays} label="Classes Today" value={stats.classesToday} subtext={new Date().toLocaleDateString()} color="amber" />
        <StatCard icon={TrendingUp} label="Avg Attendance" value={`${stats.avgAttendance}%`} subtext="Last 30 days" color="green" />
      </div>

      {/* ── Today's Schedule ──────────────────── */}
      <Card title="Today's Schedule" action={<span className="text-xs text-slate-400">{new Date().toDateString()}</span>}>
        <div className="space-y-3">
          {todaySchedule.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                {cls.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{cls.subject}</p>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {cls.time} &nbsp;·&nbsp; Room {cls.room} &nbsp;·&nbsp; {cls.students} students
                </p>
              </div>
              <Badge variant={statusColor[cls.status]}>{cls.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Quick Actions + Attendance ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Actions */}
        <Card title="Quick Actions">
          <div className="space-y-2">
            {[
              { icon: ClipboardList, label: 'Mark Attendance', desc: 'For current class' },
              { icon: BarChart3, label: 'Upload Marks', desc: 'Enter student results' },
              { icon: Users, label: 'Student List', desc: 'View enrolled students' },
            ].map((a) => (
              <button
                key={a.label}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left"
              >
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.label}</p>
                  <p className="text-xs text-slate-500">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Attendance */}
        <div className="lg:col-span-2">
          <Card title="Recent Attendance Records">
            <DataTable headers={['Subject', 'Date', 'Present', 'Absent', 'Percentage']}>
              {recentAttendance.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.subject}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-600 font-medium">{r.present}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-red-500 font-medium">{r.absent}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${r.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-10 text-right">{r.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
}
