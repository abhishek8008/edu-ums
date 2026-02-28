import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { facultyAPI, studentAPI, resultAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import {
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Upload,
} from 'lucide-react';

export default function UploadMarks() {
  const [searchParams] = useSearchParams();
  const preSubjectId = searchParams.get('subject');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(preSubjectId || '');
  const [semester, setSemester] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: { internalMarks, externalMarks } }
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load faculty's subjects
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

  // When subject changes, set semester from subject data and load students
  useEffect(() => {
    if (!selectedSubject) {
      setStudents([]);
      return;
    }
    const sub = subjects.find((s) => s._id === selectedSubject);
    if (sub) setSemester(String(sub.semester));

    (async () => {
      setStudentsLoading(true);
      setError('');
      setSuccess('');
      try {
        const res = await studentAPI.getBySubject(selectedSubject);
        const studs = res.data.data.students;
        setStudents(studs);
        // Init marks
        const init = {};
        studs.forEach((s) => {
          init[s._id] = { internalMarks: '', externalMarks: '' };
        });
        setMarks(init);
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [selectedSubject]);

  const updateMark = (studentId, field, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validate — every student must have both marks filled
    const results = [];
    for (const s of students) {
      const m = marks[s._id];
      if (m.internalMarks === '' || m.externalMarks === '') {
        setError('Please enter marks for all students');
        return;
      }
      const internal = Number(m.internalMarks);
      const external = Number(m.externalMarks);
      if (internal < 0 || internal > 40) {
        setError(`Internal marks must be 0–40 for ${s.user?.name}`);
        return;
      }
      if (external < 0 || external > 60) {
        setError(`External marks must be 0–60 for ${s.user?.name}`);
        return;
      }
      results.push({
        student: s._id,
        subject: selectedSubject,
        internalMarks: internal,
        externalMarks: external,
        semester: Number(semester),
      });
    }

    setSubmitting(true);
    try {
      await resultAPI.addBulk({ results });
      setSuccess(`Marks uploaded for ${results.length} students!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload marks');
    } finally {
      setSubmitting(false);
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
      <PageHeader title="Upload Marks" subtitle="Enter internal and external marks for students" />

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
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
        <div className="w-full sm:w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
          <input
            type="number"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            min={1}
            max={12}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
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

      {/* Marks table */}
      <Card>
        {!selectedSubject ? (
          <EmptyState icon={BarChart3} title="Select a subject" description="Choose a subject to enter student marks" />
        ) : studentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No students enrolled" description="No students are enrolled in this subject yet" />
        ) : (
          <>
            {/* Info bar */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <BarChart3 className="h-4 w-4 shrink-0" />
              Internal: 0–40 &nbsp;|&nbsp; External: 0–60 &nbsp;|&nbsp; Total: out of 100
            </div>

            <DataTable headers={['#', 'Enrollment', 'Name', 'Internal (40)', 'External (60)', 'Total']}>
              {students.map((s, idx) => {
                const m = marks[s._id] || { internalMarks: '', externalMarks: '' };
                const total =
                  m.internalMarks !== '' && m.externalMarks !== ''
                    ? Number(m.internalMarks) + Number(m.externalMarks)
                    : '—';
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
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={m.internalMarks}
                        onChange={(e) => updateMark(s._id, 'internalMarks', e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={m.externalMarks}
                        onChange={(e) => updateMark(s._id, 'externalMarks', e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {total !== '—' ? (
                        <span className={`font-semibold text-sm ${total >= 33 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {total}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
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
                <Upload className="h-4 w-4" />
                Upload Marks
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
