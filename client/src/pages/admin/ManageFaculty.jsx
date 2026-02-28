import { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { UserCheck, Plus, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';

const initialForm = {
  name: '',
  email: '',
  password: '',
  department: '',
  employeeId: '',
  qualification: '',
  experience: 0,
};

export default function ManageFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const res = await facultyAPI.getAll();
      setFaculty(res.data.data.faculty);
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
      await facultyAPI.create(form);
      setModalOpen(false);
      setForm(initialForm);
      loadFaculty();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add faculty');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await facultyAPI.remove(id);
      setDeleteId(null);
      loadFaculty();
    } catch (err) {
      console.error(err);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.user?.name?.toLowerCase().includes(q) ||
      f.employeeId?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Faculty" subtitle="Add, view and manage faculty members">
        <button
          onClick={() => { setForm(initialForm); setError(''); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Faculty
        </button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, employee ID, department…"
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
            icon={UserCheck}
            title="No faculty found"
            description={search ? 'Try a different search term' : 'Add your first faculty member to get started'}
          />
        ) : (
          <DataTable headers={['Employee ID', 'Name', 'Email', 'Department', 'Qualification', 'Experience', 'Subjects', 'Actions']}>
            {filtered.map((f) => (
              <tr key={f._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {f.employeeId}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{f.user?.name}</td>
                <td className="px-4 py-3 text-slate-500 text-sm">{f.user?.email}</td>
                <td className="px-4 py-3 text-slate-700">{f.department}</td>
                <td className="px-4 py-3 text-slate-500">{f.qualification || '—'}</td>
                <td className="px-4 py-3 text-center text-slate-600">{f.experience} yrs</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {f.subjectsTeaching?.length > 0
                      ? f.subjectsTeaching.map((sub) => (
                          <Badge key={sub._id} variant="info">{sub.subjectCode}</Badge>
                        ))
                      : <span className="text-slate-400 text-xs">None</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDeleteId(f._id)}
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

      {/* ── Add Faculty Modal ─────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Faculty"
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
              form="add-faculty-form"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Faculty
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
        <form id="add-faculty-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Account info */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="name" value={form.name} onChange={onChange} required />
              <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
              <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} required />
              <Field label="Department" name="department" value={form.department} onChange={onChange} required />
            </div>
          </div>

          {/* Faculty details */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Faculty Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Employee ID" name="employeeId" value={form.employeeId} onChange={onChange} required placeholder="e.g. FAC-001" />
              <Field label="Qualification" name="qualification" value={form.qualification} onChange={onChange} placeholder="e.g. Ph.D Computer Science" />
              <Field label="Experience (years)" name="experience" type="number" value={form.experience} onChange={onChange} min={0} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Faculty"
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
          Are you sure you want to delete this faculty member? This will also remove their user account. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder, min }) {
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
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
}
