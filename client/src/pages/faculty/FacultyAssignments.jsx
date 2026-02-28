import { useState, useEffect } from 'react';
import { facultyAPI, assignmentAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  Upload,
  Download,
  CalendarDays,
  Users,
  Star,
} from 'lucide-react';

export default function FacultyAssignments() {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', dueDate: '', totalMarks: '100', file: null });

  // Submissions modal
  const [showSubs, setShowSubs] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);

  // Grade modal
  const [showGrade, setShowGrade] = useState(false);
  const [gradeSub, setGradeSub] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, asnRes] = await Promise.all([
        facultyAPI.getMySubjects(),
        assignmentAPI.getAll(),
      ]);
      setSubjects(subRes.data.data.subjects);
      setAssignments(asnRes.data.data.assignments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    if (!form.title || !form.subject || !form.dueDate || !form.file) {
      setError('Title, subject, due date, and file are required');
      return;
    }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('subject', form.subject);
      fd.append('dueDate', form.dueDate);
      fd.append('totalMarks', form.totalMarks || '100');
      fd.append('file', form.file);
      await assignmentAPI.create(fd);
      setSuccess('Assignment created!');
      setShowCreate(false);
      setForm({ title: '', description: '', subject: '', dueDate: '', totalMarks: '100', file: null });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment and all its submissions?')) return;
    try {
      await assignmentAPI.remove(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      setSuccess('Assignment deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const viewSubmissions = async (asn) => {
    setActiveAssignment(asn);
    setShowSubs(true);
    setSubsLoading(true);
    try {
      const res = await assignmentAPI.getSubmissions(asn._id);
      setSubmissions(res.data.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setSubsLoading(false);
    }
  };

  const openGrade = (sub) => {
    setGradeSub(sub);
    setGradeForm({ marks: sub.marks ?? '', feedback: sub.feedback || '' });
    setShowGrade(true);
  };

  const handleGrade = async () => {
    if (gradeForm.marks === '') { setError('Marks are required'); return; }
    setGrading(true);
    try {
      await assignmentAPI.gradeSubmission(gradeSub._id, {
        marks: Number(gradeForm.marks),
        feedback: gradeForm.feedback,
      });
      // refresh submissions
      const res = await assignmentAPI.getSubmissions(activeAssignment._id);
      setSubmissions(res.data.data.submissions);
      setShowGrade(false);
      setSuccess('Submission graded!');
    } catch (err) {
      setError(err.response?.data?.message || 'Grading failed');
    } finally {
      setGrading(false);
    }
  };

  const isPastDue = (d) => new Date(d) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader title="Assignments" subtitle="Create and manage assignments for your subjects" />
        <button
          onClick={() => { setShowCreate(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Assignment
        </button>
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

      {/* Assignments Table */}
      <Card>
        {assignments.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments yet" description="Create your first assignment" />
        ) : (
          <DataTable headers={['#', 'Title', 'Subject', 'Due Date', 'Marks', 'Submissions', 'File', 'Actions']}>
            {assignments.map((a, idx) => (
              <tr key={a._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {a.subject?.subjectCode}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={isPastDue(a.dueDate) ? 'text-red-500' : 'text-slate-700'}>
                    {new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {isPastDue(a.dueDate) && <span className="ml-1 text-[10px] text-red-400">(past)</span>}
                </td>
                <td className="px-4 py-3 text-center text-slate-700">{a.totalMarks}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => viewSubmissions(a)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Users className="h-3 w-3" /> {a.submissionCount ?? 0}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/${a.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800"
                  >
                    <Download className="h-3 w-3" /> PDF
                  </a>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {/* ── Create Assignment Modal ────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Assignment"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" /> Create
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Data Structures Lab 3"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.subjectCode} — {s.subjectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                min={0}
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignment File (PDF) *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Submissions Modal ──────────────────── */}
      <Modal
        open={showSubs}
        onClose={() => setShowSubs(false)}
        title={`Submissions — ${activeAssignment?.title || ''}`}
        size="xl"
        footer={
          <button onClick={() => setShowSubs(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
        }
      >
        {subsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
        ) : submissions.length === 0 ? (
          <EmptyState icon={Users} title="No submissions" description="No students have submitted yet" />
        ) : (
          <DataTable headers={['#', 'Student', 'Enrollment', 'File', 'Status', 'Submitted', 'Marks', 'Actions']}>
            {submissions.map((s, idx) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.student?.user?.name}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {s.student?.enrollmentNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/${s.filePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800">
                    <Download className="h-3 w-3" /> View
                  </a>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === 'Graded' ? 'success' : s.status === 'Late' ? 'danger' : 'warning'}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(s.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.marks !== null && s.marks !== undefined ? (
                    <span className="font-semibold text-sm text-primary-600">{s.marks}/{activeAssignment?.totalMarks}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openGrade(s)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                  >
                    <Star className="h-3 w-3" /> Grade
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Modal>

      {/* ── Grade Modal ────────────────────────── */}
      <Modal
        open={showGrade}
        onClose={() => setShowGrade(false)}
        title={`Grade — ${gradeSub?.student?.user?.name || ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowGrade(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={handleGrade}
              disabled={grading}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {grading && <Loader2 className="h-4 w-4 animate-spin" />} Save Grade
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Marks (out of {activeAssignment?.totalMarks || 100})
            </label>
            <input
              type="number"
              min={0}
              max={activeAssignment?.totalMarks || 100}
              value={gradeForm.marks}
              onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
            <textarea
              rows={3}
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              placeholder="Optional feedback…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
