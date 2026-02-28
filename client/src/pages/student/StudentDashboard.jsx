import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard, PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  BookOpen,
  ClipboardList,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Award,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Simulated data — in production these come from API
  const stats = {
    subjects: 6,
    attendance: 87.5,
    cgpa: 8.42,
    semester: 5,
  };

  const subjects = [
    { id: 1, name: 'Data Structures', code: 'CS301', faculty: 'Dr. Kumar', credits: 4, attendance: 92, grade: 'A' },
    { id: 2, name: 'Algorithms', code: 'CS302', faculty: 'Prof. Sharma', credits: 4, attendance: 85, grade: 'B+' },
    { id: 3, name: 'Database Systems', code: 'CS401', faculty: 'Dr. Patel', credits: 3, attendance: 90, grade: 'A' },
    { id: 4, name: 'Operating Systems', code: 'CS303', faculty: 'Prof. Singh', credits: 4, attendance: 78, grade: 'B' },
    { id: 5, name: 'Computer Networks', code: 'CS304', faculty: 'Dr. Gupta', credits: 3, attendance: 95, grade: 'A+' },
    { id: 6, name: 'Software Engg.', code: 'CS402', faculty: 'Prof. Mehta', credits: 3, attendance: 88, grade: 'A' },
  ];

  const upcomingClasses = [
    { id: 1, subject: 'Algorithms', time: '11:00 AM', room: 'LH-105' },
    { id: 2, subject: 'Database Systems', time: '02:00 PM', room: 'LH-301' },
    { id: 3, subject: 'Operating Systems', time: '04:00 PM', room: 'LH-201' },
  ];

  const gradeColor = (grade) => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name}`}
        subtitle={`Semester ${stats.semester} · ${user?.department || 'Computer Science'}`}
      />

      {/* ── Stats ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Subjects" value={stats.subjects} subtext="This semester" color="primary" />
        <StatCard
          icon={ClipboardList}
          label="Attendance"
          value={`${stats.attendance}%`}
          subtext={stats.attendance >= 75 ? 'Good standing' : 'Below minimum'}
          color={stats.attendance >= 75 ? 'green' : 'red'}
        />
        <StatCard icon={Award} label="CGPA" value={stats.cgpa} subtext="Cumulative" color="purple" />
        <StatCard icon={CalendarDays} label="Semester" value={stats.semester} subtext="Current" color="amber" />
      </div>

      {/* ── Main grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <Card title="Today's Classes">
          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{cls.subject}</p>
                  <p className="text-xs text-slate-500">{cls.time} · Room {cls.room}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attendance Overview */}
        <div className="lg:col-span-2">
          <Card title="Attendance Overview">
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-40 truncate" title={sub.name}>{sub.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.attendance >= 85 ? 'bg-emerald-500' : sub.attendance >= 75 ? 'bg-amber-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${sub.attendance}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-10 text-right ${
                    sub.attendance >= 85 ? 'text-emerald-600' : sub.attendance >= 75 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {sub.attendance}%
                  </span>
                </div>
              ))}
            </div>

            {/* Attendance warning */}
            {subjects.some((s) => s.attendance < 75) && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">
                  <span className="font-medium">Low attendance alert:</span> Some subjects are below 75%. You may be debarred from exams.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Subjects & Results Table ──────────── */}
      <Card title="Subjects & Grades">
        <DataTable headers={['Code', 'Subject', 'Faculty', 'Credits', 'Attendance', 'Grade']}>
          {subjects.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {sub.code}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{sub.name}</td>
              <td className="px-4 py-3 text-slate-500">{sub.faculty}</td>
              <td className="px-4 py-3 text-center text-slate-600">{sub.credits}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sub.attendance >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${sub.attendance}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{sub.attendance}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={gradeColor(sub.grade)}>{sub.grade}</Badge>
              </td>
            </tr>
          ))}
        </DataTable>

        {/* Summary row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">Total Credits: <span className="font-semibold text-slate-800">{subjects.reduce((a, s) => a + s.credits, 0)}</span></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">CGPA: <span className="font-semibold text-slate-800">{stats.cgpa}</span></span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">+0.15 from last semester</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
