import { useState, useEffect } from 'react';
import { assignmentAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  CalendarDays,
  Clock,
  Star,
  Eye,
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit modal
  const [showSubmit, setShowSubmit] = useState(false);
  const [activeAsn, setActiveAsn] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Details modal
  const [showDetails, setShowDetails] = useState(false);
  const [detailAsn, setDetailAsn] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const res = await assignmentAPI.getMyAssignments();
      setAssignments(res.data.data.assignments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openSubmit = (asn) => {
    setActiveAsn(asn);
    setFile(null);
    setError('');
    setSuccess('');
    setShowSubmit(true);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to submit');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await assignmentAPI.submit(activeAsn._id, fd);
      setSuccess('Assignment submitted successfully!');
      setShowSubmit(false);
      loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (asn) => {
    setDetailAsn(asn);
    setShowDetails(true);
  };

  const isPastDue = (d) => new Date(d) < new Date();
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Stats
  const total = assignments.length;
  const submitted = assignments.filter((a) => a.mySubmission).length;
  const graded = assignments.filter((a) => a.mySubmission?.status === 'Graded').length;
  const pending = total - submitted;

  return (
    <div className="space-y-6">
      <PageHeader title="My Assignments" subtitle="View and submit assignments" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-500 mb-1">Submitted</p>
          <p className="text-2xl font-bold text-emerald-700">{submitted}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-500 mb-1">Graded</p>
          <p className="text-2xl font-bold text-primary-700">{graded}</p>
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

      {/* Assignments list */}
      <Card>
        {assignments.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments" description="You have no assignments yet" />
        ) : (
          <DataTable headers={['#', 'Title', 'Subject', 'Faculty', 'Due Date', 'File', 'Status', 'Marks', 'Actions']}>
            {assignments.map((a, idx) => {
              const sub = a.mySubmission;
              const past = isPastDue(a.dueDate);
              let status = 'Pending';
              let variant = 'warning';
              if (sub) {
                status = sub.status;
                variant = sub.status === 'Graded' ? 'success' : sub.status === 'Late' ? 'danger' : 'info';
              } else if (past) {
                status = 'Overdue';
                variant = 'danger';
              }

              return (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 text-sm">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {a.subject?.subjectCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.faculty?.user?.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={past ? 'text-red-500' : 'text-slate-700'}>{formatDate(a.dueDate)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/${a.filePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800">
                      <Download className="h-3 w-3" /> PDF
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={variant}>{status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sub?.marks !== null && sub?.marks !== undefined ? (
                      <span className="font-semibold text-sm text-primary-600">{sub.marks}/{a.totalMarks}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!sub && (
                        <button
                          onClick={() => openSubmit(a)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                        >
                          <Upload className="h-3 w-3" /> Submit
                        </button>
                      )}
                      {sub && (
                        <button
                          onClick={() => openDetails(a)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <Eye className="h-3 w-3" /> Details
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>

      {/* ── Submit Modal ───────────────────────── */}
      <Modal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        title={`Submit — ${activeAsn?.title || ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowSubmit(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" /> Submit
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {activeAsn && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm space-y-1">
              <p><span className="text-slate-500">Subject:</span> <span className="font-medium text-slate-800">{activeAsn.subject?.subjectName}</span></p>
              <p><span className="text-slate-500">Due:</span> <span className={isPastDue(activeAsn.dueDate) ? 'text-red-500 font-medium' : 'text-slate-800'}>{formatDate(activeAsn.dueDate)}</span></p>
              <p><span className="text-slate-500">Total Marks:</span> <span className="font-medium text-slate-800">{activeAsn.totalMarks}</span></p>
            </div>
          )}
          {activeAsn && isPastDue(activeAsn.dueDate) && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Due date has passed — submission will be marked as late
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF) *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
        </div>
      </Modal>

      {/* ── Details Modal ──────────────────────── */}
      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="Submission Details"
        size="sm"
        footer={
          <button onClick={() => setShowDetails(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
        }
      >
        {detailAsn?.mySubmission && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Assignment', value: detailAsn.title },
                { label: 'Subject', value: `${detailAsn.subject?.subjectCode} — ${detailAsn.subject?.subjectName}` },
                { label: 'Due Date', value: formatDate(detailAsn.dueDate) },
                { label: 'Submitted On', value: formatDate(detailAsn.mySubmission.submittedAt) },
                { label: 'Status', value: detailAsn.mySubmission.status },
                {
                  label: 'Marks',
                  value:
                    detailAsn.mySubmission.marks !== null && detailAsn.mySubmission.marks !== undefined
                      ? `${detailAsn.mySubmission.marks}/${detailAsn.totalMarks}`
                      : 'Not graded yet',
                },
                { label: 'Feedback', value: detailAsn.mySubmission.feedback || '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2.5">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
            </div>
            <a
              href={`/${detailAsn.mySubmission.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" /> View My Submission
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
