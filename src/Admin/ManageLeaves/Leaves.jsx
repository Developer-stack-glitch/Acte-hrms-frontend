import React, { useState, useMemo } from 'react';
import {
    ClipboardList,
    PlusCircle,
    Settings,
    Palmtree,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeaveList from './LeaveList';
import AddLeave from './AddLeave';
import ManageLeavesContent from './ManageLeavesContent';
import ManageHolidays from './ManageHolidays';

const tabs = [
    { id: 'manage-leaves', label: 'Manage Leaves', icon: Settings, component: ManageLeavesContent, permissionId: 'leaves_manage' },
    { id: 'leave-list', label: 'Leave List', icon: ClipboardList, component: LeaveList, permissionId: 'leaves_list' },
    { id: 'add-leave', label: 'Apply Leave', icon: PlusCircle, component: AddLeave, permissionId: 'leaves_apply' },
    { id: 'holiday', label: 'Manage Holiday', icon: Palmtree, component: ManageHolidays, permissionId: 'leaves_holiday' },
];

import { useNavigate, useParams } from 'react-router-dom';

export default function Leaves() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const filteredTabs = useMemo(() => {
        if (userRole === 'superadmin') return tabs;
        return tabs.filter(tab => !tab.permissionId || userPermissions.includes(tab.permissionId));
    }, [userRole, userPermissions]);

    const activeTab = tabId || (filteredTabs.length > 0 ? filteredTabs[0].id : null);

    const setActiveTab = (id) => {
        navigate(`/leaves/${id}`);
    };

    React.useEffect(() => {
        if (!tabId || !filteredTabs.some(t => t.id === tabId)) {
            if (filteredTabs.length > 0) {
                navigate(`/leaves/${filteredTabs[0].id}`, { replace: true });
            }
        }
    }, [tabId, filteredTabs, navigate]);


    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white rounded-lg border-b border-gray-100 md:px-3 px-3 pt-3 pb-0 sticky top-0 z-20">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {filteredTabs.map((tab) => (
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
                                {tab.id === 'manage-leaves' && userRole === 'employee' ? 'Overview' : tab.label}
                            </span>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-nav-indicator-leaves"
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
                            {activeTab === 'leave-list' ? (
                                <LeaveList />
                            ) : activeTab === 'add-leave' ? (
                                <AddLeave
                                    onSuccess={() => setActiveTab('leave-list')}
                                    onCancel={() => setActiveTab('leave-list')}
                                />
                            ) : activeTab === 'holiday' ? (
                                <ManageHolidays />
                            ) : (
                                <ManageLeavesContent
                                    onViewAll={() => setActiveTab('leave-list')}
                                />
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
