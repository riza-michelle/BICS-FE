import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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

  // Redirect based on user role
  if (user?.role === 'Super Admin' || user?.role === 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/data-entry" replace />;
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<Test />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute adminOnly>
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
                  <ProtectedRoute>
                    <SiteView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moa-uploader"
                element={
                  <ProtectedRoute>
                    <MoaUploader />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cob-inventory"
                element={
                  <ProtectedRoute>
                    <CobInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute superAdminOnly>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-logs"
                element={
                  <ProtectedRoute superAdminOnly>
                    <UserLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/epc-batch"
                element={
                  <ProtectedRoute superAdminOnly>
                    <EpcBatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor"
                element={
                  <ProtectedRoute superAdminOnly>
                    <Vendor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saq-personnel"
                element={
                  <ProtectedRoute superAdminOnly>
                    <SaqPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fco-personnel"
                element={
                  <ProtectedRoute superAdminOnly>
                    <FcoPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/top-developer"
                element={
                  <ProtectedRoute superAdminOnly>
                    <TopDeveloper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relationship-manager"
                element={
                  <ProtectedRoute superAdminOnly>
                    <RelationshipManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/validated-by"
                element={
                  <ProtectedRoute superAdminOnly>
                    <ValidatedBy />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<RootRedirect />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
