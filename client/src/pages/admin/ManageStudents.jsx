import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { GraduationCap, Plus, Trash2, Pencil, Search, Loader2, AlertCircle } from 'lucide-react';

const initialForm = {
  name: '',
  email: '',
  password: '',
  department: '',
  enrollmentNumber: '',
  course: '',
  semester: 1,
  guardianName: '',
  guardianPhone: '',
};

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getAll();
      setStudents(res.data.data.students);
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
      await studentAPI.create(form);
      setModalOpen(false);
      setForm(initialForm);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await studentAPI.remove(id);
      setDeleteId(null);
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.enrollmentNumber?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Students" subtitle="Add, view and manage student profiles">
        <button
          onClick={() => { setForm(initialForm); setError(''); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, enrollment, course…"
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
            icon={GraduationCap}
            title="No students found"
            description={search ? 'Try a different search term' : 'Add your first student to get started'}
          />
        ) : (
          <DataTable headers={['Enrollment', 'Name', 'Email', 'Course', 'Semester', 'Department', 'Actions']}>
            {filtered.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
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
                <td className="px-4 py-3 text-slate-500">{s.user?.department || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      {/* ── Add Student Modal ──────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Student"
        size="lg"
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
              form="add-student-form"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Student
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
        <form id="add-student-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Account info */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="name" value={form.name} onChange={onChange} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
              <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
              <Field label="Department" name="department" value={form.department} onChange={onChange} />
            </div>
          </div>

          {/* Student info */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Student Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Enrollment No." name="enrollmentNumber" value={form.enrollmentNumber} onChange={onChange} required />
              <Field label="Course" name="course" value={form.course} onChange={onChange} required placeholder="e.g. B.Tech CSE" />
              <Field label="Semester" name="semester" type="number" value={form.semester} onChange={onChange} required min={1} max={12} />
            </div>
          </div>

          {/* Guardian */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Guardian Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Guardian Name" name="guardianName" value={form.guardianName} onChange={onChange} />
              <Field label="Guardian Phone" name="guardianPhone" value={form.guardianPhone} onChange={onChange} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Student"
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
          Are you sure you want to delete this student? This will also remove their user account. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

/* ── reusable form field ─── */
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
