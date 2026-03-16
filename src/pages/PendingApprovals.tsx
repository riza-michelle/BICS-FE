import React, { useState, useEffect } from 'react';
import { pendingRecordsAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, Eye, X, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

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

const PendingApprovals: React.FC = () => {
  const [pendingList, setPendingList] = useState<PendingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [viewRecord, setViewRecord] = useState<PendingRecord | null>(null);
  const [rejectModal, setRejectModal] = useState<PendingRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [approveConfirmRecord, setApproveConfirmRecord] = useState<PendingRecord | null>(null);
  const { showNotification } = useNotification();

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await pendingRecordsAPI.list(activeTab);
      if (response.success) {
        setPendingList(response.data || []);
      }
    } catch {
      showNotification('error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleApprove = async () => {
    if (!approveConfirmRecord) return;
    setActionLoading(true);
    try {
      const response = await pendingRecordsAPI.approve(approveConfirmRecord.id);
      if (response.success) {
        showNotification('success', response.message || 'Record approved and added to live sites.');
        setApproveConfirmRecord(null);
        fetchList();
      } else {
        showNotification('error', response.message || 'Failed to approve record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error approving record');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const response = await pendingRecordsAPI.reject(rejectModal.id, rejectReason);
      if (response.success) {
        showNotification('success', 'Record rejected.');
        setRejectModal(null);
        setRejectReason('');
        fetchList();
      } else {
        showNotification('error', response.message || 'Failed to reject record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error rejecting record');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'PENDING') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    if (status === 'APPROVED') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
    if (status === 'REJECTED') return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
    return null;
  };

  const fieldLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" />
            Pending Site Approvals
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve or reject site submissions from User accounts.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 bg-white border border-gray-200 rounded-lg p-1 w-fit shadow-sm">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? tab === 'PENDING'
                    ? 'bg-yellow-500 text-white'
                    : tab === 'APPROVED'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
              Loading...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No {activeTab.toLowerCase()} submissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Building</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted At</th>
                    {activeTab !== 'PENDING' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reviewed By</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reviewed At</th>
                        {activeTab === 'REJECTED' && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                        )}
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.record_data.site_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.record_data.building_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.submitted_username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.submitted_at)}</td>
                      {activeTab !== 'PENDING' && (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.reviewed_username || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.reviewed_at)}</td>
                          {activeTab === 'REJECTED' && (
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{item.rejection_reason || '—'}</td>
                          )}
                        </>
                      )}
                      <td className="px-4 py-3">{statusBadge(item.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewRecord(item)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Eye className="h-3.5 w-3.5" />View
                          </button>
                          {activeTab === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setApproveConfirmRecord(item)}
                                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />Approve
                              </button>
                              <button
                                onClick={() => { setRejectModal(item); setRejectReason(''); }}
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                <XCircle className="h-3.5 w-3.5" />Reject
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
      </div>

      {/* View Record Modal */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Submission Details</h2>
                <p className="text-sm text-blue-100">By {viewRecord.submitted_username} — {formatDate(viewRecord.submitted_at)}</p>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-gray-50" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(viewRecord.record_data).map(([key, val]) => (
                  <div key={key} className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{fieldLabel(key)}</p>
                    <p className="text-sm text-gray-900 break-words uppercase">{val ? String(val) : <span className="text-gray-400 italic normal-case">Not specified</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
              <h2 className="text-lg font-bold">Confirm Approval</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-800 font-medium">Approve this site submission?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">{approveConfirmRecord.record_data.site_name || 'Unnamed Site'}</span>
                    {approveConfirmRecord.record_data.building_name && ` — ${approveConfirmRecord.record_data.building_name}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Submitted by <span className="font-medium">{approveConfirmRecord.submitted_username}</span></p>
                  <p className="text-sm text-gray-600 mt-3">This will add the site to View Live Site immediately.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setApproveConfirmRecord(null)} disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
              <h2 className="text-lg font-bold">Reject Submission</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-800 font-medium">Reject this site submission?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">{rejectModal.record_data.site_name || 'Unnamed Site'}</span>
                    {rejectModal.record_data.building_name && ` — ${rejectModal.record_data.building_name}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Submitted by <span className="font-medium">{rejectModal.submitted_username}</span></p>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }} disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleReject} disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
