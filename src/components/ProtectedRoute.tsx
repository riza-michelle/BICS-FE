import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  menuKey?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, superAdminOnly = false, menuKey }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Dynamic permission check via menuKey
  if (menuKey && !hasPermission(user?.role, menuKey)) {
    return <Navigate to="/data-entry" replace />;
  }

  // Super Admin only routes
  if (superAdminOnly && user?.role !== 'Super Admin') {
    return <Navigate to="/data-entry" replace />;
  }

  // Admin or Super Admin routes
  if (adminOnly && user?.role !== 'Admin' && user?.role !== 'Super Admin') {
    return <Navigate to="/data-entry" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;