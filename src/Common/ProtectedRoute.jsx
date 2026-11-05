import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const rawUserInfo = (localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo'));

    if (!rawUserInfo) {
        // User is not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        try {
            const user = JSON.parse(rawUserInfo);
            const userRole = (user?.role || '').toLowerCase();
            const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
            
            if (!normalizedAllowed.includes(userRole)) {
                // User's role is not authorized for this route, redirect to dashboard
                return <Navigate to="/dashboard" replace />;
            }
        } catch (e) {
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
