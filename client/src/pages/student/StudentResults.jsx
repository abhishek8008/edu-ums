import { useState, useEffect } from 'react';
import { studentAPI, resultAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  Award,
  TrendingUp,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

const gradeColor = {
  'A+': 'bg-emerald-100 text-emerald-700',
  A: 'bg-emerald-50 text-emerald-600',
  'B+': 'bg-blue-100 text-blue-700',
  B: 'bg-blue-50 text-blue-600',
  'C+': 'bg-amber-100 text-amber-700',
  C: 'bg-amber-50 text-amber-600',
  D: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

export default function StudentResults() {
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await studentAPI.getMyProfile();
      const student = res.data.data.student;
      setProfile(student);
      await loadResults(student._id, '');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (studentId, semester) => {
    try {
      const params = {};
      if (semester) params.semester = semester;
      const res = await resultAPI.getByStudent(studentId, params);
      setResults(res.data.data.results);
      setStats(res.data.data.statistics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSemesterFilter = (sem) => {
    setSelectedSemester(sem);
    if (profile) loadResults(profile._id, sem);
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

  // Build available semesters from current profile
  const maxSem = profile?.semester || 8;
  const semesters = Array.from({ length: maxSem }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <PageHeader title="My Results" subtitle="View your semester-wise academic performance" />

      {/* ── Stats Cards ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-primary-500">SGPA</span>
            <TrendingUp className="h-4 w-4 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-primary-700">{stats?.sgpa || '—'}</p>
          <p className="text-[10px] text-primary-500 mt-1">
            {selectedSemester ? `Semester ${selectedSemester}` : 'Overall'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Percentage</span>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.percentage || 0}%</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Subjects</span>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.totalSubjects || 0}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Marks</span>
            <Award className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats?.totalMarksObtained || 0}
            <span className="text-base font-normal text-slate-400">/{stats?.totalMaxMarks || 0}</span>
          </p>
        </div>
      </div>

      {/* ── Semester Filter ───────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleSemesterFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedSemester === ''
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Semesters
        </button>
        {semesters.map((sem) => (
          <button
            key={sem}
            onClick={() => handleSemesterFilter(String(sem))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSemester === String(sem)
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sem {sem}
          </button>
        ))}
      </div>

      {/* ── Results Table ─────────────────────── */}
      <Card>
        {results.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No results found"
            description={
              selectedSemester
                ? `No results available for Semester ${selectedSemester}`
                : 'Your results will appear here once published'
            }
          />
        ) : (
          <DataTable headers={['#', 'Subject', 'Code', 'Credits', 'Internal (40)', 'External (60)', 'Total', 'Grade']}>
            {results.map((r, idx) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.subject?.subjectName}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {r.subject?.subjectCode}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{r.subject?.credits || 3}</td>
                <td className="px-4 py-3 text-center text-slate-700">{r.internalMarks}</td>
                <td className="px-4 py-3 text-center text-slate-700">{r.externalMarks}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${r.totalMarks >= 33 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {r.totalMarks}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeColor[r.grade] || 'bg-slate-100 text-slate-600'}`}>
                    {r.grade}
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {/* ── SGPA Summary Bar ──────────────────── */}
      {results.length > 0 && stats && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 p-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <GraduationCap className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedSemester ? `Semester ${selectedSemester} Summary` : 'Overall Summary'}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.totalSubjects} subjects · {stats.totalMarksObtained}/{stats.totalMaxMarks} marks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase">Percentage</p>
                <p className="text-lg font-bold text-slate-800">{stats.percentage}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase">SGPA</p>
                <p className="text-lg font-bold text-primary-600">{stats.sgpa}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
