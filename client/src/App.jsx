import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageSubjects from './pages/admin/ManageSubjects';
import AssignSubject from './pages/admin/AssignSubject';
import ViewAllUsers from './pages/admin/ViewAllUsers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AuditLogs from './pages/admin/AuditLogs';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultySubjects from './pages/faculty/FacultySubjects';
import MarkAttendance from './pages/faculty/MarkAttendance';
import UploadMarks from './pages/faculty/UploadMarks';
import StudentList from './pages/faculty/StudentList';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import FacultyNotifications from './pages/faculty/FacultyNotifications';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentResults from './pages/student/StudentResults';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentProfile from './pages/student/StudentProfile';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentNotifications from './pages/student/StudentNotifications';

/* ─── role → default dashboard path ─── */
const roleHome = {
  Admin: '/admin',
  Faculty: '/faculty',
  Student: '/student',
};

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[user?.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/faculty" element={<ManageFaculty />} />
        <Route path="/admin/subjects" element={<ManageSubjects />} />
        <Route path="/admin/assign-subject" element={<AssignSubject />} />
        <Route path="/admin/users" element={<ViewAllUsers />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Faculty routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/subjects" element={<FacultySubjects />} />
        <Route path="/faculty/attendance" element={<MarkAttendance />} />
        <Route path="/faculty/results" element={<UploadMarks />} />
        <Route path="/faculty/students" element={<StudentList />} />
        <Route path="/faculty/assignments" element={<FacultyAssignments />} />
        <Route path="/faculty/notifications" element={<FacultyNotifications />} />
      </Route>

      {/* Student routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['Student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/subjects" element={<StudentSubjects />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
