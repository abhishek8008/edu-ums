import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { facultyAPI, studentAPI, attendanceAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Users,
} from 'lucide-react';

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const preSubjectId = searchParams.get('subject');
  const preSubjectName = searchParams.get('name');
  const preSubjectCode = searchParams.get('code');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(preSubjectId || '');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [facultyId, setFacultyId] = useState(null);

  // Load faculty's subjects
  useEffect(() => {
    (async () => {
      try {
        const res = await facultyAPI.getMySubjects();
        setSubjects(res.data.data.subjects);
        setFacultyId(res.data.data.facultyId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load students when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setStudents([]);
      return;
    }
    (async () => {
      setStudentsLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await studentAPI.getBySubject(selectedSubject);
        const studs = res.data.data.students;
        setStudents(studs);
        // Default all to Present
        const init = {};
        studs.forEach((s) => { init[s._id] = 'Present'; });
        setAttendance(init);
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [selectedSubject]);

  const toggleStatus = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const attendanceRecords = Object.entries(attendance).map(([student, status]) => ({
        student,
        status,
      }));

      await attendanceAPI.markBulk({
        subject: selectedSubject,
        date,
        attendanceRecords,
      });

      setSuccess(`Attendance marked for ${attendanceRecords.length} students!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v === 'Present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'Absent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mark Attendance" subtitle="Select a subject and mark student attendance" />

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Subject select */}
        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.subjectCode} — {s.subjectName}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="w-full sm:w-44">
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Quick actions */}
        {students.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => markAll('Present')}
              className="px-3 py-2.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('Absent')}
              className="px-3 py-2.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
            >
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {/* Student list */}
      <Card>
        {!selectedSubject ? (
          <EmptyState icon={ClipboardList} title="Select a subject" description="Choose a subject to view the student list" />
        ) : studentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No students enrolled" description="No students are enrolled in this subject yet" />
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-sm text-slate-600">
                Total: <span className="font-semibold text-slate-800">{students.length}</span>
              </span>
              <span className="text-sm text-emerald-600">
                Present: <span className="font-semibold">{presentCount}</span>
              </span>
              <span className="text-sm text-red-500">
                Absent: <span className="font-semibold">{absentCount}</span>
              </span>
              <div className="flex-1" />
              <span className="text-xs text-slate-400">{date}</span>
            </div>

            <DataTable headers={['#', 'Enrollment', 'Name', 'Status', 'Toggle']}>
              {students.map((s, idx) => {
                const status = attendance[s._id] || 'Present';
                return (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {s.enrollmentNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.user?.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={status === 'Present' ? 'success' : 'danger'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(s._id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          status === 'Present' ? 'bg-emerald-500' : 'bg-red-400'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            status === 'Present' ? 'left-6' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </DataTable>

            {/* Submit */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 shadow-sm"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Attendance
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
