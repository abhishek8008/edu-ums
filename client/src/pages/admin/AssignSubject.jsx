import { useState, useEffect } from 'react';
import { subjectAPI, facultyAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { Link2, BookOpen, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AssignSubject() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subRes, facRes] = await Promise.all([
        subjectAPI.getAll(),
        facultyAPI.getAll(),
      ]);
      setSubjects(subRes.data.data.subjects);
      setFaculty(facRes.data.data.faculty);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (subject) => {
    setSelectedSubject(subject);
    setSelectedFacultyId(subject.assignedFaculty?._id || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedFacultyId) {
      setError('Please select a faculty member');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await subjectAPI.update(selectedSubject._id, { assignedFaculty: selectedFacultyId });
      setSuccess('Subject assigned successfully!');
      // Refresh data
      const res = await subjectAPI.getAll();
      setSubjects(res.data.data.subjects);
      setTimeout(() => {
        setModalOpen(false);
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (subjectId) => {
    try {
      await subjectAPI.update(subjectId, { assignedFaculty: null });
      const res = await subjectAPI.getAll();
      setSubjects(res.data.data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Assign Subjects" subtitle="Assign subjects to faculty members" />

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects available"
            description="Create subjects first, then assign them to faculty"
          />
        ) : (
          <DataTable headers={['Code', 'Subject', 'Department', 'Semester', 'Credits', 'Assigned Faculty', 'Action']}>
            {subjects.map((s) => {
              const assignedFac = s.assignedFaculty;
              // Find faculty user info — the populated data might be nested
              const facName = assignedFac?.user?.name || null;
              const facEmpId = assignedFac?.employeeId || null;

              return (
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
                  <td className="px-4 py-3">
                    {facName ? (
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold">
                          {facName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{facName}</p>
                          {facEmpId && <p className="text-xs text-slate-400">{facEmpId}</p>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAssignModal(s)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                      >
                        {assignedFac ? 'Reassign' : 'Assign'}
                      </button>
                      {assignedFac && (
                        <button
                          onClick={() => handleUnassign(s._id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Unassign
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

      {/* ── Assign Modal ──────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Assign: ${selectedSubject?.subjectName || ''}`}
        size="md"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={submitting || !!success}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Faculty
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
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Subject info */}
        <div className="mb-5 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedSubject?.subjectName}</p>
              <p className="text-xs text-slate-500">
                {selectedSubject?.subjectCode} · Semester {selectedSubject?.semester} · {selectedSubject?.credits} credits
              </p>
            </div>
          </div>
        </div>

        {/* Faculty selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Faculty Member</label>
          {faculty.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No faculty members available. Add faculty first.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {faculty.map((f) => (
                <label
                  key={f._id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFacultyId === f._id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="faculty"
                    value={f._id}
                    checked={selectedFacultyId === f._id}
                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                    className="accent-primary-600"
                  />
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold shrink-0">
                    {f.user?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{f.user?.name}</p>
                    <p className="text-xs text-slate-500">
                      {f.employeeId} · {f.department}
                      {f.qualification && ` · ${f.qualification}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
