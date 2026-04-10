import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './shared/authContext';

const PrivateRoute = ({ children, requireAdmin = false }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="bg-[#070514] min-h-screen text-white flex items-center justify-center">Cargando...</div>;
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/admin" replace />;
    }
    
    return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública (B2C) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Ruta Privada (B2B Administrativa) */}
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
