import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './layout/MainLayout';
import Employees from './pages/Employees';
import Loans from './pages/Loans';
import User from './pages/User';
import Home from './pages/Home';
import Reports from "./pages/Reports"

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
      
          <Route path="/" element={<Navigate to="/home" />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/cashier" element={<Employees />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route
            path="/user"
            element={
              <ProtectedRoute>

                <User />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;