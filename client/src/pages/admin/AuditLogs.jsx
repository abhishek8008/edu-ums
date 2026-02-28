import { useState, useEffect } from 'react';
import { Shield, Clock, Filter, ChevronLeft, ChevronRight, Activity, User, Eye, X } from 'lucide-react';
import { auditLogAPI } from '../../services/api';

const ACTION_COLORS = {
  CREATE_STUDENT: 'bg-green-100 text-green-700',
  UPDATE_STUDENT: 'bg-blue-100 text-blue-700',
  DELETE_STUDENT: 'bg-red-100 text-red-700',
  CREATE_FACULTY: 'bg-green-100 text-green-700',
  UPDATE_FACULTY: 'bg-blue-100 text-blue-700',
  DELETE_FACULTY: 'bg-red-100 text-red-700',
  CREATE_SUBJECT: 'bg-green-100 text-green-700',
  UPDATE_SUBJECT: 'bg-blue-100 text-blue-700',
  DELETE_SUBJECT: 'bg-red-100 text-red-700',
  ADD_MARKS: 'bg-emerald-100 text-emerald-700',
  UPDATE_MARKS: 'bg-amber-100 text-amber-700',
  DELETE_MARKS: 'bg-red-100 text-red-700',
  BULK_ADD_MARKS: 'bg-emerald-100 text-emerald-700',
  MARK_ATTENDANCE: 'bg-purple-100 text-purple-700',
  CREATE_ASSIGNMENT: 'bg-indigo-100 text-indigo-700',
  DELETE_ASSIGNMENT: 'bg-red-100 text-red-700',
  GRADE_SUBMISSION: 'bg-amber-100 text-amber-700',
  SEND_NOTIFICATION: 'bg-cyan-100 text-cyan-700',
};

const MODEL_OPTIONS = ['Student', 'Faculty', 'Subject', 'Result', 'Attendance', 'Assignment', 'Notification'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ targetModel: '', action: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      const { data } = await auditLogAPI.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.targetModel) params.targetModel = filters.targetModel;
      if (filters.action) params.action = filters.action;
      const { data } = await auditLogAPI.getAll(params);
      setLogs(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ targetModel: '', action: '' });
    setPage(1);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const timeAgo = (d) => {
    const seconds = Math.floor((Date.now() - new Date(d)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(d);
  };

  const uniqueActions = stats?.byAction?.map((a) => a._id) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all system actions and changes</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition text-sm font-medium ${
            showFilters || filters.targetModel || filters.action
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          Filters
          {(filters.targetModel || filters.action) && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {(filters.targetModel ? 1 : 0) + (filters.action ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                <p className="text-sm text-gray-500">Total Logs</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.last24Hours}</p>
                <p className="text-sm text-gray-500">Last 24 Hours</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.byAction?.length || 0}</p>
                <p className="text-sm text-gray-500">Action Types</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.byModel?.length || 0}</p>
                <p className="text-sm text-gray-500">Models Tracked</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={filters.targetModel}
                onChange={(e) => applyFilter('targetModel', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Models</option>
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => applyFilter('action', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Actions</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {(filters.targetModel || filters.action) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Activity Log {total > 0 && <span className="text-gray-400 font-normal">({total} records)</span>}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Shield size={48} className="mb-3" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm">System actions will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-left">
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Performed By</th>
                    <th className="px-6 py-3 font-medium">Model</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700 max-w-xs truncate">{log.description}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {log.performedBy?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-xs">{log.performedBy?.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-xs">{log.performedBy?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {log.targetModel}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {timeAgo(log.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setSelected(log)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield size={20} className="text-primary-600" />
                Audit Log Details
              </h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Action</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[selected.action] || 'bg-gray-100 text-gray-700'}`}>
                    {selected.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Model</p>
                  <p className="text-sm font-medium text-gray-900">{selected.targetModel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Performed By</p>
                  <p className="text-sm font-medium text-gray-900">{selected.performedBy?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selected.performedBy?.email} ({selected.performedBy?.role})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                  <p className="text-sm text-gray-900">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{selected.description}</p>
              </div>
              {selected.targetId && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Target ID</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{selected.targetId}</code>
                </div>
              )}
              {selected.details && Object.keys(selected.details).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Details</p>
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
              {selected.ipAddress && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">IP Address</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{selected.ipAddress}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
