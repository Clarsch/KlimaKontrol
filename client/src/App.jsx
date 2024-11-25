import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import { useAuth } from './contexts/AuthContext';
import LocationDetail from './pages/LocationDetail';

// Protected Route component with role check and auth verification
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, user } = useAuth();
  
  // If no token or no user data, redirect to login
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // If roles are specified, check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect collectors to upload page, others to dashboard
    return <Navigate to={user.role === 'collector' ? "/upload" : "/dashboard"} replace />;
  }

  return children;
};

// Public route component that redirects logged-in users to their appropriate page
const PublicRoute = ({ children }) => {
  const { token, user } = useAuth();

  if (token && user) {
    // Redirect to appropriate page based on role
    return <Navigate to={user.role === 'collector' ? "/upload" : "/dashboard"} replace />;
  }

  return children;
};

// Create a new component for the catch-all route
const CatchAllRedirect = () => {
  const { user } = useAuth();
  return (
    <Navigate 
      to={user?.role === 'collector' ? "/upload" : "/dashboard"} 
      replace 
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route (login page) */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'monitoring']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location/:locationId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'monitoring']}>
                <LocationDetail />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to appropriate page based on role */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <CatchAllRedirect />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
