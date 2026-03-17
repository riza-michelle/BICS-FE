import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { pendingRecordsAPI, epcBatchAPI, vendorAPI, saqPersonnelAPI, fcoPersonnelAPI, topDeveloperAPI, relationshipManagerAPI, validatedByAPI } from '../services/api';
import { BicsRecord } from '../types';
import { useNotification } from '../context/NotificationContext';

interface PendingEditModalProps {
  pendingId: number;
  initialData: Record<string, any>;
  onClose: () => void;
  onSaved: () => void;
}

const PendingEditModal: React.FC<PendingEditModalProps> = ({ pendingId, initialData, onClose, onSaved }) => {
  const [formData, setFormData] = useState<BicsRecord>({ ...initialData });
  const [saving, setSaving] = useState(false);
  const [epcBatchList, setEpcBatchList] = useState<string[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [saqPersonnelList, setSaqPersonnelList] = useState<string[]>([]);
  const [fcoPersonnelList, setFcoPersonnelList] = useState<string[]>([]);
  const [topDeveloperList, setTopDeveloperList] = useState<string[]>([]);
  const [relationshipManagerList, setRelationshipManagerList] = useState<string[]>([]);
  const [relationshipManagerData, setRelationshipManagerData] = useState<{ relationship_manager: string; relationship_manager_group: string }[]>([]);
  const [validatedByList, setValidatedByList] = useState<string[]>([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    epcBatchAPI.getList({ limit: 1000 }).then(r => { if (r.success && r.data) setEpcBatchList(r.data.batches.map((b: any) => b.batch_name)); }).catch(() => {});
    vendorAPI.getList({ limit: 1000 }).then(r => { if (r.success && r.data) setVendorList(r.data.vendors.map((v: any) => v.vendor_name)); }).catch(() => {});
    saqPersonnelAPI.getList({ limit: 1000 }).then(r => { if (r.success && r.data) setSaqPersonnelList(r.data.personnel.map((p: any) => p.personnel_name)); }).catch(() => {});
    fcoPersonnelAPI.getList({ limit: 1000 }).then(r => { if (r.success && r.data) setFcoPersonnelList(r.data.personnel.map((p: any) => p.personnel_name)); }).catch(() => {});
    topDeveloperAPI.getList({ limit: 1000 }).then(r => { if (r.success && r.data) setTopDeveloperList(r.data.topDevelopers.map((t: any) => t.top_developer_name)); }).catch(() => {});
    relationshipManagerAPI.getAll().then(r => {
      if (r.success && r.data) {
        setRelationshipManagerData(r.data.map((rm: any) => ({ relationship_manager: rm.relationship_manager, relationship_manager_group: rm.relationship_manager_group })));
        setRelationshipManagerList(Array.from(new Set(r.data.map((rm: any) => rm.relationship_manager))) as string[]);
      }
    }).catch(() => {});
    validatedByAPI.getAll().then(r => { if (r.success && r.data) setValidatedByList(r.data.map((v: any) => v.validated_by_name)); }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'rm') {
      const match = relationshipManagerData.find(rm => rm.relationship_manager === value);
      setFormData(prev => ({ ...prev, rm: value, rm_group: match ? match.relationship_manager_group : '' }));
      return;
    }
    if (name === 'project_milestone' && value === 'SIGNED MOA') {
      setFormData(prev => ({ ...prev, project_milestone: value, moa_status: 'WITH MOA' })); return;
    }
    if (name === 'moa_status' && value === 'WITH MOA') {
      setFormData(prev => ({ ...prev, moa_status: value, project_milestone: 'SIGNED MOA' })); return;
    }
    if (name === 'saq_milestone' && value === 'SIGNED MOA') {
      setFormData(prev => ({ ...prev, saq_milestone: value, productivity: 'MOA ACQUIRED' })); return;
    }
    if (name === 'productivity' && value === 'MOA ACQUIRED') {
      setFormData(prev => ({ ...prev, productivity: value, saq_milestone: 'SIGNED MOA' })); return;
    }
    if (name === 'date_of_recent_engagement' && value) {
      setFormData(prev => ({ ...prev, date_of_recent_engagement: value, productivity: 'ENGAGED' })); return;
    }

    const isSelect = e.target.tagName === 'SELECT';
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number'
        ? (value === '' ? undefined : Number(value))
        : (isSelect ? value : (typeof value === 'string' ? value.toUpperCase() : value)),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await pendingRecordsAPI.updateSubmission(pendingId, formData);
      if (response.success) {
        showNotification('success', 'Submission updated successfully.');
        onSaved();
        onClose();
      } else {
        showNotification('error', response.message || 'Failed to update submission');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Error updating submission');
    } finally {
      setSaving(false);
    }
  };

  // ---- render helpers ----
  const cls = "block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs";

  const field = (name: keyof BicsRecord, label: string, type: 'text' | 'number' | 'date' = 'text', colSpan?: string) => (
    <div key={name} className={colSpan || ''}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={formData[name] as string || ''} onChange={handleChange} className={cls} />
    </div>
  );

  const readOnly = (name: keyof BicsRecord, label: string) => (
    <div key={name}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" name={name} value={formData[name] as string || ''} readOnly disabled
        className="block w-full px-2.5 py-1.5 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-xs cursor-not-allowed" />
    </div>
  );

  const select = (name: keyof BicsRecord, label: string, options: string[], required?: boolean) => (
    <div key={name}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <select name={name} value={formData[name] as string || ''} onChange={handleChange} required={required} className={cls}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const textarea = (name: keyof BicsRecord, label: string) => (
    <div key={name} className="md:col-span-2 lg:col-span-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <textarea name={name} value={formData[name] as string || ''} onChange={handleChange} rows={2} className={cls} />
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
          {title}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      </div>
    </div>
  );

  const PROVINCES = ['ABRA','AGUSAN DEL NORTE','AGUSAN DEL SUR','AKLAN','ALBAY','ANTIQUE','APAYAO','AURORA','BASILAN','BATAAN','BATANES','BATANGAS','BENGUET','BILIRAN','BOHOL','BUKIDNON','BULACAN','CAGAYAN','CAMARINES NORTE','CAMARINES SUR','CAMIGUIN','CAPIZ','CATANDUANES','CAVITE','CEBU','CORDILLERA ADMINISTRATIVE REGION (CAR)','COTABATO (NORTH COTABATO)','DAVAO DE ORO','DAVAO DEL NORTE','DAVAO DEL SUR','DAVAO OCCIDENTAL','DAVAO ORIENTAL','DINAGAT ISLANDS','EASTERN SAMAR','GUIMARAS','IFUGAO','ILOCOS NORTE','ILOCOS SUR','ILOILO','ISABELA','KALINGA','LA UNION','LAGUNA','LANAO DEL NORTE','LANAO DEL SUR','LEYTE','MAGUINDANAO DEL NORTE','MAGUINDANAO DEL SUR','MARINDUQUE','MASBATE','METRO MANILA (NCR)','MISAMIS OCCIDENTAL','MISAMIS ORIENTAL','MOUNTAIN PROVINCE','NEGROS OCCIDENTAL','NEGROS ORIENTAL','NORTHERN SAMAR','NUEVA ECIJA','NUEVA VIZCAYA','OCCIDENTAL MINDORO','ORIENTAL MINDORO','PALAWAN','PAMPANGA','PANGASINAN','QUEZON','QUIRINO','RIZAL','ROMBLON','SAMAR (WESTERN SAMAR)','SARANGANI','SIQUIJOR','SORSOGON','SOUTH COTABATO','SOUTHERN LEYTE','SULTAN KUDARAT','SULU','SURIGAO DEL NORTE','SURIGAO DEL SUR','TARLAC','TAWI-TAWI','ZAMBALES','ZAMBOANGA DEL NORTE','ZAMBOANGA DEL SUR','ZAMBOANGA SIBUGAY'];
  const SAQ_MILESTONES = ["CAN'T LOCATE",'DUPLICATION','ELECTRICITY PAYMENT','FACILITY COLOCATED','FACILITY LOCATION','FEASIBLE VIA POLE NAP','FOR DEMOLITION / DEMOLISHED','FOR RENOV / ONGOING RENOV','FOR VACANCY','FOR ACQUISITION','FOR PROFILING','FOR SIGNING','HIGH COB','HIGH LEASE','MIXED USE','MOA VALIDATION','MULTIPLE SITES','NO COMMITMENT','NO DEMAND (SALES CONFIRMED)','NO DEMAND FROM CLIENT','NO RESPONSE','ONGOING COMMERCIAL NEGO','PO CONCERN','PRA','REJECTED','REJECTED REPLACEMENT','REQUIRES FTTB PLAN','REQUIRES HS DESIGN','RESIDENTIAL','SIGNED MOA','SIGNED TOR','SUBMITTED LOI','SUBMITTED MOA','UNDER CLARKTEL PROJECT','UNDER CONSTRUCTION','USED AS REPLACEMENT','WIP SITE','WITH EXISTING FTTB','PLDT BUILDING'];
  const PROJECT_MILESTONES = ['COMPLETED MIGRATION','COMPLETED MIGRATION (HS BA PROVIDED)','FALLOUT W/O REPLACEMENT (PO)','FALLOUT W/O REPLACEMENT (WIP)','FALLOUT_ W/O REPLACEMENT','FALLOUT_WITH REPLACEMENT','FOR ACCEPTANCE','FOR DESIGN APPROVAL','FOR IMPLEM PATCHING','FOR INSERTION','FOR ISP AND OSP PERMIT APPROVAL','FOR ISP PERMIT APPROVAL','FOR MOA ACQUISITION','FOR PROFILING','FOR PR-PO','FOR RE-SURVEY','FOR SURVEY','FTTB COMPLETED','HOLD - IMPLEMENTATION','ON-GOING HWS','ON-GOING IMPLEMENTATION','ON-GOING MIGRATION','ON-GOING MIGRATION (HS BA PROVIDED)','PARTIALLY COMPLETED','PERMIT, FOR IMPLEMENTATION','PERMIT, FOR JOINT SURVEY','PLAN BUILDING APPROVAL','PLAN CREATION','PLAN INITIAL APPROVAL','PLAN SUBMITTED','REPLACEMENT_FOR ACCENG ENDORSEMENT','REPLACEMENT_FOR VENDOR ASSESSMENT','REPLACEMENT_REJECTED','SIGNED MOA','WITH ISSUE'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-xl border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Submission</h2>
            <p className="text-xs text-gray-500 mt-0.5">This submission is still pending. You can update the details below.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
          {section("Basic Information", <>
            {select('epc_batch', 'EPC BATCH', epcBatchList, true)}
            {select('vendor', 'VENDOR', vendorList)}
            {field('snap_id_bldg_tag', 'SNAP ID/BLDG TAG')}
            {field('pcn', 'PCN')}
            {select('bcsi_aor', 'BICS PERSONNEL', saqPersonnelList, true)}
            {select('project_scheme', 'PROJECT SCHEME', ['GROWTH', 'OVERLAY'])}
            {field('bid', 'BID')}
          </>)}

          {section("Site Information", <>
            {field('site_name', 'SITE NAME')}
            {field('building_name', 'BUILDING NAME')}
            {field('address', 'ADDRESS', 'text', 'md:col-span-2 lg:col-span-3')}
            {field('brgy', 'BRGY')}
            {field('city_municipality', 'CITY/MUNICIPALITY')}
            {select('province', 'PROVINCE', PROVINCES)}
            {field('coordinates', 'COORDINATES')}
            {select('district', 'DISTRICT', ['GMM EAST','GMM NORTH','GMM SOUTH','GMM WEST','MINDANAO','NORTH LUZON','SOUTH LUZON','VISAYAS'])}
            {field('zone', 'ZONE')}
            {select('area', 'AREA', ['GMM', 'REGIONAL'])}
            {select('market_segment', 'MARKET SEGMENT', ['Enterprise', 'Home', 'Mixed'])}
          </>)}

          {section("Building Details", <>
            {select('building_status', 'BUILDING STATUS', ['ABANDONED','DEMOLISHED','EXISTING','FOR CONSTRUCTION','FOR VACANCY','ONGOING CONSTRUCTION','UNDER CONSTRUCTION','UNDER RENOVATION','UPCOMING'])}
            {select('usage_type', 'USAGE', ['Residential','Commercial','Mixed','Office','Industrial','Mall & Retail'])}
            {field('floors', 'FLOORS', 'number')}
            {field('units', 'UNITS', 'number')}
            {field('developer', 'DEVELOPER')}
            {select('top_dev', 'TOP DEVELOPER', topDeveloperList)}
          </>)}

          {section("Contact Information", <>
            {select('rm', 'RELATIONSHIP MANAGER', relationshipManagerList)}
            {readOnly('rm_group', 'RELATIONSHIP MANAGER GROUP')}
          </>)}

          {section("Project Information", <>
            {select('project_status', 'PROJECT STATUS', ['ACTIVE', 'FALLOUT', 'PIPELINE'], true)}
            {select('project_stage', 'PROJECT STAGE', ['FALLOUT STAGE','HALLWAY STAGE','MIGRATION STAGE','NETWORK STAGE','PRE-BUILD STAGE','PROJECT COMPLETED','SAQ STAGE'])}
            {select('project_milestone', 'PROJECT MILESTONE', PROJECT_MILESTONES)}
            {field('working_lines', 'WORKING LINES', 'number')}
            {field('rollout_ports', 'ROLLOUT PORTS', 'number')}
            {field('mrc', 'MRC', 'number')}
          </>)}

          {section("SAQ Information", <>
            {select('saq_milestone', 'SAQ MILESTONE', SAQ_MILESTONES, true)}
            {select('commercial_scheme', 'COMMERCIAL SCHEME', ['COB','DUPLICATE','FREE OF CHARGE','LEASE','POTENTIAL LEASE'])}
            {select('col_tor_status', 'COL TOR STATUS', ['REQUESTED PA','REQUESTED REVENUE','SALES APPROVAL','TOR APPROVED','TOR BA FOR SIGNING','TOR BA SUBMITTED'])}
            {field('signed_tor_moa_date', 'SIGNED TOR/MOA DATE', 'date')}
            {select('moa_acquired_by', 'MOA ACQUIRED BY', saqPersonnelList)}
            {select('moa_uploading_status', 'MOA UPLOADING STATUS', ['FOR UPLOADING', 'UPLOADED'])}
            {field('skom_date', 'SKOM DATE', 'date')}
            {select('attended_by', 'ATTENDED BY', saqPersonnelList)}
            {field('validated_date', 'VALIDATED DATE', 'date')}
            {select('validated_by', 'VALIDATED BY', validatedByList)}
          </>)}

          {section("Important Dates", <>
            {field('site_visited_date', 'SITE VISITED DATE', 'date')}
            {field('target_date_profiling', 'TARGET DATE PROFILING', 'date')}
            {field('target_date_moa_to_acquire', 'TARGET DATE MOA TO ACQUIRE', 'date')}
            {field('date_of_recent_engagement', 'DATE OF RECENT ENGAGEMENT', 'date')}
            {field('site_entry_date', 'SITE ENTRY DATE', 'date')}
          </>)}

          {section("Status Information", <>
            {select('productivity', 'PRODUCTIVITY', ['ENGAGED', 'MOA ACQUIRED', 'NO RECENT ENGAGEMENT'])}
            {select('moa_status', 'MOA STATUS', ['FOR MOA NEGO', 'FOR PROFILING', 'NO NEED', 'WITH MOA'], true)}
            {select('profile_status', 'PROFILE STATUS', ['FOR PROFILING', 'NEW', 'EXISTING', 'NO NEED'])}
            {select('project_phase', 'PROJECT PHASE', ['COMPLETED MIGRATION','FALLOUT','HALLWAY PHASE','IMPLEMENTATION PHASE','MIGRATION PHASE','READY TO SELL','SITE ACQUISITION PHASE'])}
            {select('budget_status', 'BUDGET STATUS', ['BUDGET APPROVED', 'FOR BUDGET APPROVAL'])}
            {select('implementation_status', 'IMPLEMENTATION STATUS', ['DROPPED', 'ONGOING', 'INCOMING', 'COMPLETED'])}
            {field('ref_id', 'REF ID')}
            {readOnly('reference_number', 'REFERENCE #')}
          </>)}

          {section("Remarks", <>{textarea('significant_remarks', 'SIGNIFICANT REMARKS')}</>)}

          {section("Replacement Information", <>
            {field('replacement_site', 'REPLACEMENT SITE')}
            {field('date_endorse_replacement', 'DATE ENDORSE REPLACEMENT', 'date')}
            {field('date_accepted', 'DATE ACCEPTED', 'date')}
            {field('date_rejected', 'DATE REJECTED', 'date')}
            {field('go_nogo', 'GO/NOGO')}
            {field('replacements_groupings', 'REPLACEMENTS GROUPINGS')}
            {field('tagging_temp', 'TAGGING TEMP')}
            {textarea('replacement_request', 'REPLACEMENT REQUEST')}
          </>)}

          {section("Additional Information", <>
            {field('prev_batch', 'PREV BATCH')}
            {field('fl_id', 'FL ID')}
            {select('po_status', 'PO STATUS', ['FOR PR-PO', 'PO RELEASED'])}
            {field('migrated_lines', 'MIGRATED LINES', 'number')}
            {field('quick_bashing', 'QUICK BASHING')}
          </>)}

          {section("BASH Section", <>
            {field('bash_preworks', 'BASH-PREWORKS (LOUIE)')}
            {field('bash_network', 'BASH-NETWORK (JARROD)')}
            {field('bash_hallway', 'BASH-HALLWAY (VIDAL)')}
            {field('bash_migration', 'BASH-MIGRATION (JAYR)')}
          </>)}

          {section("Revenue & Capacity Metrics", <>
            {field('based_revenue_existing_circuits_hw_tracker', 'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)', 'number')}
            {field('annual_based_revenue_existing_circuits_efpa', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)', 'number')}
            {field('actual_tad_ports_pairs_provisioned', 'ACTUAL TAD PORTS/PAIRS PROVISIONED', 'number')}
            {field('mdu_onu', 'MDU/ONU')}
            {field('actual_remaining_ports', 'ACTUAL REMAINING PORTS', 'number')}
            {field('potential_revenue_growth', 'POTENTIAL REVENUE GROWTH', 'number')}
            {field('actual_ta', 'ACTUAL TA')}
            {field('actual_fa', 'ACTUAL FA')}
            {field('warpp_pcn', 'WARPP PCN')}
            {field('actual_ready_to_sell_ports', 'ACTUAL READY TO SELL PORTS')}
          </>)}

          {section("Design & Planning", <>
            {field('scheme_design', 'SCHEME DESIGN')}
            {select('fco_aor', 'FCO AOR', fcoPersonnelList)}
          </>)}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-white rounded-b-xl border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingEditModal;
