import * as React from 'react';
import { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectForm from './components/ProjectForm';
import ClientPortal from './components/ClientPortal';
import CustomerManagement from './components/CustomerManagement';
import UserManagement from './components/UserManagement';
import FinanceHub from './components/FinanceHub';
import MonthlyAccounting from './components/MonthlyAccounting';
import CashMemo from './components/CashMemo';
import AuditTrail from './components/AuditTrail';
import Analytics from './components/Analytics';
import About from './components/About';
import Settings from './components/Settings';
import ClientDashboard from './components/ClientDashboard';
import SmsManagement from './components/SmsManagement';
import { useAppStore } from './store';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRoute = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, authType, currentUser } = useAppStore();
  if (!isAuthenticated || authType !== 'staff' || currentUser?.role !== 'Admin') return <Navigate to="/" />;
  return <>{children}</>;
};

// Staff Route: For both Admin and Team members
const StaffRoute = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, authType } = useAppStore();
  if (!isAuthenticated || authType !== 'staff') return <Navigate to="/" />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          {/* Admin ONLY routes */}
          <Route path="/settings" element={<StaffRoute><Settings /></StaffRoute>} />
          {/* Admin ONLY routes */}
          <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          {/* Staff (Admin + Team) routes */}
          <Route path="/projects" element={<Dashboard />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/add" element={<StaffRoute><ProjectForm /></StaffRoute>} />
          <Route path="/edit/:projectId" element={<StaffRoute><ProjectForm /></StaffRoute>} />
          <Route path="/customers" element={<StaffRoute><CustomerManagement /></StaffRoute>} />
          <Route path="/finance" element={<StaffRoute><FinanceHub /></StaffRoute>} />
          <Route path="/analytics" element={<StaffRoute><Analytics /></StaffRoute>} />
          <Route path="/audit" element={<StaffRoute><AuditTrail /></StaffRoute>} />
          <Route path="/voucher" element={<StaffRoute><MonthlyAccounting /></StaffRoute>} />
          <Route path="/sms" element={<StaffRoute><SmsManagement /></StaffRoute>} />
          {/* Public routes */}
          <Route path="/cash-memo/:projectId" element={<CashMemo />} />
          <Route path="/project/:projectId/:secureToken" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <DataLoader />
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
};

const DataLoader = () => {
  const location = useLocation();
  const { loadInitialData, isAuthenticated } = useAppStore();

  React.useEffect(() => {
    // Load data on mount and route change
    // This fixes the "Data disappears on refresh" issue
    loadInitialData();
  }, [location.pathname, isAuthenticated, loadInitialData]);

  return null;
};

export default App;
