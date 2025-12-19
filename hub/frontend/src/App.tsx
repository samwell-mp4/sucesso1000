import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Financial from './pages/Financial';
import ClientRobots from './components/ClientRobots';
import Schedule from './pages/Schedule';
import HubSelector from './pages/HubSelector';
import WhatsAppLayout from './components/WhatsAppLayout';
import WhatsAppDashboard from './pages/whatsapp/WhatsAppDashboard';
import WhatsAppStats from './pages/whatsapp/WhatsAppStats';
import WhatsAppContacts from './pages/whatsapp/WhatsAppContacts';
import ClientWhatsAppRobot from './components/ClientWhatsAppRobot';
import WhatsAppMarketing from './pages/WhatsAppMarketing';


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

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HubSelector />} />

        {/* Management Hub Routes */}
        <Route element={<Layout />}>
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

        {/* WhatsApp Hub Routes */}
        <Route path="/whatsapp" element={<WhatsAppLayout />}>
          <Route index element={<WhatsAppDashboard />} />
          <Route path="stats" element={<WhatsAppStats />} />
          <Route path="contacts" element={<WhatsAppContacts />} />
          <Route path="robots" element={<ClientWhatsAppRobot clientId={user?.id || ''} />} /> {/* Reusing for now */}
          <Route path="automations" element={<div className="p-8 text-white">Automações (Em breve)</div>} />
          <Route path="conversations" element={<div className="p-8 text-white">Conversas (Em breve)</div>} />
          <Route path="settings" element={<Settings />} /> {/* Reusing for now */}
        </Route>

        {/* WhatsApp Marketing Route */}
        <Route path="/whatsapp-marketing" element={<Layout />}>
          <Route index element={<WhatsAppMarketing />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
