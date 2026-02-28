import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui/SharedUI';
import Modal from '../../components/ui/Modal';
import { Users, Search, Loader2, Trash2, Eye, AlertCircle } from 'lucide-react';

export default function ViewAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deleteId, setDeleteId] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getAll();
      setUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.remove(id);
      setDeleteId(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadgeVariant = {
    Admin: 'danger',
    Faculty: 'warning',
    Student: 'info',
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'Admin').length,
    faculty: users.filter((u) => u.role === 'Faculty').length,
    students: users.filter((u) => u.role === 'Student').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="All Users" subtitle={`${stats.total} total users in the system`} />

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Admin', 'Faculty', 'Student'].map((role) => {
          const count =
            role === 'All'
              ? stats.total
              : role === 'Admin'
              ? stats.admins
              : role === 'Faculty'
              ? stats.faculty
              : stats.students;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {role} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={search || roleFilter !== 'All' ? 'Try adjusting your filters' : 'No users have been registered yet'}
          />
        ) : (
          <DataTable headers={['Name', 'Email', 'Role', 'Department', 'Joined', 'Actions']}>
            {filtered.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-sm">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadgeVariant[u.role] || 'default'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.department || '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewUser(u)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(u._id)}
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

      {/* ── View User Modal ────────────────────── */}
      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User Details"
        size="sm"
        footer={
          <button onClick={() => setViewUser(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            Close
          </button>
        }
      >
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
                {viewUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{viewUser.name}</h3>
                <Badge variant={roleBadgeVariant[viewUser.role]}>{viewUser.role}</Badge>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                { label: 'Email', value: viewUser.email },
                { label: 'Department', value: viewUser.department || '—' },
                { label: 'Joined', value: new Date(viewUser.createdAt).toLocaleString() },
                { label: 'User ID', value: viewUser._id },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-3">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className="text-sm font-medium text-slate-800 text-right max-w-[60%] break-all">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation ────────────────── */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete User"
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
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
