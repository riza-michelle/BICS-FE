import React, { useState, useEffect } from 'react';
import { moaAPI } from '../services/api';
import { MoaUpload } from '../types';
import { Upload, FileText, Trash2, Search, ChevronLeft, ChevronRight, Eye, Download, PackageOpen, Edit } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import MoaEditModal from '../components/MoaEditModal';

const MoaUploader: React.FC = () => {
  const [records, setRecords] = useState<MoaUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{
    moa: File | null;
    freebie_moa: File | null;
  }>({
    moa: null,
    freebie_moa: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editingRecord, setEditingRecord] = useState<MoaUpload | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<MoaUpload | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedYear]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await moaAPI.getList({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        year: selectedYear || undefined,
      });

      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching MOA records:', error);
      showNotification('error', 'Error fetching MOA records');
    } finally {
      setLoading(false);
    }
  };


  const handleFileChange = (fieldName: keyof typeof selectedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFiles(prev => ({
          ...prev,
          [fieldName]: file
        }));
      } else {
        showNotification('error', 'Only PDF and Microsoft Word files are allowed');
        e.target.value = '';
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      showNotification('error', 'Please enter a client name');
      return;
    }

    // Check if at least one file is selected
    const hasFiles = Object.values(selectedFiles).some(file => file !== null);
    if (!hasFiles) {
      showNotification('error', 'Please select at least one document');
      return;
    }

    setUploading(true);
    try {
      const response = await moaAPI.upload(clientName.trim(), selectedFiles);
      if (response.success) {
        showNotification('success', 'Documents uploaded successfully');
        setClientName('');
        setSelectedFiles({
          moa: null,
          freebie_moa: null,
        });
        // Reset all file inputs
        ['moa-input', 'freebie-moa-input'].forEach(id => {
          const input = document.getElementById(id) as HTMLInputElement;
          if (input) input.value = '';
        });
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Upload failed');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (id: number, docType: string) => {
    try {
      await moaAPI.viewDocument(id, docType);
    } catch (error) {
      showNotification('error', 'Error viewing document');
    }
  };

  const handleDownloadDocument = async (id: number, docType: string) => {
    try {
      await moaAPI.downloadDocument(id, docType);
      showNotification('success', 'Document downloaded successfully');
    } catch (error) {
      showNotification('error', 'Error downloading document');
    }
  };

  const handleDownloadAll = async (id: number, clientName: string) => {
    try {
      await moaAPI.downloadAll(id);
      showNotification('success', `All documents for ${clientName} downloaded successfully`);
    } catch (error) {
      showNotification('error', 'Error downloading documents');
    }
  };

  const handleDeleteClick = (record: MoaUpload) => {
    setDeleteConfirmRecord(record);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await moaAPI.delete(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'MOA file deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Delete failed');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting file');
    }
  };

  const handleUpdate = async (id: number, clientName: string, filesToAdd: any, filesToDelete: string[]) => {
    try {
      const response = await moaAPI.update(id, clientName, filesToAdd, filesToDelete);
      if (response.success) {
        showNotification('success', 'MOA record updated successfully');
        setEditingRecord(null);
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Update failed');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error updating record');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value === '' ? null : parseInt(e.target.value);
    setSelectedYear(year);
    setCurrentPage(1);
  };

  // Generate year options from 2020 to current year
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MOA Uploader</h1>
          <p className="mt-1 text-sm text-gray-600">Upload and manage MOA documents (PDF and Microsoft Word formats)</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Upload Documents
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MOA */}
              <div>
                <label htmlFor="moa-input" className="block text-sm font-medium text-gray-700 mb-1">
                  MOA
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    id="moa-input"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange('moa')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFiles.moa && (
                    <span className="text-xs text-gray-600">
                      {formatFileSize(selectedFiles.moa.size)}
                    </span>
                  )}
                </div>
              </div>

              {/* Freebie MOA */}
              <div>
                <label htmlFor="freebie-moa-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Freebie MOA
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    id="freebie-moa-input"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange('freebie_moa')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFiles.freebie_moa && (
                    <span className="text-xs text-gray-600">
                      {formatFileSize(selectedFiles.freebie_moa.size)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
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
                placeholder="Search by client name or file name..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Year:</label>
              <select
                value={selectedYear || ''}
                onChange={handleYearChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Years</option>
                {getYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MOA Files Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                    Available Documents
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Uploaded By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Upload Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      No documents found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.client_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap items-center gap-1">
                          {(record as any).moa_file_name && (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                              <span className="text-xs font-medium text-blue-800 whitespace-nowrap">MOA</span>
                              <button
                                onClick={() => handleViewDocument(record.id, 'moa')}
                                className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                                title="View document"
                              >
                                <Eye className="h-3 w-3 text-blue-700" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(record.id, 'moa')}
                                className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                                title="Download document"
                              >
                                <Download className="h-3 w-3 text-blue-700" />
                              </button>
                            </div>
                          )}
                          {(record as any).freebie_moa_file_name && (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 border border-green-200">
                              <span className="text-xs font-medium text-green-800 whitespace-nowrap">Freebie MOA</span>
                              <button
                                onClick={() => handleViewDocument(record.id, 'freebie_moa')}
                                className="p-0.5 hover:bg-green-200 rounded transition-colors"
                                title="View document"
                              >
                                <Eye className="h-3 w-3 text-green-700" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(record.id, 'freebie_moa')}
                                className="p-0.5 hover:bg-green-200 rounded transition-colors"
                                title="Download document"
                              >
                                <Download className="h-3 w-3 text-green-700" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.uploaded_by_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-4 text-sm font-medium">
                        <div className="flex flex-row items-center gap-2 flex-nowrap">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit MOA record"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadAll(record.id, record.client_name)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Download all documents as ZIP"
                          >
                            <PackageOpen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Edit Modal */}
        {editingRecord && (
          <MoaEditModal
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSave={handleUpdate}
          />
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
                      Are you sure you want to delete this MOA record?
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Client Name:</strong> {deleteConfirmRecord.client_name || 'N/A'}
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
                    Delete MOA Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoaUploader;
