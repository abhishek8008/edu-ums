import { useState, useEffect } from 'react';
import { studentAPI, attendanceAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';

export default function StudentAttendance() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await studentAPI.getMyProfile();
      const student = res.data.data.student;
      setProfile(student);
      await loadAttendance(student._id, '');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (studentId, subjectId) => {
    try {
      const params = {};
      if (subjectId) params.subject = subjectId;
      const res = await attendanceAPI.getByStudent(studentId, params);
      setAttendance(res.data.data.attendance);
      setStats(res.data.data.statistics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectFilter = (subjectId) => {
    setSelectedSubject(subjectId);
    if (profile) loadAttendance(profile._id, subjectId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-red-600 p-4">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      </Card>
    );
  }

  const percentage = stats?.percentage || 0;
  const isLow = percentage < 75;

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" subtitle="Track your attendance across all subjects" />

      {/* ── Stats Cards ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall percentage */}
        <div className={`rounded-xl border p-4 ${isLow ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium uppercase tracking-wide ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>
              Percentage
            </span>
            {isLow ? <TrendingDown className="h-4 w-4 text-red-400" /> : <TrendingUp className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className={`text-2xl font-bold ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
            {percentage}%
          </p>
          {isLow && <p className="text-[10px] text-red-500 mt-1">Below 75% minimum</p>}
        </div>

        {/* Total classes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</span>
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.totalClasses || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Classes held</p>
        </div>

        {/* Present */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-500">Present</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats?.present || 0}</p>
        </div>

        {/* Absent */}
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-red-500">Absent</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-700">{stats?.absent || 0}</p>
        </div>
      </div>

      {/* ── Progress Bar ──────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Attendance Progress</span>
          <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
            {percentage}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">0%</span>
          <span className="text-[10px] text-slate-400 ml-[73%]">75% min</span>
          <span className="text-[10px] text-slate-400">100%</span>
        </div>
      </Card>

      {/* ── Filter + Table ────────────────────── */}
      <div className="flex items-end gap-4">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectFilter(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Subjects</option>
            {profile?.subjects?.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.subjectCode} — {sub.subjectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        {attendance.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No attendance records"
            description="Your attendance records will appear here once marked"
          />
        ) : (
          <DataTable headers={['#', 'Date', 'Subject', 'Status']}>
            {attendance.map((rec, idx) => (
              <tr key={rec._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {new Date(rec.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-slate-800 text-sm">{rec.subject?.subjectName}</span>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">{rec.subject?.subjectCode}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={rec.status === 'Present' ? 'success' : 'danger'}>{rec.status}</Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </div>
  );
}
