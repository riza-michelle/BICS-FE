export interface User {
  id: number;
  username: string;
  email?: string;
  fullname?: string;
  contact_number?: string;
  role?: 'Super Admin' | 'Admin' | 'User - SAQ';
  is_locked?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
  maskedEmail?: string;
}

export interface BicsRecord {
  id?: number;
  epc_batch?: string;
  vendor?: string;
  snap_id_bldg_tag?: string;
  pcn?: string;
  bcsi_aor?: string;
  project_scheme?: string;
  bid?: string;
  site_name?: string;
  building_name?: string;
  address?: string;
  brgy?: string;
  city_municipality?: string;
  province?: string;
  coordinates?: string;
  district?: string;
  zone?: string;
  area?: string;
  market_segment?: string;
  building_status?: string;
  usage_type?: string;
  floors?: number;
  units?: number;
  developer?: string;
  project_status?: string;
  project_stage?: string;
  project_milestone?: string;
  working_lines?: number;
  rollout_ports?: number;
  mrc?: number;
  saq_milestone?: string;
  commercial_scheme?: string;
  col_tor_status?: string;
  signed_tor_moa_date?: string;
  moa_acquired_by?: string;
  moa_uploading_status?: string;
  skom_date?: string;
  attended_by?: string;
  validated_date?: string;
  validated_by?: string;
  site_visited_date?: string;
  target_date_profiling?: string;
  target_date_moa_to_acquire?: string;
  date_of_recent_engagement?: string;
  significant_remarks?: string;
  saq_sub_status?: string;
  saq_status?: string;
  actionable?: string;
  productivity?: string;
  moa_status?: string;
  profile_status?: string;
  ref_id?: string;
  replacement_site?: string;
  date_endorse_replacement?: string;
  date_accepted_rejected?: string;
  reference_number?: string;
  site_entry_date?: string;
  prev_batch?: string;
  fl_id?: string;
  po_status?: string;
  migrated_lines?: number;
  quick_bashing?: string;
  bash_preworks?: string;
  bash_network?: string;
  bash_hallway?: string;
  bash_migration?: string;
  replacement_request?: string;
  top_dev?: string;
  rm?: string;
  rm_group?: string;
  date_accepted?: string;
  date_rejected?: string;
  go_nogo?: string;
  replacements_groupings?: string;
  tagging_temp?: string;
  budget_status?: string;
  project_phase?: string;
  implementation_status?: string;
  based_revenue_existing_circuits_hw_tracker?: number;
  annual_based_revenue_existing_circuits_efpa?: number;
  actual_tad_ports_pairs_provisioned?: number;
  mdu_onu?: string;
  actual_remaining_ports?: number;
  potential_revenue_growth?: number;
  scheme_design?: string;
  fco_aor?: string;
  fttb_po_release?: string;
  fttb_cip?: string;
  fttb_target_completion?: string;
  rollout_solution?: string;
  actual_ta?: string;
  actual_fa?: string;
  warpp_pcn?: string;
  actual_ready_to_sell_ports?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_records: number;
  unique_statuses: number;
  records_last_30_days: number;
  active_projects: number;
  fallout_projects: number;
  pipeline_projects: number;
  completed_projects: number;
  moa_for_profiling: number;
  moa_for_nego: number;
  moa_with_moa: number;
  moa_no_need: number;
}

export interface EngagementSummary {
  personnel: string;
  total_engagements: number;
  last_engagement_date: string;
  engagements_last_7_days: number;
  engagements_last_30_days: number;
  unique_vendors: number;
  unique_locations: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_records: number;
  per_page: number;
}

export interface RecordsResponse {
  records: BicsRecord[];
  pagination: PaginationInfo;
}

export interface MoaUpload {
  id: number;
  client_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name?: string;
  uploaded_at: string;
  // Individual document fields
  moa_file_name?: string;
  moa_file_path?: string;
  moa_file_size?: number;
  freebie_moa_file_name?: string;
  freebie_moa_file_path?: string;
  freebie_moa_file_size?: number;
}

export interface MoaListResponse {
  records: MoaUpload[];
  pagination: PaginationInfo;
}

export interface UsersListResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface EpcBatch {
  id: number;
  batch_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface EpcBatchListResponse {
  batches: EpcBatch[];
  pagination: PaginationInfo;
}

export interface Vendor {
  id: number;
  vendor_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorListResponse {
  vendors: Vendor[];
  pagination: PaginationInfo;
}

export interface SaqPersonnel {
  id: number;
  personnel_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SaqPersonnelListResponse {
  personnel: SaqPersonnel[];
  pagination: PaginationInfo;
}

export interface FcoPersonnel {
  id: number;
  personnel_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface FcoPersonnelListResponse {
  personnel: FcoPersonnel[];
  pagination: PaginationInfo;
}

export interface TopDeveloper {
  id: number;
  top_developer_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface TopDeveloperListResponse {
  topDevelopers: TopDeveloper[];
  pagination: PaginationInfo;
}

export interface RelationshipManager {
  id: number;
  relationship_manager: string;
  relationship_manager_group: string;
  created_at?: string;
  updated_at?: string;
}

export interface RelationshipManagerListResponse {
  relationshipManagers: RelationshipManager[];
  pagination: PaginationInfo;
}

export interface ValidatedBy {
  id: number;
  validated_by_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValidatedByListResponse {
  personnel: ValidatedBy[];
  pagination: PaginationInfo;
}

export interface CobInventory {
  id: number;
  client_name: string;
  batch_number?: number;
  batch_name?: string;
  duration?: string;
  status: string;
  bw_speed?: string;
  uploader_id?: number;
  uploader_name?: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CobInventoryListResponse {
  records: CobInventory[];
  pagination: PaginationInfo;
}

export interface EpcBatchOption {
  id: number;
  batch_name: string;
}

export interface SaqPersonnelOption {
  id: number;
  personnel_name: string;
}