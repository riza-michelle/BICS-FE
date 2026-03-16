import React, { useState, useEffect } from 'react';
import { BicsRecord } from '../types';
import { Save, X, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { epcBatchAPI, vendorAPI, saqPersonnelAPI, fcoPersonnelAPI, topDeveloperAPI, relationshipManagerAPI, validatedByAPI } from '../services/api';

interface EditModalProps {
  record: BicsRecord;
  onClose: () => void;
  onSave: (record: BicsRecord) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ record, onClose, onSave }) => {
  const [formData, setFormData] = useState<BicsRecord>(record);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [epcBatchList, setEpcBatchList] = useState<string[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [saqPersonnelList, setSaqPersonnelList] = useState<string[]>([]);
  const [fcoPersonnelList, setFcoPersonnelList] = useState<string[]>([]);
  const [topDeveloperList, setTopDeveloperList] = useState<string[]>([]);
  const [relationshipManagerList, setRelationshipManagerList] = useState<string[]>([]);
  const [relationshipManagerData, setRelationshipManagerData] = useState<{relationship_manager: string; relationship_manager_group: string}[]>([]);
  const [validatedByList, setValidatedByList] = useState<string[]>([]);

  // Helper function to format date for input fields
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      // If already in YYYY-MM-DD format, return as-is to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      // Parse the date and format it using local timezone to avoid shifts
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      // Use local date components instead of toISOString to avoid timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Fetch EPC Batch, Vendor, and SAQ Personnel lists on component mount
  useEffect(() => {
    const fetchEpcBatches = async () => {
      try {
        const response = await epcBatchAPI.getList({ limit: 1000 });
        if (response.success && response.data) {
          const batchNames = response.data.batches.map(batch => batch.batch_name);
          setEpcBatchList(batchNames);
        }
      } catch (error) {
        console.error('Error fetching EPC batches:', error);
      }
    };

    const fetchVendors = async () => {
      try {
        const response = await vendorAPI.getList({ limit: 1000 });
        if (response.success && response.data) {
          const vendorNames = response.data.vendors.map(vendor => vendor.vendor_name);
          setVendorList(vendorNames);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    const fetchSaqPersonnel = async () => {
      try {
        const response = await saqPersonnelAPI.getList({ limit: 1000 });
        if (response.success && response.data) {
          const personnelNames = response.data.personnel.map(person => person.personnel_name);
          setSaqPersonnelList(personnelNames);
        }
      } catch (error) {
        console.error('Error fetching SAQ personnel:', error);
      }
    };

    const fetchFcoPersonnel = async () => {
      try {
        const response = await fcoPersonnelAPI.getList({ limit: 1000 });
        if (response.success && response.data) {
          const personnelNames = response.data.personnel.map(person => person.personnel_name);
          setFcoPersonnelList(personnelNames);
        }
      } catch (error) {
        console.error('Error fetching FCO personnel:', error);
      }
    };

    const fetchTopDevelopers = async () => {
      try {
        const response = await topDeveloperAPI.getAll();
        if (response.success && response.data) {
          const developerNames = response.data.map(dev => dev.top_developer_name);
          setTopDeveloperList(developerNames);
        }
      } catch (error) {
        console.error('Error fetching top developers:', error);
      }
    };

    const fetchRelationshipManagers = async () => {
      try {
        const response = await relationshipManagerAPI.getAll();
        if (response.success && response.data) {
          // Store full data for lookup
          setRelationshipManagerData(response.data.map(rm => ({
            relationship_manager: rm.relationship_manager,
            relationship_manager_group: rm.relationship_manager_group
          })));
          // Get unique relationship manager names
          const rmNames = Array.from(new Set(response.data.map(rm => rm.relationship_manager)));
          setRelationshipManagerList(rmNames);
        }
      } catch (error) {
        console.error('Error fetching relationship managers:', error);
      }
    };

    const fetchValidatedBy = async () => {
      try {
        const response = await validatedByAPI.getAll();
        if (response.success && response.data) {
          const validatedByNames = response.data.map(item => item.validated_by_name);
          setValidatedByList(validatedByNames);
        }
      } catch (error) {
        console.error('Error fetching validated by personnel:', error);
      }
    };

    fetchEpcBatches();
    fetchVendors();
    fetchSaqPersonnel();
    fetchFcoPersonnel();
    fetchTopDevelopers();
    fetchRelationshipManagers();
    fetchValidatedBy();
  }, []);

  useEffect(() => {
    // Format dates for input fields
    const formattedRecord = {
      ...record,
      signed_tor_moa_date: formatDateForInput(record.signed_tor_moa_date),
      skom_date: formatDateForInput(record.skom_date),
      validated_date: formatDateForInput(record.validated_date),
      site_visited_date: formatDateForInput(record.site_visited_date),
      target_date_profiling: formatDateForInput(record.target_date_profiling),
      target_date_moa_to_acquire: formatDateForInput(record.target_date_moa_to_acquire),
      date_of_recent_engagement: formatDateForInput(record.date_of_recent_engagement),
      site_entry_date: formatDateForInput(record.site_entry_date),
      date_endorse_replacement: formatDateForInput(record.date_endorse_replacement),
      date_accepted_rejected: formatDateForInput(record.date_accepted_rejected),
      date_accepted: formatDateForInput(record.date_accepted),
      date_rejected: formatDateForInput(record.date_rejected),
      fttb_po_release: formatDateForInput(record.fttb_po_release),
      fttb_target_completion: formatDateForInput(record.fttb_target_completion),
    };
    setFormData(formattedRecord);
  }, [record]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Auto-fill rm_group when rm is selected, clear when rm is cleared
    if (name === 'rm') {
      if (value) {
        const matchingRM = relationshipManagerData.find(rm => rm.relationship_manager === value);
        if (matchingRM) {
          setFormData(prev => ({
            ...prev,
            rm: value,
            rm_group: matchingRM.relationship_manager_group,
          }));
          return;
        }
      } else {
        // Clear rm_group when rm is cleared
        setFormData(prev => ({
          ...prev,
          rm: '',
          rm_group: '',
        }));
        return;
      }
    }

    // Auto-set moa_status to "WITH MOA" when project_milestone is "SIGNED MOA"
    if (name === 'project_milestone') {
      if (value === 'SIGNED MOA') {
        setFormData(prev => ({
          ...prev,
          project_milestone: value,
          moa_status: 'WITH MOA',
        }));
        return;
      }
    }

    // Auto-set project_milestone to "SIGNED MOA" when moa_status is "WITH MOA"
    if (name === 'moa_status') {
      if (value === 'WITH MOA') {
        setFormData(prev => ({
          ...prev,
          moa_status: value,
          project_milestone: 'SIGNED MOA',
        }));
        return;
      }
    }

    // Auto-set productivity to "MOA ACQUIRED" when saq_milestone is "SIGNED MOA"
    if (name === 'saq_milestone') {
      if (value === 'SIGNED MOA') {
        setFormData(prev => ({
          ...prev,
          saq_milestone: value,
          productivity: 'MOA ACQUIRED',
        }));
        return;
      }
    }

    // Auto-set saq_milestone to "SIGNED MOA" when productivity is "MOA ACQUIRED"
    if (name === 'productivity') {
      if (value === 'MOA ACQUIRED') {
        setFormData(prev => ({
          ...prev,
          productivity: value,
          saq_milestone: 'SIGNED MOA',
        }));
        return;
      }
    }

    // Auto-set productivity to "ENGAGED" when date_of_recent_engagement is set
    if (name === 'date_of_recent_engagement' && value) {
      setFormData(prev => ({
        ...prev,
        date_of_recent_engagement: value,
        productivity: 'ENGAGED',
      }));
      return;
    }

    const isSelect = e.target.tagName === 'SELECT';
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number'
        ? (value === '' ? undefined : Number(value))
        : (isSelect ? value : (typeof value === 'string' ? value.toUpperCase() : value)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await onSave(formData);
      // Success notification will be handled by parent component
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error updating record'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const renderFormSection = (title: string, children: React.ReactNode) => {
    // Default to collapsed (false) if not set
    const isExpanded = expandedSections[title] === true;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(title)}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors border-b border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>
        {isExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInput = (
    name: keyof BicsRecord,
    label: string,
    type: 'text' | 'number' | 'email' | 'tel' | 'date' = 'text',
    colSpan?: string
  ) => {
    // Get the value and ensure proper formatting
    let value = formData[name];
    if (value === null || value === undefined) {
      value = '';
    } else if (typeof value === 'number') {
      value = value.toString();
    } else {
      value = String(value);
    }

    return (
      <div className={colSpan || ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
    );
  };

  const renderSelect = (
    name: keyof BicsRecord,
    label: string,
    options: string[],
    required?: boolean
  ) => {
    let value = formData[name];
    if (value === null || value === undefined) {
      value = '';
    } else {
      value = String(value);
    }

    // Case-insensitive match: if stored value doesn't exactly match any option,
    // find a case-insensitive match and use that option's casing for display
    if (value && options.length > 0 && !options.includes(value)) {
      const lower = value.toLowerCase();
      const match = options.find(o => o.toLowerCase() === lower);
      if (match) value = match;
    }

    // If still no match, include the stored value as an extra option so it stays visible
    const hasMatch = !value || options.includes(value);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select {label}</option>
          {!hasMatch && value && (
            <option key="__current__" value={value}>{value}</option>
          )}
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderTextarea = (
    name: keyof BicsRecord,
    label: string,
    rows: number = 2
  ) => {
    let value = formData[name];
    if (value === null || value === undefined) {
      value = '';
    } else {
      value = String(value);
    }

    return (
      <div className="md:col-span-2 lg:col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          rows={rows}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
    );
  };

  const renderReadOnlyInput = (
    name: keyof BicsRecord,
    label: string
  ) => {
    let value = formData[name];
    if (value === null || value === undefined) {
      value = '';
    } else {
      value = String(value);
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <input
          type="text"
          name={name}
          value={value}
          readOnly
          disabled
          className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
          <div>
            <h2 className="text-xl font-bold">Edit Site Entry</h2>
            <p className="text-sm text-green-100 mt-0.5">
              {formData.site_name || 'Unnamed Site'} • {formData.building_name || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 bg-gray-50" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 shadow-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            {renderFormSection("Basic Information", (
              <>
                {renderSelect('epc_batch', 'EPC BATCH', epcBatchList, true)}
                {renderSelect('vendor', 'VENDOR', vendorList)}
                {renderInput('snap_id_bldg_tag', 'SNAP ID/BLDG TAG')}
                {renderInput('pcn', 'PCN')}
                {renderSelect('bcsi_aor', 'BICS PERSONNEL', saqPersonnelList, true)}
                {renderSelect('project_scheme', 'PROJECT SCHEME', [
                  'GROWTH',
                  'OVERLAY'
                ])}
                {renderInput('bid', 'BID')}
              </>
            ))}

            {/* Site Information */}
            {renderFormSection("Site Information", (
              <>
                {renderInput('site_name', 'SITE NAME')}
                {renderInput('building_name', 'BUILDING NAME')}
                {renderInput('address', 'ADDRESS', 'text', 'md:col-span-2 lg:col-span-3')}
                {renderInput('brgy', 'BRGY')}
                {renderInput('city_municipality', 'CITY/MUNICIPALITY')}
                {renderSelect('province', 'PROVINCE', [
                  'ABRA',
                  'AGUSAN DEL NORTE',
                  'AGUSAN DEL SUR',
                  'AKLAN',
                  'ALBAY',
                  'ANTIQUE',
                  'APAYAO',
                  'AURORA',
                  'BASILAN',
                  'BATAAN',
                  'BATANES',
                  'BATANGAS',
                  'BENGUET',
                  'BILIRAN',
                  'BOHOL',
                  'BUKIDNON',
                  'BULACAN',
                  'CAGAYAN',
                  'CAMARINES NORTE',
                  'CAMARINES SUR',
                  'CAMIGUIN',
                  'CAPIZ',
                  'CATANDUANES',
                  'CAVITE',
                  'CEBU',
                  'CORDILLERA ADMINISTRATIVE REGION (CAR)',
                  'COTABATO (NORTH COTABATO)',
                  'DAVAO DE ORO',
                  'DAVAO DEL NORTE',
                  'DAVAO DEL SUR',
                  'DAVAO OCCIDENTAL',
                  'DAVAO ORIENTAL',
                  'DINAGAT ISLANDS',
                  'EASTERN SAMAR',
                  'GUIMARAS',
                  'IFUGAO',
                  'ILOCOS NORTE',
                  'ILOCOS SUR',
                  'ILOILO',
                  'ISABELA',
                  'KALINGA',
                  'LA UNION',
                  'LAGUNA',
                  'LANAO DEL NORTE',
                  'LANAO DEL SUR',
                  'LEYTE',
                  'MAGUINDANAO DEL NORTE',
                  'MAGUINDANAO DEL SUR',
                  'MARINDUQUE',
                  'MASBATE',
                  'METRO MANILA (NCR)',
                  'MISAMIS OCCIDENTAL',
                  'MISAMIS ORIENTAL',
                  'MOUNTAIN PROVINCE',
                  'NEGROS OCCIDENTAL',
                  'NEGROS ORIENTAL',
                  'NORTHERN SAMAR',
                  'NUEVA ECIJA',
                  'NUEVA VIZCAYA',
                  'OCCIDENTAL MINDORO',
                  'ORIENTAL MINDORO',
                  'PALAWAN',
                  'PAMPANGA',
                  'PANGASINAN',
                  'QUEZON',
                  'QUIRINO',
                  'RIZAL',
                  'ROMBLON',
                  'SAMAR (WESTERN SAMAR)',
                  'SARANGANI',
                  'SIQUIJOR',
                  'SORSOGON',
                  'SOUTH COTABATO',
                  'SOUTHERN LEYTE',
                  'SULTAN KUDARAT',
                  'SULU',
                  'SURIGAO DEL NORTE',
                  'SURIGAO DEL SUR',
                  'TARLAC',
                  'TAWI-TAWI',
                  'ZAMBALES',
                  'ZAMBOANGA DEL NORTE',
                  'ZAMBOANGA DEL SUR',
                  'ZAMBOANGA SIBUGAY'
                ])}
                {renderInput('coordinates', 'COORDINATES')}
                {renderSelect('district', 'DISTRICT', [
                  'GMM EAST',
                  'GMM NORTH',
                  'GMM SOUTH',
                  'GMM WEST',
                  'MINDANAO',
                  'NORTH LUZON',
                  'SOUTH LUZON',
                  'VISAYAS'
                ])}
                {renderInput('zone', 'ZONE')}
                {renderSelect('area', 'AREA', ['GMM', 'REGIONAL'])}
                {renderSelect('market_segment', 'MARKET SEGMENT', [
                  'Enterprise',
                  'Home',
                  'Mixed'
                ])}
              </>
            ))}

            {/* Building Details */}
            {renderFormSection("Building Details", (
              <>
                {renderSelect('building_status', 'BUILDING STATUS', [
                  'ABANDONED',
                  'DEMOLISHED',
                  'EXISTING',
                  'FOR CONSTRUCTION',
                  'FOR VACANCY',
                  'ONGOING CONSTRUCTION',
                  'UNDER CONSTRUCTION',
                  'UNDER RENOVATION',
                  'UPCOMING'
                ])}
                {renderSelect('usage_type', 'USAGE', [
                  'Residential', 'Commercial', 'Mixed', 'Office', 'Industrial', 'Mall & Retail'
                ])}
                {renderInput('floors', 'FLOORS', 'number')}
                {renderInput('units', 'UNITS', 'number')}
                {renderInput('developer', 'DEVELOPER')}
                {renderSelect('top_dev', 'TOP DEVELOPER', topDeveloperList)}
              </>
            ))}

            {/* Contact Information */}
            {renderFormSection("Contact Information", (
              <>
                {renderSelect('rm', 'RELATIONSHIP MANAGER', relationshipManagerList)}
                {renderReadOnlyInput('rm_group', 'RELATIONSHIP MANAGER GROUP')}
              </>
            ))}

            {/* Project Information */}
            {renderFormSection("Project Information", (
              <>
                {renderSelect('project_status', 'PROJECT STATUS', [
                  'ACTIVE',
                  'FALLOUT',
                  'PIPELINE'
                ], true)}
                {renderSelect('project_stage', 'PROJECT STAGE', [
                  'FALLOUT STAGE',
                  'HALLWAY STAGE',
                  'MIGRATION STAGE',
                  'NETWORK STAGE',
                  'PRE-BUILD STAGE',
                  'PROJECT COMPLETED',
                  'SAQ STAGE'
                ])}
                {renderSelect('project_milestone', 'PROJECT MILESTONE', [
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
                  'WITH ISSUE'
                ])}
                {renderInput('working_lines', 'WORKING LINES', 'number')}
                {renderInput('rollout_ports', 'ROLLOUT PORTS', 'number')}
                {renderInput('mrc', 'MRC', 'number')}
              </>
            ))}

            {/* SAQ Information */}
            {renderFormSection("SAQ Information", (
              <>
                {renderSelect('saq_milestone', 'SAQ MILESTONE', [
                  'CAN\'T LOCATE',
                  'DUPLICATION',
                  'ELECTRICITY PAYMENT',
                  'FACILITY COLOCATED',
                  'FACILITY LOCATION',
                  'FEASIBLE VIA POLE NAP',
                  'FOR DEMOLITION / DEMOLISHED',
                  'FOR RENOV / ONGOING RENOV',
                  'FOR VACANCY',
                  'FOR ACQUISITION',
                  'FOR PROFILING',
                  'FOR SIGNING',
                  'HIGH COB',
                  'HIGH LEASE',
                  'MIXED USE',
                  'MOA VALIDATION',
                  'MULTIPLE SITES',
                  'NO COMMITMENT',
                  'NO DEMAND (SALES CONFIRMED)',
                  'NO DEMAND FROM CLIENT',
                  'NO RESPONSE',
                  'ONGOING COMMERCIAL NEGO',
                  'PO CONCERN',
                  'PRA',
                  'REJECTED',
                  'REJECTED REPLACEMENT',
                  'REQUIRES FTTB PLAN',
                  'REQUIRES HS DESIGN',
                  'RESIDENTIAL',
                  'SIGNED MOA',
                  'SIGNED TOR',
                  'SUBMITTED LOI',
                  'SUBMITTED MOA',
                  'UNDER CLARKTEL PROJECT',
                  'UNDER CONSTRUCTION',
                  'USED AS REPLACEMENT',
                  'WIP SITE',
                  'WITH EXISTING FTTB',
                  'PLDT BUILDING'
                ], true)}
                {renderSelect('commercial_scheme', 'COMMERCIAL SCHEME', [
                  'COB',
                  'DUPLICATE',
                  'FREE OF CHARGE',
                  'LEASE',
                  'POTENTIAL LEASE'
                ])}
                {renderSelect('col_tor_status', 'COL TOR STATUS', [
                  'REQUESTED PA',
                  'REQUESTED REVENUE',
                  'SALES APPROVAL',
                  'TOR APPROVED',
                  'TOR BA FOR SIGNING',
                  'TOR BA SUBMITTED'
                ])}
                {renderInput('signed_tor_moa_date', 'SIGNED TOR/MOA DATE', 'date')}
                {renderSelect('moa_acquired_by', 'MOA ACQUIRED BY', saqPersonnelList)}
                {renderSelect('moa_uploading_status', 'MOA UPLOADING STATUS', [
                  'FOR UPLOADING',
                  'UPLOADED'
                ])}
                {renderInput('skom_date', 'SKOM DATE', 'date')}
                {renderSelect('attended_by', 'ATTENDED BY', saqPersonnelList)}
                {renderInput('validated_date', 'VALIDATED DATE', 'date')}
                {renderSelect('validated_by', 'VALIDATED BY', validatedByList)}
              </>
            ))}

            {/* Important Dates */}
            {renderFormSection("Important Dates", (
              <>
                {renderInput('site_visited_date', 'SITE VISITED DATE', 'date')}
                {renderInput('target_date_profiling', 'TARGET DATE PROFILING', 'date')}
                {renderInput('target_date_moa_to_acquire', 'TARGET DATE MOA TO ACQUIRE', 'date')}
                {renderInput('date_of_recent_engagement', 'DATE OF RECENT ENGAGEMENT', 'date')}
                {renderInput('site_entry_date', 'SITE ENTRY DATE', 'date')}
              </>
            ))}

            {/* Status Information */}
            {renderFormSection("Status Information", (
              <>
                {renderSelect('productivity', 'PRODUCTIVITY', [
                  'ENGAGED',
                  'MOA ACQUIRED',
                  'NO RECENT ENGAGEMENT'
                ])}
                {renderSelect('moa_status', 'MOA STATUS', [
                  'FOR MOA NEGO',
                  'FOR PROFILING',
                  'NO NEED',
                  'WITH MOA'
                ], true)}
                {renderSelect('profile_status', 'PROFILE STATUS', [
                  'FOR PROFILING',
                  'NEW',
                  'EXISTING',
                  'NO NEED'
                ])}
                {renderSelect('project_phase', 'PROJECT PHASE', [
                  'COMPLETED MIGRATION',
                  'FALLOUT',
                  'HALLWAY PHASE',
                  'IMPLEMENTATION PHASE',
                  'MIGRATION PHASE',
                  'READY TO SELL',
                  'SITE ACQUISITION PHASE',
                ])}
                {renderSelect('budget_status', 'BUDGET STATUS', [
                  'BUDGET APPROVED',
                  'FOR BUDGET APPROVAL',
                ])}
                {renderSelect('implementation_status', 'IMPLEMENTATION STATUS', [
                  'DROPPED',
                  'ONGOING',
                  'INCOMING',
                  'COMPLETED'
                ])}
                {renderInput('ref_id', 'REF ID')}
                {renderInput('reference_number', 'REFERENCE #')}
              </>
            ))}

            {/* Remarks */}
            {renderFormSection("Remarks", (
              <>
                {renderTextarea('significant_remarks', 'SIGNIFICANT REMARKS')}
              </>
            ))}

            {/* Replacement Information */}
            {renderFormSection("Replacement Information", (
              <>
                {renderInput('replacement_site', 'REPLACEMENT SITE')}
                {renderInput('date_endorse_replacement', 'DATE ENDORSE REPLACEMENT', 'date')}
                {renderInput('date_accepted', 'DATE ACCEPTED', 'date')}
                {renderInput('date_rejected', 'DATE REJECTED', 'date')}
                {renderInput('go_nogo', 'GO/NOGO')}
                {renderInput('replacements_groupings', 'REPLACEMENTS GROUPINGS')}
                {renderInput('tagging_temp', 'TAGGING TEMP')}
                {renderTextarea('replacement_request', 'REPLACEMENT REQUEST')}
              </>
            ))}

            {/* Additional Information */}
            {renderFormSection("Additional Information", (
              <>
                {renderInput('prev_batch', 'PREV BATCH')}
                {renderInput('fl_id', 'FL ID')}
                {renderSelect('po_status', 'PO STATUS', [
                  'FOR PR-PO',
                  'PO RELEASED'
                ])}
                {renderInput('migrated_lines', 'MIGRATED LINES', 'number')}
                {renderInput('quick_bashing', 'QUICK BASHING')}
              </>
            ))}

            {/* BASH Section */}
            {renderFormSection("BASH Section", (
              <>
                {renderInput('bash_preworks', 'BASH-PREWORKS (LOUIE)')}
                {renderInput('bash_network', 'BASH-NETWORK (JARROD)')}
                {renderInput('bash_hallway', 'BASH-HALLWAY (VIDAL)')}
                {renderInput('bash_migration', 'BASH-MIGRATION (JAYR)')}
              </>
            ))}

            {/* Revenue & Capacity Metrics */}
            {renderFormSection("Revenue & Capacity Metrics", (
              <>
                {renderInput('based_revenue_existing_circuits_hw_tracker', 'BASED REVENUE (EXISTING CIRCUITS HW TRACKER)', 'number')}
                {renderInput('annual_based_revenue_existing_circuits_efpa', 'ANNUAL BASED REVENUE (EXISTING CIRCUITS EFPA)', 'number')}
                {renderInput('actual_tad_ports_pairs_provisioned', 'ACTUAL TAD PORTS/PAIRS PROVISIONED', 'number')}
                {renderInput('mdu_onu', 'MDU/ONU')}
                {renderInput('actual_remaining_ports', 'ACTUAL REMAINING PORTS', 'number')}
                {renderInput('potential_revenue_growth', 'POTENTIAL REVENUE GROWTH', 'number')}
                {renderInput('actual_ta', 'ACTUAL TA')}
                {renderInput('actual_fa', 'ACTUAL FA')}
                {renderInput('warpp_pcn', 'WARPP PCN')}
                {renderInput('actual_ready_to_sell_ports', 'ACTUAL READY TO SELL PORTS')}
              </>
            ))}

            {/* Design & Planning */}
            {renderFormSection("Design & Planning", (
              <>
                {renderInput('scheme_design', 'SCHEME DESIGN')}
                {renderSelect('fco_aor', 'FCO AOR', fcoPersonnelList)}
              </>
            ))}

            {/* FTTB Information */}
            {renderFormSection("FTTB Information", (
              <>
                {renderInput('fttb_po_release', 'FTTB PO RELEASE', 'date')}
                {renderInput('fttb_cip', 'FTTB CIP')}
                {renderInput('fttb_target_completion', 'FTTB TARGET COMPLETION', 'date')}
                {renderInput('rollout_solution', 'ROLLOUT SOLUTION')}
              </>
            ))}

            {/* Footer with actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Record
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
