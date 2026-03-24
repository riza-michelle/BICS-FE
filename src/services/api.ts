import axios from 'axios';
import { AuthResponse, ApiResponse, DashboardStats, RecordsResponse, BicsRecord, EngagementSummary, MoaListResponse, UsersListResponse, User, EpcBatchListResponse, EpcBatch, VendorListResponse, Vendor, SaqPersonnelListResponse, SaqPersonnel, FcoPersonnelListResponse, FcoPersonnel, TopDeveloperListResponse, TopDeveloper, RelationshipManagerListResponse, RelationshipManager, ValidatedByListResponse, ValidatedBy, CobInventoryListResponse, CobInventory, EpcBatchOption, SaqPersonnelOption } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Debug logging
console.log('🔍 API Debug Info:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('API_BASE_URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    console.log('🚀 Login attempt:', { username, url: `${API_BASE_URL}/auth/login` });
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Login response:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  verify: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<any>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (username: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/auth/change-password', {
      username,
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (username: string, email: string, newPassword: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/auth/forgot-password', {
      username,
      email,
      newPassword,
    });
    return response.data;
  },

  verifyMfa: async (mfaToken: string, code: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-mfa', { mfaToken, code });
    return response.data;
  },

  resendMfa: async (mfaToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/resend-mfa', { mfaToken });
    return response.data;
  },
};

// BICS API
export const bicsAPI = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/bics/dashboard-stats');
    return response.data;
  },

  getEngagementSummary: async (days?: number): Promise<ApiResponse<EngagementSummary[]>> => {
    const response = await api.get('/bics/engagement-summary', {
      params: { days: days || 30 }
    });
    return response.data;
  },

  getNextReferenceNumber: async (): Promise<{ success: boolean; next_reference_number: string }> => {
    const response = await api.get('/bics/next-reference-number');
    return response.data;
  },

  getRecords: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    moa_status?: string;
    moa_status_blank?: boolean;
    project_status?: string;
    bcsi_aor?: string;
    epc_batch?: string;
    project_scheme?: string;
    saq_milestone?: string;
    min_aging_days?: number;
    max_aging_days?: number;
    site_name_initial?: string;
  }): Promise<ApiResponse<RecordsResponse>> => {
    const response = await api.get('/bics/records', { params });
    return response.data;
  },

  getRecord: async (id: number): Promise<ApiResponse<BicsRecord>> => {
    const response = await api.get(`/bics/records/${id}`);
    return response.data;
  },

  createRecord: async (data: BicsRecord): Promise<ApiResponse<BicsRecord>> => {
    const response = await api.post('/bics/records', data);
    return response.data;
  },

  updateRecord: async (id: number, data: BicsRecord): Promise<ApiResponse<BicsRecord>> => {
    const response = await api.put(`/bics/records/${id}`, data);
    return response.data;
  },

  deleteRecord: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/bics/records/${id}`);
    return response.data;
  },

  getSignedMoaMonthly: async (): Promise<ApiResponse<{ month_key: string; month_label: string; count: number }[]>> => {
    const response = await api.get('/bics/signed-moa-monthly');
    return response.data;
  },

  getSignedMoaByPersonnel: async (): Promise<ApiResponse<{ personnel: string; total: number; months: Record<string, number> }[]>> => {
    const response = await api.get('/bics/signed-moa-by-personnel');
    return response.data;
  },

  duplicateRecord: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.post(`/bics/records/${id}/duplicate`);
    return response.data;
  },

  deleteAllRecords: async (): Promise<ApiResponse<any>> => {
    const response = await api.delete('/bics/records');
    return response.data;
  },

  importExcel: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/bics/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Pending Records API
export const pendingRecordsAPI = {
  submit: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/pending-records/submit', data);
    return response.data;
  },
  list: async (status = 'PENDING'): Promise<ApiResponse<any>> => {
    const response = await api.get(`/pending-records/list?status=${status}`);
    return response.data;
  },
  approve: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/pending-records/${id}/approve`);
    return response.data;
  },
  reject: async (id: number, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/pending-records/${id}/reject`, { reason });
    return response.data;
  },
  count: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.get('/pending-records/count');
    return response.data;
  },
  deleteRejected: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/pending-records/${id}`);
    return response.data;
  },
  mySubmissions: async (status?: string): Promise<ApiResponse<any>> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/pending-records/my-submissions${params}`);
    return response.data;
  },
  updateSubmission: async (id: number, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/pending-records/${id}/update`, data);
    return response.data;
  },
  deleteMySubmission: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/pending-records/my/${id}`);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// MOA API
export const moaAPI = {
  upload: async (clientName: string, files: {
    moa: File | null;
    freebie_moa: File | null;
  }): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('client_name', clientName);

    // Append files only if they exist
    if (files.moa) formData.append('moa', files.moa);
    if (files.freebie_moa) formData.append('freebie_moa', files.freebie_moa);

    const response = await api.post('/moa/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    year?: number;
  }): Promise<ApiResponse<MoaListResponse>> => {
    const response = await api.get('/moa/list', { params });
    return response.data;
  },

  downloadDocument: async (id: number, docType: string): Promise<void> => {
    const response = await api.get(`/moa/download/${id}/${docType}`, {
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from response headers if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadAll: async (id: number): Promise<void> => {
    const response = await api.get(`/moa/download-all/${id}`, {
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from response headers if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'documents.zip';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  viewDocument: async (id: number, docType: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/moa/download/${id}/${docType}?token=${token}`;
    window.open(url, '_blank');
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/moa/delete/${id}`);
    return response.data;
  },

  update: async (id: number, clientName: string, filesToAdd: {
    moa: File | null;
    freebie_moa: File | null;
  }, filesToDelete: string[]): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('client_name', clientName);
    formData.append('files_to_delete', JSON.stringify(filesToDelete));

    // Append new files
    if (filesToAdd.moa) formData.append('moa', filesToAdd.moa);
    if (filesToAdd.freebie_moa) formData.append('freebie_moa', filesToAdd.freebie_moa);

    const response = await api.put(`/moa/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<UsersListResponse>> => {
    const response = await api.get('/users/list', { params });
    return response.data;
  },

  create: async (userData: {
    username: string;
    password: string;
    email?: string;
    fullname?: string;
    contact_number?: string;
    role?: 'Super Admin' | 'Admin' | 'User - SAQ' | 'User - FCO';
  }): Promise<ApiResponse<User>> => {
    const response = await api.post('/users/create', userData);
    return response.data;
  },

  update: async (id: number, userData: {
    username?: string;
    password?: string;
    email?: string;
    fullname?: string;
    contact_number?: string;
    role?: 'Super Admin' | 'Admin' | 'User - SAQ' | 'User - FCO';
  }): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/update/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/users/delete/${id}`);
    return response.data;
  },

  lock: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/lock/${id}`);
    return response.data;
  },

  unlock: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/unlock/${id}`);
    return response.data;
  },

  activate: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/activate/${id}`);
    return response.data;
  },

  deactivate: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.put(`/users/deactivate/${id}`);
    return response.data;
  },
};

// User Logs API
export const userLogsAPI = {
  getUserLogs: async (
    page?: number,
    limit?: number,
    search?: string,
    filters?: { user_id?: number; action?: string; date_from?: string; date_to?: string }
  ): Promise<ApiResponse<any>> => {
    const params: any = { page, limit, search };
    if (filters?.user_id) params.user_id = filters.user_id;
    if (filters?.action) params.action = filters.action;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;

    const response = await api.get('/user-logs/list', { params });
    return response.data;
  },

  getActions: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/user-logs/actions');
    return response.data;
  },

  exportAllLogs: async (): Promise<Blob> => {
    const response = await api.get('/user-logs/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAllLogs: async (): Promise<ApiResponse<{ deleted_count: number }>> => {
    const response = await api.delete('/user-logs/delete-all');
    return response.data;
  },
};

// EPC Batch API
export const epcBatchAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<EpcBatchListResponse>> => {
    const response = await api.get('/epc-batch/list', { params });
    return response.data;
  },

  create: async (data: {
    batch_name: string;
  }): Promise<ApiResponse<EpcBatch>> => {
    const response = await api.post('/epc-batch/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    batch_name: string;
  }): Promise<ApiResponse<EpcBatch>> => {
    const response = await api.put(`/epc-batch/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/epc-batch/delete/${id}`);
    return response.data;
  },
};

// Vendor API
export const vendorAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<VendorListResponse>> => {
    const response = await api.get('/vendor/list', { params });
    return response.data;
  },

  create: async (data: {
    vendor_name: string;
  }): Promise<ApiResponse<Vendor>> => {
    const response = await api.post('/vendor/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    vendor_name: string;
  }): Promise<ApiResponse<Vendor>> => {
    const response = await api.put(`/vendor/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/vendor/delete/${id}`);
    return response.data;
  },
};

// SAQ Personnel API
export const saqPersonnelAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<SaqPersonnelListResponse>> => {
    const response = await api.get('/saq-personnel/list', { params });
    return response.data;
  },

  create: async (data: {
    personnel_name: string;
  }): Promise<ApiResponse<SaqPersonnel>> => {
    const response = await api.post('/saq-personnel/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    personnel_name: string;
  }): Promise<ApiResponse<SaqPersonnel>> => {
    const response = await api.put(`/saq-personnel/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/saq-personnel/delete/${id}`);
    return response.data;
  },
};

// FCO Personnel API
export const fcoPersonnelAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<FcoPersonnelListResponse>> => {
    const response = await api.get('/fco-personnel/list', { params });
    return response.data;
  },

  create: async (data: {
    personnel_name: string;
  }): Promise<ApiResponse<FcoPersonnel>> => {
    const response = await api.post('/fco-personnel/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    personnel_name: string;
  }): Promise<ApiResponse<FcoPersonnel>> => {
    const response = await api.put(`/fco-personnel/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/fco-personnel/delete/${id}`);
    return response.data;
  },
};

// Top Developer API
export const topDeveloperAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<TopDeveloperListResponse>> => {
    const response = await api.get('/top-developer/list', { params });
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<TopDeveloper[]>> => {
    const response = await api.get('/top-developer/all');
    return response.data;
  },

  create: async (data: {
    top_developer_name: string;
  }): Promise<ApiResponse<TopDeveloper>> => {
    const response = await api.post('/top-developer/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    top_developer_name: string;
  }): Promise<ApiResponse<TopDeveloper>> => {
    const response = await api.put(`/top-developer/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/top-developer/delete/${id}`);
    return response.data;
  },
};

// Relationship Manager API
export const relationshipManagerAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<RelationshipManagerListResponse>> => {
    const response = await api.get('/relationship-manager/list', { params });
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<RelationshipManager[]>> => {
    const response = await api.get('/relationship-manager/all');
    return response.data;
  },

  create: async (data: {
    relationship_manager: string;
    relationship_manager_group: string;
  }): Promise<ApiResponse<RelationshipManager>> => {
    const response = await api.post('/relationship-manager/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    relationship_manager: string;
    relationship_manager_group: string;
  }): Promise<ApiResponse<RelationshipManager>> => {
    const response = await api.put(`/relationship-manager/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/relationship-manager/delete/${id}`);
    return response.data;
  },

  importExcel: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/relationship-manager/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Validated By API
export const validatedByAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<ValidatedByListResponse>> => {
    const response = await api.get('/validated-by/list', { params });
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<ValidatedBy[]>> => {
    const response = await api.get('/validated-by/all');
    return response.data;
  },

  create: async (data: {
    validated_by_name: string;
  }): Promise<ApiResponse<ValidatedBy>> => {
    const response = await api.post('/validated-by/create', data);
    return response.data;
  },

  update: async (id: number, data: {
    validated_by_name: string;
  }): Promise<ApiResponse<ValidatedBy>> => {
    const response = await api.put(`/validated-by/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/validated-by/delete/${id}`);
    return response.data;
  },
};

export const cobInventoryAPI = {
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<CobInventoryListResponse>> => {
    const response = await api.get('/cob-inventory/list', { params });
    return response.data;
  },

  getBatches: async (): Promise<ApiResponse<EpcBatchOption[]>> => {
    const response = await api.get('/cob-inventory/batches');
    return response.data;
  },

  getSaqPersonnel: async (): Promise<ApiResponse<SaqPersonnelOption[]>> => {
    const response = await api.get('/cob-inventory/saq-personnel');
    return response.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<CobInventory>> => {
    const response = await api.post('/cob-inventory/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, formData: FormData): Promise<ApiResponse<CobInventory>> => {
    const response = await api.put(`/cob-inventory/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/cob-inventory/delete/${id}`);
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/cob-inventory/download/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Role Permissions API
export const rolePermissionsAPI = {
  getPermissions: async (): Promise<ApiResponse<Record<string, Record<string, boolean>>>> => {
    const response = await api.get('/role-permissions/list');
    return response.data;
  },

  updatePermissions: async (permissions: Record<string, Record<string, boolean>>): Promise<ApiResponse<any>> => {
    const response = await api.put('/role-permissions/update', { permissions });
    return response.data;
  },
};

export default api;