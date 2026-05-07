import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const { token } = JSON.parse(userInfo);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Dispatch a custom event for session expiry
            window.dispatchEvent(new CustomEvent('session-expired'));
            
            // Optional: Clear userInfo from localStorage immediately
            // localStorage.removeItem('userInfo');
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const loginApi = (data) => api.post('/auth/login', data);
export const forgotPasswordApi = (data) => api.post('/auth/forgot-password', data);
export const verifyOtpApi = (data) => api.post('/auth/verify-otp', data);
export const resetPasswordApi = (data) => api.post('/auth/reset-password', data);

// User APIs
export const getUsersApi = (params) => api.get('/users', { params });
export const getUserAttendanceApi = (params) => api.get('/users/user-attendance', { params });
export const createUserApi = (data) => {
    if (data instanceof FormData) {
        return api.post('/users', data, {
            headers: { 'Content-Type': undefined }
        });
    }
    return api.post('/users', data);
};



export const getMilestonesApi = () => api.get('/users/milestones');
export const getProfileApi = () => api.get('/users/me');
export const getUserByIdApi = (id) => api.get(`/users/${id}`);
export const updateUserApi = (id, data) => {
    if (data instanceof FormData) {
        return api.put(`/users/${id}`, data, {
            headers: { 'Content-Type': undefined }
        });
    }
    return api.put(`/users/${id}`, data);
};
export const deleteUserApi = (id) => api.delete(`/users/${id}`);
export const bulkUploadUsersApi = (data) => api.post('/users/bulk-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadUserBulkTemplateApi = (id) => api.get(`/users/bulk-template?salary_structure_id=${id}`, { responseType: 'blob' });
export const downloadUserReferenceIdsApi = () => api.get('/users/reference-ids', { responseType: 'blob' });

// Organization APIs
export const createCompanyApi = (data) => {
    if (data instanceof FormData) {
        return api.post('/organization/companies', data, {
            headers: { 'Content-Type': undefined }
        });
    }
    return api.post('/organization/companies', data);
};

export const updateCompanyApi = (id, data) => {
    if (data instanceof FormData) {
        return api.put(`/organization/companies/${id}`, data, {
            headers: { 'Content-Type': undefined }
        });
    }
    return api.put(`/organization/companies/${id}`, data);
};
export const getCompaniesApi = () => api.get('/organization/companies');
export const getCompanyByIdApi = (id) => api.get(`/organization/companies/${id}`);
export const deleteCompanyApi = (id) => api.delete(`/organization/companies/${id}`);
export const setupCompanyDatabaseApi = (data) => api.post('/organization/companies/setup-database', data);

export const createBranchApi = (data) => api.post('/organization/branches', data);
export const getBranchesApi = () => api.get('/organization/branches');

export const createDesignationApi = (data) => api.post('/organization/designations', data);
export const getDesignationsApi = () => api.get('/organization/designations');

export const createShiftApi = (data) => api.post('/organization/shifts', data);
export const getShiftsApi = () => api.get('/organization/shifts');

export const createDepartmentApi = (data) => api.post('/organization/departments', data);
export const getDepartmentsApi = () => api.get('/organization/departments');
export const getEmploymentTypesApi = () => api.get('/organization/employment-types');
export const getWorkLocationsApi = () => api.get('/organization/work-locations');
export const getOrgMetadataApi = () => api.get('/organization/metadata');

// Attendance APIs
export const saveAttendanceApi = (data) => api.post('/attendance', data);
export const getAttendanceApi = (params) => api.get('/attendance', { params });
export const generateAttendanceReportApi = (params) => api.get('/attendance/generate-report', { params, responseType: 'blob' });
export const getTodayStatusApi = (userId) => api.get(`/attendance/today-status/${userId}`);
export const webClockInApi = (data) => api.post('/attendance/web-clock-in', data);
export const webClockOutApi = (data) => api.post('/attendance/web-clock-out', data);
export const startBreakApi = (data) => api.post('/attendance/start-break', data);
export const endBreakApi = (data) => api.post('/attendance/end-break', data);
export const getBiometricLogsApi = (params) => api.get('/attendance/biometric-logs', { params });
export const syncBiometricApi = (data) => api.post('/attendance/sync', data);
export const updateAttendanceApi = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendanceApi = (id) => api.delete(`/attendance/${id}`);

// Attendance Policy Rules APIs
export const getAttendancePolicyRulesApi = () => api.get('/attendance/policy-rules');
export const createAttendancePolicyRuleApi = (data) => api.post('/attendance/policy-rules', data);
export const updateAttendancePolicyRuleApi = (id, data) => api.put(`/attendance/policy-rules/${id}`, data);
export const deleteAttendancePolicyRuleApi = (id) => api.delete(`/attendance/policy-rules/${id}`);

// Company Policy APIs
export const getCompanyPolicyApi = (companyId) => api.get(`/attendance/company-policy/${companyId}`);
export const saveCompanyPolicyApi = (data) => api.post('/attendance/company-policy', data);

// Regularisation APIs
export const getRegularisationCountsApi = () => api.get('/regularisations/counts');
export const getRegularisationsApi = (params) => api.get('/regularisations', { params });
export const createRegularisationApi = (data) => api.post('/regularisations', data);
export const updateRegularisationStatusApi = (id, data) => api.put(`/regularisations/${id}/status`, data);

// Shift Roster APIs
export const getShiftRosterApi = (params) => api.get('/shift-roster', { params });
export const assignShiftApi = (data) => api.post('/shift-roster/assign', data);
export const bulkAssignShiftsApi = (data) => api.post('/shift-roster/bulk-assign', data);
export const deleteShiftAssignmentApi = (id) => api.delete(`/shift-roster/${id}`);

// Holiday APIs
export const getHolidaysApi = (params) => api.get('/holidays', { params });
export const createHolidayApi = (data) => api.post('/holidays', data);
export const updateHolidayApi = (id, data) => api.put(`/holidays/${id}`, data);
export const deleteHolidayApi = (id, params) => api.delete(`/holidays/${id}`, { params });

// Leave APIs
export const getLeavesApi = (params) => api.get('/leaves', { params });
export const generateLeaveReportApi = (params) => api.get('/leaves/generate-report', { params, responseType: 'blob' });
export const createLeaveApi = (data) => api.post('/leaves', data);
export const updateLeaveApi = (id, data) => api.put(`/leaves/${id}`, data);
export const deleteLeaveApi = (id) => api.delete(`/leaves/${id}`);

// WeekOff APIs
export const getWeekOffsApi = () => api.get('/weekoff');
export const createWeekOffApi = (data) => api.post('/weekoff', data);
export const updateWeekOffApi = (id, data) => api.put(`/weekoff/${id}`, data);
export const deleteWeekOffApi = (id) => api.delete(`/weekoff/${id}`);

// CompanyWeekOff APIs
export const getCompanyWeekOffsApi = (params) => api.get('/company-weekoff', { params });
export const saveCompanyWeekOffsApi = (data) => api.post('/company-weekoff', data);

// Batch Allocation APIs
export const getBatchAllocationsApi = (params) => api.get('/batch-allocation', { params });
export const createBatchAllocationApi = (data) => api.post('/batch-allocation', data);
export const updateBatchAllocationApi = (id, data) => api.put(`/batch-allocation/${id}`, data);
export const deleteBatchAllocationApi = (id) => api.delete(`/batch-allocation/${id}`);

// Batch Allocation Assignment APIs
export const getAllAssignedUsersIdsApi = (params) => api.get('/batch-allocation/all-assigned-users', { params });
export const getAssignedUsersApi = (batchId) => api.get(`/batch-allocation/${batchId}/users`);
export const assignUsersApi = (batchId, userIds) => api.post(`/batch-allocation/${batchId}/users`, { user_ids: userIds });
export const removeAssignedUserApi = (batchId, userId) => api.delete(`/batch-allocation/${batchId}/users/${userId}`);

// Salary Component APIs
export const getSalaryComponentsApi = (params) => api.get('/salary-components', { params });
export const createSalaryComponentApi = (data) => api.post('/salary-components', data);
export const updateSalaryComponentApi = (id, data) => api.put(`/salary-components/${id}`, data);
export const deleteSalaryComponentApi = (id) => api.delete(`/salary-components/${id}`);
export const bulkUpdateSalaryComponentOrderApi = (data) => api.post('/salary-components/bulk-order', data);

// Salary Structure (Batch) Component Assignment APIs
export const getStructureComponentsApi = (batchId) => api.get(`/batch-allocation/${batchId}/components`);
export const assignStructureComponentsApi = (batchId, componentIds) => api.post(`/batch-allocation/${batchId}/components`, { component_ids: componentIds });

// Payroll Run APIs
export const getPayrollRunsApi = (params) => api.get('/payroll-run', { params });
export const getPayrollAnalyticsApi = (params) => api.get('/payroll-run/analytics', { params });
export const generatePayrollReportApi = (params) => api.get('/payroll-run/generate-report', { params, responseType: 'blob' });
export const createPayrollRunApi = (data) => api.post('/payroll-run', data);
export const updatePayrollRunStatusApi = (id, data) => api.put(`/payroll-run/${id}/status`, data);
export const updatePayrollRunApi = (id, data) => api.put(`/payroll-run/${id}`, data);
export const getPayrollEmployeesApi = (id) => api.get(`/payroll-run/${id}/employees`);
export const finalizePayrollRunApi = (id) => api.post(`/payroll-run/${id}/finalize`);
export const togglePayrollHoldApi = (data) => api.post('/payroll-run/toggle-hold', data);
export const getPayrollHoldListApi = (params) => api.get('/payroll-run/holds', { params });
export const getMyPayslipsApi = () => api.get('/payroll-run/my-payslips');
export const deletePayrollRunApi = (id) => api.delete(`/payroll-run/${id}`);

// Incentive (Addons) APIs
export const getPayrollIncentivesApi = (params) => api.get('/incentives', { params });
export const createPayrollIncentiveApi = (data) => api.post('/incentives', data);
export const deletePayrollIncentiveApi = (id) => api.delete(`/incentives/${id}`);

// Asset Management APIs
export const getAssetCategoriesApi = () => api.get('/assets/categories');
export const addAssetCategoryApi = (data) => api.post('/assets/categories', data);
export const deleteAssetCategoryApi = (id) => api.delete(`/assets/categories/${id}`);

export const getAssetsApi = (params) => api.get('/assets', { params });
export const getAssetAnalyticsApi = (params) => api.get('/assets/analytics', { params });
export const generateAssetReportApi = (params) => api.get('/assets/generate-report', { params, responseType: 'blob' });
export const getMyAssetsApi = () => api.get('/assets/my-assets');
export const createAssetApi = (data) => {
    if (data instanceof FormData) {
        return api.post('/assets', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.post('/assets', data);
};
export const updateAssetApi = (id, data) => {
    if (data instanceof FormData) {
        return api.put(`/assets/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.put(`/assets/${id}`, data);
};
export const deleteAssetApi = (id) => api.delete(`/assets/${id}`);

export const createAssetRequestApi = (data) => api.post('/assets/requests', data);
export const getAssetRequestsApi = (params) => api.get('/assets/requests', { params });
export const getMyAssetRequestsApi = () => api.get('/assets/requests/my');
export const updateAssetRequestStatusApi = (id, data) => api.put(`/assets/requests/${id}/approve`, data);

// Reimbursement APIs
export const getReimbursementsApi = (params) => api.get('/reimbursements', { params });
export const getReimbursementCategoriesApi = () => api.get('/reimbursements/categories');
export const createReimbursementApi = (data) => {
    return api.post('/reimbursements', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const updateReimbursementStatusApi = (id, data) => api.put(`/reimbursements/${id}/status`, data);
export const deleteReimbursementApi = (id) => api.delete(`/reimbursements/${id}`);

// Device APIs
export const getDevicesApi = () => api.get('/devices');
export const createDeviceApi = (data) => api.post('/devices', data);
export const updateDeviceApi = (id, data) => api.put(`/devices/${id}`, data);
export const deleteDeviceApi = (id) => api.delete(`/devices/${id}`);

// Recruitment APIs
export const getJobsApi = () => api.get('/jobs');
export const getOpenPositionsApi = () => api.get('/jobs/open-positions');
export const getJobByIdApi = (id) => api.get(`/jobs/${id}`);
export const createJobApi = (data) => api.post('/jobs', data);
export const updateJobApi = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJobApi = (id) => api.delete(`/jobs/${id}`);
export const getApplicantsApi = () => api.get('/applicants');
export const getApplicantsByJobApi = (jobId) => api.get(`/applicants/job/${jobId}`);
export const createApplicantApi = (data) => {
    if (data instanceof FormData) {
        return api.post('/applicants', data, {
            headers: { 'Content-Type': undefined }
        });
    }
    return api.post('/applicants', data);
};
export const updateApplicantStatusApi = (id, data) => api.put(`/applicants/${id}/status`, data);
export const scheduleInterviewApi = (id, data) => api.post(`/applicants/${id}/schedule-interview`, data);
export const sendOfferLetterApi = (id, data) => api.post(`/applicants/${id}/send-offer`, data);
export const requestDocumentsApi = (id, data) => api.post(`/applicants/${id}/request-documents`, data);
export const deleteApplicantApi = (id) => api.delete(`/applicants/${id}`);

// Advance Salary APIs
export const getAdvanceSalariesApi = (params) => api.get('/advance-salary', { params });
export const getMyAdvanceSalariesApi = (params) => api.get('/advance-salary/my-requests', { params });
export const createAdvanceSalaryApi = (data) => api.post('/advance-salary', data);
export const updateAdvanceSalaryStatusApi = (id, data) => api.put(`/advance-salary/${id}/status`, data);
export const deleteAdvanceSalaryApi = (id) => api.delete(`/advance-salary/${id}`);

// Policy APIs
export const getPoliciesApi = () => api.get('/policies');
export const createPolicyApi = (data) => {
    return api.post('/policies', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const updatePolicyApi = (id, data) => {
    return api.put(`/policies/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deletePolicyApi = (id) => api.delete(`/policies/${id}`);

// Statutory Compliance APIs
export const getStatutoryPFDataApi = (params) => api.get('/statutory-compliance/pf', { params });
export const createPFDataApi = (data) => api.post('/statutory-compliance/pf', data);
export const deletePFDataApi = (id) => api.delete(`/statutory-compliance/pf/${id}`);

export const getStatutoryESIDataApi = (params) => api.get('/statutory-compliance/esi', { params });
export const createESIDataApi = (data) => api.post('/statutory-compliance/esi', data);
export const deleteESIDataApi = (id) => api.delete(`/statutory-compliance/esi/${id}`);

export const getStatutoryPTDataApi = (params) => api.get('/statutory-compliance/pt', { params });
export const createPTDataApi = (data) => api.post('/statutory-compliance/pt', data);
export const deletePTDataApi = (id) => api.delete(`/statutory-compliance/pt/${id}`);

export const getStatutoryTDSDataApi = (params) => api.get('/statutory-compliance/tds', { params });
export const createTDSDataApi = (data) => api.post('/statutory-compliance/tds', data);
export const deleteTDSDataApi = (id) => api.delete(`/statutory-compliance/tds/${id}`);

// Salary Formula APIs
export const getSalaryFormulasApi = (params) => api.get('/salary-formulas', { params });
export const createSalaryFormulaApi = (data) => api.post('/salary-formulas', data);
export const updateSalaryFormulaApi = (id, data) => api.put(`/salary-formulas/${id}`, data);
export const deleteSalaryFormulaApi = (id) => api.delete(`/salary-formulas/${id}`);
export const validateSalaryFormulaApi = (data) => api.post('/salary-formulas/validate', data);

export const getStatutorySummaryApi = (params) => api.get('/statutory-compliance/summary', { params });

// Compliance Configuration Settings APIs
export const getPFSettingsApi = (params) => api.get('/statutory-compliance/settings/pf', { params });
export const updatePFSettingsApi = (data) => api.post('/statutory-compliance/settings/pf', data);

export const getESISettingsApi = (params) => api.get('/statutory-compliance/settings/esi', { params });
export const updateESISettingsApi = (data) => api.post('/statutory-compliance/settings/esi', data);

export const getPTSettingsApi = (params) => api.get('/statutory-compliance/settings/pt', { params });
export const updatePTSettingsApi = (data) => api.post('/statutory-compliance/settings/pt', data);
export const getPTStatesApi = (params) => api.get('/statutory-compliance/settings/pt/states', { params });
export const updatePTStateApi = (id, data) => api.put(`/statutory-compliance/settings/pt/states/${id}`, data);

export const getLWFSettingsApi = (params) => api.get('/statutory-compliance/settings/lwf', { params });
export const updateLWFSettingsApi = (data) => api.post('/statutory-compliance/settings/lwf', data);
export const getLWFStatesApi = (params) => api.get('/statutory-compliance/settings/lwf/states', { params });
export const updateLWFStateApi = (id, data) => api.put(`/statutory-compliance/settings/lwf/states/${id}`, data);

export const getTDSSettingsApi = (params) => api.get('/statutory-compliance/settings/tds', { params });
export const updateTDSSettingsApi = (data) => api.post('/statutory-compliance/settings/tds', data);


export const getRolePermissionsApi = (role) => api.get(`/role-permissions/${role}`);
export const getAllRolePermissionsApi = () => api.get('/role-permissions');
export const updateRolePermissionsApi = (data) => api.post('/role-permissions', data);
export const deleteRoleApi = (role) => api.delete(`/role-permissions/${role}`);

// Notification APIs
export const getMyNotificationsApi = () => api.get('/notifications/my');
export const markNotificationReadApi = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => api.patch('/notifications/read-all');

export default api;




