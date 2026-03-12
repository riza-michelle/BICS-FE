import React, { useState, useEffect } from 'react';
import { validatedByAPI } from '../services/api';
import { ValidatedBy } from '../types';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X, Users } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ValidatedByPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<ValidatedBy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<ValidatedBy | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<ValidatedBy | null>(null);
  const [formData, setFormData] = useState({
    validated_by_name: ''
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchPersonnel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const response = await validatedByAPI.getList({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setPersonnel(response.data.personnel);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching Validated By personnel:', error);
      showNotification('error', 'Error fetching Validated By personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (person?: ValidatedBy) => {
    if (person) {
      setEditingPersonnel(person);
      setFormData({
        validated_by_name: person.validated_by_name
      });
    } else {
      setEditingPersonnel(null);
      setFormData({
        validated_by_name: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPersonnel(null);
    setFormData({
      validated_by_name: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.validated_by_name.trim()) {
      showNotification('error', 'Name is required');
      return;
    }

    try {
      if (editingPersonnel) {
        // Update personnel
        const response = await validatedByAPI.update(editingPersonnel.id, {
          validated_by_name: formData.validated_by_name
        });
        if (response.success) {
          showNotification('success', 'Validated By updated successfully');
          handleCloseModal();
          fetchPersonnel();
        } else {
          showNotification('error', response.message || 'Failed to update Validated By');
        }
      } else {
        // Create new personnel
        const response = await validatedByAPI.create({
          validated_by_name: formData.validated_by_name
        });

        if (response.success) {
          showNotification('success', 'Validated By created successfully');
          handleCloseModal();
          fetchPersonnel();
        } else {
          showNotification('error', response.message || 'Failed to create Validated By');
        }
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error saving Validated By');
    }
  };

  const handleDeleteClick = (personnel: ValidatedBy) => {
    setDeleteConfirmRecord(personnel);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await validatedByAPI.delete(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'Validated By deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchPersonnel();
      } else {
        showNotification('error', response.message || 'Failed to delete Validated By');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting Validated By');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Validated By Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage Validated By personnel names</p>
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
                placeholder="Search Validated By..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Validated By
            </button>
          </div>
        </div>

        {/* Personnel Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
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
                ) : personnel.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      No Validated By personnel found
                    </td>
                  </tr>
                ) : (
                  personnel.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {person.validated_by_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.created_at ? new Date(person.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleOpenModal(person)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(person)}
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
          {!loading && personnel.length > 0 && (
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
                {editingPersonnel ? 'Edit Validated By' : 'Add New Validated By'}
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
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.validated_by_name}
                  onChange={(e) => setFormData({ ...formData, validated_by_name: e.target.value.toUpperCase() })}
                  placeholder="e.g., ADMARASIGAN, APMORILLA"
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
                  {editingPersonnel ? 'Update' : 'Create'}
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
                    Are you sure you want to delete this Validated By personnel?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Name:</strong> {deleteConfirmRecord.validated_by_name || 'N/A'}
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
                  Delete Validated By
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatedByPage;
