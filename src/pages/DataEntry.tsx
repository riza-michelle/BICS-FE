import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { bicsAPI, pendingRecordsAPI, epcBatchAPI, vendorAPI, saqPersonnelAPI, fcoPersonnelAPI, topDeveloperAPI, relationshipManagerAPI, validatedByAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BicsRecord } from '../types';
import { Save, RotateCcw, ArrowLeft, ChevronDown, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const SearchableSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputWrapRef          = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const updatePosition = useCallback(() => {
    if (!inputWrapRef.current) return;
    const rect = inputWrapRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdownEl = document.getElementById('ss-dropdown');
      if (
        inputWrapRef.current && !inputWrapRef.current.contains(target) &&
        !(dropdownEl && dropdownEl.contains(target))
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
  };

  const dropdown = open ? ReactDOM.createPortal(
    <ul
      id="ss-dropdown"
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-md shadow-xl max-h-52 overflow-y-auto"
    >
      {filtered.length === 0 ? (
        <li className="px-3 py-2 text-xs text-gray-400 text-center">No results</li>
      ) : (
        filtered.map(opt => (
          <li
            key={opt}
            onMouseDown={() => handleSelect(opt)}
            className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${value === opt ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
          >
            {opt}
          </li>
        ))
      )}
    </ul>,
    document.body
  ) : null;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div ref={inputWrapRef} className="relative flex items-center">
        <input
          type="text"
          value={open ? query : (value || '')}
          placeholder={`Select or search ${label}`}
          onFocus={() => { setOpen(true); setQuery(''); updatePosition(); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className="block w-full px-2.5 py-1.5 pr-14 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <X
              className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); setOpen(false); }}
            />
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {dropdown}
    </div>
  );
};

const DataEntry: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BicsRecord>({});
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [epcBatchList, setEpcBatchList] = useState<string[]>([]);
  const [vendorList, setVendorList] = useState<string[]>([]);
  const [saqPersonnelList, setSaqPersonnelList] = useState<string[]>([]);
  const [fcoPersonnelList, setFcoPersonnelList] = useState<string[]>([]);
  const [topDeveloperList, setTopDeveloperList] = useState<string[]>([]);
  const [relationshipManagerList, setRelationshipManagerList] = useState<string[]>([]);
  const [relationshipManagerData, setRelationshipManagerData] = useState<{relationship_manager: string; relationship_manager_group: string}[]>([]);
  const [validatedByList, setValidatedByList] = useState<string[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();

  // Fetch EPC Batch list, Vendor list, and SAQ Personnel list on component mount
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
        const response = await topDeveloperAPI.getList({ limit: 1000 });
        if (response.success && response.data) {
          const topDeveloperNames = response.data.topDevelopers.map(topDev => topDev.top_developer_name);
          setTopDeveloperList(topDeveloperNames);
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

    // Auto-set reference number for new entries only
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (!editId) {
      bicsAPI.getNextReferenceNumber().then(res => {
        if (res.success) {
          setFormData(prev => ({ ...prev, reference_number: res.next_reference_number }));
        }
      }).catch(() => {});
    }
  }, []);

  // Load record for editing if edit parameter is present
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      const id = parseInt(editId);
      if (!isNaN(id)) {
        setIsEditMode(true);
        setRecordId(id);
        loadRecord(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadRecord = async (id: number) => {
    setLoading(true);
    try {
      const response = await bicsAPI.getRecord(id);
      if (response.success && response.data) {
        setFormData(response.data);
      } else {
        showNotification('error', 'Failed to load record');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error loading record');
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const dataToSubmit = {
        ...formData
      };

      let response;
      if (isEditMode && recordId) {
        response = await bicsAPI.updateRecord(recordId, dataToSubmit);
      } else if (user?.role === 'User - SAQ') {
        // User role: submit for Super Admin approval
        response = await pendingRecordsAPI.submit(dataToSubmit);
      } else {
        response = await bicsAPI.createRecord(dataToSubmit);
      }

      if (response.success) {
        if (isEditMode) {
          showNotification('success', 'Record updated successfully!');
          setTimeout(() => { navigate('/site-view'); }, 1500);
        } else if (user?.role === 'User - SAQ') {
          showNotification('success', 'Site submitted for Super Admin approval. It will appear in View Live Site once approved.');
          bicsAPI.getNextReferenceNumber().then(r => {
            setFormData(r.success ? { reference_number: r.next_reference_number } : {});
          }).catch(() => setFormData({}));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showNotification('success', 'Record created successfully!');
          bicsAPI.getNextReferenceNumber().then(r => {
            setFormData(r.success ? { reference_number: r.next_reference_number } : {});
          }).catch(() => setFormData({}));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        showNotification('error', response.message || `Failed to ${isEditMode ? 'update' : 'create'} record`);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    bicsAPI.getNextReferenceNumber().then(r => {
      setFormData(r.success ? { reference_number: r.next_reference_number } : {});
    }).catch(() => setFormData({}));
  };

  const renderFormSection = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800 flex items-center">
          <span className="w-1 h-5 bg-blue-600 rounded-full mr-2"></span>
          {title}
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      </div>
    </div>
  );

  const renderInput = (
    name: keyof BicsRecord,
    label: string,
    type: 'text' | 'number' | 'email' | 'tel' | 'date' = 'text',
    colSpan?: string
  ) => (
    <div className={colSpan || ''}>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
      />
    </div>
  );

  const renderSelect = (
    name: keyof BicsRecord,
    label: string,
    options: string[],
    required?: boolean
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const renderTextarea = (
    name: keyof BicsRecord,
    label: string,
    rows: number = 2
  ) => (
    <div className="md:col-span-2 lg:col-span-3">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <textarea
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        rows={rows}
        className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
      />
    </div>
  );

  const renderReadOnlyInput = (
    name: keyof BicsRecord,
    label: string
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={formData[name] || ''}
        readOnly
        disabled
        className="block w-full px-2.5 py-1.5 border border-gray-200 rounded-md shadow-sm bg-gray-100 text-gray-600 text-xs cursor-not-allowed"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-4">
                {isEditMode && (
                  <button
                    onClick={() => navigate('/site-view')}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Back
                  </button>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Site Entry' : 'Site Entry'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {isEditMode ? 'Update existing BICS record' : 'Create a new BICS record'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <SearchableSelect
                  label="RELATIONSHIP MANAGER"
                  value={formData.rm || ''}
                  options={relationshipManagerList}
                  onChange={val => {
                    if (val) {
                      const matchingRM = relationshipManagerData.find(r => r.relationship_manager === val);
                      setFormData(prev => ({ ...prev, rm: val, rm_group: matchingRM?.relationship_manager_group || '' }));
                    } else {
                      setFormData(prev => ({ ...prev, rm: '', rm_group: '' }));
                    }
                  }}
                />
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">REFERENCE #</label>
                  <input
                    type="text"
                    name="reference_number"
                    value={formData.reference_number || ''}
                    readOnly
                    className="block w-full px-2.5 py-1.5 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-xs text-gray-700 font-semibold cursor-not-allowed"
                  />
                </div>
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

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {isEditMode ? 'Update Record' : 'Save Record'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEntry;