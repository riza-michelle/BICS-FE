import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import ExcelJS from 'exceljs';

interface SignedMoaMonthly { month_key: string; month_label: string; count: number; }
interface SignedMoaByPersonnel { personnel: string; total: number; months: Record<string, number>; }

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [signedMoaMonthly, setSignedMoaMonthly] = useState<SignedMoaMonthly[]>([]);
  const [signedMoaByPersonnel, setSignedMoaByPersonnel] = useState<SignedMoaByPersonnel[]>([]);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const loadDashboardStats = useCallback(async () => {
    try {
      const [statsResponse, moaMonthlyResponse, moaPersonnelResponse] = await Promise.all([
        bicsAPI.getDashboardStats(),
        bicsAPI.getSignedMoaMonthly(),
        bicsAPI.getSignedMoaByPersonnel(),
      ]);
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (moaMonthlyResponse.success && moaMonthlyResponse.data) {
        setSignedMoaMonthly(moaMonthlyResponse.data);
      }
      if (moaPersonnelResponse.success && moaPersonnelResponse.data) {
        setSignedMoaByPersonnel(moaPersonnelResponse.data);
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
      const u = (v: any) => (v ? String(v).toUpperCase() : '');
      const exportData = records.map(record => ({
        // Basic Information
        'EPC BATCH': u(record.epc_batch),
        'VENDOR': u(record.vendor),
        'SNAP ID/BLDG TAG': u(record.snap_id_bldg_tag),
        'PCN': u(record.pcn),
        'BICS PERSONNEL': u(record.bcsi_aor),
        'PROJECT SCHEME': u(record.project_scheme),
        'BID': u(record.bid),

        // Site Information
        'SITE NAME': u(record.site_name),
        'BUILDING NAME': u(record.building_name),
        'ADDRESS': u(record.address),
        'BRGY': u(record.brgy),
        'CITY/MUNICIPALITY': u(record.city_municipality),
        'PROVINCE': u(record.province),
        'COORDINATES': record.coordinates || '',
        'DISTRICT': u(record.district),
        'ZONE': u(record.zone),
        'AREA': u(record.area),
        'MARKET SEGMENT': u(record.market_segment),

        // Building Details
        'BUILDING STATUS': u(record.building_status),
        'USAGE': u(record.usage_type),
        'FLOORS': record.floors || '',
        'UNITS': record.units || '',
        'DEVELOPER': u(record.developer),
        'TOP DEV': u(record.top_dev),

        // Contact Information
        'RM': u(record.rm),
        'RM GROUP': u(record.rm_group),

        // Project Information
        'PROJECT STATUS': u(record.project_status),
        'PROJECT STAGE': u(record.project_stage),
        'PROJECT MILESTONE': u(record.project_milestone),
        'WORKING LINES': record.working_lines || '',
        'ROLLOUT PORTS': record.rollout_ports || '',
        'MRC': record.mrc || '',

        // SAQ Information
        'SAQ MILESTONE': u(record.saq_milestone),
        'COMMERCIAL SCHEME': u(record.commercial_scheme),
        'COL TOR STATUS': u(record.col_tor_status),
        'SIGNED TOR/MOA DATE': record.signed_tor_moa_date ? new Date(record.signed_tor_moa_date).toLocaleDateString() : '',
        'MOA ACQUIRED BY': u(record.moa_acquired_by),
        'MOA UPLOADING STATUS': u(record.moa_uploading_status),
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': u(record.validated_by),

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': u(record.significant_remarks),

        // Status Information
        'PRODUCTIVITY': u(record.productivity),
        'REF ID': u(record.ref_id),

        // Replacement Information
        'REPLACEMENT SITE': u(record.replacement_site),
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': u(record.moa_status),
        'PROFILE STATUS': u(record.profile_status),
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': u(record.prev_batch),
        'FL ID': u(record.fl_id),
        'PO STATUS': u(record.po_status),

        // Replacement Information (continued)
        'GO-NOGO': u(record.go_nogo),
        'QUICK BASHING': u(record.quick_bashing),
        'REPLACEMENTS GROUPINGS': u(record.replacements_groupings),
        'TAGGING TEMP': u(record.tagging_temp),

        // Status Information (continued)
        'BUDGET STATUS': u(record.budget_status),
        'PROJECT PHASE': u(record.project_phase),
        'IMPLEM STATUS': u(record.implementation_status),

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': u(record.warpp_pcn),
        'MDU/ONU': u(record.mdu_onu),
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': u(record.scheme_design),
        'FCO AOR': u(record.fco_aor),

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': u(record.fttb_cip),
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': u(record.rollout_solution),

        // BASH Section
        'BASH-PREWORKS (LOUIE)': u(record.bash_preworks),
        'BASH-NETWORK (JARROD)': u(record.bash_network),
        'BASH-HALLWAY (VIDAL)': u(record.bash_hallway),
        'BASH-MIGRATION (JAYR)': u(record.bash_migration),
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
      const u = (v: any) => (v ? String(v).toUpperCase() : '');
      const exportData = records.map(record => ({
        // Basic Information
        'EPC BATCH': u(record.epc_batch),
        'VENDOR': u(record.vendor),
        'SNAP ID/BLDG TAG': u(record.snap_id_bldg_tag),
        'PCN': u(record.pcn),
        'BICS PERSONNEL': u(record.bcsi_aor),
        'PROJECT SCHEME': u(record.project_scheme),
        'BID': u(record.bid),

        // Site Information
        'SITE NAME': u(record.site_name),
        'BUILDING NAME': u(record.building_name),
        'ADDRESS': u(record.address),
        'BRGY': u(record.brgy),
        'CITY/MUNICIPALITY': u(record.city_municipality),
        'PROVINCE': u(record.province),
        'COORDINATES': record.coordinates || '',
        'DISTRICT': u(record.district),
        'ZONE': u(record.zone),
        'AREA': u(record.area),
        'MARKET SEGMENT': u(record.market_segment),

        // Building Details
        'BUILDING STATUS': u(record.building_status),
        'USAGE': u(record.usage_type),
        'FLOORS': record.floors || '',
        'UNITS': record.units || '',
        'DEVELOPER': u(record.developer),
        'TOP DEV': u(record.top_dev),

        // Contact Information
        'RM': u(record.rm),
        'RM GROUP': u(record.rm_group),

        // Project Information
        'PROJECT STATUS': u(record.project_status),
        'PROJECT STAGE': u(record.project_stage),
        'PROJECT MILESTONE': u(record.project_milestone),
        'WORKING LINES': record.working_lines || '',
        'ROLLOUT PORTS': record.rollout_ports || '',
        'MRC': record.mrc || '',

        // SAQ Information
        'SAQ MILESTONE': u(record.saq_milestone),
        'COMMERCIAL SCHEME': u(record.commercial_scheme),
        'COL TOR STATUS': u(record.col_tor_status),
        'SIGNED TOR/MOA DATE': record.signed_tor_moa_date ? new Date(record.signed_tor_moa_date).toLocaleDateString() : '',
        'MOA ACQUIRED BY': u(record.moa_acquired_by),
        'MOA UPLOADING STATUS': u(record.moa_uploading_status),
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': u(record.validated_by),

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': u(record.significant_remarks),

        // Status Information
        'PRODUCTIVITY': u(record.productivity),
        'REF ID': u(record.ref_id),

        // Replacement Information
        'REPLACEMENT SITE': u(record.replacement_site),
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': u(record.moa_status),
        'PROFILE STATUS': u(record.profile_status),
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': u(record.prev_batch),
        'FL ID': u(record.fl_id),
        'PO STATUS': u(record.po_status),

        // Replacement Information (continued)
        'GO-NOGO': u(record.go_nogo),
        'QUICK BASHING': u(record.quick_bashing),
        'REPLACEMENTS GROUPINGS': u(record.replacements_groupings),
        'TAGGING TEMP': u(record.tagging_temp),

        // Status Information (continued)
        'BUDGET STATUS': u(record.budget_status),
        'PROJECT PHASE': u(record.project_phase),
        'IMPLEM STATUS': u(record.implementation_status),

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': u(record.warpp_pcn),
        'MDU/ONU': u(record.mdu_onu),
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': u(record.scheme_design),
        'FCO AOR': u(record.fco_aor),

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': u(record.fttb_cip),
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': u(record.rollout_solution),

        // BASH Section
        'BASH-PREWORKS (LOUIE)': u(record.bash_preworks),
        'BASH-NETWORK (JARROD)': u(record.bash_network),
        'BASH-HALLWAY (VIDAL)': u(record.bash_hallway),
        'BASH-MIGRATION (JAYR)': u(record.bash_migration),
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
      const u = (v: any) => (v ? String(v).toUpperCase() : '');
      const exportData = records.map(record => ({
        // Basic Information
        'EPC BATCH': u(record.epc_batch),
        'VENDOR': u(record.vendor),
        'SNAP ID/BLDG TAG': u(record.snap_id_bldg_tag),
        'PCN': u(record.pcn),
        'BICS PERSONNEL': u(record.bcsi_aor),
        'PROJECT SCHEME': u(record.project_scheme),
        'BID': u(record.bid),

        // Site Information
        'SITE NAME': u(record.site_name),
        'BUILDING NAME': u(record.building_name),
        'ADDRESS': u(record.address),
        'BRGY': u(record.brgy),
        'CITY/MUNICIPALITY': u(record.city_municipality),
        'PROVINCE': u(record.province),
        'COORDINATES': record.coordinates || '',
        'DISTRICT': u(record.district),
        'ZONE': u(record.zone),
        'AREA': u(record.area),
        'MARKET SEGMENT': u(record.market_segment),

        // Building Details
        'BUILDING STATUS': u(record.building_status),
        'USAGE': u(record.usage_type),
        'FLOORS': record.floors || '',
        'UNITS': record.units || '',
        'DEVELOPER': u(record.developer),
        'TOP DEV': u(record.top_dev),

        // Contact Information
        'RM': u(record.rm),
        'RM GROUP': u(record.rm_group),

        // Project Information
        'PROJECT STATUS': u(record.project_status),
        'PROJECT STAGE': u(record.project_stage),
        'PROJECT MILESTONE': u(record.project_milestone),
        'WORKING LINES': record.working_lines || '',
        'ROLLOUT PORTS': record.rollout_ports || '',
        'MRC': record.mrc || '',

        // SAQ Information
        'SAQ MILESTONE': u(record.saq_milestone),
        'COMMERCIAL SCHEME': u(record.commercial_scheme),
        'COL TOR STATUS': u(record.col_tor_status),
        'SIGNED TOR/MOA DATE': record.signed_tor_moa_date ? new Date(record.signed_tor_moa_date).toLocaleDateString() : '',
        'MOA ACQUIRED BY': u(record.moa_acquired_by),
        'MOA UPLOADING STATUS': u(record.moa_uploading_status),
        'VALIDATED DATE': record.validated_date ? new Date(record.validated_date).toLocaleDateString() : '',
        'VALIDATED BY': u(record.validated_by),

        // Important Dates
        'SITE VISITED DATE': record.site_visited_date ? new Date(record.site_visited_date).toLocaleDateString() : '',
        'TARGET DATE PROFILING': record.target_date_profiling ? new Date(record.target_date_profiling).toLocaleDateString() : '',
        'TARGET DATE MOA TO ACQUIRE': record.target_date_moa_to_acquire ? new Date(record.target_date_moa_to_acquire).toLocaleDateString() : '',
        'DATE OF RECENT ENGAGEMENT': record.date_of_recent_engagement ? new Date(record.date_of_recent_engagement).toLocaleDateString() : '',

        // Remarks
        'SIGNIFICANT REMARKS': u(record.significant_remarks),

        // Status Information
        'PRODUCTIVITY': u(record.productivity),
        'REF ID': u(record.ref_id),

        // Replacement Information
        'REPLACEMENT SITE': u(record.replacement_site),
        'DATE ENDORSE REPLACEMENT': record.date_endorse_replacement ? new Date(record.date_endorse_replacement).toLocaleDateString() : '',
        'DATE ACCEPTED': record.date_accepted ? new Date(record.date_accepted).toLocaleDateString() : '',
        'DATE REJECTED': record.date_rejected ? new Date(record.date_rejected).toLocaleDateString() : '',

        // Status Information (continued)
        'MOA STATUS': u(record.moa_status),
        'PROFILE STATUS': u(record.profile_status),
        'REFERENCE #': record.reference_number || '',
        'SITE ENTRY DATE': record.site_entry_date ? new Date(record.site_entry_date).toLocaleDateString() : '',

        // Additional Information
        'PREV BATCH': u(record.prev_batch),
        'FL ID': u(record.fl_id),
        'PO STATUS': u(record.po_status),

        // Replacement Information (continued)
        'GO-NOGO': u(record.go_nogo),
        'QUICK BASHING': u(record.quick_bashing),
        'REPLACEMENTS GROUPINGS': u(record.replacements_groupings),
        'TAGGING TEMP': u(record.tagging_temp),

        // Status Information (continued)
        'BUDGET STATUS': u(record.budget_status),
        'PROJECT PHASE': u(record.project_phase),
        'IMPLEM STATUS': u(record.implementation_status),

        // Revenue & Capacity Metrics
        'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)': record.based_revenue_existing_circuits_hw_tracker || '',
        'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)': record.annual_based_revenue_existing_circuits_efpa || '',
        'ACTUAL TAD PORTS/PAIRS PROVISIONED': record.actual_tad_ports_pairs_provisioned || '',
        'ACTUAL TA': record.actual_ta || '',
        'ACTUAL FA': record.actual_fa || '',
        'WARPP PCN': u(record.warpp_pcn),
        'MDU/ONU': u(record.mdu_onu),
        'MIGRATED LINES': record.migrated_lines || '',
        'ACTUAL REMAINING PORTS': record.actual_remaining_ports || '',
        'ACTUAL READY TO SELL PORTS': record.actual_ready_to_sell_ports || '',
        'POTENTIAL REVENUE GROWTH': record.potential_revenue_growth || '',

        // Design & Planning
        'SCHEME DESIGN': u(record.scheme_design),
        'FCO AOR': u(record.fco_aor),

        // FTTB Information
        'FTTB PO RELEASE': record.fttb_po_release ? new Date(record.fttb_po_release).toLocaleDateString() : '',
        'FTTB CIP': u(record.fttb_cip),
        'FTTB TARGET COMPLETION': record.fttb_target_completion ? new Date(record.fttb_target_completion).toLocaleDateString() : '',
        'ROLLOUT SOLUTION': u(record.rollout_solution),

        // BASH Section
        'BASH-PREWORKS (LOUIE)': u(record.bash_preworks),
        'BASH-NETWORK (JARROD)': u(record.bash_network),
        'BASH-HALLWAY (VIDAL)': u(record.bash_hallway),
        'BASH-MIGRATION (JAYR)': u(record.bash_migration),
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

  const handleExportSignedMoaMonthly = async () => {
    if (signedMoaMonthly.length === 0) {
      showNotification('error', 'No Signed MOA data to export');
      return;
    }

    const year = new Date().getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const COLS = 14; // 1 name + 12 months + 1 total

    // ── Capture chart PNG ──
    let chartImageBase64: string | null = null;
    if (chartSvgRef.current) {
      try {
        const svgEl = chartSvgRef.current;
        const vb = svgEl.viewBox.baseVal;
        const ratio = vb.height / vb.width;
        const svgStr = new XMLSerializer().serializeToString(svgEl);
        const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
        await new Promise<void>((resolve) => {
          const img = new Image();
          const W = 1800, H = Math.round(W * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
          img.onload = () => { ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); chartImageBase64 = canvas.toDataURL('image/png').split(',')[1]; resolve(); };
          img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          img.src = url;
        });
      } catch (_) {}
    }

    // ── Workbook setup ──
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BICS System';
    const ws = workbook.addWorksheet(`Signed MOA ${year}`, { views: [{ showGridLines: false }] });

    // Column widths: col1=personnel(24), cols2-13=months(8 each), col14=total(10)
    ws.columns = [
      { width: 24 },
      ...Array(12).fill({ width: 8 }),
      { width: 10 },
    ];

    // ── Helper: set cell ──
    const sc = (r: number, c: number, value: any, opts?: {
      bold?: boolean; sz?: number; color?: string; bg?: string;
      italic?: boolean; hAlign?: string; vAlign?: string;
      border?: 'none' | 'light' | 'medium' | 'outer'; wrap?: boolean;
    }) => {
      const cell = ws.getCell(r, c);
      cell.value = value;
      if (!opts) return;
      cell.font = { name: 'Calibri', bold: opts.bold, size: opts.sz ?? 10, italic: opts.italic, color: opts.color ? { argb: 'FF' + opts.color } : { argb: 'FF1F2937' } };
      if (opts.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + opts.bg } } as any;
      cell.alignment = { horizontal: (opts.hAlign ?? 'left') as any, vertical: (opts.vAlign ?? 'middle') as any, wrapText: opts.wrap };
      const thin = { style: 'thin' as const, color: { argb: 'FFD1D5DB' } };
      const med  = { style: 'medium' as const, color: { argb: 'FF9CA3AF' } };
      const dark = { style: 'medium' as const, color: { argb: 'FF374151' } };
      if (opts.border === 'light')  cell.border = { top: thin, bottom: thin, left: thin, right: thin };
      else if (opts.border === 'medium') cell.border = { top: med, bottom: med, left: med, right: med };
      else if (opts.border === 'outer')  cell.border = { top: dark, bottom: dark, left: dark, right: dark };
    };
    const mg = (r1: number, c1: number, r2: number, c2: number) => ws.mergeCells(r1, c1, r2, c2);
    const row = (r: number, h: number) => { ws.getRow(r).height = h; };

    // ══════════════════════════════════════════
    // SECTION 1 — HEADER BANNER
    // ══════════════════════════════════════════
    row(1, 36); row(2, 18); row(3, 8);

    sc(1, 1, `BICS — SIGNED MOA MONTHLY REPORT`, { bold: true, sz: 16, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', vAlign: 'middle' });
    mg(1, 1, 1, COLS);

    sc(2, 1,
      `Year: ${year}     |     Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}     |     Exported by: ${user?.username || '—'}`,
      { sz: 10, italic: true, color: 'F9FAFB', bg: '2D5986', hAlign: 'center' }
    );
    mg(2, 1, 2, COLS);

    // row 3 = spacer (light gray band)
    for (let c = 1; c <= COLS; c++) { const cell = ws.getCell(3, c); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } } as any; }
    mg(3, 1, 3, COLS);

    // ══════════════════════════════════════════
    // SECTION 2 — MONTHLY SUMMARY TABLE
    // ══════════════════════════════════════════
    row(4, 22); row(5, 22);

    sc(4, 1, '📅  MONTHLY SUMMARY', { bold: true, sz: 12, color: '1E3A5F', bg: 'E8F0FE', hAlign: 'left' });
    mg(4, 1, 4, COLS);

    // Sub-headers
    sc(5, 1,  'MONTH',            { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(5, 1, 5, 4);
    sc(5, 5,  'YEAR',             { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(5, 5, 5, 8);
    sc(5, 9,  'NO. OF SIGNED MOA',{ bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(5, 9, 5, COLS);

    signedMoaMonthly.forEach((d, i) => {
      const r = 6 + i;
      row(r, 18);
      const isEven = i % 2 === 0;
      const rowBg = isEven ? 'FFFFFF' : 'EFF6FF';
      const hasCount = d.count > 0;
      sc(r, 1, d.month_label.split(' ')[0].toUpperCase(), { sz: 11, bold: true, color: '374151', bg: rowBg, hAlign: 'center', border: 'light' }); mg(r, 1, r, 4);
      sc(r, 5, year,    { sz: 11, color: '374151', bg: rowBg, hAlign: 'center', border: 'light' }); mg(r, 5, r, 8);
      sc(r, 9, d.count, { sz: 13, bold: true, color: hasCount ? '1E40AF' : 'D1D5DB', bg: hasCount ? (isEven ? 'EFF6FF' : 'DBEAFE') : rowBg, hAlign: 'center', border: 'light' }); mg(r, 9, r, COLS);
    });

    // Monthly total row
    const mTotalRow = 6 + signedMoaMonthly.length;
    row(mTotalRow, 20);
    const grandMonthTotal = signedMoaMonthly.reduce((s, d) => s + d.count, 0);
    sc(mTotalRow, 1, 'TOTAL', { bold: true, sz: 11, color: 'FFFFFF', bg: '1E40AF', hAlign: 'center', border: 'outer' }); mg(mTotalRow, 1, mTotalRow, 8);
    sc(mTotalRow, 9, grandMonthTotal, { bold: true, sz: 13, color: 'FFFFFF', bg: '1E40AF', hAlign: 'center', border: 'outer' }); mg(mTotalRow, 9, mTotalRow, COLS);

    // ══════════════════════════════════════════
    // SECTION 3 — CHART IMAGE
    // ══════════════════════════════════════════
    const chartSectionRow = mTotalRow + 2;
    const CHART_ROWS = 20;
    row(chartSectionRow, 22);
    sc(chartSectionRow, 1, '📊  SIGNED MOA TREND CHART', { bold: true, sz: 12, color: '1E3A5F', bg: 'E8F0FE', hAlign: 'left' });
    mg(chartSectionRow, 1, chartSectionRow, COLS);

    const chartImgRow = chartSectionRow + 1;
    if (chartImageBase64) {
      const imageId = workbook.addImage({ base64: chartImageBase64, extension: 'png' });
      ws.addImage(imageId, { tl: { col: 0, row: chartImgRow - 1 }, br: { col: COLS, row: chartImgRow - 1 + CHART_ROWS }, editAs: 'oneCell' } as any);
      for (let r = chartImgRow; r < chartImgRow + CHART_ROWS; r++) row(r, 16);
    }

    // ══════════════════════════════════════════
    // SECTION 4 — BY BICS PERSONNEL
    // ══════════════════════════════════════════
    const personnelColors: Record<string, { bg: string; fg: string }> = {
      'ADMARASIGAN':  { bg: 'DBEAFE', fg: '1E40AF' },
      'APMORILLA':    { bg: 'D1FAE5', fg: '065F46' },
      'CBTABINGA':    { bg: 'FEF3C7', fg: '92400E' },
      'DFCAGADAS':    { bg: 'EDE9FE', fg: '5B21B6' },
      'ELALIBO':      { bg: 'FCE7F3', fg: '9F1239' },
      'FERUNTALAN':   { bg: 'FFF7ED', fg: '9A3412' },
      'JDALVAREZ':    { bg: 'E0E7FF', fg: '3730A3' },
      'JMBALAG':      { bg: 'CCFBF1', fg: '115E59' },
      'JMBAUTISTA':   { bg: 'FFEDD5', fg: '9A3412' },
      'LSAGAPITO':    { bg: 'ECFCCB', fg: '3F6212' },
      'LTTEOVISIO':   { bg: 'FEF9C3', fg: '78350F' },
      'MIDDELACRUZ':  { bg: 'D1FAE5', fg: '065F46' },
      'MLCARANDANG':  { bg: 'EDE9FE', fg: '5B21B6' },
      'NMNARCISO':    { bg: 'FAE8FF', fg: '86198F' },
      'DBSOLLEZA':    { bg: 'CFFAFE', fg: '164E63' },
      'AMGERBABUENA': { bg: 'ECFCCB', fg: '166534' },
      'NACABILDO':    { bg: 'FEE2E2', fg: '991B1B' },
      'JDSORIANO':    { bg: 'E0E7FF', fg: '312E81' },
      'JMMARTINEZ':   { bg: 'FEF9C3', fg: '713F12' },
      'PABARCIA':     { bg: 'F0FDF4', fg: '166534' },
    };

    const pSectionRow = chartImgRow + (chartImageBase64 ? CHART_ROWS : 0) + 1;
    row(pSectionRow, 22);
    sc(pSectionRow, 1, '👤  BY BICS PERSONNEL (MOA ACQUIRED BY)', { bold: true, sz: 12, color: '1E3A5F', bg: 'E8F0FE', hAlign: 'left' });
    mg(pSectionRow, 1, pSectionRow, COLS);

    const pHeaderRow = pSectionRow + 1;
    row(pHeaderRow, 22);
    sc(pHeaderRow, 1, 'BICS PERSONNEL', { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' });
    months.forEach((m, i) => sc(pHeaderRow, 2 + i, m, { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }));
    sc(pHeaderRow, COLS, 'TOTAL', { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' });

    signedMoaByPersonnel.forEach((p, i) => {
      const r = pHeaderRow + 1 + i;
      row(r, 18);
      const pc = personnelColors[p.personnel];
      const bg = pc ? pc.bg : (i % 2 === 0 ? 'FFFFFF' : 'F8FAFC');
      const fg = pc ? pc.fg : '1F2937';
      sc(r, 1, p.personnel, { bold: true, sz: 10, color: fg, bg, hAlign: 'left', border: 'light' });
      months.forEach((m, mi) => {
        const val = p.months[m] || 0;
        sc(r, 2 + mi, val > 0 ? val : '—', { sz: 10, color: val > 0 ? fg : 'D1D5DB', bg, hAlign: 'center', border: 'light' });
      });
      sc(r, COLS, p.total, { bold: true, sz: 11, color: fg, bg, hAlign: 'center', border: 'medium' });
    });

    const gtRow = pHeaderRow + 1 + signedMoaByPersonnel.length;
    row(gtRow, 22);
    sc(gtRow, 1, 'GRAND TOTAL', { bold: true, sz: 11, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'outer' });
    months.forEach((m, i) => {
      const t = signedMoaByPersonnel.reduce((s, p) => s + (p.months[m] || 0), 0);
      sc(gtRow, 2 + i, t > 0 ? t : '—', { bold: true, sz: 10, color: t > 0 ? 'FFFFFF' : 'CBD5E1', bg: '1E3A5F', hAlign: 'center', border: 'outer' });
    });
    sc(gtRow, COLS, signedMoaByPersonnel.reduce((s, p) => s + p.total, 0), { bold: true, sz: 12, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'outer' });

    // ══════════════════════════════════════════
    // SECTION 5 — REFERENCE LIST
    // ══════════════════════════════════════════
    const refResponse = await bicsAPI.getSignedMoaReference();
    if (refResponse.success && refResponse.data && refResponse.data.length > 0) {
      const refSectionRow = gtRow + 2;
      row(refSectionRow, 22);
      sc(refSectionRow, 1, '📋  REFERENCE LIST', { bold: true, sz: 12, color: '1E3A5F', bg: 'E8F0FE', hAlign: 'left' });
      mg(refSectionRow, 1, refSectionRow, COLS);

      const refHeaderRow = refSectionRow + 1;
      row(refHeaderRow, 22);
      sc(refHeaderRow, 1,  'BICS PERSONNEL',  { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(refHeaderRow, 1, refHeaderRow, 2);
      sc(refHeaderRow, 3,  'SITE NAME',        { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(refHeaderRow, 3, refHeaderRow, 6);
      sc(refHeaderRow, 7,  'BUILDING NAME',    { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(refHeaderRow, 7, refHeaderRow, 10);
      sc(refHeaderRow, 11, 'REF #',            { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(refHeaderRow, 11, refHeaderRow, 12);
      sc(refHeaderRow, 13, 'PROJECT STATUS',   { bold: true, sz: 10, color: 'FFFFFF', bg: '1E3A5F', hAlign: 'center', border: 'medium' }); mg(refHeaderRow, 13, refHeaderRow, COLS);

      refResponse.data.forEach((rec: any, i: number) => {
        const r = refHeaderRow + 1 + i;
        row(r, 16);
        const name = (rec.moa_acquired_by || '').toUpperCase();
        const pc = personnelColors[name];
        const bg = pc ? pc.bg : (i % 2 === 0 ? 'FFFFFF' : 'F8FAFC');
        const fg = pc ? pc.fg : '1F2937';
        const statusColor = rec.project_status === 'ACTIVE' ? { bg: 'D1FAE5', fg: '065F46' } : rec.project_status === 'FALLOUT' ? { bg: 'FEE2E2', fg: '991B1B' } : { bg: 'FEF3C7', fg: '92400E' };
        sc(r, 1,  name,                                     { sz: 10, bold: true, color: fg, bg, border: 'light' }); mg(r, 1, r, 2);
        sc(r, 3,  (rec.site_name || '').toUpperCase(),     { sz: 10, color: '1F2937', bg, border: 'light' }); mg(r, 3, r, 6);
        sc(r, 7,  (rec.building_name || '').toUpperCase(), { sz: 10, color: '374151', bg, border: 'light' }); mg(r, 7, r, 10);
        sc(r, 11, rec.reference_number || '—',             { sz: 10, color: '374151', bg, hAlign: 'center', border: 'light' }); mg(r, 11, r, 12);
        sc(r, 13, (rec.project_status || '').toUpperCase(),{ sz: 10, bold: true, color: statusColor.fg, bg: statusColor.bg, hAlign: 'center', border: 'light' }); mg(r, 13, r, COLS);
      });
    }

    // ── Download ──
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `BICS_Signed_MOA_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
    showNotification('success', `Exported Signed MOA report for ${year}`);
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
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500">BICS Management Overview</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => handleExportAllRecords()}
              disabled={exporting}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Total Records</p>
                <p className="mt-1 text-3xl font-semibold text-gray-800">{stats?.total_records?.toLocaleString() || 0}</p>
                <p className="mt-2 text-xs text-blue-500">Click to export all records</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('ACTIVE')}
              disabled={exporting}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-green-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Active Projects</p>
                <p className="mt-1 text-3xl font-semibold text-gray-800">{stats?.active_projects?.toLocaleString() || 0}</p>
                <p className="mt-2 text-xs text-green-500">Click to export active projects</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('FALLOUT')}
              disabled={exporting}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Fallout Projects</p>
                <p className="mt-1 text-3xl font-semibold text-gray-800">{stats?.fallout_projects?.toLocaleString() || 0}</p>
                <p className="mt-2 text-xs text-orange-500">Click to export fallout projects</p>
              </div>
            </button>

            <button
              onClick={() => handleExportByProjectStatus('PIPELINE')}
              disabled={exporting}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Pipeline Projects</p>
                <p className="mt-1 text-3xl font-semibold text-gray-800">{stats?.pipeline_projects?.toLocaleString() || 0}</p>
                <p className="mt-2 text-xs text-purple-500">Click to export pipeline projects</p>
              </div>
            </button>
          </div>
        </div>

        {/* MOA Status Summary */}
        <div className="mb-5">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">MOA Status Summary</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <button
                  onClick={() => handleExportByMoaStatus('FOR PROFILING')}
                  disabled={exporting}
                  className="group rounded-lg border border-amber-200 bg-amber-50 p-4 text-left hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">For Profiling</p>
                    <Download className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700">{stats?.moa_for_profiling || 0}</p>
                  <p className="mt-1.5 text-xs text-amber-500">Click to export records</p>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('FOR MOA NEGO')}
                  disabled={exporting}
                  className="group rounded-lg border border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">For MOA Nego</p>
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{stats?.moa_for_nego || 0}</p>
                  <p className="mt-1.5 text-xs text-blue-500">Click to export records</p>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('WITH MOA')}
                  disabled={exporting}
                  className="group rounded-lg border border-green-200 bg-green-50 p-4 text-left hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">With MOA</p>
                    <Download className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-green-700">{stats?.moa_with_moa || 0}</p>
                  <p className="mt-1.5 text-xs text-green-500">Click to export records</p>
                </button>

                <button
                  onClick={() => handleExportByMoaStatus('NO NEED')}
                  disabled={exporting}
                  className="group rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No Need</p>
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-700">{stats?.moa_no_need || 0}</p>
                  <p className="mt-1.5 text-xs text-gray-400">Click to export records</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aging Days Export */}
        <div className="mb-5">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Aging Days Report</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => handleExportRecentEngagement(7)}
                  disabled={exporting}
                  className="group rounded-lg border border-green-200 bg-green-50 p-4 text-left hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Sites with 7 or Fewer Aging Days</span>
                    <Download className="h-3.5 w-3.5 text-green-400 flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-sm text-green-700">Export all sites with recent engagement within the last 7 days</p>
                  <p className="mt-1.5 text-xs text-green-500">Click to export records</p>
                </button>

                <button
                  onClick={() => handleExportByAgingDays(8)}
                  disabled={exporting}
                  className="group rounded-lg border border-red-200 bg-red-50 p-4 text-left hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Sites with 8+ Aging Days</span>
                    <Download className="h-3.5 w-3.5 text-red-400 flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-sm text-red-700">Export all sites with no recent engagement for 8 or more days</p>
                  <p className="mt-1.5 text-xs text-red-500">Click to export records</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Signed MOA Monthly Chart */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-indigo-500 mr-2" />
                  <h2 className="text-base font-semibold text-gray-900">Signed MOA — Monthly</h2>
                  <span className="ml-2 text-xs text-gray-400">({new Date().getFullYear()})</span>
                </div>
                <button
                  onClick={handleExportSignedMoaMonthly}
                  disabled={exporting || signedMoaMonthly.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export Excel
                </button>
              </div>
            </div>
            <div className="p-6">
              {signedMoaMonthly.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <BarChart3 className="h-10 w-10 mb-2 text-gray-300" />
                  <p className="text-sm">No Signed MOA data available yet.</p>
                </div>
              ) : (() => {
                const maxCount = Math.max(...signedMoaMonthly.map(d => d.count), 1);
                const chartH = 240;
                const labelH = 48;
                const yAxisW = 40;
                const topPad = 28;
                const rightPad = 8;
                const viewBoxW = 900;
                const n = signedMoaMonthly.length;
                const slotW = (viewBoxW - yAxisW - rightPad) / n;
                const barW = slotW * 0.6;
                const barOffset = (slotW - barW) / 2;

                return (
                  <svg
                    ref={chartSvgRef}
                    viewBox={`0 0 ${viewBoxW} ${chartH + labelH + topPad}`}
                    width="100%"
                    height={chartH + labelH + topPad}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                      const y = topPad + chartH - pct * chartH;
                      const val = Math.round(pct * maxCount);
                      return (
                        <g key={pct}>
                          <line x1={yAxisW} y1={y} x2={viewBoxW - rightPad} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                          <text x={yAxisW - 6} y={y + 4} textAnchor="end" fontSize={12} fontFamily="system-ui, sans-serif" fill="#6B7280">{val}</text>
                        </g>
                      );
                    })}
                    {signedMoaMonthly.map((d, i) => {
                      const barH = Math.max((d.count / maxCount) * chartH, d.count > 0 ? 3 : 0);
                      const slotX = yAxisW + i * slotW;
                      const x = slotX + barOffset;
                      const y = topPad + chartH - barH;
                      const shortLabel = d.month_label.split(' ')[0];
                      const centerX = slotX + slotW / 2;
                      return (
                        <g key={d.month_key}>
                          {barH > 0 && <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#6366F1" opacity={0.88} />}
                          <text x={centerX} y={y - 7} textAnchor="middle" fontSize={13} fontWeight="700" fontFamily="system-ui, sans-serif" fill="#4338CA">
                            {d.count > 0 ? d.count : ''}
                          </text>
                          <text x={centerX} y={topPad + chartH + 20} textAnchor="middle" fontSize={13} fontWeight="600" fontFamily="system-ui, sans-serif" fill="#374151">
                            {shortLabel}
                          </text>
                          <text x={centerX} y={topPad + chartH + 38} textAnchor="middle" fontSize={11} fontFamily="system-ui, sans-serif" fill="#9CA3AF">
                            {d.month_label.split(' ')[1]}
                          </text>
                        </g>
                      );
                    })}
                    <line x1={yAxisW} y1={topPad} x2={yAxisW} y2={topPad + chartH} stroke="#D1D5DB" strokeWidth={1} />
                  </svg>
                );
              })()}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500"></span>
                <span className="text-xs text-gray-500">Number of MOAs signed per month in {new Date().getFullYear()} (based on Signed TOR/MOA Date)</span>
              </div>

              {/* Personnel Breakdown Table */}
              {signedMoaByPersonnel.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="inline-block w-2 h-4 rounded-sm bg-indigo-600"></span>
                    By BICS Personnel
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-indigo-700 text-white">
                          <th className="px-3 py-2 text-left font-semibold">BICS Personnel</th>
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                            <th key={m} className="px-2 py-2 text-center font-semibold w-10">{m}</th>
                          ))}
                          <th className="px-3 py-2 text-center font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signedMoaByPersonnel.map((p, i) => (
                          <tr key={p.personnel} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                            <td className="px-3 py-1.5 font-medium text-gray-800 whitespace-nowrap">{p.personnel}</td>
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                              <td key={m} className="px-2 py-1.5 text-center text-gray-600">
                                {p.months[m] > 0 ? p.months[m] : <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                            <td className="px-3 py-1.5 text-center font-bold text-indigo-700">{p.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-700 text-white font-bold">
                          <td className="px-3 py-2">Grand Total</td>
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                            <td key={m} className="px-2 py-2 text-center">
                              {signedMoaByPersonnel.reduce((sum, p) => sum + (p.months[m] || 0), 0) || <span className="opacity-50">—</span>}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            {signedMoaByPersonnel.reduce((sum, p) => sum + p.total, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;