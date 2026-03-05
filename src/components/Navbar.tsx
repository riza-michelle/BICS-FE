import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LayoutDashboard, FileText, LogOut, User, Eye, ChevronDown, Upload, Settings, Users, Activity, Package, Briefcase, Archive } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isActiveSiteOpen, setIsActiveSiteOpen] = useState(false);
  const [isConfigurationsOpen, setIsConfigurationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const configurationsDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isActiveSiteActive = isActive('/data-entry') || isActive('/site-view');
  const isConfigurationsActive = isActive('/users') || isActive('/user-logs') || isActive('/epc-batch') || isActive('/vendor') || isActive('/saq-personnel') || isActive('/fco-personnel') || isActive('/top-developer') || isActive('/relationship-manager') || isActive('/validated-by');

  const handleLogout = () => {
    logout();
  };

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
              {/* Dashboard - Only visible to Admin and Super Admin */}
              {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
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

              {/* Active Site Dropdown */}
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

                {/* Dropdown Menu */}
                {isActiveSiteOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
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
                    </div>
                  </div>
                )}
              </div>

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

              {/* Configurations Dropdown - Only visible to Super Admin */}
              {user?.role === 'Super Admin' && (
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

                  {/* Dropdown Menu */}
                  {isConfigurationsOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <Link
                          to="/epc-batch"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/epc-batch')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Package className="h-4 w-4" />
                          <span>Add EPC Batch</span>
                        </Link>
                        <Link
                          to="/fco-personnel"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/fco-personnel')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          <span>Add FCO Personnel</span>
                        </Link>
                        <Link
                          to="/relationship-manager"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/relationship-manager')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span>Add Relationship Manager</span>
                        </Link>
                        <Link
                          to="/saq-personnel"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/saq-personnel')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          <span>Add SAQ Personnel</span>
                        </Link>
                        <Link
                          to="/top-developer"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/top-developer')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                          <span>Add Top Developer</span>
                        </Link>
                        <Link
                          to="/users"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/users')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span>Add User</span>
                        </Link>
                        <Link
                          to="/validated-by"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/validated-by')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          <span>Add Validated By</span>
                        </Link>
                        <Link
                          to="/vendor"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/vendor')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Briefcase className="h-4 w-4" />
                          <span>Add Vendor</span>
                        </Link>
                        <Link
                          to="/user-logs"
                          onClick={() => setIsConfigurationsOpen(false)}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                            isActive('/user-logs')
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                          <span>User Logs</span>
                        </Link>
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