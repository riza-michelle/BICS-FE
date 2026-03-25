import React, { useState, useEffect } from 'react';
import { Shield, Save } from 'lucide-react';
import { rolePermissionsAPI } from '../services/api';
import { usePermissions, MENU_KEYS } from '../context/PermissionsContext';
import { useNotification } from '../context/NotificationContext';

const MENU_LABELS: Record<string, { label: string; group: string }> = {
  dashboard:                  { label: 'Dashboard',               group: 'Main Menu' },
  bpt_add_live_site:          { label: 'BPT - Add New Live Site',  group: 'Main Menu' },
  bpt_view_live_site:         { label: 'BPT - View Live Site',     group: 'Main Menu' },
  bpt_fco_update:             { label: 'BPT - FCO Update',         group: 'Main Menu' },
  moa_uploader:               { label: 'MOA Uploader',             group: 'Main Menu' },
  cdrf_routing:               { label: 'CDRF Routing',             group: 'Main Menu' },
  config_epc_batch:           { label: 'Add EPC Batch',            group: 'Configurations' },
  config_fco_personnel:       { label: 'Add FCO Personnel',        group: 'Configurations' },
  config_relationship_manager:{ label: 'Add Relationship Manager', group: 'Configurations' },
  config_saq_personnel:       { label: 'Add SAQ Personnel',        group: 'Configurations' },
  config_top_developer:       { label: 'Add Top Developer',        group: 'Configurations' },
  config_users:               { label: 'Add User',                 group: 'Configurations' },
  config_validated_by:        { label: 'Add Validated By',         group: 'Configurations' },
  config_vendor:              { label: 'Add Vendor',               group: 'Configurations' },
  config_user_logs:           { label: 'User Logs',                group: 'Configurations' },
};

const ROLES = ['Admin', 'User - SAQ', 'User - FCO'] as const;

type PermissionMap = Record<string, Record<string, boolean>>;

const RolePermissions: React.FC = () => {
  const [localPermissions, setLocalPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshPermissions } = usePermissions();
  const { showNotification } = useNotification();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await rolePermissionsAPI.getPermissions();
        if (response.success && response.data) {
          setLocalPermissions(response.data);
        }
      } catch (error) {
        showNotification('error', 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showNotification]);

  const handleToggle = (role: string, menuKey: string) => {
    setLocalPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [menuKey]: !prev[role]?.[menuKey],
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await rolePermissionsAPI.updatePermissions(localPermissions);
      if (response.success) {
        await refreshPermissions();
        showNotification('success', 'Permissions saved successfully');
      } else {
        showNotification('error', response.message || 'Failed to save permissions');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  const groups = MENU_KEYS.map(k => MENU_LABELS[k].group).filter((g, i, arr) => arr.indexOf(g) === i);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Role Permissions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure which menus and tabs are accessible per user role. Super Admin always has full access.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Menu Access Matrix</h3>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                  Menu / Tab
                </th>
                {/* Super Admin column - always checked, disabled */}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Super Admin
                </th>
                {ROLES.map(role => (
                  <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {groups.map(group => (
                <React.Fragment key={group}>
                  {/* Group header row */}
                  <tr className="bg-gray-50">
                    <td colSpan={ROLES.length + 2} className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group}
                    </td>
                  </tr>
                  {/* Menu rows in this group */}
                  {MENU_KEYS.filter(k => MENU_LABELS[k].group === group).map(menuKey => (
                    <tr key={menuKey} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                        {MENU_LABELS[menuKey].label}
                      </td>
                      {/* Super Admin - always enabled, not editable */}
                      <td className="px-6 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-not-allowed opacity-50"
                        />
                      </td>
                      {/* Configurable roles */}
                      {ROLES.map(role => (
                        <td key={role} className="px-6 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={localPermissions[role]?.[menuKey] === true}
                            onChange={() => handleToggle(role, menuKey)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          Changes take effect immediately after saving. Users currently logged in will see updated menus on their next page load.
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;
