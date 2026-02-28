import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { PageHeader, Card, Badge } from '../../components/ui/SharedUI';
import {
  Loader2,
  AlertCircle,
  User,
  Mail,
  BookOpen,
  GraduationCap,
  Building2,
  Hash,
  Phone,
  Shield,
  BarChart3,
  ClipboardList,
} from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await studentAPI.getMyProfile();
        setProfile(res.data.data.student);
      } catch (err) {
        setError('Failed to load profile');
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

  const u = profile?.user;
  const subjects = profile?.subjects || [];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your personal and academic information" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Avatar + Identity Card ─────── */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center py-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold mb-4 ring-4 ring-primary-50">
                {u?.name?.charAt(0)?.toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{u?.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" /> {u?.email}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  <GraduationCap className="h-3 w-3" /> Student
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <BookOpen className="h-4 w-4" /> Subjects
                </span>
                <span className="text-sm font-semibold text-slate-800">{subjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <ClipboardList className="h-4 w-4" /> Attendance
                </span>
                <span className={`text-sm font-semibold ${(profile?.attendance || 0) >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {profile?.attendance || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <BarChart3 className="h-4 w-4" /> CGPA
                </span>
                <span className="text-sm font-semibold text-primary-600">{profile?.cgpa?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: Details ──────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Info */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary-500" /> Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { icon: Hash, label: 'Enrollment No.', value: profile?.enrollmentNumber },
                { icon: BookOpen, label: 'Course', value: profile?.course },
                { icon: BarChart3, label: 'Semester', value: profile?.semester },
                { icon: Building2, label: 'Department', value: u?.department || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Guardian Info */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" /> Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Guardian Name</p>
                  <p className="text-sm font-medium text-slate-800">
                    {profile?.guardianDetails?.name || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Guardian Phone</p>
                  <p className="text-sm font-medium text-slate-800">
                    {profile?.guardianDetails?.phone || '—'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Enrolled Subjects */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Enrolled Subjects ({subjects.length})
            </h3>
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No subjects enrolled yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <div key={sub._id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {sub.subjectCode}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{sub.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Sem {sub.semester}</span>
                      <span>·</span>
                      <span>{sub.credits} Cr</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
