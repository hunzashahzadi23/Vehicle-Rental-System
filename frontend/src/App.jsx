import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './store/AppContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import RenterDashboard from './pages/renter/RenterDashboard_REFACTORED.jsx';
import OwnerDashboard from './pages/owner/OwnerDashboard_ENHANCED.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, authLoading } = useApp();
  if (authLoading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><div className="spinner" /></div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { currentUser } = useApp();

  function DashboardRedirect() {
    if (!currentUser) return <Landing />;
    if (currentUser.role === 'Customer') return <Navigate to="/renter" replace />;
    if (currentUser.role === 'Lessor')   return <Navigate to="/owner"  replace />;
    if (currentUser.role === 'Admin')    return <Navigate to="/admin"  replace />;
    return <Landing />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<DashboardRedirect />} />
        <Route path="/market"   element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/renter"   element={<ProtectedRoute allowedRoles={['Customer']}><RenterDashboard /></ProtectedRoute>} />
        <Route path="/owner"    element={<ProtectedRoute allowedRoles={['Lessor']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/admin"    element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
