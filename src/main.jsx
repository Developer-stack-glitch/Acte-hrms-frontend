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

import { NotificationProvider } from './utils/NotificationContext';

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
          <Route path="users/:tabId?/:subId?" element={<UserTabs />} />
          <Route path="organization/:tabId?/:subId?" element={<Organization />} />
          <Route path="attendance/:tabId?/:subId?" element={<Attendance />} />
          <Route path="biometric-manual/:tabId?" element={<BiometricManual />} />
          <Route path="leaves/:tabId?/:subId?" element={<Leaves />} />
          <Route path="payroll/:tabId?" element={<Payroll />} />
          <Route path="asset-management/:tabId?" element={<AssetManagement />} />
          <Route path="reimbursements" element={<ReimbursementClaims />} />
          <Route path="profile/:userId?" element={<MyProfile />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="career" element={<OpenJobs />} />
          <Route path="job-recruitment/:tabId?" element={<JobRecruitment />} />
          <Route path="job-recruitment/create/:id?" element={<CreateJob />} />
          <Route path="policies" element={<Policies />} />
          <Route path="reports/:tabId?" element={<Reports />} />
          <Route path="employees" element={<div className="p-10 text-2xl font-bold">Employee Management coming soon...</div>} />
        </Route>
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </NotificationProvider>
)