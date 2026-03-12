import React, { useState, useEffect } from 'react';
import { topDeveloperAPI } from '../services/api';
import { TopDeveloper } from '../types';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X, Building } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const TopDeveloperPage: React.FC = () => {
  const [topDevelopers, setTopDevelopers] = useState<TopDeveloper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTopDeveloper, setEditingTopDeveloper] = useState<TopDeveloper | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<TopDeveloper | null>(null);
  const [formData, setFormData] = useState({
    top_developer_name: ''
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchTopDevelopers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const fetchTopDevelopers = async () => {
    setLoading(true);
    try {
      const response = await topDeveloperAPI.getList({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setTopDevelopers(response.data.topDevelopers);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching top developers:', error);
      showNotification('error', 'Error fetching top developers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (topDeveloper?: TopDeveloper) => {
    if (topDeveloper) {
      setEditingTopDeveloper(topDeveloper);
      setFormData({
        top_developer_name: topDeveloper.top_developer_name
      });
    } else {
      setEditingTopDeveloper(null);
      setFormData({
        top_developer_name: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTopDeveloper(null);
    setFormData({
      top_developer_name: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.top_developer_name.trim()) {
      showNotification('error', 'Top Developer Name is required');
      return;
    }

    try {
      const requestData = {
        top_developer_name: formData.top_developer_name
      };

      if (editingTopDeveloper) {
        // Update top developer
        const response = await topDeveloperAPI.update(editingTopDeveloper.id, requestData);
        if (response.success) {
          showNotification('success', 'Top Developer updated successfully');
          handleCloseModal();
          fetchTopDevelopers();
        } else {
          showNotification('error', response.message || 'Failed to update top developer');
        }
      } else {
        // Create new top developer
        const response = await topDeveloperAPI.create(requestData);

        if (response.success) {
          showNotification('success', 'Top Developer created successfully');
          handleCloseModal();
          fetchTopDevelopers();
        } else {
          showNotification('error', response.message || 'Failed to create top developer');
        }
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error saving top developer');
    }
  };

  const handleDeleteClick = (topDeveloper: TopDeveloper) => {
    setDeleteConfirmRecord(topDeveloper);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await topDeveloperAPI.delete(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'Top Developer deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchTopDevelopers();
      } else {
        showNotification('error', response.message || 'Failed to delete top developer');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting top developer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Top Developer Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage top developer names</p>
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
                placeholder="Search top developers..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Top Developer
            </button>
          </div>
        </div>

        {/* Top Developers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Developer Name
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
                    <td colSpan={3} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : topDevelopers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      <Building className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      No top developers found
                    </td>
                  </tr>
                ) : (
                  topDevelopers.map((topDeveloper) => (
                    <tr key={topDeveloper.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {topDeveloper.top_developer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {topDeveloper.created_at ? new Date(topDeveloper.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleOpenModal(topDeveloper)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(topDeveloper)}
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
          {!loading && topDevelopers.length > 0 && (
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
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalRecords)}</span> of{' '}
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
                {editingTopDeveloper ? 'Edit Top Developer' : 'Add New Top Developer'}
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
                  Top Developer Name *
                </label>
                <input
                  type="text"
                  value={formData.top_developer_name}
                  onChange={(e) => setFormData({ ...formData, top_developer_name: e.target.value.toUpperCase() })}
                  placeholder="e.g., DMCI, Ayala Land, SM Development"
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
                  {editingTopDeveloper ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
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
                    Are you sure you want to delete this top developer?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Top Developer Name:</strong> {deleteConfirmRecord.top_developer_name || 'N/A'}
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
                  Delete Top Developer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopDeveloperPage;
