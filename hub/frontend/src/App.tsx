import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Financial from './pages/Financial';
import ClientRobots from './components/ClientRobots';
import Schedule from './pages/Schedule';


// Settings page
import Settings from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AffiliatesLayout from './components/affiliates/AffiliatesLayout';
import AffiliatesDashboard from './components/affiliates/AffiliatesDashboard';
import AffiliatesList from './components/affiliates/AffiliatesList';
import CommissionsList from './components/affiliates/CommissionsList';
import AffiliatePayments from './components/affiliates/AffiliatePayments';
import './styles/Modal.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/financial" element={<Financial />} />

              {/* Affiliates Module Routes */}
              <Route path="/affiliates" element={<AffiliatesLayout />}>
                <Route index element={<AffiliatesDashboard />} />
                <Route path="list" element={<AffiliatesList />} />
                <Route path="commissions" element={<CommissionsList />} />
                <Route path="payments" element={<AffiliatePayments />} />
              </Route>

              <Route path="/robots" element={<ClientRobots />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
