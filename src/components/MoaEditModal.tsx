import React, { useState } from 'react';
import { MoaUpload } from '../types';
import { X, Upload, FileText } from 'lucide-react';

interface MoaEditModalProps {
  record: MoaUpload;
  onClose: () => void;
  onSave: (id: number, clientName: string, filesToAdd: any, filesToDelete: string[]) => Promise<void>;
}

const MoaEditModal: React.FC<MoaEditModalProps> = ({ record, onClose, onSave }) => {
  const [clientName, setClientName] = useState(record.client_name);
  const [filesToAdd, setFilesToAdd] = useState<{
    moa: File | null;
    freebie_moa: File | null;
  }>({
    moa: null,
    freebie_moa: null,
  });
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const documentTypes = [
    { key: 'moa', label: 'MOA', color: 'blue' },
    { key: 'freebie_moa', label: 'Freebie MOA', color: 'green' },
  ];

  const handleFileChange = (docType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(file.type)) {
        setFilesToAdd(prev => ({
          ...prev,
          [docType]: file
        }));
      } else {
        alert('Only PDF and Microsoft Word files are allowed');
        e.target.value = '';
      }
    }
  };

  const toggleDelete = (docType: string) => {
    setFilesToDelete(prev =>
      prev.includes(docType)
        ? prev.filter(d => d !== docType)
        : [...prev, docType]
    );
  };

  const hasExistingFile = (docType: string): boolean => {
    return !!(record as any)[`${docType}_file_name`];
  };

  const isMarkedForDeletion = (docType: string): boolean => {
    return filesToDelete.includes(docType);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Please enter a client name');
      return;
    }

    setLoading(true);
    try {
      await onSave(record.id, clientName, filesToAdd, filesToDelete);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit MOA Upload</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Client Name */}
          <div className="mb-6">
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>

            {documentTypes.map(({ key, label, color }) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{label}</h4>
                  {hasExistingFile(key) && (
                    <button
                      type="button"
                      onClick={() => toggleDelete(key)}
                      className={`text-xs px-2 py-1 rounded ${
                        isMarkedForDeletion(key)
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {isMarkedForDeletion(key) ? 'Marked for deletion' : 'Mark for deletion'}
                    </button>
                  )}
                </div>

                {/* Existing File */}
                {hasExistingFile(key) && (
                  <div className={`mb-2 p-2 rounded ${isMarkedForDeletion(key) ? 'bg-red-50 opacity-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          Current: {(record as any)[`${key}_file_name`]}
                        </span>
                      </div>
                      {(record as any)[`${key}_file_size`] && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize((record as any)[`${key}_file_size`])}
                        </span>
                      )}
                    </div>
                    {isMarkedForDeletion(key) && (
                      <p className="text-xs text-red-600 mt-1">This file will be deleted</p>
                    )}
                  </div>
                )}

                {/* New File Upload */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {hasExistingFile(key) ? 'Replace with new file:' : 'Upload file:'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange(key)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {filesToAdd[key as keyof typeof filesToAdd] && (
                    <p className="text-xs text-green-600 mt-1">
                      New file selected: {filesToAdd[key as keyof typeof filesToAdd]?.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoaEditModal;
