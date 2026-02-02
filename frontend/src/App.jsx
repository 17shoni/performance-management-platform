import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tasks from './pages/Tasks';
import Ratings from './pages/Ratings';
import Notifications from './pages/Notifications';
import AdminUsers from './pages/AdminUsers';
import Layout from './components/Layout';
import Register from './pages/Register';
import { Toaster } from 'react-hot-toast';



function getRoleFromToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null; 
  } catch (e) {
    console.error('Invalid token');
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const role = getRoleFromToken();

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const [role, setRole] = useState(getRoleFromToken());

  useEffect(() => {
    const handleStorageChange = () => {
      setRole(getRoleFromToken());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login setRole={setRole} />} /> 
        <Route element={<Layout role={role} />}>
          <Route path="/dashboard" element={<Dashboard role={role} />} />

          {/* everyone can access these */}
          <Route path="/attendance" element={<Attendance role={role} />} />
          <Route path="/tasks" element={<Tasks role={role} />} />
          <Route path="/notifications" element={<Notifications role={role} />} />

          {/* supervisor and admin only can access */}
          <Route
            path="/ratings"
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <Ratings role={role} />
              </ProtectedRoute>
            }
          />

          {/* admin only can access */}
          <Route
            path="/admin-users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers role={role} />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;