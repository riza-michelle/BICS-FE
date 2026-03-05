import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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