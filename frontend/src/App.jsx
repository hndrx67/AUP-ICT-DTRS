import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import KioskScreen from './pages/KioskScreen';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KioskScreen />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
