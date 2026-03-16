import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PermissionsProvider, usePermissions } from './context/PermissionsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import SiteView from './pages/SiteView';
import MoaUploader from './pages/MoaUploader';
import CobInventory from './pages/CobInventory';
import Users from './pages/Users';
import UserLogs from './pages/UserLogs';
import EpcBatch from './pages/EpcBatch';
import Vendor from './pages/Vendor';
import SaqPersonnel from './pages/SaqPersonnel';
import FcoPersonnel from './pages/FcoPersonnel';
import TopDeveloper from './pages/TopDeveloper';
import RelationshipManager from './pages/RelationshipManager';
import ValidatedBy from './pages/ValidatedBy';
import RolePermissions from './pages/RolePermissions';
import PendingApprovals from './pages/PendingApprovals';
import Test from './pages/Test';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  if (user?.role === 'User' || hasPermission(user?.role, 'dashboard')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/data-entry" replace />;
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <PermissionsProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<Test />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-entry"
                element={
                  <ProtectedRoute>
                    <DataEntry />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/site-view"
                element={
                  <ProtectedRoute menuKey="bpt_view_live_site">
                    <SiteView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moa-uploader"
                element={
                  <ProtectedRoute menuKey="moa_uploader">
                    <MoaUploader />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cob-inventory"
                element={
                  <ProtectedRoute menuKey="cdrf_routing">
                    <CobInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute menuKey="config_users">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-logs"
                element={
                  <ProtectedRoute menuKey="config_user_logs">
                    <UserLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/epc-batch"
                element={
                  <ProtectedRoute menuKey="config_epc_batch">
                    <EpcBatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor"
                element={
                  <ProtectedRoute menuKey="config_vendor">
                    <Vendor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saq-personnel"
                element={
                  <ProtectedRoute menuKey="config_saq_personnel">
                    <SaqPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fco-personnel"
                element={
                  <ProtectedRoute menuKey="config_fco_personnel">
                    <FcoPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/top-developer"
                element={
                  <ProtectedRoute menuKey="config_top_developer">
                    <TopDeveloper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relationship-manager"
                element={
                  <ProtectedRoute menuKey="config_relationship_manager">
                    <RelationshipManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/validated-by"
                element={
                  <ProtectedRoute menuKey="config_validated_by">
                    <ValidatedBy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/role-permissions"
                element={
                  <ProtectedRoute superAdminOnly>
                    <RolePermissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pending-approvals"
                element={
                  <ProtectedRoute superAdminOnly>
                    <PendingApprovals />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<RootRedirect />} />
            </Routes>
          </AppLayout>
        </Router>
        </PermissionsProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
