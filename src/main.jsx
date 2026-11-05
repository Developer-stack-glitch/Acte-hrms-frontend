import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import ForgotPassword from './Login/ForgotPassword';
import MainLayout from './Common/MainLayout';
import './index.css'
import { Toaster } from 'react-hot-toast';
import UserTabs from './Admin/User/UserTabs';
import ProtectedRoute from './Common/ProtectedRoute';
import PublicRoute from './Common/PublicRoute';
import Organization from './Admin/Organization/Organization';
import Attendance from './Admin/Attendance/Attendance';
import BiometricManual from './Admin/Attendance/BiometricManual';
import Dashboard from './Admin/Dashboard/Dashboard';
import Leaves from './Admin/ManageLeaves/Leaves';
import Payroll from './Admin/Payroll/Payroll';
import AssetManagement from './Admin/AssetManagement/AssetManagement';
import ReimbursementClaims from './Admin/ReimbursementClaims/ReimbursementClaims';
import MyProfile from './Employee/MyProfile';
import JobRecruitment from './Admin/JobRecruitment/JobRecruitment';
import CreateJob from './Admin/JobRecruitment/CreateJob';
import MyAssets from './Employee/MyAssets';
import OpenJobs from './Employee/OpenJobs';
import Policies from './Admin/Policies/Policies';
import Reports from './Admin/Reports/Reports';
import RegularisationPage from './Admin/Attendance/RegularisationPage';
import ShiftRoster from './Admin/Attendance/ShiftRoster';
import Settings from './Common/Settings/Settings';

import { NotificationProvider } from './utils/NotificationContext';

const ADMIN_ROLES = ['admin', 'superadmin', 'hr executive'];
const MANAGEMENT_ROLES = ['admin', 'superadmin'];

createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <Router>
      <Toaster />
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
          <Route path="shift-roster" element={<ShiftRoster />} />
          <Route path="biometric-manual/:tabId?" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><BiometricManual /></ProtectedRoute>} />
          <Route path="leaves/:tabId?/:subId?" element={<Leaves />} />
          <Route path="payroll/:tabId?" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><Payroll /></ProtectedRoute>} />
          <Route path="asset-management/:tabId?" element={<AssetManagement />} />
          <Route path="reimbursements" element={<ReimbursementClaims />} />
          <Route path="profile/:userId?" element={<MyProfile />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="career" element={<OpenJobs />} />
          <Route path="job-recruitment/:tabId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><JobRecruitment /></ProtectedRoute>} />
          <Route path="job-recruitment/create/:id?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateJob /></ProtectedRoute>} />
          <Route path="policies" element={<Policies />} />
          <Route path="reports/:tabId?" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES}><Settings /></ProtectedRoute>} />
          <Route path="employees" element={<div className="p-10 text-2xl font-bold">Employee Management coming soon...</div>} />
        </Route>
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </NotificationProvider>
)