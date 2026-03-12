import React, { useState, useEffect, useCallback } from 'react';
import { userLogsAPI, usersAPI } from '../services/api';
import { Activity, Download, Trash2, Filter as FilterIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface UserLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  user_agent: string | null;
  details: any;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  fullname?: string;
}

const UserLogs: React.FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const { user } = useAuth();
  const { showNotification } = useNotification();

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (filterUserId) filters.user_id = parseInt(filterUserId);
      if (filterAction) filters.action = filterAction;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;

      const response = await userLogsAPI.getUserLogs(currentPage, itemsPerPage, searchTerm, filters);

      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setTotalRecords(response.data.pagination?.total_records || 0);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error loading user logs');
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filterUserId, filterAction, filterDateFrom, filterDateTo, searchTerm, showNotification]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getList({ page: 1, limit: 1000 });
      if (response.success && response.data?.users) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActions = async () => {
    try {
      const response = await userLogsAPI.getActions();
      if (response.success && response.data) {
        setActions(response.data);
      }
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadUsers();
    loadActions();
  }, []);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterUserId('');
    setFilterAction('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleExportLogs = async () => {
    try {
      setExportLoading(true);
      const blob = await userLogsAPI.exportAllLogs();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('success', 'User logs exported successfully');
    } catch (error: any) {
      console.error('Error exporting logs:', error);
      showNotification('error', error.response?.data?.message || 'Error exporting logs');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAllLogs = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAllLogs = async () => {
    try {
      setDeleteAllLoading(true);
      const response = await userLogsAPI.deleteAllLogs();
      if (response.success) {
        setLogs([]);
        setTotalRecords(0);
        setTotalPages(1);
        setCurrentPage(1);
        setShowDeleteAllModal(false);
        setDeleteConfirmationText('');
        showNotification('success', `Successfully deleted ${response.data?.deleted_count || 0} log entries`);
        loadLogs();
      } else {
        showNotification('error', response.message || 'Failed to delete logs');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting logs');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const closeDeleteAllModal = () => {
    setShowDeleteAllModal(false);
    setDeleteConfirmationText('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    const colors = {
      // Auth
      login:                        'bg-green-100 text-green-800 border-green-200',
      logout:                       'bg-gray-100 text-gray-800 border-gray-200',
      change_password:              'bg-yellow-100 text-yellow-800 border-yellow-200',
      forgot_password_reset:        'bg-yellow-100 text-yellow-800 border-yellow-200',
      // BICS Records
      create_record:                'bg-blue-100 text-blue-800 border-blue-200',
      update_record:                'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_record:                'bg-red-100 text-red-800 border-red-200',
      delete_all_records:           'bg-red-100 text-red-800 border-red-200',
      duplicate_record:             'bg-purple-100 text-purple-800 border-purple-200',
      import_excel:                 'bg-blue-100 text-blue-800 border-blue-200',
      // MOA
      upload_moa:                   'bg-blue-100 text-blue-800 border-blue-200',
      update_moa:                   'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_moa:                   'bg-red-100 text-red-800 border-red-200',
      // EPC Batch
      create_epc_batch:             'bg-blue-100 text-blue-800 border-blue-200',
      update_epc_batch:             'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_epc_batch:             'bg-red-100 text-red-800 border-red-200',
      // Vendor
      create_vendor:                'bg-blue-100 text-blue-800 border-blue-200',
      update_vendor:                'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_vendor:                'bg-red-100 text-red-800 border-red-200',
      // SAQ Personnel
      create_saq_personnel:         'bg-blue-100 text-blue-800 border-blue-200',
      update_saq_personnel:         'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_saq_personnel:         'bg-red-100 text-red-800 border-red-200',
      // FCO Personnel
      create_fco_personnel:         'bg-blue-100 text-blue-800 border-blue-200',
      update_fco_personnel:         'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_fco_personnel:         'bg-red-100 text-red-800 border-red-200',
      // Top Developer
      create_top_developer:         'bg-blue-100 text-blue-800 border-blue-200',
      update_top_developer:         'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_top_developer:         'bg-red-100 text-red-800 border-red-200',
      // Relationship Manager
      create_relationship_manager:  'bg-blue-100 text-blue-800 border-blue-200',
      update_relationship_manager:  'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_relationship_manager:  'bg-red-100 text-red-800 border-red-200',
      // Validated By
      create_validated_by:          'bg-blue-100 text-blue-800 border-blue-200',
      update_validated_by:          'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_validated_by:          'bg-red-100 text-red-800 border-red-200',
      // COB Inventory
      create_cob_inventory:         'bg-blue-100 text-blue-800 border-blue-200',
      update_cob_inventory:         'bg-yellow-100 text-yellow-800 border-yellow-200',
      delete_cob_inventory:         'bg-red-100 text-red-800 border-red-200',
      // System
      delete_all_logs:              'bg-red-100 text-red-800 border-red-200',
    };
    return colors[action as keyof typeof colors] || 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const formatActionLabel = (action: string, details?: any) => {
    const labels: { [key: string]: string } = {
      // Auth
      login:                       'Login',
      logout:                      'Logout',
      change_password:             'Change Password',
      forgot_password_reset:       'Password Reset',
      // BICS Records
      create_record:               'Create Record',
      update_record:               'Update Record',
      delete_record:               'Delete Record',
      delete_all_records:          'Delete All Records',
      duplicate_record:            'Duplicate Record',
      import_excel:                'Bulk Upload Excel',
      // MOA
      upload_moa:                  'Upload MOA',
      update_moa:                  'Update MOA',
      delete_moa:                  'Delete MOA',
      // EPC Batch
      create_epc_batch:            'Create EPC Batch',
      update_epc_batch:            'Update EPC Batch',
      delete_epc_batch:            'Delete EPC Batch',
      // Vendor
      create_vendor:               'Create Vendor',
      update_vendor:               'Update Vendor',
      delete_vendor:               'Delete Vendor',
      // SAQ Personnel
      create_saq_personnel:        'Create SAQ Personnel',
      update_saq_personnel:        'Update SAQ Personnel',
      delete_saq_personnel:        'Delete SAQ Personnel',
      // FCO Personnel
      create_fco_personnel:        'Create FCO Personnel',
      update_fco_personnel:        'Update FCO Personnel',
      delete_fco_personnel:        'Delete FCO Personnel',
      // Top Developer
      create_top_developer:        'Create Top Developer',
      update_top_developer:        'Update Top Developer',
      delete_top_developer:        'Delete Top Developer',
      // Relationship Manager
      create_relationship_manager: 'Create Relationship Manager',
      update_relationship_manager: 'Update Relationship Manager',
      delete_relationship_manager: 'Delete Relationship Manager',
      // Validated By
      create_validated_by:         'Create Validated By',
      update_validated_by:         'Update Validated By',
      delete_validated_by:         'Delete Validated By',
      // COB Inventory
      create_cob_inventory:        'Create COB Inventory',
      update_cob_inventory:        'Update COB Inventory',
      delete_cob_inventory:        'Delete COB Inventory',
      // System
      delete_all_logs:             'Delete All Logs',
    };

    let actionText = labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Add entity name for create/delete operations
    if (details) {
      if ((action.includes('create') || action.includes('delete')) && !action.includes('record') && !action.includes('all')) {
        if (details.vendor_name) {
          actionText += ` - ${details.vendor_name}`;
        } else if (details.personnel_name) {
          actionText += ` - ${details.personnel_name}`;
        } else if (details.batch_name) {
          actionText += ` - ${details.batch_name}`;
        } else if (details.client_name) {
          actionText += ` - ${details.client_name}`;
        } else if (details.top_developer_name) {
          actionText += ` - ${details.top_developer_name}`;
        } else if (details.relationship_manager) {
          actionText += ` - ${details.relationship_manager}`;
        } else if (details.validated_by_name) {
          actionText += ` - ${details.validated_by_name}`;
        }
      }

      // Add changes for update operations
      if (action.includes('update') && details.changes) {
        const changes: string[] = [];
        Object.entries(details.changes).forEach(([field, change]: [string, any]) => {
          if (typeof change === 'object' && change.from !== undefined && change.to !== undefined) {
            if (['vendor_name', 'personnel_name', 'batch_name', 'client_name', 'top_developer_name',
                 'relationship_manager', 'validated_by_name'].includes(field)) {
              changes.push(`"${change.from}" → "${change.to}"`);
            }
          }
        });
        if (changes.length > 0) {
          actionText += ` (${changes.join(', ')})`;
        }
      }
    }

    return actionText;
  };

  const formatDetails = (details: any, action: string) => {
    if (!details) return null;

    if (action.includes('update') && details.changes) {
      const changesList = Object.entries(details.changes).map(([field, change]: [string, any]) => {
        if (field === 'documents_added' || field === 'documents_deleted') {
          return null;
        }

        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const fromValue = change.from !== null && change.from !== undefined && change.from !== ''
          ? String(change.from)
          : 'empty';
        const toValue = change.to !== null && change.to !== undefined && change.to !== ''
          ? String(change.to)
          : 'empty';

        return (
          <div key={field} className="mb-1">
            <span className="font-semibold text-gray-700">{fieldName}:</span>{' '}
            <span className="text-gray-600">"{fromValue}"</span>{' '}
            <span className="text-gray-500">→</span>{' '}
            <span className="text-blue-600">"{toValue}"</span>
          </div>
        );
      }).filter(Boolean);

      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            {changesList}
            {details.changes.documents_added && details.changes.documents_added.length > 0 && (
              <div className="mb-1">
                <span className="font-semibold text-gray-700">Documents Added:</span>{' '}
                <span className="text-green-600">{details.changes.documents_added.join(', ')}</span>
              </div>
            )}
            {details.changes.documents_deleted && details.changes.documents_deleted.length > 0 && (
              <div className="mb-1">
                <span className="font-semibold text-gray-700">Documents Deleted:</span>{' '}
                <span className="text-red-600">{details.changes.documents_deleted.join(', ')}</span>
              </div>
            )}
            {details.vendor_name && (
              <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
                Vendor: {details.vendor_name}
              </div>
            )}
            {details.personnel_name && (
              <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
                Personnel: {details.personnel_name}
              </div>
            )}
            {details.site_name && (
              <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
                Site: {details.site_name} {details.building_name && `(${details.building_name})`}
              </div>
            )}
            {details.client_name && (
              <div className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
                Client: {details.client_name}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Duplicate record
    if (action === 'duplicate_record') {
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            {details.site_name && <div><span className="font-semibold text-gray-700">Site:</span> {details.site_name}</div>}
            {details.original_id && <div><span className="font-semibold text-gray-700">Original ID:</span> {details.original_id}</div>}
            {details.new_id && <div><span className="font-semibold text-gray-700">New Record ID:</span> <span className="text-purple-600">{details.new_id}</span></div>}
          </div>
        </div>
      );
    }

    // Delete all records
    if (action === 'delete_all_records') {
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            <div><span className="font-semibold text-gray-700">Total Deleted:</span> <span className="text-red-600">{details.deleted_count}</span> record(s)</div>
          </div>
        </div>
      );
    }

    // Bulk upload (import_excel)
    if (action === 'import_excel') {
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            {details.filename && <div><span className="font-semibold text-gray-700">File:</span> {details.filename}</div>}
            {details.total_records !== undefined && <div><span className="font-semibold text-gray-700">Total Rows:</span> {details.total_records}</div>}
            {details.success_count !== undefined && <div><span className="font-semibold text-gray-700">Imported:</span> <span className="text-green-600">{details.success_count}</span></div>}
            {details.error_count !== undefined && details.error_count > 0 && <div><span className="font-semibold text-gray-700">Errors:</span> <span className="text-red-600">{details.error_count}</span></div>}
          </div>
        </div>
      );
    }

    if (action.includes('create') || action.includes('delete') || action.includes('upload')) {
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="text-xs">
            {details.vendor_name && (
              <div><span className="font-semibold text-gray-700">Vendor:</span> {details.vendor_name}</div>
            )}
            {details.personnel_name && (
              <div><span className="font-semibold text-gray-700">Personnel:</span> {details.personnel_name}</div>
            )}
            {details.batch_name && (
              <div><span className="font-semibold text-gray-700">Batch:</span> {details.batch_name}</div>
            )}
            {details.client_name && (
              <div><span className="font-semibold text-gray-700">Client:</span> {details.client_name}</div>
            )}
            {details.site_name && (
              <div><span className="font-semibold text-gray-700">Site:</span> {details.site_name}</div>
            )}
            {details.building_name && (
              <div><span className="font-semibold text-gray-700">Building:</span> {details.building_name}</div>
            )}
            {details.epc_batch && (
              <div><span className="font-semibold text-gray-700">EPC Batch:</span> {details.epc_batch}</div>
            )}
            {details.project_status && (
              <div><span className="font-semibold text-gray-700">Status:</span> {details.project_status}</div>
            )}
            {details.top_developer_name && (
              <div><span className="font-semibold text-gray-700">Top Developer:</span> {details.top_developer_name}</div>
            )}
            {details.relationship_manager && (
              <div><span className="font-semibold text-gray-700">Relationship Manager:</span> {details.relationship_manager}</div>
            )}
            {details.relationship_manager_group && (
              <div><span className="font-semibold text-gray-700">RM Group:</span> {details.relationship_manager_group}</div>
            )}
            {details.validated_by_name && (
              <div><span className="font-semibold text-gray-700">Validated By:</span> {details.validated_by_name}</div>
            )}
            {details.documents_uploaded && details.documents_uploaded.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Documents Uploaded:</span>{' '}
                <span className="text-blue-600">{details.documents_uploaded.join(', ')}</span>
              </div>
            )}
            {details.documents_deleted && details.documents_deleted.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Documents Deleted:</span>{' '}
                <span className="text-red-600">{details.documents_deleted.join(', ')}</span>
              </div>
            )}
            {details.deleted_count !== undefined && (
              <div>
                <span className="font-semibold text-gray-700">Records Deleted:</span>{' '}
                <span className="text-red-600">{details.deleted_count}</span>
              </div>
            )}
            {details.message && (
              <div className="text-gray-600 mt-1">{details.message}</div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageNumbers.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border text-sm rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white border-blue-600 font-bold'
              : 'border-gray-300 bg-white hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-gray-600">
          Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalRecords)}</strong> of{' '}
          <strong>{totalRecords}</strong> entries
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm mr-2">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {pageNumbers}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 bg-white text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">User Logs</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track user login and activity logs (Admin only - Logs older than 30 days are automatically deleted)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Username, action, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullname || user.username} ({user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{formatActionLabel(action, undefined)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFilterChange}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportLogs}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {exportLoading ? 'Exporting...' : 'Export All Logs'}
            </button>
            {user?.role === 'Super Admin' && (
              <button
                onClick={handleDeleteAllLogs}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4" />
                Delete All Logs
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                        {log.username || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-block text-left">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getActionBadge(log.action)}`}>
                            {formatActionLabel(log.action, log.details)}
                          </span>
                          {formatDetails(log.details, log.action)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}
      </div>

      {/* Delete All Logs Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeDeleteAllModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete All User Logs</h3>
              <button
                onClick={closeDeleteAllModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4 text-gray-700">
                Are you sure you want to delete ALL user logs?
              </p>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="font-bold mb-2 text-red-700">Warning:</div>
                <div className="text-sm text-red-800">
                  <div className="mb-1">Total logs to be deleted: <strong>{totalRecords}</strong></div>
                  <div className="mb-1">This action is permanent and cannot be undone.</div>
                  <div>A system audit log will be created recording this deletion.</div>
                </div>
              </div>

              <p className="text-red-600 text-sm font-medium mb-2">
                Type "DELETE ALL" below to confirm this irreversible action:
              </p>

              <input
                type="text"
                placeholder="Type DELETE ALL to confirm"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteAllModal}
                disabled={deleteAllLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAllLogs}
                disabled={deleteAllLoading || deleteConfirmationText !== 'DELETE ALL'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAllLoading ? 'Deleting...' : 'Delete All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLogs;
