import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { PageHeader, Card, Badge, EmptyState } from '../../components/ui/SharedUI';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  Clock,
  GraduationCap,
  Award,
} from 'lucide-react';

export default function StudentSubjects() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await studentAPI.getMyProfile();
        setProfile(res.data.data.student);
      } catch (err) {
        setError('Failed to load subjects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const subjects = profile?.subjects || [];
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subjects"
        subtitle={`Semester ${profile?.semester || '—'} · ${profile?.course || ''}`}
      />

      {/* ── Summary Bar ───────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-50 border border-primary-100">
          <BookOpen className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">{subjects.length} Subjects</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
          <Award className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">{totalCredits} Total Credits</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Semester {profile?.semester}</span>
        </div>
      </div>

      {/* ── Subjects Grid ─────────────────────── */}
      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No subjects enrolled"
            description="Contact your administrator to get enrolled in subjects"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-primary-50">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                </div>
                <span className="font-mono text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {sub.subjectCode}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-slate-900 mb-1">{sub.subjectName}</h3>
              <p className="text-xs text-slate-500 mb-4">{sub.department}</p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Sem {sub.semester}
                </span>
                <span>·</span>
                <span>{sub.credits} Credits</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
