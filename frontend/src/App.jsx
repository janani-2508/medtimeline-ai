import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import PatientList from './pages/PatientList';
import AddPatient from './pages/AddPatient';
import PatientProfile from './pages/PatientProfile';
import DocumentUpload from './pages/DocumentUpload';
import DocumentAnalysis from './pages/DocumentAnalysis';
import DocumentHistory from './pages/DocumentHistory';
import AIAssistant from './pages/AIAssistant';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPatients from './pages/AdminPatients';
import AdminDocuments from './pages/AdminDocuments';
import AdminActivity from './pages/AdminActivity';

function HomeRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="page-center">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Normal user routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute requiredRole="user"><PatientList /></ProtectedRoute>} />
      <Route path="/patients/new" element={<ProtectedRoute requiredRole="user"><AddPatient /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute requiredRole="user"><DocumentUpload /></ProtectedRoute>} />
      <Route path="/documents/history" element={<ProtectedRoute requiredRole="user"><DocumentHistory /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentAnalysis /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute requiredRole="user"><AIAssistant /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminPatients /></ProtectedRoute>} />
      <Route path="/admin/documents" element={<ProtectedRoute requiredRole="admin"><AdminDocuments /></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute requiredRole="admin"><AdminActivity /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
