import React, { useState, useEffect, useCallback } from 'react';
import { bicsAPI } from '../services/api';
import { BicsRecord } from '../types';
import { Search, Edit, ChevronLeft, ChevronRight, Layers, X, CheckSquare } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const FCO_FIELDS: { key: keyof BicsRecord; label: string; type: 'text' | 'number' | 'select'; group: string; options?: string[]; readonly?: boolean }[] = [
  { key: 'project_milestone', label: 'Project Milestone', type: 'select', group: 'Project Info', options: [
    'COMPLETED MIGRATION',
    'COMPLETED MIGRATION (HS BA PROVIDED)',
    'FALLOUT W/O REPLACEMENT (PO)',
    'FALLOUT W/O REPLACEMENT (WIP)',
    'FALLOUT_ W/O REPLACEMENT',
    'FALLOUT_WITH REPLACEMENT',
    'FOR ACCEPTANCE',
    'FOR DESIGN APPROVAL',
    'FOR IMPLEM PATCHING',
    'FOR INSERTION',
    'FOR ISP AND OSP PERMIT APPROVAL',
    'FOR ISP PERMIT APPROVAL',
    'FOR MOA ACQUISITION',
    'FOR PROFILING',
    'FOR PR-PO',
    'FOR RE-SURVEY',
    'FOR SURVEY',
    'FTTB COMPLETED',
    'HOLD - IMPLEMENTATION',
    'ON-GOING HWS',
    'ON-GOING IMPLEMENTATION',
    'ON-GOING MIGRATION',
    'ON-GOING MIGRATION (HS BA PROVIDED)',
    'PARTIALLY COMPLETED',
    'PERMIT, FOR IMPLEMENTATION',
    'PERMIT, FOR JOINT SURVEY',
    'PLAN BUILDING APPROVAL',
    'PLAN CREATION',
    'PLAN INITIAL APPROVAL',
    'PLAN SUBMITTED',
    'REPLACEMENT_FOR ACCENG ENDORSEMENT',
    'REPLACEMENT_FOR VENDOR ASSESSMENT',
    'REPLACEMENT_REJECTED',
    'SIGNED MOA',
    'WITH ISSUE',
  ]},
  { key: 'project_status', label: 'Project Status', type: 'select', group: 'Project Info', options: [
    'ACTIVE', 'FALLOUT', 'PIPELINE',
  ]},
  { key: 'project_stage', label: 'Project Stage', type: 'select', group: 'Project Info', options: [
    'FALLOUT STAGE', 'HALLWAY STAGE', 'MIGRATION STAGE', 'NETWORK STAGE',
    'PRE-BUILD STAGE', 'PROJECT COMPLETED', 'SAQ STAGE',
  ]},
  { key: 'budget_status', label: 'Budget Status', type: 'select', group: 'Project Info', options: [
    'BUDGET APPROVED', 'FOR BUDGET APPROVAL',
  ]},
  { key: 'project_phase', label: 'Project Phase', type: 'select', group: 'Project Info', options: [
    'COMPLETED MIGRATION', 'FALLOUT', 'HALLWAY PHASE', 'IMPLEMENTATION PHASE',
    'MIGRATION PHASE', 'READY TO SELL', 'SITE ACQUISITION PHASE',
  ]},
  { key: 'implementation_status', label: 'Implementation Status', type: 'select', group: 'Project Info', options: [
    'DROPPED', 'ONGOING', 'INCOMING', 'COMPLETED',
  ]},
  { key: 'bash_preworks',                              label: 'Bash Preworks (Louie)',               type: 'text',   group: 'BASH' },
  { key: 'bash_network',                               label: 'Bash Network (Jarrod)',               type: 'text',   group: 'BASH' },
  { key: 'bash_hallway',                               label: 'Bash Hallway (Vidal)',                type: 'text',   group: 'BASH' },
  { key: 'bash_migration',                             label: 'Bash Migration (Jayr)',               type: 'text',   group: 'BASH' },
  { key: 'based_revenue_existing_circuits_hw_tracker', label: 'Based Revenue (HW Tracker)',         type: 'number', group: 'Revenue / Technical' },
  { key: 'annual_based_revenue_existing_circuits_efpa',label: 'Annual Based Revenue (EFPA)',        type: 'number', group: 'Revenue / Technical', readonly: true },
  { key: 'actual_tad_ports_pairs_provisioned',         label: 'Actual TAD Ports/Pairs Provisioned', type: 'number', group: 'Revenue / Technical' },
  { key: 'mdu_onu',                                    label: 'MDU/ONU',                            type: 'text',   group: 'Revenue / Technical' },
  { key: 'actual_remaining_ports',                     label: 'Actual Remaining Ports',             type: 'number', group: 'Revenue / Technical' },
  { key: 'potential_revenue_growth',                   label: 'Potential Revenue Growth',           type: 'number', group: 'Revenue / Technical' },
  { key: 'actual_ta',                                  label: 'Actual TA',                          type: 'text',   group: 'Revenue / Technical' },
  { key: 'actual_fa',                                  label: 'Actual FA',                          type: 'text',   group: 'Revenue / Technical' },
];

const FCO_GROUPS = ['Project Info', 'BASH', 'Revenue / Technical'];

const FcoUpdate: React.FC = () => {
  const [records, setRecords] = useState<BicsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Quick Edit Modal
  const [editRecord, setEditRecord] = useState<BicsRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<BicsRecord>>({});

  // Inline BASH edit
  const [inlineEdit, setInlineEdit] = useState<{ id: number; field: keyof BicsRecord } | null>(null);
  const [inlineValue, setInlineValue] = useState('');

  // Bulk Update Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkFields, setBulkFields] = useState<Set<keyof BicsRecord>>(new Set());
  const [bulkSiteData, setBulkSiteData] = useState<Record<number, Partial<BicsRecord>>>({});

  const { showNotification } = useNotification();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bicsAPI.getRecords({
        page: currentPage,
        limit: 15,
        search: searchTerm,
      });
      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch {
      showNotification('error', 'Error fetching records');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // --- Selection ---
  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id!)));
    }
  };

  // --- Quick Edit ---
  const openEdit = async (record: BicsRecord) => {
    try {
      const response = await bicsAPI.getRecord(record.id!);
      const fresh = response.success && response.data ? response.data : record;
      setEditRecord(fresh);
      const form: Partial<BicsRecord> = {};
      FCO_FIELDS.forEach(f => {
        (form as any)[f.key] = (fresh as any)[f.key] ?? '';
      });
      setEditForm(form);
    } catch {
      // fallback to table data if fetch fails
      setEditRecord(record);
      const form: Partial<BicsRecord> = {};
      FCO_FIELDS.forEach(f => {
        (form as any)[f.key] = (record as any)[f.key] ?? '';
      });
      setEditForm(form);
    }
  };

  const handleEditSave = async () => {
    if (!editRecord?.id) return;
    try {
      const response = await bicsAPI.fcoUpdateRecord(editRecord.id, editForm);
      if (response.success) {
        showNotification('success', 'Record updated successfully');
        setEditRecord(null);
        fetchRecords();
      } else {
        showNotification('error', response.message || 'Failed to update record');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error updating record');
    }
  };

  // --- Inline BASH Edit ---
  const startInlineEdit = (record: BicsRecord, field: keyof BicsRecord) => {
    setInlineEdit({ id: record.id!, field });
    setInlineValue((record as any)[field] ?? '');
  };

  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;
    setInlineEdit(null);
    try {
      await bicsAPI.fcoUpdateRecord(id, { [field]: inlineValue });
      setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: inlineValue || null } : r));
    } catch {
      showNotification('error', 'Failed to save');
      fetchRecords(); // revert on error
    }
  };

  const cancelInlineEdit = () => setInlineEdit(null);

  // --- Bulk Update ---
  const openBulkModal = () => {
    setBulkStep(1);
    setBulkFields(new Set());
    setBulkSiteData({});
    setShowBulkModal(true);
  };

  const toggleBulkField = (key: keyof BicsRecord) => {
    setBulkFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        if (key === 'based_revenue_existing_circuits_hw_tracker') {
          next.delete('annual_based_revenue_existing_circuits_efpa');
        }
      } else {
        next.add(key);
        if (key === 'based_revenue_existing_circuits_hw_tracker') {
          next.add('annual_based_revenue_existing_circuits_efpa');
        }
      }
      return next;
    });
  };

  const advanceToStep2 = () => {
    if (bulkFields.size === 0) {
      showNotification('error', 'Select at least one field to update');
      return;
    }
    const selectedRecords = records.filter(r => selectedIds.has(r.id!));
    const initialData: Record<number, Partial<BicsRecord>> = {};
    selectedRecords.forEach(record => {
      const siteData: Partial<BicsRecord> = {};
      bulkFields.forEach(key => {
        (siteData as any)[key] = (record as any)[key] ?? '';
      });
      initialData[record.id!] = siteData;
    });
    setBulkSiteData(initialData);
    setBulkStep(2);
  };

  const updateSiteField = (siteId: number, field: keyof BicsRecord, value: string) => {
    setBulkSiteData(prev => {
      const updated: any = { ...prev[siteId], [field]: value };
      if (field === 'based_revenue_existing_circuits_hw_tracker') {
        updated.annual_based_revenue_existing_circuits_efpa =
          value !== '' ? String(parseFloat(value) * 12) : '';
      }
      return { ...prev, [siteId]: updated };
    });
  };

  const handleBulkSave = async () => {
    const entries = Object.entries(bulkSiteData);
    if (entries.length === 0) return;
    try {
      await Promise.all(
        entries.map(([siteId, data]) => bicsAPI.fcoUpdateRecord(Number(siteId), data))
      );
      showNotification('success', `${entries.length} site${entries.length !== 1 ? 's' : ''} updated successfully`);
      setShowBulkModal(false);
      setSelectedIds(new Set());
      fetchRecords();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error bulk updating');
    }
  };

  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < records.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">FCO Update</h1>
          <p className="mt-1 text-sm text-gray-600">Update FCO-relevant fields for single or multiple sites</p>
        </div>

        {/* Search + Bulk Action bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by site name, PCN, BID, building name..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={openBulkModal}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Layers className="h-4 w-4 mr-2" />
                Bulk Update ({selectedIds.size} selected)
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[2%] px-2 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="w-[7%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPC Batch</th>
                  <th className="w-[15%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                  <th className="w-[10%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building Name</th>
                  <th className="w-[7%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="w-[7%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="w-[9%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
                  <th className="w-[6%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impl.</th>
                  <th className="w-[8%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    <span className="text-amber-700">Preworks</span>
                    <span className="block text-[10px] font-normal text-amber-500 normal-case">Louie</span>
                  </th>
                  <th className="w-[8%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    <span className="text-amber-700">Network</span>
                    <span className="block text-[10px] font-normal text-amber-500 normal-case">Jarrod</span>
                  </th>
                  <th className="w-[8%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    <span className="text-amber-700">Hallway</span>
                    <span className="block text-[10px] font-normal text-amber-500 normal-case">Vidal</span>
                  </th>
                  <th className="w-[8%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-amber-50">
                    <span className="text-amber-700">Migration</span>
                    <span className="block text-[10px] font-normal text-amber-500 normal-case">Jayr</span>
                  </th>
                  <th className="w-[5%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-2 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-2 py-8 text-center text-sm text-gray-500">No records found</td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr
                      key={record.id}
                      className={`hover:bg-gray-50 transition-colors ${selectedIds.has(record.id!) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id!)}
                          onChange={() => toggleRow(record.id!)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-500 truncate">{record.epc_batch || '-'}</td>
                      <td className="px-2 py-1.5 text-sm font-medium text-gray-900 truncate">{record.site_name || '-'}</td>
                      <td className="px-2 py-1.5 text-xs text-gray-500 truncate">{record.building_name || '-'}</td>
                      <td className="px-2 py-1.5 text-xs">
                        {record.project_status
                          ? <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{record.project_status}</span>
                          : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-gray-500 truncate">{record.project_stage || '-'}</td>
                      <td className="px-2 py-1.5 text-xs text-gray-500 truncate">{record.project_milestone || '-'}</td>
                      <td className="px-2 py-1.5 text-xs text-gray-500 truncate">{record.implementation_status || '-'}</td>
                      {(['bash_preworks', 'bash_network', 'bash_hallway', 'bash_migration'] as (keyof BicsRecord)[]).map(field => (
                        <td key={field} className="px-1 py-1 bg-amber-50/40">
                          {inlineEdit?.id === record.id && inlineEdit?.field === field ? (
                            <input
                              autoFocus
                              type="text"
                              value={inlineValue}
                              onChange={e => setInlineValue(e.target.value)}
                              onBlur={saveInlineEdit}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit(); }
                                if (e.key === 'Escape') cancelInlineEdit();
                              }}
                              className="w-full px-1.5 py-0.5 border border-indigo-400 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          ) : (
                            <span
                              onClick={() => startInlineEdit(record, field)}
                              title="Click to edit"
                              className="block w-full min-h-[1.25rem] px-1 py-0.5 rounded text-xs text-gray-600 truncate cursor-text hover:bg-amber-100 hover:text-gray-900 transition-colors"
                            >
                              {(record as any)[field] || <span className="text-gray-300">—</span>}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => openEdit(record)}
                          title="Edit FCO fields"
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 15 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 15, totalRecords)}</span> of{' '}
                <span className="font-medium">{totalRecords}</span> results
              </p>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Edit Modal ── */}
      {editRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex justify-between items-start flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold">Edit FCO Fields</h2>
                <p className="text-indigo-200 text-sm mt-0.5 truncate max-w-xl">
                  {editRecord.site_name} {editRecord.pcn ? `· ${editRecord.pcn}` : ''} {editRecord.epc_batch ? `· ${editRecord.epc_batch}` : ''}
                </p>
              </div>
              <button onClick={() => setEditRecord(null)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {FCO_GROUPS.map(group => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">{group}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {FCO_FIELDS.filter(f => f.group === group).map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        {field.type === 'select' ? (
                          <select
                            value={(editForm as any)[field.key] ?? ''}
                            onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">— Select —</option>
                            {(editForm as any)[field.key] && !(field.options!).includes((editForm as any)[field.key]) && (
                              <option value={(editForm as any)[field.key]}>{(editForm as any)[field.key]}</option>
                            )}
                            {field.options!.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.readonly ? (
                          <div className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-600">
                            {(editForm as any)[field.key] !== '' && (editForm as any)[field.key] != null
                              ? (editForm as any)[field.key]
                              : <span className="text-gray-400 italic">Auto-calculated</span>}
                          </div>
                        ) : (
                          <input
                            type={field.type}
                            value={(editForm as any)[field.key] ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              setEditForm(prev => {
                                const updated: any = { ...prev, [field.key]: val };
                                if (field.key === 'based_revenue_existing_circuits_hw_tracker') {
                                  updated.annual_based_revenue_existing_circuits_efpa =
                                    val !== '' ? String(parseFloat(val) * 12) : '';
                                }
                                return updated;
                              });
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={`Enter ${field.label}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setEditRecord(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Update Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full ${bulkStep === 2 ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] flex flex-col overflow-hidden transition-all`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex justify-between items-start flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold">Bulk Update</h2>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${bulkStep === 1 ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-indigo-200'}`}>1 Select Fields</span>
                    <span className="text-indigo-400">›</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${bulkStep === 2 ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-indigo-200'}`}>2 Edit Per Site</span>
                  </div>
                </div>
                <p className="text-indigo-200 text-sm">
                  {bulkStep === 1
                    ? `${selectedIds.size} site${selectedIds.size !== 1 ? 's' : ''} selected — choose which fields to update`
                    : `Edit values individually for each of the ${selectedIds.size} selected site${selectedIds.size !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Field selection */}
            {bulkStep === 1 && (
              <>
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                  {FCO_GROUPS.map(group => (
                    <div key={group}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b pb-1">{group}</h3>
                      <div className="space-y-1.5">
                        {FCO_FIELDS.filter(f => f.group === group).map(field => (
                          <label
                            key={field.key}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              field.readonly
                                ? 'opacity-50 cursor-default'
                                : bulkFields.has(field.key)
                                  ? 'bg-indigo-50 border border-indigo-200'
                                  : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            {field.readonly ? (
                              <div className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <input
                                type="checkbox"
                                checked={bulkFields.has(field.key)}
                                onChange={() => toggleBulkField(field.key)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                              />
                            )}
                            <span className={`text-sm font-medium ${field.readonly ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                              {field.label}{field.readonly ? ' (auto-calculated)' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                  <span className="text-sm text-gray-500">
                    <CheckSquare className="inline h-4 w-4 mr-1 text-indigo-500" />
                    {bulkFields.size} field{bulkFields.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={advanceToStep2}
                      disabled={bulkFields.size === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Per-site cards */}
            {bulkStep === 2 && (() => {
              const selectedRecords = records.filter(r => selectedIds.has(r.id!));
              const editableFields = FCO_FIELDS.filter(f => bulkFields.has(f.key) && !f.readonly);
              const hasEfpa = bulkFields.has('annual_based_revenue_existing_circuits_efpa');
              const allFields = hasEfpa
                ? [...editableFields, FCO_FIELDS.find(f => f.key === 'annual_based_revenue_existing_circuits_efpa')!]
                : editableFields;
              return (
                <>
                  <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-gray-50">
                    {selectedRecords.map((record, idx) => {
                      const siteData = bulkSiteData[record.id!] ?? {};
                      return (
                        <div key={record.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          {/* Site card header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{record.site_name || '—'}</div>
                              <div className="text-xs text-gray-500 flex gap-3">
                                {record.epc_batch && <span>EPC: {record.epc_batch}</span>}
                                {record.project_status && <span>Status: {record.project_status}</span>}
                                {record.project_stage && <span>Stage: {record.project_stage}</span>}
                              </div>
                            </div>
                          </div>
                          {/* Fields grid */}
                          <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
                            {allFields.map(field => {
                              const isAuto = field.readonly;
                              const val = (siteData as any)[field.key] ?? '';
                              return (
                                <div key={field.key}>
                                  <label className={`block text-xs font-semibold mb-1 ${isAuto ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                                    {field.label}{isAuto ? ' (auto-calculated)' : ''}
                                  </label>
                                  {isAuto ? (
                                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                                      {val !== '' && val != null
                                        ? val
                                        : <span className="italic text-gray-400">HW Tracker × 12</span>}
                                    </div>
                                  ) : field.type === 'select' ? (
                                    <select
                                      value={val}
                                      onChange={e => updateSiteField(record.id!, field.key, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                      <option value="">— Select —</option>
                                      {val && !field.options!.includes(val) && (
                                        <option value={val}>{val}</option>
                                      )}
                                      {field.options!.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={field.type}
                                      value={val}
                                      onChange={e => updateSiteField(record.id!, field.key, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                    <button
                      onClick={() => setBulkStep(1)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowBulkModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm"
                      >
                        Save {selectedIds.size} Site{selectedIds.size !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default FcoUpdate;
