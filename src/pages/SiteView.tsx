import React, { useState, useEffect } from 'react';
import { bicsAPI } from '../services/api';
import { BicsRecord } from '../types';
import { Eye, ChevronLeft, ChevronRight, FileText, Edit, ChevronDown, Trash2, Download, Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import EditModal from '../components/EditModal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx-js-style';

const SiteView: React.FC = () => {
  const [records, setRecords] = useState<BicsRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BicsRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<BicsRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string>('');
  const [selectedEpcBatch, setSelectedEpcBatch] = useState<string>('');
  const [selectedProjectStatus, setSelectedProjectStatus] = useState<string>('');
  const [selectedProjectScheme, setSelectedProjectScheme] = useState<string>('');
  const [selectedAgingDays, setSelectedAgingDays] = useState<string>('');
  const [expandedViewSections, setExpandedViewSections] = useState<{ [key: string]: boolean }>({});
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<BicsRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const location = useLocation();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedPersonnel, selectedEpcBatch, selectedProjectStatus, selectedProjectScheme, selectedAgingDays]);

  // Check for notification from navigation state
  useEffect(() => {
    if (location.state && (location.state as any).notification) {
      const notif = (location.state as any).notification;
      if (notif.type === 'success') {
        showNotification('success', notif.message);
      } else {
        showNotification('error', notif.message);
      }
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location, showNotification]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Convert aging days range to min/max values for server-side filtering
      let minAgingDays: number | undefined;
      let maxAgingDays: number | undefined;
      if (selectedAgingDays) {
        switch (selectedAgingDays) {
          case '0-7':   minAgingDays = 0;  maxAgingDays = 7;   break;
          case '8-30':  minAgingDays = 8;  maxAgingDays = 30;  break;
          case '31-60': minAgingDays = 31; maxAgingDays = 60;  break;
          case '61+':   minAgingDays = 61;                     break;
        }
      }

      const response = await bicsAPI.getRecords({
        page: currentPage,
        limit: 50,
        bcsi_aor: selectedPersonnel || undefined,
        epc_batch: selectedEpcBatch || undefined,
        project_status: selectedProjectStatus || undefined,
        project_scheme: selectedProjectScheme || undefined,
        min_aging_days: minAgingDays,
        max_aging_days: maxAgingDays,
      });

      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record: BicsRecord) => {
    setSelectedRecord(record);
  };

  const handleCloseDetail = () => {
    setSelectedRecord(null);
  };

  const handleEditRecord = (record: BicsRecord) => {
    setEditingRecord(record);
  };

  const handleCloseEditModal = () => {
    setEditingRecord(null);
  };

  const handleSaveEdit = async (updatedRecord: BicsRecord) => {
    try {
      const response = await bicsAPI.updateRecord(updatedRecord.id!, updatedRecord);
      if (response.success) {
        showNotification('success', 'Record updated successfully!');
        setEditingRecord(null);
        fetchRecords(); // Refresh the list
      } else {
        showNotification('error', response.message || 'Failed to update record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error updating record');
    }
  };

  const handleDeleteClick = (record: BicsRecord) => {
    setDeleteConfirmRecord(record);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await bicsAPI.deleteRecord(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'Record deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchRecords(); // Refresh the list
      } else {
        showNotification('error', response.message || 'Failed to delete record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting record');
    }
  };

  const handlePersonnelFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPersonnel(e.target.value);
    setCurrentPage(1);
  };

  const handleEpcBatchFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEpcBatch(e.target.value);
    setCurrentPage(1);
  };

  const handleProjectStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleProjectSchemeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectScheme(e.target.value);
    setCurrentPage(1);
  };

  const handleAgingDaysFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgingDays(e.target.value);
    setCurrentPage(1);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportExcel = async () => {
    if (!selectedFile) {
      showNotification('error', 'Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const response = await bicsAPI.importExcel(selectedFile);

      if (response.success) {
        const importedCount: number = response.data?.success ?? 0;
        const failedCount: number = response.data?.errors ?? 0;

        if (importedCount > 0) {
          showNotification('success', response.message || 'Import completed successfully');
          setShowImportModal(false);
          setSelectedFile(null);
          fetchRecords();
        }

        if (failedCount > 0 && response.data?.errorDetails) {
          const errLines = response.data.errorDetails
            .map((e: any) => `Row ${e.row} (${e.site}): ${e.error}`)
            .join('\n');
          console.error('Import row errors:\n' + errLines);
          // Show first 3 errors in a browser alert so user can see what's wrong
          const preview = response.data.errorDetails
            .slice(0, 3)
            .map((e: any) => `• Row ${e.row} (${e.site}): ${e.error}`)
            .join('\n');
          alert(`${failedCount} row(s) failed to import:\n\n${preview}${failedCount > 3 ? `\n\n...and ${failedCount - 3} more (see browser console for full list).` : ''}`);
        }

        if (importedCount === 0) {
          showNotification('error', `Import failed — all ${failedCount} row(s) had errors. See the error details above.`);
        }
      } else {
        showNotification('error', response.message || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showNotification('error', error.response?.data?.message || 'Error importing Excel file');
    } finally {
      setImporting(false);
    }
  };

  const personnelList = [
    'ADMARASIGAN',
    'APMORILLA',
    'CBTABINGA',
    'CLTRABUCO',
    'DFCAGADAS',
    'ELALIBO',
    'JDALVAREZ',
    'JMBALAG',
    'KDTAMONDONG',
    'LMTAMAYO',
    'LSAGAPITO',
    'LTTEOVISIO',
    'MIDDELACRUZ',
    'MLCARANDANG',
    'NMNARCISO'
  ];

  const epcBatchList = [
    'BATCH - 55',
    'BATCH - 118',
    'BATCH - 223',
    'BATCH - 243',
    'BATCH - 340',
    'BATCH - 406',
    'PIPELINE - BICS',
    'PIPELINE - DEMAND'
  ];

  const projectStatusList = [
    'ACTIVE',
    'FALLOUT',
    'PIPELINE'
  ];

  const toggleViewSection = (title: string) => {
    setExpandedViewSections(prev => ({
      ...prev,
      [title]: prev[title] === false ? true : false
    }));
  };

  const handleDownloadTemplate = () => {
    // Column order as specified by the user (96 columns)
    const templateColumns = [
      // Basic Information
      { header: 'EPC BATCH',              color: '1F4788', section: 'Basic Information' },
      { header: 'VENDOR',                 color: '1F4788', section: 'Basic Information' },
      { header: 'SNAP ID/BLDG TAG',       color: '1F4788', section: 'Basic Information' },
      { header: 'PCN',                    color: '1F4788', section: 'Basic Information' },
      { header: 'BICS PERSONNEL',         color: '1F4788', section: 'Basic Information' },
      { header: 'PROJECT SCHEME',         color: '1F4788', section: 'Basic Information' },
      { header: 'BID',                    color: '1F4788', section: 'Basic Information' },
      // Site Information
      { header: 'SITE NAME',              color: '0D7377', section: 'Site Information' },
      { header: 'BUILDING NAME',          color: '0D7377', section: 'Site Information' },
      { header: 'ADDRESS',                color: '0D7377', section: 'Site Information' },
      { header: 'BRGY',                   color: '0D7377', section: 'Site Information' },
      { header: 'CITY/MUNICIPALITY',      color: '0D7377', section: 'Site Information' },
      { header: 'PROVINCE',               color: '0D7377', section: 'Site Information' },
      { header: 'COORDINATES',            color: '0D7377', section: 'Site Information' },
      { header: 'DISTRICT',               color: '0D7377', section: 'Site Information' },
      { header: 'ZONE',                   color: '0D7377', section: 'Site Information' },
      { header: 'AREA',                   color: '0D7377', section: 'Site Information' },
      { header: 'MARKET SEGMENT',         color: '0D7377', section: 'Site Information' },
      // Building Details
      { header: 'BUILDING STATUS',        color: '6B46C1', section: 'Building Details' },
      { header: 'USAGE',                  color: '6B46C1', section: 'Building Details' },
      { header: 'FLOORS',                 color: '6B46C1', section: 'Building Details' },
      { header: 'UNITS',                  color: '6B46C1', section: 'Building Details' },
      { header: 'DEVELOPER',              color: '6B46C1', section: 'Building Details' },
      { header: 'TOP DEV',                color: '6B46C1', section: 'Building Details' },
      // Contact Information
      { header: 'NAME',                   color: 'D97706', section: 'Contact Information' },
      { header: 'DESIGNATION',            color: 'D97706', section: 'Contact Information' },
      { header: 'CONTACT NUMBER',         color: 'D97706', section: 'Contact Information' },
      { header: 'EMAIL ADD',              color: 'D97706', section: 'Contact Information' },
      { header: 'RM',                     color: 'D97706', section: 'Contact Information' },
      { header: 'RM GROUP',               color: 'D97706', section: 'Contact Information' },
      // Project Information
      { header: 'PROJECT STATUS',         color: '047857', section: 'Project Information' },
      { header: 'PROJECT STAGE',          color: '047857', section: 'Project Information' },
      { header: 'PROJECT MILESTONE',      color: '047857', section: 'Project Information' },
      { header: 'WORKING LINES',          color: '047857', section: 'Project Information' },
      { header: 'ROLLOUT PORTS',          color: '047857', section: 'Project Information' },
      { header: 'MRC',                    color: '047857', section: 'Project Information' },
      // SAQ Information
      { header: 'SAQ MILESTONE',          color: '4338CA', section: 'SAQ Information' },
      { header: 'COMMERCIAL SCHEME',      color: '4338CA', section: 'SAQ Information' },
      { header: 'COL TOR STATUS',         color: '4338CA', section: 'SAQ Information' },
      { header: 'SIGNED TOR/MOA DATE',    color: '4338CA', section: 'SAQ Information' },
      { header: 'MOA ACQUIRED BY',        color: '4338CA', section: 'SAQ Information' },
      { header: 'MOA UPLOADING STATUS',   color: '4338CA', section: 'SAQ Information' },
      { header: 'VALIDATED DATE',         color: '4338CA', section: 'SAQ Information' },
      { header: 'VALIDATED BY',           color: '4338CA', section: 'SAQ Information' },
      // Important Dates
      { header: 'SITE VISITED DATE',              color: 'B91C1C', section: 'Important Dates' },
      { header: 'TARGET DATE PROFILING',          color: 'B91C1C', section: 'Important Dates' },
      { header: 'TARGET DATE MOA TO ACQUIRE',     color: 'B91C1C', section: 'Important Dates' },
      { header: 'DATE OF RECENT ENGAGEMENT',      color: 'B91C1C', section: 'Important Dates' },
      // Remarks
      { header: 'SIGNIFICANT REMARKS',    color: '4B5563', section: 'Remarks' },
      // Status Information
      { header: 'PRODUCTIVITY',           color: '0891B2', section: 'Status Information' },
      { header: 'REF ID',                 color: '0891B2', section: 'Status Information' },
      // Replacement Information
      { header: 'REPLACEMENT SITE',           color: 'DB2777', section: 'Replacement Information' },
      { header: 'DATE ENDORSE REPLACEMENT',   color: 'DB2777', section: 'Replacement Information' },
      { header: 'DATE ACCEPTED',              color: 'DB2777', section: 'Replacement Information' },
      { header: 'DATE REJECTED',              color: 'DB2777', section: 'Replacement Information' },
      // Status Information (continued)
      { header: 'MOA STATUS',             color: '0891B2', section: 'Status Information' },
      { header: 'PROFILE STATUS',         color: '0891B2', section: 'Status Information' },
      { header: 'REFERENCE #',            color: '0891B2', section: 'Status Information' },
      { header: 'SITE ENTRY DATE',        color: '0891B2', section: 'Status Information' },
      // Additional Information
      { header: 'PREV BATCH',             color: 'D97706', section: 'Additional Information' },
      { header: 'FL ID',                  color: 'D97706', section: 'Additional Information' },
      { header: 'PO STATUS',              color: 'D97706', section: 'Additional Information' },
      // Replacement Information (continued)
      { header: 'GO-NOGO',                    color: 'DB2777', section: 'Replacement Information' },
      { header: 'QUICK BASHING',              color: 'D97706', section: 'Additional Information' },
      { header: 'REPLACEMENTS GROUPINGS',     color: 'DB2777', section: 'Replacement Information' },
      { header: 'TAGGING TEMP',               color: 'DB2777', section: 'Replacement Information' },
      // Status Information (continued)
      { header: 'BUDGET STATUS',          color: '0891B2', section: 'Status Information' },
      { header: 'PROJECT PHASE',          color: '0891B2', section: 'Status Information' },
      { header: 'IMPLEM STATUS',          color: '0891B2', section: 'Status Information' },
      // Revenue & Capacity Metrics
      { header: 'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)',  color: '059669', section: 'Revenue & Capacity' },
      { header: 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)', color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL TAD PORTS/PAIRS PROVISIONED',            color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL TA NETWORK',                             color: '059669', section: 'Revenue & Capacity' },
      { header: 'TA NETWORK VS WARPP',                           color: '059669', section: 'Revenue & Capacity' },
      { header: 'TA DATE NETWORK',                               color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL TA',                                     color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL FA',                                     color: '059669', section: 'Revenue & Capacity' },
      { header: 'WARPP PCN',                                     color: '059669', section: 'Revenue & Capacity' },
      { header: 'MDU/ONU',                                       color: '059669', section: 'Revenue & Capacity' },
      { header: 'MIGRATED LINES',                                color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL REMAINING PORTS',                        color: '059669', section: 'Revenue & Capacity' },
      { header: 'ACTUAL READY TO SELL PORTS',                    color: '059669', section: 'Revenue & Capacity' },
      { header: 'READY TO SELL PORTS',                           color: '059669', section: 'Revenue & Capacity' },
      { header: 'POTENTIAL REVENUE GROWTH',                      color: '059669', section: 'Revenue & Capacity' },
      // Design & Planning
      { header: 'SCHEME DESIGN',          color: '7C3AED', section: 'Design & Planning' },
      { header: 'FCO AOR',                color: '7C3AED', section: 'Design & Planning' },
      // FTTB Information
      { header: 'FTTB PO RELEASE',        color: '0284C7', section: 'FTTB Information' },
      { header: 'FTTB CIP',               color: '0284C7', section: 'FTTB Information' },
      { header: 'FTTB TARGET COMPLETION', color: '0284C7', section: 'FTTB Information' },
      { header: 'FTTB ACTUAL TA DATE',    color: '0284C7', section: 'FTTB Information' },
      { header: 'ROLLOUT SOLUTION',       color: '0284C7', section: 'FTTB Information' },
      // HWS Information
      { header: 'HWS PO RELEASE',         color: 'E11D48', section: 'HWS Information' },
      { header: 'HWS CIP',                color: 'E11D48', section: 'HWS Information' },
      { header: 'HWS TARGET COMPLETION',  color: 'E11D48', section: 'HWS Information' },
      { header: 'HWS ACTUAL COMPLETION',  color: 'E11D48', section: 'HWS Information' },
      // Additional
      { header: 'BASH',                   color: 'D97706', section: 'Additional Information' },
    ];

    const headers = templateColumns.map(c => c.header);

    // Build title rows + empty row + section-label row
    const sectionLabelRow = templateColumns.map(c => c.section);
    const titleData = [
      ['BICS - Bulk Upload Template'],
      ['Fill in the data rows below starting from Row 5. Do NOT modify the header row (Row 4) or section row (Row 3).'],
      sectionLabelRow,
      headers,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(titleData);

    // Column widths
    worksheet['!cols'] = templateColumns.map(c => {
      const h = c.header;
      let wch = Math.max(h.length + 2, 14);
      if (h === 'ADDRESS' || h === 'SIGNIFICANT REMARKS') wch = 40;
      else if (h.includes('COORDINATES')) wch = 30;
      else if (h.includes('REVENUE') || h.includes('DESCRIPTION')) wch = 38;
      else if (h.includes('DATE')) wch = 20;
      return { wch };
    });

    // Freeze rows 1-4 so data starts at row 5
    worksheet['!freeze'] = { xSplit: 0, ySplit: 4, topLeftCell: 'A5' };

    // Style: title row (row 0)
    worksheet['A1'] = {
      t: 's', v: 'BICS - Bulk Upload Template',
      s: { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4788' } }, alignment: { horizontal: 'left', vertical: 'center' } }
    };
    // Style: instruction row (row 1)
    if (!worksheet['A2']) worksheet['A2'] = { t: 's', v: '' };
    worksheet['A2'].s = {
      font: { sz: 9, italic: true, color: { rgb: '7F1D1D' } },
      fill: { fgColor: { rgb: 'FEF3C7' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };

    // Style: section label row (row 2) and header row (row 3)
    headers.forEach((header, colIndex) => {
      const col = templateColumns[colIndex];
      const sectionCell = XLSX.utils.encode_cell({ r: 2, c: colIndex });
      const headerCell  = XLSX.utils.encode_cell({ r: 3, c: colIndex });

      // Section label — lighter shade
      if (!worksheet[sectionCell]) worksheet[sectionCell] = { t: 's', v: col.section };
      worksheet[sectionCell].s = {
        font: { bold: false, sz: 8, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: col.color } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
        border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }
      };

      // Header label — bold, slightly darker
      if (!worksheet[headerCell]) worksheet[headerCell] = { t: 's', v: header };
      worksheet[headerCell].s = {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: col.color } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
        border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'medium', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }
      };
    });

    // Row heights
    worksheet['!rows'] = [
      { hpt: 28 }, // Title
      { hpt: 18 }, // Instructions
      { hpt: 16 }, // Section labels
      { hpt: 20 }, // Headers
    ];

    // Zoom & view
    worksheet['!views'] = [{ showGridLines: true, zoomScale: 70 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'BICS_Bulk_Upload_Template.xlsx');
  };

  const handleExportToExcel = () => {
    if (records.length === 0) {
      showNotification('error', 'No records to export');
      return;
    }

    // Prepare data for Excel export
    const exportData = records.map(record => ({
      // Basic Information
      'EPC BATCH': record.epc_batch || '',
      'VENDOR': record.vendor || '',
      'SNAP ID/BLDG TAG': record.snap_id_bldg_tag || '',
      'PCN': record.pcn || '',
      'BICS PERSONNEL': record.bcsi_aor || '',
      'PROJECT SCHEME': record.project_scheme || '',
      'BID': record.bid || '',

      // Site Information
      'SITE NAME': record.site_name || '',
      'BUILDING NAME': record.building_name || '',
      'ADDRESS': record.address || '',
      'BRGY': record.brgy || '',
      'CITY/MUNICIPALITY': record.city_municipality || '',
      'PROVINCE': record.province || '',
      'COORDINATES': record.coordinates || '',
      'DISTRICT': record.district || '',
      'ZONE': record.zone || '',
      'AREA': record.area || '',
      'MARKET SEGMENT': record.market_segment || '',

      // Building Details
      'BUILDING STATUS': record.building_status || '',
      'USAGE': record.usage_type || '',
      'FLOORS': record.floors || '',
      'UNITS': record.units || '',
      'DEVELOPER': record.developer || '',
      'TOP DEVELOPER': record.top_dev || '',

      // Contact Information
      'CONTACT NAME': record.contact_name || '',
      'DESIGNATION': record.designation || '',
      'CONTACT NUMBER': record.contact_number || '',
      'EMAIL ADDRESS': record.email_add || '',
      'RELATIONSHIP MANAGER': record.rm || '',
      'RELATIONSHIP MANAGER GROUP': record.rm_group || '',

      // Project Information
      'PROJECT STATUS': record.project_status || '',
      'PROJECT STAGE': record.project_stage || '',
      'PROJECT MILESTONE': record.project_milestone || '',
      'WORKING LINES': record.working_lines || '',
      'ROLLOUT PORTS': record.rollout_ports || '',
      'MRC': record.mrc || '',

      // SAQ Information
      'SAQ MILESTONE': record.saq_milestone || '',
      'COMMERCIAL SCHEME': record.commercial_scheme || '',
      'COL TOR STATUS': record.col_tor_status || '',
      'SIGNED TOR/MOA DATE': record.signed_tor_moa_date ? new Date(record.signed_tor_moa_date).toLocaleDateString() : '',
      'MOA ACQUIRED BY': record.moa_acquired_by || '',
      'MOA UPLOADING STATUS': record.moa_uploading_status || '',
      'SKOM DATE': record.skom_date ? new Date(record.skom_date).toLocaleDateString() : '',
      'ATTENDED BY': record.attended_by || '',

      // Important Dates
      'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
      'VALIDATED BY': record.validated_by || '',
      'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
      'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
      'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
      'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',
      'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

      // Status Information
      'PRODUCTIVITY': record.productivity || '',
      'MOA STATUS': record.moa_status || '',
      'PROFILE STATUS': record.profile_status || '',
      'REF ID': record.ref_id || '',
      'REFERENCE #': record.reference_number || '',
      'PROJECT PHASE': record.project_phase || '',
      'BUDGET STATUS': record.budget_status || '',
      'IMPLEMENTATION STATUS': record.implementation_status || '',

      // Remarks
      'SIGNIFICANT REMARKS': record.significant_remarks || '',

      // Replacement Information
      'REPLACEMENT SITE': record.replacement_site || '',
      'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
      'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
      'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',
      'GO/NOGO': record.go_nogo || '',
      'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
      'TAGGING TEMP': record.tagging_temp || '',
      'REPLACEMENT REQUEST': record.replacement_request || '',

      // Additional Information
      'PREV BATCH': record.prev_batch || '',
      'FL ID': record.fl_id || '',
      'PO STATUS': record.po_status || '',
      'MIGRATED LINES': record.migrated_lines || '',
      'BASH': record.quick_bashing || '',

      // Revenue & Capacity Metrics
      'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
      'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
      'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
      'MDU/ONU': record.mdu_onu || '',
      'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
      'READY TO SELL PORTS': record.ready_to_sell_ports || '',
      'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',
      'ACTUAL TA NETWORK': record.actual_ta_network || '',
      'TA NETWORK VS WARPP': record.ta_network_vs_warpp || '',
      'TA DATE NETWORK': record.ta_date_network ? new Date(record.ta_date_network).toLocaleDateString() : '',
      'ACTUAL TA': record.actual_ta || '',
      'ACTUAL FA': record.actual_fa || '',
      'WARPP PCN': record.warpp_pcn || '',
      'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',

      // Design & Planning
      'SCHEME DESIGN': record.scheme_design || '',
      'FCO AOR': record.fco_aor || '',

      // FTTB Information
      'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
      'FTTB CIP': record.fttb_cip || '',
      'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
      'FTTB ACTUAL TA DATE': record.fttb_actual_ta_date ? new Date(record.fttb_actual_ta_date).toLocaleDateString() : '',
      'ROLLOUT SOLUTION': record.rollout_solution || '',

      // HWS Information
      'HWS PO RELEASE': record.hws_po_release ? new Date(record.hws_po_release).toLocaleDateString() : '',
      'HWS CIP': record.hws_cip || '',
      'HWS TARGET COMPLETION': record.hws_target_completion ? new Date(record.hws_target_completion).toLocaleDateString() : '',
      'HWS ACTUAL COMPLETION': record.hws_actual_completion ? new Date(record.hws_actual_completion).toLocaleDateString() : '',
    }));

    // Create title row with metadata
    const currentDateTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const titleData = [
      ['BICS - Live Site Data Export'],
      [`Export Date: ${currentDateTime}`],
      [`Total Records: ${records.length}`],
      [`Exported By: ${user?.username || 'Unknown'}`],
      [], // Empty row for spacing
    ];

    // Create workbook and worksheet with title
    const worksheet = XLSX.utils.aoa_to_sheet(titleData);

    // Append the data starting from row 6 (after title and spacing)
    XLSX.utils.sheet_add_json(worksheet, exportData, { origin: 'A6' });

    // Get the column headers
    const headers = Object.keys(exportData[0]);
    const lastColumn = XLSX.utils.encode_col(headers.length - 1);

    // Set up auto-filter on the header row (row 6)
    worksheet['!autofilter'] = { ref: `A6:${lastColumn}${exportData.length + 6}` };

    // Freeze the header row (row 6) and title rows
    worksheet['!freeze'] = { xSplit: 0, ySplit: 6, topLeftCell: 'A7' };

    // Auto-size columns based on actual content to ensure everything is visible
    const columnWidths = headers.map((header, colIndex) => {
      // Calculate the maximum width needed for this column
      const headerLength = header.length;

      // Find the longest content in this column
      const maxContentLength = exportData.reduce((max, row) => {
        const cellValue = String(row[header as keyof typeof row] || '');
        return Math.max(max, cellValue.length);
      }, 0);

      // For column A (index 0), also consider the title row content
      let titleContentLength = 0;
      if (colIndex === 0) {
        titleContentLength = Math.max(
          'BICS - Live Site Data Export'.length,
          `Export Date: ${currentDateTime}`.length,
          `Total Records: ${records.length}`.length,
          `Exported By: ${user?.username || 'Unknown'}`.length
        );
      }

      // Use the larger of header, content, or title (for column A)
      const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);

      // Apply specific sizing rules for different field types
      let finalWidth;

      if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
        // Long text fields - allow up to 50 chars
        finalWidth = Math.min(contentWidth, 50);
      } else if (header.includes('COORDINATES')) {
        // Coordinates - typically long
        finalWidth = Math.min(contentWidth, 35);
      } else if (header.includes('PCN') || header.includes('SNAP ID')) {
        // Long IDs
        finalWidth = Math.min(contentWidth, 25);
      } else if (header.includes('DATE')) {
        // Dates - formatted dates need more space
        finalWidth = Math.max(contentWidth, 18);
      } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
        // Names - ensure full visibility
        finalWidth = Math.max(contentWidth, 15);
      } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
        // Long descriptions
        finalWidth = Math.min(contentWidth, 40);
      } else {
        // Default: use actual content width
        finalWidth = Math.min(contentWidth, 30);
      }

      // Ensure minimum width for readability - higher for column A
      const minWidth = colIndex === 0 ? 15 : 12;
      return { wch: Math.max(finalWidth, minWidth) };
    });
    worksheet['!cols'] = columnWidths;

    // Apply styling to title rows
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F4788" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const metaStyle = {
      font: { sz: 10, color: { rgb: "333333" } },
      fill: { fgColor: { rgb: "E8F0FE" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    // Style title row (A1)
    if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
    worksheet['A1'].s = titleStyle;

    // Style metadata rows (A2-A4)
    ['A2', 'A3', 'A4'].forEach(cell => {
      if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
      worksheet[cell].s = metaStyle;
    });

    // Define section colors for headers
    const sectionColors: { [key: string]: string } = {
      // Basic Information - Blue
      'EPC BATCH': '1F4788',
      'VENDOR': '1F4788',
      'SNAP ID/BLDG TAG': '1F4788',
      'PCN': '1F4788',
      'BICS PERSONNEL': '1F4788',
      'PROJECT SCHEME': '1F4788',
      'BID': '1F4788',

      // Site Information - Teal
      'SITE NAME': '0D7377',
      'BUILDING NAME': '0D7377',
      'ADDRESS': '0D7377',
      'BRGY': '0D7377',
      'CITY/MUNICIPALITY': '0D7377',
      'PROVINCE': '0D7377',
      'COORDINATES': '0D7377',
      'DISTRICT': '0D7377',
      'ZONE': '0D7377',
      'AREA': '0D7377',
      'MARKET SEGMENT': '0D7377',

      // Building Details - Purple
      'BUILDING STATUS': '6B46C1',
      'USAGE': '6B46C1',
      'FLOORS': '6B46C1',
      'UNITS': '6B46C1',
      'DEVELOPER': '6B46C1',
      'TOP DEVELOPER': '6B46C1',

      // Contact Information - Orange
      'CONTACT NAME': 'D97706',
      'DESIGNATION': 'D97706',
      'CONTACT NUMBER': 'D97706',
      'EMAIL ADDRESS': 'D97706',
      'RELATIONSHIP MANAGER': 'D97706',
      'RELATIONSHIP MANAGER GROUP': 'D97706',

      // Project Information - Green
      'PROJECT STATUS': '047857',
      'PROJECT STAGE': '047857',
      'PROJECT MILESTONE': '047857',
      'WORKING LINES': '047857',
      'ROLLOUT PORTS': '047857',
      'MRC': '047857',

      // SAQ Information - Indigo
      'SAQ MILESTONE': '4338CA',
      'COMMERCIAL SCHEME': '4338CA',
      'COL TOR STATUS': '4338CA',
      'SIGNED TOR/MOA DATE': '4338CA',
      'MOA ACQUIRED BY': '4338CA',
      'MOA UPLOADING STATUS': '4338CA',
      'SKOM DATE': '4338CA',
      'ATTENDED BY': '4338CA',

      // Important Dates - Red
      'VALIDATED DATE': 'B91C1C',
      'VALIDATED BY': 'B91C1C',
      'SITE VISITED DATE': 'B91C1C',
      'TARGET DATE PROFILING': 'B91C1C',
      'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
      'DATE OF RECENT ENGAGEMENT': 'B91C1C',
      'SITE ENTRY DATE': 'B91C1C',

      // Status Information - Cyan
      'PRODUCTIVITY': '0891B2',
      'MOA STATUS': '0891B2',
      'PROFILE STATUS': '0891B2',
      'REF ID': '0891B2',
      'REFERENCE #': '0891B2',
      'PROJECT PHASE': '0891B2',
      'BUDGET STATUS': '0891B2',
      'IMPLEMENTATION STATUS': '0891B2',

      // Remarks - Gray
      'SIGNIFICANT REMARKS': '4B5563',

      // Replacement Information - Pink/Magenta
      'REPLACEMENT SITE': 'DB2777',
      'DATE ENDORSE REPLACEMENT': 'DB2777',
      'DATE ACCEPTED': 'DB2777',
      'DATE REJECTED': 'DB2777',
      'GO/NOGO': 'DB2777',
      'REPLACEMENTS GROUPINGS': 'DB2777',
      'TAGGING TEMP': 'DB2777',
      'REPLACEMENT REQUEST': 'DB2777',

      // Additional Information - Amber
      'PREV BATCH': 'D97706',
      'FL ID': 'D97706',
      'PO STATUS': 'D97706',
      'MIGRATED LINES': 'D97706',
      'BASH': 'D97706',

      // Revenue & Capacity Metrics - Emerald
      'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669',
      'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
      'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669',
      'MDU/ONU': '059669',
      'ACTUAL REMAINING PORTS': '059669',
      'READY TO SELL PORTS': '059669',
      'POTENTIAL REVENUE GROWTH': '059669',
      'ACTUAL TA NETWORK': '059669',
      'TA NETWORK VS WARPP': '059669',
      'TA DATE NETWORK': '059669',
      'ACTUAL TA': '059669',
      'ACTUAL FA': '059669',
      'WARPP PCN': '059669',
      'ACTUAL READY TO SELL PORTS': '059669',

      // Design & Planning - Violet
      'SCHEME DESIGN': '7C3AED',
      'FCO AOR': '7C3AED',

      // FTTB Information - Sky Blue
      'FTTB PO RELEASE': '0284C7',
      'FTTB CIP': '0284C7',
      'FTTB TARGET COMPLETION': '0284C7',
      'FTTB ACTUAL TA DATE': '0284C7',
      'ROLLOUT SOLUTION': '0284C7',

      // HWS Information - Rose
      'HWS PO RELEASE': 'E11D48',
      'HWS CIP': 'E11D48',
      'HWS TARGET COMPLETION': 'E11D48',
      'HWS ACTUAL COMPLETION': 'E11D48',
    };

    // Apply header styles with section colors
    headers.forEach((header, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex }); // Row 6 (0-indexed as 5)
      if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };

      const customHeaderStyle = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: sectionColors[header] || "2E5C8A" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: false },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      worksheet[cellAddress].s = customHeaderStyle;
    });

    // Helper function to get conditional cell colors
    const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
      let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
      let fontColor = "000000";
      let isBold = false;

      // PROJECT STATUS colors
      if (header === 'PROJECT STATUS') {
        if (value === 'ACTIVE') {
          backgroundColor = 'D1FAE5'; // Light green
          fontColor = '065F46';
          isBold = true;
        } else if (value === 'FALLOUT') {
          backgroundColor = 'FEE2E2'; // Light red
          fontColor = '991B1B';
          isBold = true;
        } else if (value === 'PIPELINE') {
          backgroundColor = 'FEF3C7'; // Light yellow
          fontColor = '92400E';
          isBold = true;
        }
      }

      // SAQ MILESTONE colors
      if (header === 'SAQ MILESTONE') {
        if (value === 'SIGNED MOA') {
          backgroundColor = 'D1FAE5'; // Light green
          fontColor = '065F46';
          isBold = true;
        } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
          backgroundColor = 'FEF3C7'; // Light yellow
          fontColor = '92400E';
          isBold = true;
        }
      }

      // PROJECT SCHEME colors
      if (header === 'PROJECT SCHEME') {
        if (value === 'GROWTH') {
          backgroundColor = 'DBEAFE'; // Light blue
          fontColor = '1E40AF';
          isBold = true;
        } else if (value === 'OVERLAY') {
          backgroundColor = 'E0E7FF'; // Light indigo
          fontColor = '3730A3';
          isBold = true;
        }
      }

      // BICS PERSONNEL colors (matching navbar colors)
      if (header === 'BICS PERSONNEL') {
        const personnelColors: { [key: string]: { bg: string, fg: string } } = {
          'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' },
          'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
          'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' },
          'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
          'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' },
          'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
          'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' },
          'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
          'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' },
          'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
          'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' },
          'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
          'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' },
          'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
          'NMNARCISO': { bg: 'FAE8FF', fg: '86198F' }
        };

        if (personnelColors[value as string]) {
          backgroundColor = personnelColors[value as string].bg;
          fontColor = personnelColors[value as string].fg;
          isBold = true;
        }
      }

      return {
        font: { sz: 10, color: { rgb: fontColor }, bold: isBold },
        fill: { fgColor: { rgb: backgroundColor } },
        alignment: { horizontal: "left", vertical: "center", wrapText: false },
        border: {
          top: { style: "thin", color: { rgb: "DDDDDD" } },
          bottom: { style: "thin", color: { rgb: "DDDDDD" } },
          left: { style: "thin", color: { rgb: "DDDDDD" } },
          right: { style: "thin", color: { rgb: "DDDDDD" } }
        }
      };
    };

    // Apply styling to data rows with conditional colors
    for (let rowIndex = 6; rowIndex < exportData.length + 6; rowIndex++) {
      const isEvenRow = (rowIndex - 6) % 2 === 0;
      const record = exportData[rowIndex - 6];

      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };

        const cellValue = record[header as keyof typeof record];
        worksheet[cellAddress].s = getCellStyle(header, cellValue, isEvenRow);
      });
    }

    // Set row heights - no wrapping so rows can be shorter
    worksheet['!rows'] = [
      { hpt: 25 }, // Title row
      { hpt: 16 }, // Metadata rows
      { hpt: 16 },
      { hpt: 16 },
      { hpt: 5 },  // Spacing row
      { hpt: 22 }, // Header row
    ];

    // Set default row height for data rows - single line height
    for (let i = 6; i < exportData.length + 6; i++) {
      if (!worksheet['!rows']) worksheet['!rows'] = [];
      if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
      worksheet['!rows'][i].hpt = 16; // Single line height
    }

    // Add view settings for optimal screen display
    worksheet['!views'] = [{
      showGridLines: true,
      showRowColHeaders: true,
      rightToLeft: false,
      zoomScale: 70, // Set zoom to 70% to fit more columns on screen
      zoomScaleNormal: 70,
      zoomScalePageLayoutView: 70
    }];

    // Add print settings for better layout
    worksheet['!margins'] = {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    };

    // Set page setup for landscape orientation
    worksheet['!pageSetup'] = {
      orientation: 'landscape',
      scale: 100,
      fitToWidth: 1,
      fitToHeight: 0, // Allow multiple pages vertically
      paperSize: 9 // A4
    };

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Live Site Data');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `BICS_Live_Site_Data_${currentDate}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
    showNotification('success', `Exported ${records.length} records to Excel successfully!`);
  };

  const getPersonnelColor = (personnel: string) => {
    const colorMap: { [key: string]: string } = {
      'ADMARASIGAN': 'bg-blue-100 text-blue-800 border border-blue-200',
      'APMORILLA': 'bg-green-100 text-green-800 border border-green-200',
      'CBTABINGA': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'CLTRABUCO': 'bg-red-100 text-red-800 border border-red-200',
      'DFCAGADAS': 'bg-purple-100 text-purple-800 border border-purple-200',
      'ELALIBO': 'bg-pink-100 text-pink-800 border border-pink-200',
      'JDALVAREZ': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      'JMBALAG': 'bg-teal-100 text-teal-800 border border-teal-200',
      'KDTAMONDONG': 'bg-orange-100 text-orange-800 border border-orange-200',
      'LMTAMAYO': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      'LSAGAPITO': 'bg-lime-100 text-lime-800 border border-lime-200',
      'LTTEOVISIO': 'bg-amber-100 text-amber-800 border border-amber-200',
      'MIDDELACRUZ': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'MLCARANDANG': 'bg-violet-100 text-violet-800 border border-violet-200',
      'NMNARCISO': 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200'
    };
    return colorMap[personnel] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const renderDetailSection = (title: string, fields: { label: string; value: any }[]) => {
    // Default to expanded (true) if not set
    const isExpanded = expandedViewSections[title] !== false;

    return (
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleViewSection(title)}
          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center hover:from-blue-100 hover:to-indigo-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
            {title}
          </h3>
          <ChevronDown
            className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>
        {isExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field, index) => (
                <div key={index} className={`${field.value && field.value.toString().length > 50 ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-900 break-words">
                      {field.value || <span className="text-gray-400 italic">Not specified</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecordDetail = () => {
    if (!selectedRecord) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex justify-between items-center shadow-lg">
            <div>
              <h2 className="text-2xl font-bold mb-1">Site Entry Details</h2>
              <div className="flex items-center space-x-2 text-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm font-medium">
                  {selectedRecord.site_name || 'Unnamed Site'} • {selectedRecord.building_name || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseDetail}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-8 bg-gray-50" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {renderDetailSection('Basic Information', [
              { label: 'EPC BATCH', value: selectedRecord.epc_batch },
              { label: 'VENDOR', value: selectedRecord.vendor },
              { label: 'SNAP ID/BLDG TAG', value: selectedRecord.snap_id_bldg_tag },
              { label: 'PCN', value: selectedRecord.pcn },
              { label: 'BICS PERSONNEL', value: selectedRecord.bcsi_aor },
              { label: 'PROJECT SCHEME', value: selectedRecord.project_scheme },
              { label: 'BID', value: selectedRecord.bid },
            ])}

            {renderDetailSection('Site Information', [
              { label: 'SITE NAME', value: selectedRecord.site_name },
              { label: 'BUILDING NAME', value: selectedRecord.building_name },
              { label: 'ADDRESS', value: selectedRecord.address },
              { label: 'BRGY', value: selectedRecord.brgy },
              { label: 'CITY/MUNICIPALITY', value: selectedRecord.city_municipality },
              { label: 'PROVINCE', value: selectedRecord.province },
              { label: 'COORDINATES', value: selectedRecord.coordinates },
              { label: 'DISTRICT', value: selectedRecord.district },
              { label: 'ZONE', value: selectedRecord.zone },
              { label: 'AREA', value: selectedRecord.area },
              { label: 'MARKET SEGMENT', value: selectedRecord.market_segment },
            ])}

            {renderDetailSection('Building Details', [
              { label: 'BUILDING STATUS', value: selectedRecord.building_status },
              { label: 'USAGE', value: selectedRecord.usage_type },
              { label: 'FLOORS', value: selectedRecord.floors },
              { label: 'UNITS', value: selectedRecord.units },
              { label: 'DEVELOPER', value: selectedRecord.developer },
              { label: 'TOP DEVELOPER', value: selectedRecord.top_dev },
            ])}

            {renderDetailSection('Contact Information', [
              { label: 'NAME', value: selectedRecord.contact_name },
              { label: 'DESIGNATION', value: selectedRecord.designation },
              { label: 'CONTACT NUMBER', value: selectedRecord.contact_number },
              { label: 'EMAIL ADDRESS', value: selectedRecord.email_add },
              { label: 'RELATIONSHIP MANAGER', value: selectedRecord.rm },
              { label: 'RELATIONSHIP MANAGER GROUP', value: selectedRecord.rm_group },
            ])}

            {renderDetailSection('Project Information', [
              { label: 'PROJECT STATUS', value: selectedRecord.project_status },
              { label: 'PROJECT STAGE', value: selectedRecord.project_stage },
              { label: 'PROJECT MILESTONE', value: selectedRecord.project_milestone },
              { label: 'WORKING LINES', value: selectedRecord.working_lines },
              { label: 'ROLLOUT PORTS', value: selectedRecord.rollout_ports },
              { label: 'MRC', value: selectedRecord.mrc },
            ])}

            {renderDetailSection('SAQ Information', [
              { label: 'SAQ MILESTONE', value: selectedRecord.saq_milestone },
              { label: 'COMMERCIAL SCHEME', value: selectedRecord.commercial_scheme },
              { label: 'COL TOR STATUS', value: selectedRecord.col_tor_status },
              { label: 'SIGNED TOR/MOA DATE', value: selectedRecord.signed_tor_moa_date ? new Date(selectedRecord.signed_tor_moa_date).toLocaleDateString() : '-' },
              { label: 'MOA ACQUIRED BY', value: selectedRecord.moa_acquired_by },
              { label: 'MOA UPLOADING STATUS', value: selectedRecord.moa_uploading_status },
            ])}

            {renderDetailSection('Important Dates', [
              { label: 'VALIDATED DATE', value: selectedRecord.validated_date ? new Date(selectedRecord.validated_date).toLocaleDateString() : '-' },
              { label: 'VALIDATED BY', value: selectedRecord.validated_by },
              { label: 'SITE VISITED DATE', value: selectedRecord.site_visited_date ? new Date(selectedRecord.site_visited_date).toLocaleDateString() : '-' },
              { label: 'TARGET DATE PROFILING', value: selectedRecord.target_date_profiling ? new Date(selectedRecord.target_date_profiling).toLocaleDateString() : '-' },
              { label: 'TARGET DATE MOA TO ACQUIRE', value: selectedRecord.target_date_moa_to_acquire ? new Date(selectedRecord.target_date_moa_to_acquire).toLocaleDateString() : '-' },
              { label: 'DATE OF RECENT ENGAGEMENT', value: selectedRecord.date_of_recent_engagement ? new Date(selectedRecord.date_of_recent_engagement).toLocaleDateString() : '-' },
              { label: 'SITE ENTRY DATE', value: selectedRecord.site_entry_date ? new Date(selectedRecord.site_entry_date).toLocaleDateString() : '-' },
            ])}

            {renderDetailSection('Status Information', [
              { label: 'PRODUCTIVITY', value: selectedRecord.productivity },
              { label: 'MOA STATUS', value: selectedRecord.moa_status },
              { label: 'PROFILE STATUS', value: selectedRecord.profile_status },
              { label: 'REF ID', value: selectedRecord.ref_id },
              { label: 'REFERENCE #', value: selectedRecord.reference_number },
              { label: 'PROJECT PHASE', value: selectedRecord.project_phase },
              { label: 'BUDGET STATUS', value: selectedRecord.budget_status },
              { label: 'IMPLEMENTATION STATUS', value: selectedRecord.implementation_status },
            ])}

            {renderDetailSection('Remarks', [
              { label: 'SIGNIFICANT REMARKS', value: selectedRecord.significant_remarks },
            ])}

            {renderDetailSection('Replacement Information', [
              { label: 'REPLACEMENT SITE', value: selectedRecord.replacement_site },
              { label: 'DATE ENDORSE REPLACEMENT', value: selectedRecord.date_endorse_replacement ? new Date(selectedRecord.date_endorse_replacement).toLocaleDateString() : '-' },
              { label: 'DATE ACCEPTED', value: selectedRecord.date_accepted ? new Date(selectedRecord.date_accepted).toLocaleDateString() : '-' },
              { label: 'DATE REJECTED', value: selectedRecord.date_rejected ? new Date(selectedRecord.date_rejected).toLocaleDateString() : '-' },
              { label: 'GO/NOGO', value: selectedRecord.go_nogo },
              { label: 'REPLACEMENTS GROUPINGS', value: selectedRecord.replacements_groupings },
              { label: 'TAGGING TEMP', value: selectedRecord.tagging_temp },
              { label: 'REPLACEMENT REQUEST', value: selectedRecord.replacement_request },
            ])}

            {renderDetailSection('Additional Information', [
              { label: 'PREV BATCH', value: selectedRecord.prev_batch },
              { label: 'FL ID', value: selectedRecord.fl_id },
              { label: 'PO STATUS', value: selectedRecord.po_status },
              { label: 'MIGRATED LINES', value: selectedRecord.migrated_lines },
              { label: 'BASH', value: selectedRecord.quick_bashing },
            ])}

            {renderDetailSection('Revenue & Capacity Metrics', [
              { label: 'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)', value: selectedRecord.based_revenue_existing_circuits_hw_tracker },
              { label: 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)', value: selectedRecord.annual_based_revenue_existing_circuits_efpa },
              { label: 'ACTUAL TAD PORTS/PAIRS PROVISIONED', value: selectedRecord.actual_tad_ports_pairs_provisioned },
              { label: 'MDU/ONU', value: selectedRecord.mdu_onu },
              { label: 'ACTUAL REMAINING PORTS', value: selectedRecord.actual_remaining_ports },
              { label: 'READY TO SELL PORTS', value: selectedRecord.ready_to_sell_ports },
              { label: 'POTENTIAL REVENUE GROWTH', value: selectedRecord.potential_revenue_growth },
              { label: 'ACTUAL TA NETWORK', value: selectedRecord.actual_ta_network },
              { label: 'TA NETWORK VS WARPP', value: selectedRecord.ta_network_vs_warpp },
              { label: 'TA DATE NETWORK', value: selectedRecord.ta_date_network ? new Date(selectedRecord.ta_date_network).toLocaleDateString() : '-' },
              { label: 'ACTUAL TA', value: selectedRecord.actual_ta },
              { label: 'ACTUAL FA', value: selectedRecord.actual_fa },
              { label: 'WARPP PCN', value: selectedRecord.warpp_pcn },
              { label: 'ACTUAL READY TO SELL PORTS', value: selectedRecord.actual_ready_to_sell_ports },
            ])}

            {renderDetailSection('Design & Planning', [
              { label: 'SCHEME DESIGN', value: selectedRecord.scheme_design },
              { label: 'FCO AOR', value: selectedRecord.fco_aor },
            ])}

            {renderDetailSection('FTTB Information', [
              { label: 'FTTB PO RELEASE', value: selectedRecord.fttb_po_release ? new Date(selectedRecord.fttb_po_release).toLocaleDateString() : '-' },
              { label: 'FTTB CIP', value: selectedRecord.fttb_cip },
              { label: 'FTTB TARGET COMPLETION', value: selectedRecord.fttb_target_completion ? new Date(selectedRecord.fttb_target_completion).toLocaleDateString() : '-' },
              { label: 'FTTB ACTUAL TA DATE', value: selectedRecord.fttb_actual_ta_date ? new Date(selectedRecord.fttb_actual_ta_date).toLocaleDateString() : '-' },
              { label: 'ROLLOUT SOLUTION', value: selectedRecord.rollout_solution },
            ])}

            {renderDetailSection('HWS Information', [
              { label: 'HWS PO RELEASE', value: selectedRecord.hws_po_release ? new Date(selectedRecord.hws_po_release).toLocaleDateString() : '-' },
              { label: 'HWS CIP', value: selectedRecord.hws_cip },
              { label: 'HWS TARGET COMPLETION', value: selectedRecord.hws_target_completion ? new Date(selectedRecord.hws_target_completion).toLocaleDateString() : '-' },
              { label: 'HWS ACTUAL COMPLETION', value: selectedRecord.hws_actual_completion ? new Date(selectedRecord.hws_actual_completion).toLocaleDateString() : '-' },
            ])}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Sites View</h1>
            <p className="mt-0.5 text-xs text-gray-600">View all active sites records</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={loading || records.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-[140px]">
              <select
                value={selectedPersonnel}
                onChange={handlePersonnelFilter}
                className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">All BICS Personnel</option>
                {personnelList.map((personnel) => (
                  <option key={personnel} value={personnel}>
                    {personnel}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <select
                value={selectedEpcBatch}
                onChange={handleEpcBatchFilter}
                className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">All EPC Batch</option>
                {epcBatchList.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <select
                value={selectedProjectStatus}
                onChange={handleProjectStatusFilter}
                className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">All Project Status</option>
                {projectStatusList.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <select
                value={selectedProjectScheme}
                onChange={handleProjectSchemeFilter}
                className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">All Project Schemes</option>
                <option value="GROWTH">GROWTH</option>
                <option value="OVERLAY">OVERLAY</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <select
                value={selectedAgingDays}
                onChange={handleAgingDaysFilter}
                className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">All Aging Days</option>
                <option value="0-7">0-7 days (Recent)</option>
                <option value="8-30">8-30 days</option>
                <option value="31-60">31-60 days</option>
                <option value="61+">61+ days (Overdue)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    BICS Personnel
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    EPC Batch
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    Site Name
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    Building Name
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    Project Status
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    Project Scheme
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    SAQ Milestone
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                    Aging Days
                  </th>
                  <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-tight sticky right-0 z-10 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-4 text-center text-xs text-gray-500">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-center">
                        {record.bcsi_aor ? (
                          <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${getPersonnelColor(record.bcsi_aor)}`}>
                            {record.bcsi_aor}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500 text-center">
                        {record.epc_batch || '-'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] font-medium text-gray-900 text-center">
                        {record.site_name || '-'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500 text-center">
                        {record.building_name || '-'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                          record.project_status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : record.project_status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : record.project_status === 'On Hold'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.project_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500 text-center">
                        {record.project_scheme || '-'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-500 text-center">
                        {record.saq_milestone ? (
                          <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                            record.saq_milestone === 'SIGNED MOA'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {record.saq_milestone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] text-gray-900 font-medium text-center">
                        {record.saq_milestone === 'SIGNED MOA' ? (
                          <span className="text-gray-500 italic">-</span>
                        ) : record.date_of_recent_engagement ? (
                          (() => {
                            // Parse date string (YYYY-MM-DD format from backend)
                            // Split and parse manually to avoid timezone issues
                            const dateStr = record.date_of_recent_engagement.split('T')[0]; // Handle both date and datetime formats
                            const [year, month, day] = dateStr.split('-').map(Number);

                            // Create date objects at midnight local time
                            const engagementDate = new Date(year, month - 1, day); // month is 0-indexed
                            const currentDate = new Date();
                            currentDate.setHours(0, 0, 0, 0); // Reset to start of day

                            // Calculate difference in milliseconds and convert to days
                            const diffTime = currentDate.getTime() - engagementDate.getTime();
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            return (
                              <span className={`px-1.5 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                                diffDays <= 7
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {diffDays} {diffDays === 1 ? 'day' : 'days'}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] font-medium sticky right-0 z-10 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewRecord(record)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-3 w-3 mr-0.5" />
                            <span className="text-[10px]">View</span>
                          </button>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="inline-flex items-center text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-3 w-3 mr-0.5" />
                            <span className="text-[10px]">Edit</span>
                          </button>
                          {user?.role === 'Admin' && (
                            <button
                              onClick={() => handleDeleteClick(record)}
                              className="inline-flex items-center text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-3 w-3 mr-0.5" />
                              <span className="text-[10px]">Delete</span>
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
            <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
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
                      className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Detail Modal */}
      {renderRecordDetail()}

      {/* Edit Modal */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
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
                    Are you sure you want to delete this record?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Site:</strong> {deleteConfirmRecord.site_name || 'N/A'}
                    <br />
                    <strong>Building:</strong> {deleteConfirmRecord.building_name || 'N/A'}
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
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Import Excel File</h3>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Notes:</h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Use the <span className="font-semibold">Download Template</span> button to get the standard upload file</li>
                  <li>The Excel file must have headers in <span className="font-semibold">Row 4</span> (if using the template)</li>
                  <li>At least "SITE NAME" or "BUILDING NAME" must be provided</li>
                  <li>Date fields should be in a proper date format (e.g., MM/DD/YYYY)</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </button>
              <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                disabled={importing}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleImportExcel}
                disabled={!selectedFile || importing}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteView;
