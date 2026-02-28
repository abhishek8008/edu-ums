import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facultyAPI } from '../../services/api';
import { PageHeader, Card, Badge, EmptyState } from '../../components/ui/SharedUI';
import { BookOpen, Loader2, Users, Clock, ChevronRight } from 'lucide-react';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await facultyAPI.getMySubjects();
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Subjects" subtitle={`${subjects.length} subjects assigned to you`} />

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No subjects assigned"
            description="Contact the administrator to get subjects assigned to you"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all group"
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

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Sem {sub.semester}
                </span>
                <span>·</span>
                <span>{sub.credits} Credits</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/faculty/attendance?subject=${sub._id}&name=${encodeURIComponent(sub.subjectName)}&code=${sub.subjectCode}`)}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate(`/faculty/results?subject=${sub._id}&name=${encodeURIComponent(sub.subjectName)}&code=${sub.subjectCode}`)}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  Marks
                </button>
                <button
                  onClick={() => navigate(`/faculty/students?subject=${sub._id}&name=${encodeURIComponent(sub.subjectName)}&code=${sub.subjectCode}`)}
                  className="flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                >
                  Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
