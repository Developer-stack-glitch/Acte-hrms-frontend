import React, { useState } from 'react';
import {
    Building2,
    GitBranch,
    Briefcase,
    Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyManagement from './CompanyManagement';
import AddBranch from './AddBranch';
import AddDepartment from './AddDepartment';
import AddDesignation from './AddDesignation';
import AddShift from './AddShift';
import AddRoles from './AddRoles';
import CompanyDatabase from './CompanyDatabase';
import { Database, Layout } from 'lucide-react';

const allTabs = [
    { id: 'company', label: 'Manage Company', icon: Building2, component: CompanyManagement, permissionId: 'organization_company' },
    { id: 'db-config', label: 'Company Databases', icon: Database, component: CompanyDatabase, permissionId: 'organization_databases' },
    { id: 'branch', label: 'Manage Branches', icon: GitBranch, component: AddBranch, permissionId: 'organization_branches' },
    { id: 'department', label: 'Manage Departments', icon: Layout, component: AddDepartment, permissionId: 'organization_departments' },
    { id: 'designation', label: 'Manage Designations', icon: Briefcase, component: AddDesignation, permissionId: 'organization_designations' },
    { id: 'shift', label: 'Manage Shifts', icon: Clock, component: AddShift, permissionId: 'organization_shifts' },
    { id: 'roles', label: 'Manage Roles', icon: Layout, component: AddRoles, permissionId: 'organization_roles' },
];

import { useNavigate, useParams } from 'react-router-dom';

export default function Organization() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isMainDb = userInfo.database === 'hrm_database';
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const tabs = React.useMemo(() => {
        return allTabs.filter(tab => {
            // Manage Company and Database tabs are ONLY for superadmin AND on the main database
            if (tab.id === 'company' || tab.id === 'db-config') {
                return userRole === 'superadmin' && isMainDb;
            }

            // Other tabs follow role-based permissions or superadmin access
            if (userRole === 'superadmin') return true;
            return userPermissions.includes(tab.permissionId);
        });
    }, [isMainDb, userRole, userPermissions]);

    const activeTab = tabId || tabs[0]?.id || 'branch';

    const setActiveTab = (id) => {
        navigate(`/organization/${id}`);
    };

    React.useEffect(() => {
        if (userRole === 'employee') {
            navigate('/dashboard', { replace: true });
        }
    }, [userRole, navigate]);

    if (userRole === 'employee') return null;

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || tabs[0]?.component;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white rounded-lg border-b border-gray-100 md:px-3 px-3 pt-3 pb-0 sticky top-0 z-20">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-4 py-3 border-b-2 transition-all duration-300 relative whitespace-nowrap group ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-50 group-hover:bg-gray-100 text-gray-400'
                                }`}>
                                <tab.icon size={16} />
                            </div>
                            <span className={`text-[13.5px] font-semibold tracking-tight ${activeTab === tab.id ? 'text-primary' : 'text-gray-600'
                                }`}>
                                {tab.label}
                            </span>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-nav-indicator-org"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    initial={false}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-0 py-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="max-w-[1600px] mx-auto h-full"
                    >
                        <div className="overflow-hidden min-h-[600px]">
                            <ActiveComponent />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}