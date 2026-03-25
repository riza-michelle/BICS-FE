import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { rolePermissionsAPI } from '../services/api';
import { useAuth } from './AuthContext';

// All configurable menu keys
export const MENU_KEYS = [
  'dashboard',
  'bpt_add_live_site',
  'bpt_view_live_site',
  'bpt_fco_update',
  'moa_uploader',
  'cdrf_routing',
  'config_epc_batch',
  'config_fco_personnel',
  'config_relationship_manager',
  'config_saq_personnel',
  'config_top_developer',
  'config_users',
  'config_validated_by',
  'config_vendor',
  'config_user_logs',
  'pending_approvals',
] as const;

export type MenuKey = typeof MENU_KEYS[number];

type Permissions = Record<string, Record<string, boolean>>;

interface PermissionsContextType {
  permissions: Permissions;
  hasPermission: (role: string | undefined, menuKey: string) => boolean;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: {},
  hasPermission: () => false,
  refreshPermissions: async () => {},
  isLoading: true,
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await rolePermissionsAPI.getPermissions();
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPermissions();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchPermissions]);

  const hasPermission = (role: string | undefined, menuKey: string): boolean => {
    if (!role) return false;
    // Super Admin always has full access
    if (role === 'Super Admin') return true;
    return permissions[role]?.[menuKey] === true;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, refreshPermissions: fetchPermissions, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
