import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { facultyAPI, studentAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { Users, Loader2, Search, BookOpen, Eye, Mail } from 'lucide-react';

export default function StudentList() {
  const [searchParams] = useSearchParams();
  const preSubjectId = searchParams.get('subject');
  const preSubjectName = searchParams.get('name');
  const preSubjectCode = searchParams.get('code');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(preSubjectId || '');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await facultyAPI.getMySubjects();
        setSubjects(res.data.data.subjects);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setStudents([]);
      return;
    }
    (async () => {
      setStudentsLoading(true);
      try {
        const res = await studentAPI.getBySubject(selectedSubject);
        setStudents(res.data.data.students);
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [selectedSubject]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.enrollmentNumber?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  const currentSubject = subjects.find((s) => s._id === selectedSubject);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student List" subtitle="View students enrolled in your subjects" />

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-72">
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

        {selectedSubject && students.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
        )}
      </div>

      {/* Subject info banner */}
      {currentSubject && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
          <BookOpen className="h-5 w-5 text-primary-600" />
          <div>
            <span className="text-sm font-semibold text-primary-800">{currentSubject.subjectName}</span>
            <span className="text-xs text-primary-600 ml-2">{currentSubject.subjectCode} · Sem {currentSubject.semester}</span>
          </div>
          <div className="ml-auto">
            <Badge variant="info">{students.length} students</Badge>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        {!selectedSubject ? (
          <EmptyState icon={Users} title="Select a subject" description="Choose a subject to view enrolled students" />
        ) : studentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No matching students' : 'No students enrolled'}
            description={search ? 'Try a different search term' : 'No students are enrolled in this subject yet'}
          />
        ) : (
          <DataTable headers={['#', 'Enrollment', 'Name', 'Email', 'Course', 'Semester', 'CGPA', 'Actions']}>
            {filtered.map((s, idx) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {s.enrollmentNumber}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.user?.name}</td>
                <td className="px-4 py-3 text-slate-500 text-sm">{s.user?.email}</td>
                <td className="px-4 py-3 text-slate-700">{s.course}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="info">Sem {s.semester}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold text-sm ${s.cgpa >= 7 ? 'text-emerald-600' : s.cgpa >= 5 ? 'text-amber-600' : 'text-red-500'}`}>
                    {s.cgpa?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setViewStudent(s)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {/* ── View Student Modal ─────────────────── */}
      <Modal
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Details"
        size="sm"
        footer={
          <button onClick={() => setViewStudent(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            Close
          </button>
        }
      >
        {viewStudent && (
          <div className="space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
                {viewStudent.user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{viewStudent.user?.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {viewStudent.user?.email}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Enrollment No.', value: viewStudent.enrollmentNumber },
                { label: 'Course', value: viewStudent.course },
                { label: 'Semester', value: viewStudent.semester },
                { label: 'Department', value: viewStudent.user?.department || '—' },
                { label: 'CGPA', value: viewStudent.cgpa?.toFixed(2) || '0.00' },
                { label: 'Attendance', value: `${viewStudent.attendance || 0}%` },
                { label: 'Guardian', value: viewStudent.guardianDetails?.name || '—' },
                { label: 'Guardian Phone', value: viewStudent.guardianDetails?.phone || '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2.5">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className="text-sm font-medium text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
