import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
        // User is already logged in, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicRoute;
