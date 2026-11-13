import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './Common/MainLayout';
import ProtectedRoute from './Common/ProtectedRoute';
import PublicRoute from './Common/PublicRoute';
import FullPageLoader from './Common/FullPageLoader';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './utils/NotificationContext';

// Route Code-Splitting: Lazy load view components on demand
const Login = lazy(() => import('./Login/Login'));
const ForgotPassword = lazy(() => import('./Login/ForgotPassword'));
const Dashboard = lazy(() => import('./Admin/Dashboard/Dashboard'));
const UserTabs = lazy(() => import('./Admin/User/UserTabs'));
const Organization = lazy(() => import('./Admin/Organization/Organization'));
const Attendance = lazy(() => import('./Admin/Attendance/Attendance'));
const RegularisationPage = lazy(() => import('./Admin/Attendance/RegularisationPage'));
const ShiftRoster = lazy(() => import('./Admin/Attendance/ShiftRoster'));
const BiometricManual = lazy(() => import('./Admin/Attendance/BiometricManual'));
const Leaves = lazy(() => import('./Admin/ManageLeaves/Leaves'));
const Payroll = lazy(() => import('./Admin/Payroll/Payroll'));
const AssetManagement = lazy(() => import('./Admin/AssetManagement/AssetManagement'));
const ReimbursementClaims = lazy(() => import('./Admin/ReimbursementClaims/ReimbursementClaims'));
const MyProfile = lazy(() => import('./Employee/MyProfile'));
const MyAssets = lazy(() => import('./Employee/MyAssets'));
const OpenJobs = lazy(() => import('./Employee/OpenJobs'));
const JobRecruitment = lazy(() => import('./Admin/JobRecruitment/JobRecruitment'));
const CreateJob = lazy(() => import('./Admin/JobRecruitment/CreateJob'));
const Policies = lazy(() => import('./Admin/Policies/Policies'));
const Reports = lazy(() => import('./Admin/Reports/Reports'));
const Settings = lazy(() => import('./Common/Settings/Settings'));

const ADMIN_ROLES = ['admin', 'superadmin', 'hr executive'];
const MANAGEMENT_ROLES = ['admin', 'superadmin'];

const SuspenseLoader = () => <FullPageLoader isLoading={true} message="Loading module..." />;

createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <Router>
      <Toaster />
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard/:tabId?" element={<Dashboard />} />
            <Route path="users/:tabId?/:subId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><UserTabs /></ProtectedRoute>} />
            <Route path="organization/:tabId?/:subId?" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><Organization /></ProtectedRoute>} />
            <Route path="attendance/:tabId?/:subId?" element={<Attendance />} />
            <Route path="regularisations/:tabId?" element={<RegularisationPage />} />
            <Route path="shift-roster" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ShiftRoster /></ProtectedRoute>} />
            <Route path="biometric-manual/:tabId?" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><BiometricManual /></ProtectedRoute>} />
            <Route path="leaves/:tabId?/:subId?" element={<Leaves />} />
            <Route path="payroll/:tabId?" element={<Payroll />} />
            <Route path="asset-management/:tabId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AssetManagement /></ProtectedRoute>} />
            <Route path="reimbursements" element={<ReimbursementClaims />} />
            <Route path="profile/:userId?" element={<MyProfile />} />
            <Route path="my-assets" element={<MyAssets />} />
            <Route path="career" element={<OpenJobs />} />
            <Route path="job-recruitment/:tabId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><JobRecruitment /></ProtectedRoute>} />
            <Route path="job-recruitment/create/:id?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateJob /></ProtectedRoute>} />
            <Route path="policies" element={<Policies />} />
            <Route path="reports/:tabId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<Settings />} />
            <Route path="employees" element={<div className="p-10 text-2xl font-bold">Employee Management coming soon...</div>} />
          </Route>
          {/* Fallback for any other route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  </NotificationProvider>
);
