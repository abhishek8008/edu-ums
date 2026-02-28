import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ums_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ums_token');
      localStorage.removeItem('ums_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
};

// ── Users ────────────────────────────────────
export const userAPI = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  update: (id, data) => API.patch(`/users/${id}`, data),
  remove: (id) => API.delete(`/users/${id}`),
};

// ── Faculty ──────────────────────────────────
export const facultyAPI = {
  getAll: (params) => API.get('/faculty', { params }),
  getById: (id) => API.get(`/faculty/${id}`),
  create: (data) => API.post('/faculty', data),
  update: (id, data) => API.patch(`/faculty/${id}`, data),
  remove: (id) => API.delete(`/faculty/${id}`),
  getMyProfile: () => API.get('/faculty/me/profile'),
  getMySubjects: () => API.get('/faculty/me/subjects'),
};

// ── Students ─────────────────────────────────
export const studentAPI = {
  getAll: (params) => API.get('/students', { params }),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data),
  update: (id, data) => API.patch(`/students/${id}`, data),
  remove: (id) => API.delete(`/students/${id}`),
  getBySubject: (subjectId) => API.get(`/students/by-subject/${subjectId}`),
  getMyProfile: () => API.get('/students/me/profile'),
};

// ── Subjects ─────────────────────────────────
export const subjectAPI = {
  getAll: (params) => API.get('/subjects', { params }),
  getById: (id) => API.get(`/subjects/${id}`),
  create: (data) => API.post('/subjects', data),
  update: (id, data) => API.patch(`/subjects/${id}`, data),
  remove: (id) => API.delete(`/subjects/${id}`),
};

// ── Attendance ───────────────────────────────
export const attendanceAPI = {
  mark: (data) => API.post('/attendance', data),
  markBulk: (data) => API.post('/attendance/bulk', data),
  getByStudent: (studentId, params) => API.get(`/attendance/student/${studentId}`, { params }),
  getBySubject: (subjectId, params) => API.get(`/attendance/subject/${subjectId}`, { params }),
  update: (id, data) => API.patch(`/attendance/${id}`, data),
  remove: (id) => API.delete(`/attendance/${id}`),
};

// ── Results ──────────────────────────────────
export const resultAPI = {
  add: (data) => API.post('/results', data),
  addBulk: (data) => API.post('/results/bulk', data),
  getByStudent: (studentId, params) => API.get(`/results/student/${studentId}`, { params }),
  getBySubject: (subjectId, params) => API.get(`/results/subject/${subjectId}`, { params }),
  update: (id, data) => API.patch(`/results/${id}`, data),
  remove: (id) => API.delete(`/results/${id}`),
};

// ── Notifications ────────────────────────────
export const notificationAPI = {
  // Admin
  sendToAll: (data) => API.post('/notifications', data),
  // Faculty
  sendToSubject: (data) => API.post('/notifications/subject', data),
  // Admin & Faculty
  getSent: () => API.get('/notifications/sent'),
  remove: (id) => API.delete(`/notifications/${id}`),
  // Student
  getMy: () => API.get('/notifications/my'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
};

// ── Assignments ──────────────────────────────
export const assignmentAPI = {
  // Faculty
  create: (formData) => API.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => API.get('/assignments', { params }),
  getById: (id) => API.get(`/assignments/${id}`),
  remove: (id) => API.delete(`/assignments/${id}`),
  getSubmissions: (id) => API.get(`/assignments/${id}/submissions`),
  gradeSubmission: (submissionId, data) => API.patch(`/assignments/submissions/${submissionId}/grade`, data),
  // Student
  getMyAssignments: () => API.get('/assignments/student/my-assignments'),
  submit: (id, formData) => API.post(`/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMySubmission: (id) => API.get(`/assignments/${id}/my-submission`),
};

// ── Audit Logs ───────────────────────────────
export const auditLogAPI = {
  getAll: (params) => API.get('/audit-logs', { params }),
  getStats: () => API.get('/audit-logs/stats'),
  getById: (id) => API.get(`/audit-logs/${id}`),
};

export default API;
