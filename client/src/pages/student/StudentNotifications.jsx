import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, Clock, BookOpen, Shield, X } from 'lucide-react';
import { notificationAPI } from '../../services/api';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getMy();
      setNotifications(data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const openNotification = (n) => {
    setSelected(n);
    if (!n.isRead) handleMarkAsRead(n._id);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? (
              <>You have <span className="text-primary-600 font-semibold">{unreadCount} unread</span> notification{unreadCount > 1 ? 's' : ''}</>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-100 transition text-sm font-medium"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilter('all')}
          className={`cursor-pointer p-4 rounded-xl border-2 transition ${
            filter === 'all' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setFilter('unread')}
          className={`cursor-pointer p-4 rounded-xl border-2 transition ${
            filter === 'unread' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setFilter('read')}
          className={`cursor-pointer p-4 rounded-xl border-2 transition ${
            filter === 'read' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifications.length - unreadCount}</p>
              <p className="text-sm text-gray-500">Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            {filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'} Notifications ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BellOff size={48} className="mb-3" />
            <p className="text-lg font-medium">
              {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((n) => (
              <div
                key={n._id}
                onClick={() => openNotification(n)}
                className={`px-6 py-4 cursor-pointer transition ${
                  !n.isRead ? 'bg-primary-50/50 hover:bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread dot */}
                  <div className="pt-1.5">
                    {!n.isRead ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </h3>
                      {n.targetType === 'all' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <Shield size={10} /> Admin
                        </span>
                      ) : (
                        n.subject && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <BookOpen size={10} /> {n.subject.name}
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1">{n.message}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-primary-600" />
                <h2 className="text-lg font-semibold">Notification</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {selected.targetType === 'all' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <Shield size={12} /> From Admin
                    </span>
                  ) : (
                    selected.subject && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <BookOpen size={12} /> {selected.subject.name} ({selected.subject.code})
                      </span>
                    )
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {formatDate(selected.createdAt)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
