import React, { useState, useEffect, useCallback } from 'react';
import { bicsAPI } from '../services/api';
import { DashboardStats } from '../types';
import {
  BarChart3,
  TrendingUp,
  RefreshCw,
  Calendar,
  Activity,
  FileText,
  Download
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx-js-style';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const loadDashboardStats = useCallback(async () => {
    try {
      const statsResponse = await bicsAPI.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await loadDashboardStats();
    setLoading(false);
  };

  const handleExportAllRecords = async () => {
    setExporting(true);
    try {
      // Fetch all records
      const response = await bicsAPI.getRecords({
        page: 1,
        limit: 10000, // Get all records
      });

      if (!response.success || !response.data || response.data.records.length === 0) {
        showNotification('error', 'No records found');
        setExporting(false);
        return;
      }

      const records = response.data.records;

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
        'TOP DEV': record.top_dev || '',

        // Contact Information
        'RM': record.rm || '',
        'RM GROUP': record.rm_group || '',

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
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': record.validated_by || '',

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': record.significant_remarks || '',

        // Status Information
        'PRODUCTIVITY': record.productivity || '',
        'REF ID': record.ref_id || '',

        // Replacement Information
        'REPLACEMENT SITE': record.replacement_site || '',
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': record.moa_status || '',
        'PROFILE STATUS': record.profile_status || '',
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': record.prev_batch || '',
        'FL ID': record.fl_id || '',
        'PO STATUS': record.po_status || '',

        // Replacement Information (continued)
        'GO-NOGO': record.go_nogo || '',
        'QUICK BASHING': record.quick_bashing || '',
        'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
        'TAGGING TEMP': record.tagging_temp || '',

        // Status Information (continued)
        'BUDGET STATUS': record.budget_status || '',
        'PROJECT PHASE': record.project_phase || '',
        'IMPLEM STATUS': record.implementation_status || '',

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': record.warpp_pcn || '',
        'MDU/ONU': record.mdu_onu || '',
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': record.scheme_design || '',
        'FCO AOR': record.fco_aor || '',

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': record.fttb_cip || '',
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': record.rollout_solution || '',

        // BASH Section
        'BASH-PREWORKS (LOUIE)': record.bash_preworks || '',
        'BASH-NETWORK (JARROD)': record.bash_network || '',
        'BASH-HALLWAY (VIDAL)': record.bash_hallway || '',
        'BASH-MIGRATION (JAYR)': record.bash_migration || '',
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
        [`BICS - All Records`],
        [`Export Date: ${currentDateTime}`],
        [`Total Records: ${records.length}`],
        [`Exported By: ${user?.username || 'Unknown'}`],
        [],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(titleData);
      XLSX.utils.sheet_add_json(worksheet, exportData, { origin: 'A6' });

      const headers = Object.keys(exportData[0]);
      const lastColumn = XLSX.utils.encode_col(headers.length - 1);

      worksheet['!autofilter'] = { ref: `A6:${lastColumn}${exportData.length + 6}` };
      worksheet['!freeze'] = { xSplit: 0, ySplit: 6, topLeftCell: 'A7' };

      const columnWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxContentLength = exportData.reduce((max, row) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          return Math.max(max, cellValue.length);
        }, 0);

        let titleContentLength = 0;
        if (colIndex === 0) {
          titleContentLength = Math.max(
            `BICS - All Records`.length,
            `Export Date: ${currentDateTime}`.length,
            `Total Records: ${records.length}`.length,
            `Exported By: ${user?.username || 'Unknown'}`.length
          );
        }

        const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);
        let finalWidth;

        if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
          finalWidth = Math.min(contentWidth, 50);
        } else if (header.includes('COORDINATES')) {
          finalWidth = Math.min(contentWidth, 35);
        } else if (header.includes('PCN') || header.includes('SNAP ID')) {
          finalWidth = Math.min(contentWidth, 25);
        } else if (header.includes('DATE')) {
          finalWidth = Math.max(contentWidth, 18);
        } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
          finalWidth = Math.max(contentWidth, 15);
        } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
          finalWidth = Math.min(contentWidth, 40);
        } else {
          finalWidth = Math.min(contentWidth, 30);
        }

        const minWidth = colIndex === 0 ? 15 : 12;
        return { wch: Math.max(finalWidth, minWidth) };
      });
      worksheet['!cols'] = columnWidths;

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

      if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
      worksheet['A1'].s = titleStyle;

      ['A2', 'A3', 'A4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
        worksheet[cell].s = metaStyle;
      });

      const sectionColors: { [key: string]: string } = {
        'EPC BATCH': '1F4788', 'VENDOR': '1F4788', 'SNAP ID/BLDG TAG': '1F4788', 'PCN': '1F4788',
        'BICS PERSONNEL': '1F4788', 'PROJECT SCHEME': '1F4788', 'BID': '1F4788',
        'SITE NAME': '0D7377', 'BUILDING NAME': '0D7377', 'ADDRESS': '0D7377', 'BRGY': '0D7377',
        'CITY/MUNICIPALITY': '0D7377', 'PROVINCE': '0D7377', 'COORDINATES': '0D7377', 'DISTRICT': '0D7377',
        'ZONE': '0D7377', 'AREA': '0D7377', 'MARKET SEGMENT': '0D7377',
        'BUILDING STATUS': '6B46C1', 'USAGE': '6B46C1', 'FLOORS': '6B46C1', 'UNITS': '6B46C1',
        'DEVELOPER': '6B46C1', 'TOP DEVELOPER': '6B46C1',
        'RELATIONSHIP MANAGER': 'D97706', 'RELATIONSHIP MANAGER GROUP': 'D97706',
        'PROJECT STATUS': '047857', 'PROJECT STAGE': '047857', 'PROJECT MILESTONE': '047857',
        'WORKING LINES': '047857', 'ROLLOUT PORTS': '047857', 'MRC': '047857',
        'SAQ MILESTONE': '4338CA', 'COMMERCIAL SCHEME': '4338CA', 'COL TOR STATUS': '4338CA',
        'SIGNED TOR/MOA DATE': '4338CA', 'MOA ACQUIRED BY': '4338CA', 'MOA UPLOADING STATUS': '4338CA',
        'VALIDATED DATE': 'B91C1C', 'VALIDATED BY': 'B91C1C', 'SITE VISITED DATE': 'B91C1C',
        'TARGET DATE PROFILING': 'B91C1C', 'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
        'DATE OF RECENT ENGAGEMENT': 'B91C1C', 'SITE ENTRY DATE': 'B91C1C',
        'PRODUCTIVITY': '0891B2', 'MOA STATUS': '0891B2', 'PROFILE STATUS': '0891B2', 'REF ID': '0891B2',
        'REFERENCE #': '0891B2', 'PROJECT PHASE': '0891B2', 'BUDGET STATUS': '0891B2', 'IMPLEMENTATION STATUS': '0891B2',
        'SIGNIFICANT REMARKS': '4B5563',
        'REPLACEMENT SITE': 'DB2777', 'DATE ENDORSE REPLACEMENT': 'DB2777', 'DATE ACCEPTED': 'DB2777',
        'DATE REJECTED': 'DB2777', 'GO/NOGO': 'DB2777', 'REPLACEMENTS GROUPINGS': 'DB2777',
        'TAGGING TEMP': 'DB2777', 'REPLACEMENT REQUEST': 'DB2777',
        'PREV BATCH': 'D97706', 'FL ID': 'D97706', 'PO STATUS': 'D97706', 'MIGRATED LINES': 'D97706', 'QUICK BASHING': 'D97706',
        'BASH-PREWORKS (LOUIE)': '7C3AED', 'BASH-NETWORK (JARROD)': '7C3AED', 'BASH-HALLWAY (VIDAL)': '7C3AED', 'BASH-MIGRATION (JAYR)': '7C3AED',
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669', 'MDU/ONU': '059669', 'ACTUAL REMAINING PORTS': '059669',
        'POTENTIAL REVENUE GROWTH': '059669',
        'SCHEME DESIGN': '7C3AED', 'FCO AOR': '7C3AED',
        'FTTB PO RELEASE': '0284C7', 'FTTB CIP': '0284C7', 'FTTB TARGET COMPLETION': '0284C7',
        'ROLLOUT SOLUTION': '0284C7',
      };

      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        worksheet[cellAddress].s = {
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
      });

      const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
        let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
        let fontColor = "000000";
        let isBold = false;

        if (header === 'PROJECT STATUS') {
          if (value === 'ACTIVE') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FALLOUT') {
            backgroundColor = 'FEE2E2';
            fontColor = '991B1B';
            isBold = true;
          } else if (value === 'PIPELINE') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'SAQ MILESTONE') {
          if (value === 'SIGNED MOA') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'PROJECT SCHEME') {
          if (value === 'GROWTH') {
            backgroundColor = 'DBEAFE';
            fontColor = '1E40AF';
            isBold = true;
          } else if (value === 'OVERLAY') {
            backgroundColor = 'E0E7FF';
            fontColor = '3730A3';
            isBold = true;
          }
        }

        if (header === 'BICS PERSONNEL') {
          const personnelColors: { [key: string]: { bg: string, fg: string } } = {
            'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' }, 'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
            'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' }, 'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
            'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' }, 'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
            'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' }, 'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
            'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' }, 'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
            'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' }, 'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
            'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' }, 'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
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

      worksheet['!rows'] = [
        { hpt: 25 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 5 }, { hpt: 22 },
      ];
      for (let i = 6; i < exportData.length + 6; i++) {
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
        worksheet['!rows'][i].hpt = 16;
      }

      worksheet['!views'] = [{
        showGridLines: true,
        showRowColHeaders: true,
        rightToLeft: false,
        zoomScale: 70,
        zoomScaleNormal: 70,
        zoomScalePageLayoutView: 70
      }];

      worksheet['!margins'] = {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
      };
      worksheet['!pageSetup'] = {
        orientation: 'landscape',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All_Records');

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `BICS_All_Records_${currentDate}.xlsx`;

      XLSX.writeFile(workbook, filename);

      showNotification('success', `Exported ${records.length} total records`);
    } catch (error: any) {
      console.error('Error exporting all records:', error);
      showNotification('error', 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByProjectStatus = async (projectStatus: string) => {
    setExporting(true);
    try {
      // Fetch all records with the specific project status
      const response = await bicsAPI.getRecords({
        page: 1,
        limit: 10000,
        project_status: projectStatus
      });

      if (!response.success || !response.data || response.data.records.length === 0) {
        showNotification('error', `No records found for Project Status: ${projectStatus}`);
        setExporting(false);
        return;
      }

      const records = response.data.records;

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
        'TOP DEV': record.top_dev || '',

        // Contact Information
        'RM': record.rm || '',
        'RM GROUP': record.rm_group || '',

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
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': record.validated_by || '',

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': record.significant_remarks || '',

        // Status Information
        'PRODUCTIVITY': record.productivity || '',
        'REF ID': record.ref_id || '',

        // Replacement Information
        'REPLACEMENT SITE': record.replacement_site || '',
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': record.moa_status || '',
        'PROFILE STATUS': record.profile_status || '',
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': record.prev_batch || '',
        'FL ID': record.fl_id || '',
        'PO STATUS': record.po_status || '',

        // Replacement Information (continued)
        'GO-NOGO': record.go_nogo || '',
        'QUICK BASHING': record.quick_bashing || '',
        'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
        'TAGGING TEMP': record.tagging_temp || '',

        // Status Information (continued)
        'BUDGET STATUS': record.budget_status || '',
        'PROJECT PHASE': record.project_phase || '',
        'IMPLEM STATUS': record.implementation_status || '',

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': record.warpp_pcn || '',
        'MDU/ONU': record.mdu_onu || '',
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': record.scheme_design || '',
        'FCO AOR': record.fco_aor || '',

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': record.fttb_cip || '',
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': record.rollout_solution || '',

        // BASH Section
        'BASH-PREWORKS (LOUIE)': record.bash_preworks || '',
        'BASH-NETWORK (JARROD)': record.bash_network || '',
        'BASH-HALLWAY (VIDAL)': record.bash_hallway || '',
        'BASH-MIGRATION (JAYR)': record.bash_migration || '',
      }));

      const currentDateTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusColors: { [key: string]: string } = {
        'ACTIVE': '047857',
        'FALLOUT': 'DC2626',
        'PIPELINE': 'D97706'
      };

      const statusBgColors: { [key: string]: string } = {
        'ACTIVE': 'D1FAE5',
        'FALLOUT': 'FEE2E2',
        'PIPELINE': 'FEF3C7'
      };

      const titleData = [
        [`BICS - ${projectStatus} Projects`],
        [`Export Date: ${currentDateTime}`],
        [`Total Records: ${records.length}`],
        [`Exported By: ${user?.username || 'Unknown'}`],
        [],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(titleData);
      XLSX.utils.sheet_add_json(worksheet, exportData, { origin: 'A6' });

      const headers = Object.keys(exportData[0]);
      const lastColumn = XLSX.utils.encode_col(headers.length - 1);

      worksheet['!autofilter'] = { ref: `A6:${lastColumn}${exportData.length + 6}` };
      worksheet['!freeze'] = { xSplit: 0, ySplit: 6, topLeftCell: 'A7' };

      const columnWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxContentLength = exportData.reduce((max, row) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          return Math.max(max, cellValue.length);
        }, 0);

        let titleContentLength = 0;
        if (colIndex === 0) {
          titleContentLength = Math.max(
            `BICS - ${projectStatus} Projects`.length,
            `Export Date: ${currentDateTime}`.length,
            `Total Records: ${records.length}`.length,
            `Exported By: ${user?.username || 'Unknown'}`.length
          );
        }

        const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);
        let finalWidth;

        if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
          finalWidth = Math.min(contentWidth, 50);
        } else if (header.includes('COORDINATES')) {
          finalWidth = Math.min(contentWidth, 35);
        } else if (header.includes('PCN') || header.includes('SNAP ID')) {
          finalWidth = Math.min(contentWidth, 25);
        } else if (header.includes('DATE')) {
          finalWidth = Math.max(contentWidth, 18);
        } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
          finalWidth = Math.max(contentWidth, 15);
        } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
          finalWidth = Math.min(contentWidth, 40);
        } else {
          finalWidth = Math.min(contentWidth, 30);
        }

        const minWidth = colIndex === 0 ? 15 : 12;
        return { wch: Math.max(finalWidth, minWidth) };
      });
      worksheet['!cols'] = columnWidths;

      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: statusColors[projectStatus] || "1F4788" } },
        alignment: { horizontal: "left", vertical: "center" }
      };

      const metaStyle = {
        font: { sz: 10, color: { rgb: "333333" } },
        fill: { fgColor: { rgb: statusBgColors[projectStatus] || "E8F0FE" } },
        alignment: { horizontal: "left", vertical: "center" }
      };

      if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
      worksheet['A1'].s = titleStyle;

      ['A2', 'A3', 'A4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
        worksheet[cell].s = metaStyle;
      });

      const sectionColors: { [key: string]: string } = {
        'EPC BATCH': '1F4788', 'VENDOR': '1F4788', 'SNAP ID/BLDG TAG': '1F4788', 'PCN': '1F4788',
        'BICS PERSONNEL': '1F4788', 'PROJECT SCHEME': '1F4788', 'BID': '1F4788',
        'SITE NAME': '0D7377', 'BUILDING NAME': '0D7377', 'ADDRESS': '0D7377', 'BRGY': '0D7377',
        'CITY/MUNICIPALITY': '0D7377', 'PROVINCE': '0D7377', 'COORDINATES': '0D7377', 'DISTRICT': '0D7377',
        'ZONE': '0D7377', 'AREA': '0D7377', 'MARKET SEGMENT': '0D7377',
        'BUILDING STATUS': '6B46C1', 'USAGE': '6B46C1', 'FLOORS': '6B46C1', 'UNITS': '6B46C1',
        'DEVELOPER': '6B46C1', 'TOP DEVELOPER': '6B46C1',
        'RELATIONSHIP MANAGER': 'D97706', 'RELATIONSHIP MANAGER GROUP': 'D97706',
        'PROJECT STATUS': '047857', 'PROJECT STAGE': '047857', 'PROJECT MILESTONE': '047857',
        'WORKING LINES': '047857', 'ROLLOUT PORTS': '047857', 'MRC': '047857',
        'SAQ MILESTONE': '4338CA', 'COMMERCIAL SCHEME': '4338CA', 'COL TOR STATUS': '4338CA',
        'SIGNED TOR/MOA DATE': '4338CA', 'MOA ACQUIRED BY': '4338CA', 'MOA UPLOADING STATUS': '4338CA',
        'VALIDATED DATE': 'B91C1C', 'VALIDATED BY': 'B91C1C', 'SITE VISITED DATE': 'B91C1C',
        'TARGET DATE PROFILING': 'B91C1C', 'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
        'DATE OF RECENT ENGAGEMENT': 'B91C1C', 'SITE ENTRY DATE': 'B91C1C',
        'PRODUCTIVITY': '0891B2', 'MOA STATUS': '0891B2', 'PROFILE STATUS': '0891B2', 'REF ID': '0891B2',
        'REFERENCE #': '0891B2', 'PROJECT PHASE': '0891B2', 'BUDGET STATUS': '0891B2', 'IMPLEMENTATION STATUS': '0891B2',
        'SIGNIFICANT REMARKS': '4B5563',
        'REPLACEMENT SITE': 'DB2777', 'DATE ENDORSE REPLACEMENT': 'DB2777', 'DATE ACCEPTED': 'DB2777',
        'DATE REJECTED': 'DB2777', 'GO/NOGO': 'DB2777', 'REPLACEMENTS GROUPINGS': 'DB2777',
        'TAGGING TEMP': 'DB2777', 'REPLACEMENT REQUEST': 'DB2777',
        'PREV BATCH': 'D97706', 'FL ID': 'D97706', 'PO STATUS': 'D97706', 'MIGRATED LINES': 'D97706', 'QUICK BASHING': 'D97706',
        'BASH-PREWORKS (LOUIE)': '7C3AED', 'BASH-NETWORK (JARROD)': '7C3AED', 'BASH-HALLWAY (VIDAL)': '7C3AED', 'BASH-MIGRATION (JAYR)': '7C3AED',
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669', 'MDU/ONU': '059669', 'ACTUAL REMAINING PORTS': '059669',
        'POTENTIAL REVENUE GROWTH': '059669',
        'SCHEME DESIGN': '7C3AED', 'FCO AOR': '7C3AED',
        'FTTB PO RELEASE': '0284C7', 'FTTB CIP': '0284C7', 'FTTB TARGET COMPLETION': '0284C7',
        'ROLLOUT SOLUTION': '0284C7',
      };

      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        worksheet[cellAddress].s = {
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
      });

      const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
        let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
        let fontColor = "000000";
        let isBold = false;

        if (header === 'PROJECT STATUS') {
          if (value === 'ACTIVE') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FALLOUT') {
            backgroundColor = 'FEE2E2';
            fontColor = '991B1B';
            isBold = true;
          } else if (value === 'PIPELINE') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'SAQ MILESTONE') {
          if (value === 'SIGNED MOA') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'PROJECT SCHEME') {
          if (value === 'GROWTH') {
            backgroundColor = 'DBEAFE';
            fontColor = '1E40AF';
            isBold = true;
          } else if (value === 'OVERLAY') {
            backgroundColor = 'E0E7FF';
            fontColor = '3730A3';
            isBold = true;
          }
        }

        if (header === 'BICS PERSONNEL') {
          const personnelColors: { [key: string]: { bg: string, fg: string } } = {
            'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' }, 'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
            'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' }, 'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
            'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' }, 'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
            'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' }, 'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
            'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' }, 'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
            'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' }, 'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
            'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' }, 'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
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

      worksheet['!rows'] = [
        { hpt: 25 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 5 }, { hpt: 22 },
      ];
      for (let i = 6; i < exportData.length + 6; i++) {
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
        worksheet['!rows'][i].hpt = 16;
      }

      worksheet['!views'] = [{
        showGridLines: true,
        showRowColHeaders: true,
        rightToLeft: false,
        zoomScale: 70,
        zoomScaleNormal: 70,
        zoomScalePageLayoutView: 70
      }];

      worksheet['!margins'] = {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
      };
      worksheet['!pageSetup'] = {
        orientation: 'landscape',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, projectStatus.replace(/\s+/g, '_'));

      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `BICS_${projectStatus.replace(/\s+/g, '_')}_Projects_${currentDate}.xlsx`;

      XLSX.writeFile(workbook, filename);

      showNotification('success', `Exported ${records.length} ${projectStatus} projects`);
    } catch (error: any) {
      console.error('Error exporting project status records:', error);
      showNotification('error', 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByMoaStatus = async (moaStatus: string) => {
    setExporting(true);
    const isBlank = moaStatus === '';
    const displayLabel = isBlank ? 'No Status' : moaStatus;
    try {
      // Fetch all records with the specific MOA status
      const response = await bicsAPI.getRecords({
        page: 1,
        limit: 10000, // Get all records
        ...(isBlank ? { moa_status_blank: true } : { moa_status: moaStatus })
      });

      if (!response.success || !response.data || response.data.records.length === 0) {
        showNotification('error', `No records found for MOA Status: ${displayLabel}`);
        setExporting(false);
        return;
      }

      const records = response.data.records;

      // Prepare data for Excel export (same structure as SiteView)
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
        'TOP DEV': record.top_dev || '',

        // Contact Information
        'RM': record.rm || '',
        'RM GROUP': record.rm_group || '',

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
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': record.validated_by || '',

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': record.significant_remarks || '',

        // Status Information
        'PRODUCTIVITY': record.productivity || '',
        'REF ID': record.ref_id || '',

        // Replacement Information
        'REPLACEMENT SITE': record.replacement_site || '',
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': record.moa_status || '',
        'PROFILE STATUS': record.profile_status || '',
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': record.prev_batch || '',
        'FL ID': record.fl_id || '',
        'PO STATUS': record.po_status || '',

        // Replacement Information (continued)
        'GO-NOGO': record.go_nogo || '',
        'QUICK BASHING': record.quick_bashing || '',
        'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
        'TAGGING TEMP': record.tagging_temp || '',

        // Status Information (continued)
        'BUDGET STATUS': record.budget_status || '',
        'PROJECT PHASE': record.project_phase || '',
        'IMPLEM STATUS': record.implementation_status || '',

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': record.warpp_pcn || '',
        'MDU/ONU': record.mdu_onu || '',
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': record.scheme_design || '',
        'FCO AOR': record.fco_aor || '',

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': record.fttb_cip || '',
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': record.rollout_solution || '',

        // BASH Section
        'BASH-PREWORKS (LOUIE)': record.bash_preworks || '',
        'BASH-NETWORK (JARROD)': record.bash_network || '',
        'BASH-HALLWAY (VIDAL)': record.bash_hallway || '',
        'BASH-MIGRATION (JAYR)': record.bash_migration || '',
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
        [`BICS - MOA Status: ${displayLabel}`],
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

      // Auto-size columns based on actual content
      const columnWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxContentLength = exportData.reduce((max, row) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          return Math.max(max, cellValue.length);
        }, 0);

        let titleContentLength = 0;
        if (colIndex === 0) {
          titleContentLength = Math.max(
            `BICS - MOA Status: ${displayLabel}`.length,
            `Export Date: ${currentDateTime}`.length,
            `Total Records: ${records.length}`.length,
            `Exported By: ${user?.username || 'Unknown'}`.length
          );
        }

        const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);
        let finalWidth;

        if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
          finalWidth = Math.min(contentWidth, 50);
        } else if (header.includes('COORDINATES')) {
          finalWidth = Math.min(contentWidth, 35);
        } else if (header.includes('PCN') || header.includes('SNAP ID')) {
          finalWidth = Math.min(contentWidth, 25);
        } else if (header.includes('DATE')) {
          finalWidth = Math.max(contentWidth, 18);
        } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
          finalWidth = Math.max(contentWidth, 15);
        } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
          finalWidth = Math.min(contentWidth, 40);
        } else {
          finalWidth = Math.min(contentWidth, 30);
        }

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

      if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
      worksheet['A1'].s = titleStyle;

      ['A2', 'A3', 'A4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
        worksheet[cell].s = metaStyle;
      });

      // Define section colors for headers (same as SiteView)
      const sectionColors: { [key: string]: string } = {
        'EPC BATCH': '1F4788', 'VENDOR': '1F4788', 'SNAP ID/BLDG TAG': '1F4788', 'PCN': '1F4788',
        'BICS PERSONNEL': '1F4788', 'PROJECT SCHEME': '1F4788', 'BID': '1F4788',
        'SITE NAME': '0D7377', 'BUILDING NAME': '0D7377', 'ADDRESS': '0D7377', 'BRGY': '0D7377',
        'CITY/MUNICIPALITY': '0D7377', 'PROVINCE': '0D7377', 'COORDINATES': '0D7377', 'DISTRICT': '0D7377',
        'ZONE': '0D7377', 'AREA': '0D7377', 'MARKET SEGMENT': '0D7377',
        'BUILDING STATUS': '6B46C1', 'USAGE': '6B46C1', 'FLOORS': '6B46C1', 'UNITS': '6B46C1',
        'DEVELOPER': '6B46C1', 'TOP DEVELOPER': '6B46C1',
        'RELATIONSHIP MANAGER': 'D97706', 'RELATIONSHIP MANAGER GROUP': 'D97706',
        'PROJECT STATUS': '047857', 'PROJECT STAGE': '047857', 'PROJECT MILESTONE': '047857',
        'WORKING LINES': '047857', 'ROLLOUT PORTS': '047857', 'MRC': '047857',
        'SAQ MILESTONE': '4338CA', 'COMMERCIAL SCHEME': '4338CA', 'COL TOR STATUS': '4338CA',
        'SIGNED TOR/MOA DATE': '4338CA', 'MOA ACQUIRED BY': '4338CA', 'MOA UPLOADING STATUS': '4338CA',
        'VALIDATED DATE': 'B91C1C', 'VALIDATED BY': 'B91C1C', 'SITE VISITED DATE': 'B91C1C',
        'TARGET DATE PROFILING': 'B91C1C', 'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
        'DATE OF RECENT ENGAGEMENT': 'B91C1C', 'SITE ENTRY DATE': 'B91C1C',
        'PRODUCTIVITY': '0891B2', 'MOA STATUS': '0891B2', 'PROFILE STATUS': '0891B2', 'REF ID': '0891B2',
        'REFERENCE #': '0891B2', 'PROJECT PHASE': '0891B2', 'BUDGET STATUS': '0891B2', 'IMPLEMENTATION STATUS': '0891B2',
        'SIGNIFICANT REMARKS': '4B5563',
        'REPLACEMENT SITE': 'DB2777', 'DATE ENDORSE REPLACEMENT': 'DB2777', 'DATE ACCEPTED': 'DB2777',
        'DATE REJECTED': 'DB2777', 'GO/NOGO': 'DB2777', 'REPLACEMENTS GROUPINGS': 'DB2777',
        'TAGGING TEMP': 'DB2777', 'REPLACEMENT REQUEST': 'DB2777',
        'PREV BATCH': 'D97706', 'FL ID': 'D97706', 'PO STATUS': 'D97706', 'MIGRATED LINES': 'D97706', 'QUICK BASHING': 'D97706',
        'BASH-PREWORKS (LOUIE)': '7C3AED', 'BASH-NETWORK (JARROD)': '7C3AED', 'BASH-HALLWAY (VIDAL)': '7C3AED', 'BASH-MIGRATION (JAYR)': '7C3AED',
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669', 'MDU/ONU': '059669', 'ACTUAL REMAINING PORTS': '059669',
        'POTENTIAL REVENUE GROWTH': '059669',
        'SCHEME DESIGN': '7C3AED', 'FCO AOR': '7C3AED',
        'FTTB PO RELEASE': '0284C7', 'FTTB CIP': '0284C7', 'FTTB TARGET COMPLETION': '0284C7',
        'ROLLOUT SOLUTION': '0284C7',
      };

      // Apply header styles
      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        worksheet[cellAddress].s = {
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
      });

      // Helper function for conditional cell colors
      const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
        let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
        let fontColor = "000000";
        let isBold = false;

        if (header === 'PROJECT STATUS') {
          if (value === 'ACTIVE') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FALLOUT') {
            backgroundColor = 'FEE2E2';
            fontColor = '991B1B';
            isBold = true;
          } else if (value === 'PIPELINE') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'SAQ MILESTONE') {
          if (value === 'SIGNED MOA') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'PROJECT SCHEME') {
          if (value === 'GROWTH') {
            backgroundColor = 'DBEAFE';
            fontColor = '1E40AF';
            isBold = true;
          } else if (value === 'OVERLAY') {
            backgroundColor = 'E0E7FF';
            fontColor = '3730A3';
            isBold = true;
          }
        }

        if (header === 'BICS PERSONNEL') {
          const personnelColors: { [key: string]: { bg: string, fg: string } } = {
            'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' }, 'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
            'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' }, 'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
            'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' }, 'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
            'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' }, 'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
            'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' }, 'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
            'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' }, 'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
            'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' }, 'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
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

      // Apply styling to data rows
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

      // Set row heights
      worksheet['!rows'] = [
        { hpt: 25 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 5 }, { hpt: 22 },
      ];
      for (let i = 6; i < exportData.length + 6; i++) {
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
        worksheet['!rows'][i].hpt = 16;
      }

      // View settings
      worksheet['!views'] = [{
        showGridLines: true,
        showRowColHeaders: true,
        rightToLeft: false,
        zoomScale: 70,
        zoomScaleNormal: 70,
        zoomScalePageLayoutView: 70
      }];

      // Print settings
      worksheet['!margins'] = {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
      };
      worksheet['!pageSetup'] = {
        orientation: 'landscape',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, displayLabel.replace(/\s+/g, '_'));

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `BICS_MOA_${displayLabel.replace(/\s+/g, '_')}_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      showNotification('success', `Exported ${records.length} records for MOA Status: ${displayLabel}`);
    } catch (error: any) {
      console.error('Error exporting MOA status records:', error);
      showNotification('error', 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByAgingDays = async (minDays: number) => {
    setExporting(true);
    try {
      // Fetch all records with aging days >= minDays
      const response = await bicsAPI.getRecords({
        page: 1,
        limit: 10000, // Get all records
        min_aging_days: minDays
      });

      if (!response.success || !response.data || response.data.records.length === 0) {
        showNotification('error', `No records found with ${minDays}+ aging days`);
        setExporting(false);
        return;
      }

      const records = response.data.records;

      // Prepare data for Excel export (same structure as MOA Status export)
      const exportData = records.map(record => {
        // Calculate aging days using same logic as SiteView
        let agingDaysDisplay: string | number = 'N/A';

        if (record.saq_milestone === 'SIGNED MOA') {
          agingDaysDisplay = '-';
        } else if (record.date_of_recent_engagement) {
          // Parse date string (YYYY-MM-DD format from backend)
          // Split and parse manually to avoid timezone issues
          const dateStr = record.date_of_recent_engagement.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);

          // Create date objects at midnight local time
          const engagementDate = new Date(year, month - 1, day);
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Reset to start of day

          // Calculate difference in milliseconds and convert to days
          const diffTime = currentDate.getTime() - engagementDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          agingDaysDisplay = diffDays;
        }

        return {
          // Aging Days (first column)
          'AGING DAYS': agingDaysDisplay,

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
          'TOP DEV': record.top_dev || '',

          // Contact Information
          'RM': record.rm || '',
          'RM GROUP': record.rm_group || '',

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
          'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
          'VALIDATED BY': record.validated_by || '',

          // Important Dates
          'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
          'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
          'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
          'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

          // Remarks
          'SIGNIFICANT REMARKS': record.significant_remarks || '',

          // Status Information
          'PRODUCTIVITY': record.productivity || '',
          'REF ID': record.ref_id || '',

          // Replacement Information
          'REPLACEMENT SITE': record.replacement_site || '',
          'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
          'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
          'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

          // Status Information (continued)
          'MOA STATUS': record.moa_status || '',
          'PROFILE STATUS': record.profile_status || '',
          'REFERENCE #': record.reference_number || '',
          'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

          // Additional Information
          'PREV BATCH': record.prev_batch || '',
          'FL ID': record.fl_id || '',
          'PO STATUS': record.po_status || '',

          // Replacement Information (continued)
          'GO-NOGO': record.go_nogo || '',
          'QUICK BASHING': record.quick_bashing || '',
          'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
          'TAGGING TEMP': record.tagging_temp || '',

          // Status Information (continued)
          'BUDGET STATUS': record.budget_status || '',
          'PROJECT PHASE': record.project_phase || '',
          'IMPLEM STATUS': record.implementation_status || '',

          // Revenue & Capacity Metrics
          'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
          'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
          'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
          'ACTUAL TA': record.actual_ta || '',
          'ACTUAL FA': record.actual_fa || '',
          'WARPP PCN': record.warpp_pcn || '',
          'MDU/ONU': record.mdu_onu || '',
          'MIGRATED LINES': record.migrated_lines || '',
          'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
          'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
          'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

          // Design & Planning
          'SCHEME DESIGN': record.scheme_design || '',
          'FCO AOR': record.fco_aor || '',

          // FTTB Information
          'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
          'FTTB CIP': record.fttb_cip || '',
          'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
          'ROLLOUT SOLUTION': record.rollout_solution || '',

          // BASH Section
          'BASH-PREWORKS (LOUIE)': record.bash_preworks || '',
          'BASH-NETWORK (JARROD)': record.bash_network || '',
          'BASH-HALLWAY (VIDAL)': record.bash_hallway || '',
          'BASH-MIGRATION (JAYR)': record.bash_migration || '',

        };
      });

      // Create title row with metadata
      const currentDateTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const titleData = [
        [`BICS - Aging ${minDays}+ Days`],
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

      // Auto-size columns based on actual content
      const columnWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxContentLength = exportData.reduce((max, row) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          return Math.max(max, cellValue.length);
        }, 0);

        let titleContentLength = 0;
        if (colIndex === 0) {
          titleContentLength = Math.max(
            `BICS - Aging ${minDays}+ Days`.length,
            `Export Date: ${currentDateTime}`.length,
            `Total Records: ${records.length}`.length,
            `Exported By: ${user?.username || 'Unknown'}`.length
          );
        }

        const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);
        let finalWidth;

        if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
          finalWidth = Math.min(contentWidth, 50);
        } else if (header.includes('COORDINATES')) {
          finalWidth = Math.min(contentWidth, 35);
        } else if (header.includes('PCN') || header.includes('SNAP ID')) {
          finalWidth = Math.min(contentWidth, 25);
        } else if (header.includes('DATE')) {
          finalWidth = Math.max(contentWidth, 18);
        } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
          finalWidth = Math.max(contentWidth, 15);
        } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
          finalWidth = Math.min(contentWidth, 40);
        } else if (header === 'AGING DAYS') {
          finalWidth = Math.max(contentWidth, 12);
        } else {
          finalWidth = Math.min(contentWidth, 30);
        }

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

      if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
      worksheet['A1'].s = titleStyle;

      ['A2', 'A3', 'A4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
        worksheet[cell].s = metaStyle;
      });

      // Define section colors for headers (same as SiteView)
      const sectionColors: { [key: string]: string } = {
        'AGING DAYS': 'DC2626', // Red for aging days
        'EPC BATCH': '1F4788', 'VENDOR': '1F4788', 'SNAP ID/BLDG TAG': '1F4788', 'PCN': '1F4788',
        'BICS PERSONNEL': '1F4788', 'PROJECT SCHEME': '1F4788', 'BID': '1F4788',
        'SITE NAME': '0D7377', 'BUILDING NAME': '0D7377', 'ADDRESS': '0D7377', 'BRGY': '0D7377',
        'CITY/MUNICIPALITY': '0D7377', 'PROVINCE': '0D7377', 'COORDINATES': '0D7377', 'DISTRICT': '0D7377',
        'ZONE': '0D7377', 'AREA': '0D7377', 'MARKET SEGMENT': '0D7377',
        'BUILDING STATUS': '6B46C1', 'USAGE': '6B46C1', 'FLOORS': '6B46C1', 'UNITS': '6B46C1',
        'DEVELOPER': '6B46C1', 'TOP DEVELOPER': '6B46C1',
        'RELATIONSHIP MANAGER': 'D97706', 'RELATIONSHIP MANAGER GROUP': 'D97706',
        'PROJECT STATUS': '047857', 'PROJECT STAGE': '047857', 'PROJECT MILESTONE': '047857',
        'WORKING LINES': '047857', 'ROLLOUT PORTS': '047857', 'MRC': '047857',
        'SAQ MILESTONE': '4338CA', 'COMMERCIAL SCHEME': '4338CA', 'COL TOR STATUS': '4338CA',
        'SIGNED TOR/MOA DATE': '4338CA', 'MOA ACQUIRED BY': '4338CA', 'MOA UPLOADING STATUS': '4338CA',
        'VALIDATED DATE': 'B91C1C', 'VALIDATED BY': 'B91C1C', 'SITE VISITED DATE': 'B91C1C',
        'TARGET DATE PROFILING': 'B91C1C', 'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
        'DATE OF RECENT ENGAGEMENT': 'B91C1C', 'SITE ENTRY DATE': 'B91C1C',
        'PRODUCTIVITY': '0891B2', 'MOA STATUS': '0891B2', 'PROFILE STATUS': '0891B2', 'REF ID': '0891B2',
        'REFERENCE #': '0891B2', 'PROJECT PHASE': '0891B2', 'BUDGET STATUS': '0891B2', 'IMPLEMENTATION STATUS': '0891B2',
        'SIGNIFICANT REMARKS': '4B5563',
        'REPLACEMENT SITE': 'DB2777', 'DATE ENDORSE REPLACEMENT': 'DB2777', 'DATE ACCEPTED': 'DB2777',
        'DATE REJECTED': 'DB2777', 'GO/NOGO': 'DB2777', 'REPLACEMENTS GROUPINGS': 'DB2777',
        'TAGGING TEMP': 'DB2777', 'REPLACEMENT REQUEST': 'DB2777',
        'PREV BATCH': 'D97706', 'FL ID': 'D97706', 'PO STATUS': 'D97706', 'MIGRATED LINES': 'D97706', 'QUICK BASHING': 'D97706',
        'BASH-PREWORKS (LOUIE)': '7C3AED', 'BASH-NETWORK (JARROD)': '7C3AED', 'BASH-HALLWAY (VIDAL)': '7C3AED', 'BASH-MIGRATION (JAYR)': '7C3AED',
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669', 'MDU/ONU': '059669', 'ACTUAL REMAINING PORTS': '059669',
        'POTENTIAL REVENUE GROWTH': '059669',
        'SCHEME DESIGN': '7C3AED', 'FCO AOR': '7C3AED',
        'FTTB PO RELEASE': '0284C7', 'FTTB CIP': '0284C7', 'FTTB TARGET COMPLETION': '0284C7',
        'ROLLOUT SOLUTION': '0284C7',
      };

      // Apply header styles
      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        worksheet[cellAddress].s = {
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
      });

      // Helper function for conditional cell colors
      const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
        let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
        let fontColor = "000000";
        let isBold = false;

        // Highlight aging days
        if (header === 'AGING DAYS') {
          if (value === '-') {
            // SIGNED MOA - show as complete (green)
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (typeof value === 'number') {
            if (value >= 15) {
              backgroundColor = 'FEE2E2';
              fontColor = '991B1B';
              isBold = true;
            } else if (value >= 8) {
              backgroundColor = 'FEF3C7';
              fontColor = '92400E';
              isBold = true;
            }
          }
        }

        if (header === 'PROJECT STATUS') {
          if (value === 'ACTIVE') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FALLOUT') {
            backgroundColor = 'FEE2E2';
            fontColor = '991B1B';
            isBold = true;
          } else if (value === 'PIPELINE') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'SAQ MILESTONE') {
          if (value === 'SIGNED MOA') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'PROJECT SCHEME') {
          if (value === 'GROWTH') {
            backgroundColor = 'DBEAFE';
            fontColor = '1E40AF';
            isBold = true;
          } else if (value === 'OVERLAY') {
            backgroundColor = 'E0E7FF';
            fontColor = '3730A3';
            isBold = true;
          }
        }

        if (header === 'BICS PERSONNEL') {
          const personnelColors: { [key: string]: { bg: string, fg: string } } = {
            'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' }, 'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
            'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' }, 'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
            'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' }, 'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
            'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' }, 'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
            'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' }, 'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
            'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' }, 'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
            'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' }, 'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
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

      // Apply styling to data rows
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

      // Set row heights
      worksheet['!rows'] = [
        { hpt: 25 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 5 }, { hpt: 22 },
      ];
      for (let i = 6; i < exportData.length + 6; i++) {
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
        worksheet['!rows'][i].hpt = 16;
      }

      // View settings
      worksheet['!views'] = [{
        showGridLines: true,
        showRowColHeaders: true,
        rightToLeft: false,
        zoomScale: 70,
        zoomScaleNormal: 70,
        zoomScalePageLayoutView: 70
      }];

      // Print settings
      worksheet['!margins'] = {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
      };
      worksheet['!pageSetup'] = {
        orientation: 'landscape',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Aging_${minDays}Plus_Days`);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `BICS_Aging_${minDays}Plus_Days_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      showNotification('success', `Exported ${records.length} records with ${minDays}+ aging days`);
    } catch (error: any) {
      console.error('Error exporting aging days records:', error);
      showNotification('error', 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  const handleExportRecentEngagement = async (maxDays: number) => {
    setExporting(true);
    try {
      // Fetch all records with aging days <= maxDays
      const response = await bicsAPI.getRecords({
        page: 1,
        limit: 10000, // Get all records
        max_aging_days: maxDays
      });

      if (!response.success || !response.data || response.data.records.length === 0) {
        showNotification('error', `No records found with ${maxDays} or fewer aging days`);
        setExporting(false);
        return;
      }

      const records = response.data.records;

      // Prepare data for Excel export (same structure as aging days export)
      const exportData = records.map(record => {
        // Calculate aging days using same logic as SiteView
        let agingDaysDisplay: string | number = 'N/A';

        if (record.saq_milestone === 'SIGNED MOA') {
          agingDaysDisplay = '-';
        } else if (record.date_of_recent_engagement) {
          // Parse date string (YYYY-MM-DD format from backend)
          // Split and parse manually to avoid timezone issues
          const dateStr = record.date_of_recent_engagement.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);

          // Create date objects at midnight local time
          const engagementDate = new Date(year, month - 1, day);
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Reset to start of day

          // Calculate difference in milliseconds and convert to days
          const diffTime = currentDate.getTime() - engagementDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          agingDaysDisplay = diffDays;
        }

        return {
          // Aging Days (first column)
          'AGING DAYS': agingDaysDisplay,

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
          'TOP DEV': record.top_dev || '',

          // Contact Information
          'RM': record.rm || '',
          'RM GROUP': record.rm_group || '',

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
          'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
          'VALIDATED BY': record.validated_by || '',

          // Important Dates
          'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
          'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
          'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
          'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

          // Remarks
          'SIGNIFICANT REMARKS': record.significant_remarks || '',

          // Status Information
          'PRODUCTIVITY': record.productivity || '',
          'REF ID': record.ref_id || '',

          // Replacement Information
          'REPLACEMENT SITE': record.replacement_site || '',
          'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
          'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
          'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

          // Status Information (continued)
          'MOA STATUS': record.moa_status || '',
          'PROFILE STATUS': record.profile_status || '',
          'REFERENCE #': record.reference_number || '',
          'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

          // Additional Information
          'PREV BATCH': record.prev_batch || '',
          'FL ID': record.fl_id || '',
          'PO STATUS': record.po_status || '',

          // Replacement Information (continued)
          'GO-NOGO': record.go_nogo || '',
          'QUICK BASHING': record.quick_bashing || '',
          'REPLACEMENTS GROUPINGS': record.replacements_groupings || '',
          'TAGGING TEMP': record.tagging_temp || '',

          // Status Information (continued)
          'BUDGET STATUS': record.budget_status || '',
          'PROJECT PHASE': record.project_phase || '',
          'IMPLEM STATUS': record.implementation_status || '',

          // Revenue & Capacity Metrics
          'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
          'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
          'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
          'ACTUAL TA': record.actual_ta || '',
          'ACTUAL FA': record.actual_fa || '',
          'WARPP PCN': record.warpp_pcn || '',
          'MDU/ONU': record.mdu_onu || '',
          'MIGRATED LINES': record.migrated_lines || '',
          'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
          'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
          'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

          // Design & Planning
          'SCHEME DESIGN': record.scheme_design || '',
          'FCO AOR': record.fco_aor || '',

          // FTTB Information
          'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
          'FTTB CIP': record.fttb_cip || '',
          'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
          'ROLLOUT SOLUTION': record.rollout_solution || '',

          // BASH Section
          'BASH-PREWORKS (LOUIE)': record.bash_preworks || '',
          'BASH-NETWORK (JARROD)': record.bash_network || '',
          'BASH-HALLWAY (VIDAL)': record.bash_hallway || '',
          'BASH-MIGRATION (JAYR)': record.bash_migration || '',

        };
      });

      // Create title row with metadata
      const currentDateTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const titleData = [
        [`BICS - Recent Engagement (${maxDays} Days or Less)`],
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

      // Auto-size columns based on actual content
      const columnWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxContentLength = exportData.reduce((max, row) => {
          const cellValue = String(row[header as keyof typeof row] || '');
          return Math.max(max, cellValue.length);
        }, 0);

        let titleContentLength = 0;
        if (colIndex === 0) {
          titleContentLength = Math.max(
            `BICS - Recent Engagement (${maxDays} Days or Less)`.length,
            `Export Date: ${currentDateTime}`.length,
            `Total Records: ${records.length}`.length,
            `Exported By: ${user?.username || 'Unknown'}`.length
          );
        }

        const contentWidth = Math.max(headerLength, maxContentLength, titleContentLength);
        let finalWidth;

        if (header === 'ADDRESS' || header === 'SIGNIFICANT REMARKS') {
          finalWidth = Math.min(contentWidth, 50);
        } else if (header.includes('COORDINATES')) {
          finalWidth = Math.min(contentWidth, 35);
        } else if (header.includes('PCN') || header.includes('SNAP ID')) {
          finalWidth = Math.min(contentWidth, 25);
        } else if (header.includes('DATE')) {
          finalWidth = Math.max(contentWidth, 18);
        } else if (header.includes('NAME') || header.includes('PERSONNEL')) {
          finalWidth = Math.max(contentWidth, 15);
        } else if (header.includes('REVENUE') || header.includes('DESCRIPTION')) {
          finalWidth = Math.min(contentWidth, 40);
        } else if (header === 'AGING DAYS') {
          finalWidth = Math.max(contentWidth, 12);
        } else {
          finalWidth = Math.min(contentWidth, 30);
        }

        const minWidth = colIndex === 0 ? 15 : 12;
        return { wch: Math.max(finalWidth, minWidth) };
      });
      worksheet['!cols'] = columnWidths;

      // Apply styling to title rows
      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "047857" } },
        alignment: { horizontal: "left", vertical: "center" }
      };

      const metaStyle = {
        font: { sz: 10, color: { rgb: "333333" } },
        fill: { fgColor: { rgb: "D1FAE5" } },
        alignment: { horizontal: "left", vertical: "center" }
      };

      if (!worksheet['A1']) worksheet['A1'] = { t: 's', v: '' };
      worksheet['A1'].s = titleStyle;

      ['A2', 'A3', 'A4'].forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = { t: 's', v: '' };
        worksheet[cell].s = metaStyle;
      });

      // Define section colors for headers (same as other exports)
      const sectionColors: { [key: string]: string } = {
        'AGING DAYS': '047857', // Green for recent engagement
        'EPC BATCH': '1F4788', 'VENDOR': '1F4788', 'SNAP ID/BLDG TAG': '1F4788', 'PCN': '1F4788',
        'BICS PERSONNEL': '1F4788', 'PROJECT SCHEME': '1F4788', 'BID': '1F4788',
        'SITE NAME': '0D7377', 'BUILDING NAME': '0D7377', 'ADDRESS': '0D7377', 'BRGY': '0D7377',
        'CITY/MUNICIPALITY': '0D7377', 'PROVINCE': '0D7377', 'COORDINATES': '0D7377', 'DISTRICT': '0D7377',
        'ZONE': '0D7377', 'AREA': '0D7377', 'MARKET SEGMENT': '0D7377',
        'BUILDING STATUS': '6B46C1', 'USAGE': '6B46C1', 'FLOORS': '6B46C1', 'UNITS': '6B46C1',
        'DEVELOPER': '6B46C1', 'TOP DEVELOPER': '6B46C1',
        'RELATIONSHIP MANAGER': 'D97706', 'RELATIONSHIP MANAGER GROUP': 'D97706',
        'PROJECT STATUS': '047857', 'PROJECT STAGE': '047857', 'PROJECT MILESTONE': '047857',
        'WORKING LINES': '047857', 'ROLLOUT PORTS': '047857', 'MRC': '047857',
        'SAQ MILESTONE': '4338CA', 'COMMERCIAL SCHEME': '4338CA', 'COL TOR STATUS': '4338CA',
        'SIGNED TOR/MOA DATE': '4338CA', 'MOA ACQUIRED BY': '4338CA', 'MOA UPLOADING STATUS': '4338CA',
        'VALIDATED DATE': 'B91C1C', 'VALIDATED BY': 'B91C1C', 'SITE VISITED DATE': 'B91C1C',
        'TARGET DATE PROFILING': 'B91C1C', 'TARGET DATE MOA TO ACQUIRE': 'B91C1C',
        'DATE OF RECENT ENGAGEMENT': 'B91C1C', 'SITE ENTRY DATE': 'B91C1C',
        'PRODUCTIVITY': '0891B2', 'MOA STATUS': '0891B2', 'PROFILE STATUS': '0891B2', 'REF ID': '0891B2',
        'REFERENCE #': '0891B2', 'PROJECT PHASE': '0891B2', 'BUDGET STATUS': '0891B2', 'IMPLEMENTATION STATUS': '0891B2',
        'SIGNIFICANT REMARKS': '4B5563',
        'REPLACEMENT SITE': 'DB2777', 'DATE ENDORSE REPLACEMENT': 'DB2777', 'DATE ACCEPTED': 'DB2777',
        'DATE REJECTED': 'DB2777', 'GO/NOGO': 'DB2777', 'REPLACEMENTS GROUPINGS': 'DB2777',
        'TAGGING TEMP': 'DB2777', 'REPLACEMENT REQUEST': 'DB2777',
        'PREV BATCH': 'D97706', 'FL ID': 'D97706', 'PO STATUS': 'D97706', 'MIGRATED LINES': 'D97706', 'QUICK BASHING': 'D97706',
        'BASH-PREWORKS (LOUIE)': '7C3AED', 'BASH-NETWORK (JARROD)': '7C3AED', 'BASH-HALLWAY (VIDAL)': '7C3AED', 'BASH-MIGRATION (JAYR)': '7C3AED',
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': '059669', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': '059669',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': '059669', 'MDU/ONU': '059669', 'ACTUAL REMAINING PORTS': '059669',
        'POTENTIAL REVENUE GROWTH': '059669',
        'SCHEME DESIGN': '7C3AED', 'FCO AOR': '7C3AED',
        'FTTB PO RELEASE': '0284C7', 'FTTB CIP': '0284C7', 'FTTB TARGET COMPLETION': '0284C7',
        'ROLLOUT SOLUTION': '0284C7',
      };

      // Apply header styles
      headers.forEach((header, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
        worksheet[cellAddress].s = {
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
      });

      // Helper function for conditional cell colors (for recent engagement)
      const getCellStyle = (header: string, value: any, isEvenRow: boolean) => {
        let backgroundColor = isEvenRow ? "FFFFFF" : "F8F9FA";
        let fontColor = "000000";
        let isBold = false;

        // Highlight aging days (green for recent engagement)
        if (header === 'AGING DAYS') {
          if (value === '-') {
            // SIGNED MOA - show as complete (green)
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (typeof value === 'number') {
            if (value <= 3) {
              backgroundColor = 'D1FAE5';
              fontColor = '065F46';
              isBold = true;
            } else if (value <= 7) {
              backgroundColor = 'FEF3C7';
              fontColor = '92400E';
              isBold = true;
            }
          }
        }

        if (header === 'PROJECT STATUS') {
          if (value === 'ACTIVE') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FALLOUT') {
            backgroundColor = 'FEE2E2';
            fontColor = '991B1B';
            isBold = true;
          } else if (value === 'PIPELINE') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'SAQ MILESTONE') {
          if (value === 'SIGNED MOA') {
            backgroundColor = 'D1FAE5';
            fontColor = '065F46';
            isBold = true;
          } else if (value === 'FOR PROFILING' || value === 'FOR NEGO') {
            backgroundColor = 'FEF3C7';
            fontColor = '92400E';
            isBold = true;
          }
        }

        if (header === 'PROJECT SCHEME') {
          if (value === 'GROWTH') {
            backgroundColor = 'DBEAFE';
            fontColor = '1E40AF';
            isBold = true;
          } else if (value === 'OVERLAY') {
            backgroundColor = 'E0E7FF';
            fontColor = '3730A3';
            isBold = true;
          }
        }

        if (header === 'BICS PERSONNEL') {
          const personnelColors: { [key: string]: { bg: string, fg: string } } = {
            'ADMARASIGAN': { bg: 'DBEAFE', fg: '1E40AF' }, 'APMORILLA': { bg: 'D1FAE5', fg: '065F46' },
            'CBTABINGA': { bg: 'FEF3C7', fg: '92400E' }, 'CLTRABUCO': { bg: 'FEE2E2', fg: '991B1B' },
            'DFCAGADAS': { bg: 'EDE9FE', fg: '5B21B6' }, 'ELALIBO': { bg: 'FCE7F3', fg: '9F1239' },
            'JDALVAREZ': { bg: 'E0E7FF', fg: '3730A3' }, 'JMBALAG': { bg: 'CCFBF1', fg: '115E59' },
            'KDTAMONDONG': { bg: 'FFEDD5', fg: '9A3412' }, 'LMTAMAYO': { bg: 'CFFAFE', fg: '164E63' },
            'LSAGAPITO': { bg: 'ECFCCB', fg: '3F6212' }, 'LTTEOVISIO': { bg: 'FEF3C7', fg: '78350F' },
            'MIDDELACRUZ': { bg: 'D1FAE5', fg: '065F46' }, 'MLCARANDANG': { bg: 'EDE9FE', fg: '5B21B6' },
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

      // Apply styling to data rows
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

      // Set row heights
      worksheet['!rows'] = [
        { hpt: 25 }, { hpt: 16 }, { hpt: 16 }, { hpt: 16 }, { hpt: 5 }, { hpt: 22 },
      ];
      for (let i = 6; i < exportData.length + 6; i++) {
        if (!worksheet['!rows']) worksheet['!rows'] = [];
        if (!worksheet['!rows'][i]) worksheet['!rows'][i] = {};
        worksheet['!rows'][i].hpt = 16;
      }

      // View settings
      worksheet['!views'] = [{
        showGridLines: true,
        showRowColHeaders: true,
        rightToLeft: false,
        zoomScale: 70,
        zoomScaleNormal: 70,
        zoomScalePageLayoutView: 70
      }];

      // Print settings
      worksheet['!margins'] = {
        left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3
      };
      worksheet['!pageSetup'] = {
        orientation: 'landscape',
        scale: 100,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9
      };

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Recent_${maxDays}_Days`);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `BICS_Recent_Engagement_${maxDays}_Days_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      showNotification('success', `Exported ${records.length} records with ${maxDays} or fewer aging days`);
    } catch (error: any) {
      console.error('Error exporting recent engagement records:', error);
      showNotification('error', 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      await loadDashboardStats();
      setLoading(false);
    };

    initDashboard();

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDashboardStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">BICS Management Overview</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => handleExportAllRecords()}
              disabled={exporting}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Records</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.total_records || 0}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-2">Click to export all records</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('ACTIVE')}
              disabled={exporting}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Projects</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.active_projects || 0}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-2">Click to export active projects</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('FALLOUT')}
              disabled={exporting}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Fallout Projects</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.fallout_projects || 0}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-xs text-orange-600 mt-2">Click to export fallout projects</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('PIPELINE')}
              disabled={exporting}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pipeline Projects</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats?.pipeline_projects || 0}
                      </p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">Click to export pipeline projects</p>
              </div>
            </button>
          </div>
        </div>

        {/* MOA Status Summary */}
        <div className="mb-4">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-500 mr-2" />
                <h2 className="text-base font-semibold text-gray-900">MOA Status Summary</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <button
                  onClick={() => handleExportByMoaStatus('FOR PROFILING')}
                  disabled={exporting}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                        For Profiling
                      </span>
                      <Download className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-3xl font-bold text-amber-700">
                      {stats?.moa_for_profiling || 0}
                    </span>
                    <span className="text-xs text-amber-600 mt-1">Click to export records</span>
                  </div>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('FOR MOA NEGO')}
                  disabled={exporting}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        For MOA Nego
                      </span>
                      <Download className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-3xl font-bold text-blue-700">
                      {stats?.moa_for_nego || 0}
                    </span>
                    <span className="text-xs text-blue-600 mt-1">Click to export records</span>
                  </div>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('WITH MOA')}
                  disabled={exporting}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                        With MOA
                      </span>
                      <Download className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-3xl font-bold text-green-700">
                      {stats?.moa_with_moa || 0}
                    </span>
                    <span className="text-xs text-green-600 mt-1">Click to export records</span>
                  </div>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('NO NEED')}
                  disabled={exporting}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        No Need
                      </span>
                      <Download className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-3xl font-bold text-gray-700">
                      {stats?.moa_no_need || 0}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Click to export records</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aging Days Export */}
        <div className="mb-4">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <h2 className="text-base font-semibold text-gray-900">Aging Days Report</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handleExportRecentEngagement(7)}
                  disabled={exporting}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                        Sites with 7 or Fewer Aging Days
                      </span>
                      <Download className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Export all sites with recent engagement within the last 7 days
                    </p>
                    <span className="text-xs text-green-600 mt-1">Click to export records</span>
                  </div>
                </button>

                <button
                  onClick={() => handleExportByAgingDays(8)}
                  disabled={exporting}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                        Sites with 8+ Aging Days
                      </span>
                      <Download className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Export all sites with no recent engagement for 8 or more days
                    </p>
                    <span className="text-xs text-red-600 mt-1">Click to export records</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;