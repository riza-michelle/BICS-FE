import React, { useState, useEffect } from 'react';
import { relationshipManagerAPI } from '../services/api';
import { RelationshipManager } from '../types';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X, Users, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useNotification } from '../context/NotificationContext';

const RelationshipManagerPage: React.FC = () => {
  const [relationshipManagers, setRelationshipManagers] = useState<RelationshipManager[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingRelationshipManager, setEditingRelationshipManager] = useState<RelationshipManager | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<RelationshipManager | null>(null);
  const [formData, setFormData] = useState({
    relationship_manager: '',
    relationship_manager_group: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchRelationshipManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const fetchRelationshipManagers = async () => {
    setLoading(true);
    try {
      const response = await relationshipManagerAPI.getList({
        page: currentPage,
        limit: 50,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setRelationshipManagers(response.data.relationshipManagers);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching relationship managers:', error);
      showNotification('error', 'Error fetching relationship managers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (relationshipManager?: RelationshipManager) => {
    if (relationshipManager) {
      setEditingRelationshipManager(relationshipManager);
      setFormData({
        relationship_manager: relationshipManager.relationship_manager,
        relationship_manager_group: relationshipManager.relationship_manager_group
      });
    } else {
      setEditingRelationshipManager(null);
      setFormData({
        relationship_manager: '',
        relationship_manager_group: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRelationshipManager(null);
    setFormData({
      relationship_manager: '',
      relationship_manager_group: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.relationship_manager.trim()) {
      showNotification('error', 'Relationship Manager is required');
      return;
    }

    if (!formData.relationship_manager_group.trim()) {
      showNotification('error', 'Relationship Manager Group is required');
      return;
    }

    try {
      const requestData = {
        relationship_manager: formData.relationship_manager,
        relationship_manager_group: formData.relationship_manager_group
      };

      if (editingRelationshipManager) {
        // Update relationship manager
        const response = await relationshipManagerAPI.update(editingRelationshipManager.id, requestData);
        if (response.success) {
          showNotification('success', 'Relationship Manager updated successfully');
          handleCloseModal();
          fetchRelationshipManagers();
        } else {
          showNotification('error', response.message || 'Failed to update relationship manager');
        }
      } else {
        // Create new relationship manager
        const response = await relationshipManagerAPI.create(requestData);

        if (response.success) {
          showNotification('success', 'Relationship Manager created successfully');
          handleCloseModal();
          fetchRelationshipManagers();
        } else {
          showNotification('error', response.message || 'Failed to create relationship manager');
        }
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error saving relationship manager');
    }
  };

  const handleDeleteClick = (relationshipManager: RelationshipManager) => {
    setDeleteConfirmRecord(relationshipManager);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await relationshipManagerAPI.delete(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'Relationship Manager deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchRelationshipManagers();
      } else {
        showNotification('error', response.message || 'Failed to delete relationship manager');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting relationship manager');
    }
  };

  const handleOpenUploadModal = () => {
    setUploadFile(null);
    setUploadResult(null);
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      showNotification('error', 'Please select a file');
      return;
    }
    setUploading(true);
    try {
      const response = await relationshipManagerAPI.importExcel(uploadFile);
      if (response.success) {
        setUploadResult(response.data);
        fetchRelationshipManagers();
      } else {
        showNotification('error', response.message || 'Upload failed');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Relationship Manager', 'Relationship Manager Group'];
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Style the header row
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E40AF' } },
        alignment: { horizontal: 'center' }
      };
    });

    ws['!cols'] = [{ wch: 30 }, { wch: 35 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relationship Managers');
    XLSX.writeFile(wb, 'relationship_manager_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relationship Manager Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage relationship managers and their groups</p>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search relationship managers..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleOpenUploadModal}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-5 w-5 mr-2" />
                Bulk Upload
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Relationship Manager
              </button>
            </div>
          </div>
        </div>

        {/* Relationship Managers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relationship Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relationship Manager Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : relationshipManagers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      No relationship managers found
                    </td>
                  </tr>
                ) : (
                  relationshipManagers.map((rm) => (
                    <tr key={rm.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rm.relationship_manager}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rm.relationship_manager_group}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rm.created_at ? new Date(rm.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleOpenModal(rm)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rm)}
                            className="inline-flex items-center text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && relationshipManagers.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 50 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 50, totalRecords)}</span> of{' '}
                    <span className="font-medium">{totalRecords}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
              <h2 className="text-xl font-bold">
                {editingRelationshipManager ? 'Edit Relationship Manager' : 'Add New Relationship Manager'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Manager *
                </label>
                <input
                  type="text"
                  value={formData.relationship_manager}
                  onChange={(e) => setFormData({ ...formData, relationship_manager: e.target.value.toUpperCase() })}
                  placeholder="Enter relationship manager name"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Manager Group *
                </label>
                <input
                  type="text"
                  value={formData.relationship_manager_group}
                  onChange={(e) => setFormData({ ...formData, relationship_manager_group: e.target.value.toUpperCase() })}
                  placeholder="Enter relationship manager group"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingRelationshipManager ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Bulk Upload Relationship Managers</h2>
              <button
                onClick={handleCloseUploadModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!uploadResult ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an Excel file with columns: <strong>Relationship Manager</strong> and <strong>Relationship Manager Group</strong>.
                    Existing entries will be skipped.
                  </p>

                  <button
                    onClick={handleDownloadTemplate}
                    className="mb-4 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Template
                  </button>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-sm text-blue-600 font-medium hover:underline">
                        {uploadFile ? uploadFile.name : 'Click to select an Excel file'}
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {!uploadFile && (
                      <p className="text-xs text-gray-400 mt-1">.xlsx or .xls, max 5MB</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseUploadModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={!uploadFile || uploading}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="bg-green-100 rounded-lg px-4 py-2 text-center">
                        <p className="text-2xl font-bold text-green-700">{uploadResult.inserted}</p>
                        <p className="text-xs text-green-600">Added</p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg px-4 py-2 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{uploadResult.skipped}</p>
                        <p className="text-xs text-yellow-600">Skipped</p>
                      </div>
                      {uploadResult.errors.length > 0 && (
                        <div className="bg-red-100 rounded-lg px-4 py-2 text-center">
                          <p className="text-2xl font-bold text-red-700">{uploadResult.errors.length}</p>
                          <p className="text-xs text-red-600">Errors</p>
                        </div>
                      )}
                    </div>

                    {uploadResult.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs font-medium text-red-700 mb-1">Row errors:</p>
                        {uploadResult.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseUploadModal}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-red-100 rounded-full p-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to delete this relationship manager?
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Relationship Manager:</strong> {deleteConfirmRecord.relationship_manager || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Group:</strong> {deleteConfirmRecord.relationship_manager_group || 'N/A'}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Relationship Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipManagerPage;
