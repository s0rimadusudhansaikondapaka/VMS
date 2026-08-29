import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://smsavmsserver.onrender.com/api'
    : '/api');

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const createRegistration = async (data) => {
  const res = await api.post('/registrations', data);
  return res.data;
};

export const updateRegistration = async (id, data) => {
  const res = await api.put(`/registrations/${id}`, data);
  return res.data;
};

export const updateApproval = async (registration_id, action, remarks, extraDetails = {}) => {
  const res = await api.post('/registrations/approve', { registration_id, action, remarks, ...extraDetails });
  return res.data;
};

export const generateInviteToken = async () => {
  const res = await api.post('/registrations/generate-invite-token');
  return res.data;
};

export const getPublicPassDetails = async (pass_code) => {
  const res = await api.get(`/registrations/public-pass/${pass_code}`);
  return res.data;
};

export const getGateCategoryRules = async () => {
  const res = await api.get('/admin/gate-rules');
  return res.data;
};

export const getRecentGateLookups = async () => {
  const res = await api.get('/gate/recent-lookups');
  return res.data;
};

export const getGatewiseStatsAndSelfRegistered = async (gateName) => {
  const res = await api.get(`/gate/gatewise-stats?gateName=${gateName || 'NORTH_GATE'}`);
  return res.data;
};

export const toggleGateCategoryRule = async (gate_name, visitor_category, is_allowed) => {
  const res = await api.post('/admin/gate-rules/toggle', { gate_name, visitor_category, is_allowed });
  return res.data;
};

export const getGateDirectionConfig = async () => {
  const res = await api.get('/admin/gate-direction-config');
  return res.data;
};

export const updateGateDirectionConfig = async (gate_name, direction_mode) => {
  const res = await api.post('/admin/gate-direction-config/update', { gate_name, direction_mode });
  return res.data;
};

export const getL2MatrixRules = async () => {
  const res = await api.get('/admin/l2-matrix-rules');
  return res.data;
};

export const updateL2MatrixRule = async (host_category, visit_type_category, approver_type) => {
  const res = await api.post('/admin/l2-matrix-rules/update', { host_category, visit_type_category, approver_type });
  return res.data;
};

export const getHostRegistrations = async () => {
  const res = await api.get('/registrations/host');
  return res.data;
};

export const verifyGatePass = async (query, gateName = 'NORTH_GATE') => {
  const res = await api.get(`/gate/verify?query=${encodeURIComponent(query)}&gateName=${encodeURIComponent(gateName)}`);
  return res.data;
};

export const processGateMovement = async (data) => {
  const res = await api.post('/gate/movement', data);
  return res.data;
};

export const getVisitorsInsideCampus = async () => {
  const res = await api.get('/gate/inside');
  return res.data;
};

export const getOverstayAlerts = async () => {
  const res = await api.get('/supervisor/overstays');
  return res.data;
};

export const supervisorOverride = async (registration_id, action, remarks) => {
  const res = await api.post('/supervisor/override', { registration_id, action, remarks });
  return res.data;
};

export const toggleL2Approval = async (enabled, key) => {
  const res = await api.post('/supervisor/l2-toggle', { enabled, key });
  return res.data;
};

export const adminBypassApprove = async (registration_id, remarks) => {
  const res = await api.post('/admin/bypass-approve', { registration_id, remarks });
  return res.data;
};

export const adminEmergencyPass = async (data) => {
  const res = await api.post('/admin/emergency-pass', data);
  return res.data;
};

export const getDashboardMetrics = async () => {
  const res = await api.get('/reports/metrics');
  return res.data;
};

export const getReportData = async (report_type) => {
  const res = await api.get(`/reports/data?report_type=${report_type}`);
  return res.data;
};

export const getSystemSettings = async () => {
  const res = await api.get('/system/settings');
  return res.data;
};

export const sendOtp = async (phone) => {
  const res = await api.post('/auth/send-otp', { phone });
  return res.data;
};

export const verifyOtp = async (phone, otp) => {
  const res = await api.post('/auth/verify-otp', { phone, otp });
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const getVisitHistory = async () => {
  const res = await api.get('/registrations/history');
  return res.data;
};

export const triggerExpireCheck = async () => {
  const res = await api.post('/registrations/expire-check');
  return res.data;
};

export const getDepartments = async () => {
  const res = await api.get('/departments');
  return res.data;
};

export const getAdminUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const updateAdminUser = async (id, data) => {
  const res = await api.put(`/admin/users/${id}`, data);
  return res.data;
};

export const createSingleUser = async (userData) => {
  const res = await api.post('/admin/users', userData);
  return res.data;
};

export const bulkUploadUsers = async (users) => {
  const res = await api.post('/admin/users/bulk-upload', { users });
  return res.data;
};

export const bulkUploadVisitors = async (visitors) => {
  const res = await api.post('/admin/visitors/bulk-upload', { visitors });
  return res.data;
};

export const generateQrCode = async (registration_id) => {
  const res = await api.post('/registrations/generate-qr', { registration_id });
  return res.data;
};

export const getPublicHostInfo = async (host_id) => {
  const res = await api.get(`/registrations/public-host/${host_id}`);
  return res.data;
};

export const createPublicVisitorRegistration = async (data) => {
  const res = await api.post('/registrations/public-visitor', data);
  return res.data;
};

export const getSpotRegistrationsQueue = async () => {
  const res = await api.get('/gate/spot-queue');
  return res.data;
};

export const assignSpotHost = async (registration_id, host_id, remarks) => {
  const res = await api.post('/gate/assign-host', { registration_id, host_id, remarks });
  return res.data;
};

export const getAllPendingL2Approvals = async () => {
  const res = await api.get('/admin/l2-pending-approvals');
  return res.data;
};

export const processL2ApprovalByAdmin = async (registration_id, action, remarks) => {
  const res = await api.post('/admin/process-l2-approval', { registration_id, action, remarks });
  return res.data;
};

export const getResidentFamilyMembers = async () => {
  const res = await api.get('/visitors/family-members');
  return res.data;
};

export default api;
