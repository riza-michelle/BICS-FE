import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { pendingRecordsAPI } from '../services/api';
import { Building2, LayoutDashboard, FileText, LogOut, User, Eye, ChevronDown, Upload, Settings, Users, Activity, Package, Briefcase, Archive, ShieldCheck, Clock, Bell, PencilLine } from 'lucide-react';
import { MY_SUBMISSIONS_LAST_VISIT_KEY } from '../pages/MySubmissions';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [isActiveSiteOpen, setIsActiveSiteOpen] = useState(false);
  const [isConfigurationsOpen, setIsConfigurationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadSubmissionsCount, setUnreadSubmissionsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const configurationsDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isActiveSiteActive = isActive('/data-entry') || isActive('/site-view') || isActive('/fco-update');
  const isConfigurationsActive = isActive('/users') || isActive('/user-logs') || isActive('/epc-batch') || isActive('/vendor') || isActive('/saq-personnel') || isActive('/fco-personnel') || isActive('/top-developer') || isActive('/relationship-manager') || isActive('/validated-by');

  const handleLogout = () => {
    logout();
  };

  // Fetch pending count for Super Admin
  useEffect(() => {
    if (user?.role !== 'Super Admin') return;
    const fetchCount = async () => {
      try {
        const res = await pendingRecordsAPI.count();
        setPendingCount(res.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Fetch unread submissions count for non-Super-Admin users
  useEffect(() => {
    if (user?.role === 'Super Admin') return;
    const fetchUnread = async () => {
      try {
        const res = await pendingRecordsAPI.mySubmissions();
        if (res.success && res.data) {
          const lastVisit = localStorage.getItem(MY_SUBMISSIONS_LAST_VISIT_KEY);
          const reviewed = (res.data as any[]).filter(
            s => s.status !== 'PENDING' && s.reviewed_at &&
              (!lastVisit || new Date(s.reviewed_at) > new Date(lastVisit))
          );
          setUnreadSubmissionsCount(reviewed.length);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActiveSiteOpen(false);
      }
      if (configurationsDropdownRef.current && !configurationsDropdownRef.current.contains(event.target as Node)) {
        setIsConfigurationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">BICS</h1>
                <p className="text-xs text-gray-500"></p>
              </div>
            </div>

            <div className="ml-10 flex items-baseline space-x-4">
              {/* Dashboard */}
              {hasPermission(user?.role, 'dashboard') && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* BPT Dropdown */}
              {(hasPermission(user?.role, 'bpt_add_live_site') || hasPermission(user?.role, 'bpt_view_live_site') || hasPermission(user?.role, 'bpt_fco_update')) && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsActiveSiteOpen(!isActiveSiteOpen)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                    isActiveSiteActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>BPT</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isActiveSiteOpen ? 'rotate-180' : ''}`} />
                </button>

                {isActiveSiteOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {hasPermission(user?.role, 'bpt_add_live_site') && (
                      <Link
                        to="/data-entry"
                        onClick={() => setIsActiveSiteOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive('/data-entry')
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Add New Live Site</span>
                      </Link>
                      )}
                      {hasPermission(user?.role, 'bpt_view_live_site') && (
                      <Link
                        to="/site-view"
                        onClick={() => setIsActiveSiteOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive('/site-view')
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Live Site</span>
                      </Link>
                      )}
                      {hasPermission(user?.role, 'bpt_fco_update') && (
                      <Link
                        to="/fco-update"
                        onClick={() => setIsActiveSiteOpen(false)}
                        className={`hidden flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                          isActive('/fco-update')
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <PencilLine className="h-4 w-4" />
                        <span>FCO Update</span>
                      </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* My Submissions - visible to all non-Super-Admin users */}
              {user?.role !== 'Super Admin' && (
                <Link
                  to="/my-submissions"
                  onClick={() => setUnreadSubmissionsCount(0)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                    isActive('/my-submissions')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>My Submissions</span>
                  {unreadSubmissionsCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white leading-none">
                      {unreadSubmissionsCount}
                    </span>
                  )}
                </Link>
              )}

              {hasPermission(user?.role, 'moa_uploader') && (
              <Link
                to="/moa-uploader"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  isActive('/moa-uploader')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>MOA Uploader</span>
              </Link>
              )}

              {hasPermission(user?.role, 'cdrf_routing') && (
              <Link
                to="/cob-inventory"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  isActive('/cob-inventory')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>CDRF Routing</span>
              </Link>
              )}

              {/* Configurations Dropdown */}
              {(user?.role === 'Super Admin' ||
                ['config_epc_batch','config_fco_personnel','config_relationship_manager',
                 'config_saq_personnel','config_top_developer','config_users',
                 'config_validated_by','config_vendor','config_user_logs']
                  .some(k => hasPermission(user?.role, k))
              ) && (
                <div className="relative" ref={configurationsDropdownRef}>
                  <button
                    onClick={() => setIsConfigurationsOpen(!isConfigurationsOpen)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                      isConfigurationsActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurations</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isConfigurationsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isConfigurationsOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {hasPermission(user?.role, 'config_epc_batch') && (
                        <Link to="/epc-batch" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/epc-batch') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Package className="h-4 w-4" /><span>Add EPC Batch</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_fco_personnel') && (
                        <Link to="/fco-personnel" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/fco-personnel') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <User className="h-4 w-4" /><span>Add FCO Personnel</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_relationship_manager') && (
                        <Link to="/relationship-manager" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/relationship-manager') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Users className="h-4 w-4" /><span>Add Relationship Manager</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_saq_personnel') && (
                        <Link to="/saq-personnel" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/saq-personnel') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <User className="h-4 w-4" /><span>Add SAQ Personnel</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_top_developer') && (
                        <Link to="/top-developer" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/top-developer') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Building2 className="h-4 w-4" /><span>Add Top Developer</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_users') && (
                        <Link to="/users" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/users') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Users className="h-4 w-4" /><span>Add User</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_validated_by') && (
                        <Link to="/validated-by" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/validated-by') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <User className="h-4 w-4" /><span>Add Validated By</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_vendor') && (
                        <Link to="/vendor" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/vendor') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Briefcase className="h-4 w-4" /><span>Add Vendor</span>
                        </Link>
                        )}
                        {hasPermission(user?.role, 'config_user_logs') && (
                        <Link to="/user-logs" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/user-logs') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Activity className="h-4 w-4" /><span>User Logs</span>
                        </Link>
                        )}
                        {user?.role === 'Super Admin' && (
                        <Link to="/role-permissions" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/role-permissions') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <ShieldCheck className="h-4 w-4" /><span>Role Permissions</span>
                        </Link>
                        )}
                        {user?.role === 'Super Admin' && (
                        <Link to="/pending-approvals" onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${isActive('/pending-approvals') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                          <Clock className="h-4 w-4" />
                          <span>Pending Approvals</span>
                          {pendingCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white leading-none">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;