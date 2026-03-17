import React, { useState, useEffect } from 'react';
import { pendingRecordsAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, Eye, X, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import PendingEditModal from '../components/PendingEditModal';

interface PendingRecord {
  id: number;
  record_data: Record<string, any>;
  submitted_by: number;
  submitted_username: string;
  submitted_at: string;
  status: string;
  reviewed_by: number | null;
  reviewed_username: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type Tab = typeof STATUS_TABS[number];

const MY_SUBMISSIONS_LAST_VISIT_KEY = 'mySubmissionsLastVisit';

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [viewRecord, setViewRecord] = useState<PendingRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PendingRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PendingRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'ALL' ? undefined : activeTab;
      const response = await pendingRecordsAPI.mySubmissions(status);
      if (response.success) {
        setSubmissions(response.data || []);
      }
    } catch {
      showNotification('error', 'Failed to load your submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // Mark as visited so the unread badge resets
    localStorage.setItem(MY_SUBMISSIONS_LAST_VISIT_KEY, new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDelete = async () => {
    if (!deleteConfirmRecord) return;
    setDeleteLoading(true);
    try {
      const response = await pendingRecordsAPI.deleteMySubmission(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'Submission deleted.');
        setDeleteConfirmRecord(null);
        fetchSubmissions();
      } else {
        showNotification('error', response.message || 'Failed to delete submission');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error deleting submission');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabCounts = {
    ALL: submissions.length,
    PENDING: submissions.filter(s => s.status === 'PENDING').length,
    APPROVED: submissions.filter(s => s.status === 'APPROVED').length,
    REJECTED: submissions.filter(s => s.status === 'REJECTED').length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of your submitted live site requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p className="text-sm">No submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewed By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewed At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejection Reason</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      rec.status === 'APPROVED'
                        ? 'bg-green-50 hover:bg-green-100'
                        : rec.status === 'REJECTED'
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {rec.record_data?.site_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.record_data?.building_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(rec.submitted_at)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(rec.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rec.reviewed_username || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(rec.reviewed_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-700 max-w-xs">
                      {rec.rejection_reason
                        ? <span className="italic">{rec.rejection_reason}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewRecord(rec)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {rec.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setEditRecord(rec)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirmRecord(rec)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Submission Details</h2>
                <div className="mt-1">{statusBadge(viewRecord.status)}</div>
              </div>
              <button
                onClick={() => setViewRecord(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status info banner */}
            {viewRecord.status === 'APPROVED' && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Approved by <strong>{viewRecord.reviewed_username}</strong> on {formatDate(viewRecord.reviewed_at)}.
                  This site has been added to live records.
                </span>
              </div>
            )}
            {viewRecord.status === 'REJECTED' && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>Rejected by <strong>{viewRecord.reviewed_username}</strong> on {formatDate(viewRecord.reviewed_at)}.</p>
                  {viewRecord.rejection_reason && (
                    <p className="mt-1"><span className="font-medium">Reason:</span> {viewRecord.rejection_reason}</p>
                  )}
                </div>
              </div>
            )}
            {viewRecord.status === 'PENDING' && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Submitted on {formatDate(viewRecord.submitted_at)}. Awaiting Super Admin review.</span>
              </div>
            )}

            {/* Record data */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Submitted Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(viewRecord.record_data).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-800 break-words">
                      {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewRecord(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Delete Submission</h2>
              <button onClick={() => setDeleteConfirmRecord(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete your submission for{' '}
                    <strong>{deleteConfirmRecord.record_data?.site_name || 'this site'}</strong>?
                  </p>
                  <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pending Submission Modal */}
      {editRecord && (
        <PendingEditModal
          pendingId={editRecord.id}
          initialData={editRecord.record_data}
          onClose={() => setEditRecord(null)}
          onSaved={fetchSubmissions}
        />
      )}
    </div>
  );
};

export { MY_SUBMISSIONS_LAST_VISIT_KEY };
export default MySubmissions;
