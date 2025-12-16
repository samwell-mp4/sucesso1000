import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Robots from './pages/Robots';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Schedule from './pages/Schedule';
import Conversations from './pages/Conversations';
import Sales from './pages/Sales';
import Financial from './pages/Financial';
import Affiliates from './pages/Affiliates';
// Settings page
import Settings from './pages/SettingsPage';
import SeedData from './pages/SeedData';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './styles/index.css';
import './styles/Modal.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/robots" element={<Robots />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/affiliates" element={<Affiliates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/seed" element={<SeedData />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
