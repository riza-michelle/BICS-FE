import React, { useState, useEffect, useCallback } from 'react';
import { cobInventoryAPI } from '../services/api';
import { CobInventory as CobInventoryType, EpcBatchOption, SaqPersonnelOption } from '../types';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Download,
  FileText,
  X,
  Archive
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['For Signing', 'Signed', 'For Implementation', 'Completed'];

const CobInventory: React.FC = () => {
  const [records, setRecords] = useState<CobInventoryType[]>([]);
  const [batches, setBatches] = useState<EpcBatchOption[]>([]);
  const [saqPersonnel, setSaqPersonnel] = useState<SaqPersonnelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Form states for adding new record
  const [submitting, setSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('For Signing');
  const [bwSpeed, setBwSpeed] = useState('');
  const [uploaderId, setUploaderId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CobInventoryType | null>(null);
  const [editFormData, setEditFormData] = useState({
    client_name: '',
    batch_number: '',
    duration: '',
    status: 'For Signing',
    bw_speed: '',
    uploader_id: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await cobInventoryAPI.getList({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      });

      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching CDRF Routing records:', error);
      showNotification('error', 'Error fetching CDRF Routing records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, showNotification]);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await cobInventoryAPI.getBatches();
      if (response.success && response.data) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  }, []);

  const fetchSaqPersonnel = useCallback(async () => {
    try {
      const response = await cobInventoryAPI.getSaqPersonnel();
      if (response.success && response.data) {
        setSaqPersonnel(response.data);
      }
    } catch (error) {
      console.error('Error fetching SAQ personnel:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchBatches();
    fetchSaqPersonnel();
  }, [fetchBatches, fetchSaqPersonnel]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        showNotification('error', 'Only PDF files are allowed');
        e.target.value = '';
      }
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setEditFile(file);
        setRemoveFile(false);
      } else {
        showNotification('error', 'Only PDF files are allowed');
        e.target.value = '';
      }
    }
  };

  const resetForm = () => {
    setClientName('');
    setBatchNumber('');
    setDuration('');
    setStatus('For Signing');
    setBwSpeed('');
    setUploaderId('');
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById('cob-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      showNotification('error', 'Client Name is required');
      return;
    }

    if (!selectedFile) {
      showNotification('error', 'PDF file upload is required');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('client_name', clientName.trim());
      data.append('status', status);
      if (batchNumber) {
        data.append('batch_number', batchNumber);
      }
      if (duration) {
        data.append('duration', duration);
      }
      if (bwSpeed) {
        data.append('bw_speed', bwSpeed);
      }
      if (uploaderId) {
        data.append('uploader_id', uploaderId);
      }
      data.append('file', selectedFile);

      const response = await cobInventoryAPI.create(data);
      if (response.success) {
        showNotification('success', 'CDRF Routing record created successfully');
        resetForm();
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Failed to create record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error creating record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (record: CobInventoryType) => {
    setSelectedRecord(record);
    setEditFormData({
      client_name: record.client_name || '',
      batch_number: record.batch_number?.toString() || '',
      duration: record.duration || '',
      status: record.status || 'For Signing',
      bw_speed: record.bw_speed || '',
      uploader_id: record.uploader_id?.toString() || '',
    });
    setEditFile(null);
    setRemoveFile(false);
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (record: CobInventoryType) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedRecord(null);
    setEditFile(null);
    setRemoveFile(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecord) return;

    if (!editFormData.client_name.trim()) {
      showNotification('error', 'Client Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('client_name', editFormData.client_name.trim());
      data.append('status', editFormData.status);
      data.append('batch_number', editFormData.batch_number || '');
      data.append('duration', editFormData.duration || '');
      data.append('bw_speed', editFormData.bw_speed || '');
      data.append('uploader_id', editFormData.uploader_id || '');
      if (removeFile) {
        data.append('remove_file', 'true');
      }
      if (editFile) {
        data.append('file', editFile);
      }

      const response = await cobInventoryAPI.update(selectedRecord.id, data);
      if (response.success) {
        showNotification('success', 'CDRF Routing record updated successfully');
        handleCloseModals();
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Failed to update record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error updating record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const response = await cobInventoryAPI.delete(selectedRecord.id);
      if (response.success) {
        showNotification('success', 'CDRF Routing record deleted successfully');
        handleCloseModals();
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Failed to delete record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (record: CobInventoryType) => {
    try {
      const blob = await cobInventoryAPI.download(record.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.file_name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification('success', 'File downloaded successfully');
    } catch (error) {
      showNotification('error', 'Error downloading file');
    }
  };

  const getStatusBadgeClass = (statusValue: string) => {
    switch (statusValue) {
      case 'For Signing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Signed':
        return 'bg-blue-100 text-blue-800';
      case 'For Implementation':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CDRF Routing</h1>
          <p className="mt-1 text-sm text-gray-600">Manage CDRF Routing records (PDF uploads)</p>
        </div>

        {/* Add Record Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Archive className="h-5 w-5 mr-2 text-blue-600" />
            Add CDRF Routing Record
          </h2>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Uploader */}
              <div>
                <label htmlFor="uploader" className="block text-sm font-medium text-gray-700 mb-1">
                  Uploader
                </label>
                <select
                  id="uploader"
                  value={uploaderId}
                  onChange={(e) => setUploaderId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Uploader</option>
                  {saqPersonnel.map((person) => (
                    <option key={person.id} value={person.id}>{person.personnel_name}</option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div>
                <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="client-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batch Number */}
              <div>
                <label htmlFor="batch-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number
                </label>
                <select
                  id="batch-number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.batch_name}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  id="duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 6 months, 1 year"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BW Speed */}
              <div>
                <label htmlFor="bw-speed" className="block text-sm font-medium text-gray-700 mb-1">
                  BW Speed
                </label>
                <input
                  id="bw-speed"
                  type="text"
                  value={bwSpeed}
                  onChange={(e) => setBwSpeed(e.target.value)}
                  placeholder="e.g., 100 Mbps, 1 Gbps"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Upload PDF */}
              <div>
                <label htmlFor="cob-file-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload PDF File <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    id="cob-file-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <span className="text-xs text-gray-600">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name or batch..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Status</option>
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">{totalRecords} total records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BW Speed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.uploader_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.client_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.batch_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.duration || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.bw_speed || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.file_name ? (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-gray-600 truncate max-w-[150px]" title={record.file_name}>
                              {record.file_name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({formatFileSize(record.file_size)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {record.file_name && (
                            <button
                              onClick={() => handleDownload(record)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Download File"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user?.role === 'Admin' && (
                            <button
                              onClick={() => handleOpenDeleteModal(record)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && records.length > 0 && (
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

      {/* Edit Modal */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={handleCloseModals}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitEdit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit CDRF Routing Record</h3>
                    <button type="button" onClick={handleCloseModals} className="text-gray-400 hover:text-gray-500">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Uploader</label>
                      <select
                        value={editFormData.uploader_id}
                        onChange={(e) => setEditFormData({ ...editFormData, uploader_id: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Uploader</option>
                        {saqPersonnel.map((person) => (
                          <option key={person.id} value={person.id}>{person.personnel_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.client_name}
                        onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter client name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                      <select
                        value={editFormData.batch_number}
                        onChange={(e) => setEditFormData({ ...editFormData, batch_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Batch</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>{batch.batch_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <input
                        type="text"
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 6 months, 1 year"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">BW Speed</label>
                      <input
                        type="text"
                        value={editFormData.bw_speed}
                        onChange={(e) => setEditFormData({ ...editFormData, bw_speed: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 100 Mbps, 1 Gbps"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload PDF File</label>
                      {selectedRecord.file_name && !removeFile && !editFile && (
                        <div className="mt-1 flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm text-gray-600">{selectedRecord.file_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRemoveFile(true)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {(removeFile || !selectedRecord.file_name) && (
                        <div className="mt-1">
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleEditFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {editFile && (
                            <span className="mt-1 text-sm text-gray-600">{editFile.name}</span>
                          )}
                        </div>
                      )}
                      {editFile && selectedRecord.file_name && !removeFile && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">New file selected: {editFile.name}</p>
                          <p className="text-xs text-gray-500">This will replace the existing file.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={handleCloseModals}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Record</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the record for "{selectedRecord.client_name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CobInventory;
