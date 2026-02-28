import { useState, useEffect } from 'react';
import { subjectAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { BookOpen, Plus, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';

const initialForm = {
  subjectName: '',
  subjectCode: '',
  department: '',
  semester: 1,
  credits: 3,
};

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await subjectAPI.getAll();
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await subjectAPI.create(form);
      setModalOpen(false);
      setForm(initialForm);
      loadSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await subjectAPI.remove(id);
      setDeleteId(null);
      loadSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.subjectName?.toLowerCase().includes(q) ||
      s.subjectCode?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Subjects" subtitle="Create and manage course subjects">
        <button
          onClick={() => { setForm(initialForm); setError(''); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, code, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            description={search ? 'Try a different search term' : 'Create your first subject to get started'}
          />
        ) : (
          <DataTable headers={['Code', 'Subject Name', 'Department', 'Semester', 'Credits', 'Faculty', 'Actions']}>
            {filtered.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {s.subjectCode}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.subjectName}</td>
                <td className="px-4 py-3 text-slate-500">{s.department}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="info">Sem {s.semester}</Badge>
                </td>
                <td className="px-4 py-3 text-center text-slate-700">{s.credits}</td>
                <td className="px-4 py-3 text-slate-500">
                  {s.assignedFaculty?.user?.name || s.assignedFaculty?.employeeId || <span className="text-slate-300">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDeleteId(s._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
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

      {/* ── Add Subject Modal ──────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Subject"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-subject-form"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Subject
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <form id="add-subject-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Subject Name" name="subjectName" value={form.subjectName} onChange={onChange} required placeholder="e.g. Data Structures" />
            <Field label="Subject Code" name="subjectCode" value={form.subjectCode} onChange={onChange} required placeholder="e.g. CS301" />
            <Field label="Department" name="department" value={form.department} onChange={onChange} required placeholder="e.g. Computer Science" />
            <Field label="Semester" name="semester" type="number" value={form.semester} onChange={onChange} required min={1} max={12} />
            <Field label="Credits" name="credits" type="number" value={form.credits} onChange={onChange} required min={1} max={6} />
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Subject"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this subject? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder, min, max }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
}
