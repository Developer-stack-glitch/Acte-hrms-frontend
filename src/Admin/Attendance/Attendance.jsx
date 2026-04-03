import React, { useState, useMemo } from 'react';
import {
    UserCheck,
    FileText,
    ClipboardCheck,
    Calendar,
    Tablet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManageAttedance from './ManageAttedance.jsx';
import BiometricManual from './BiometricManual.jsx';
import WeekOff from './WeekOff.jsx';
import HolidayCalendar from './HolidayCalendar.jsx';
import LeaveRules from './LeaveRules.jsx';
import CompanyPolicy from './CompanyPolicy.jsx';
import DeviceManager from './DeviceManager.jsx';

const tabs = [
    { id: 'manage', label: 'Attendance & Shift', icon: UserCheck, component: ManageAttedance, permissionId: 'attendance_shift' },
    { id: 'manual', label: 'Biometric Attendance', icon: FileText, component: () => <BiometricManual />, permissionId: 'attendance_biometric' },
    { id: 'weekoff', label: 'Week Off', icon: ClipboardCheck, component: () => <WeekOff />, permissionId: 'attendance_weekoff' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: () => <HolidayCalendar />, permissionId: 'attendance_calendar' },
    // { id: 'leave-rules', label: 'Attendance Rules', icon: FileText, component: LeaveRules, permissionId: 'attendance_rules' },
    { id: 'company-policy', label: 'Company Policy', icon: FileText, component: CompanyPolicy, permissionId: 'attendance_policy' },
    { id: 'devices', label: 'Biometric Devices', icon: Tablet, component: DeviceManager, permissionId: 'attendance_devices' },
];

import { useNavigate, useParams } from 'react-router-dom';

export default function Attendance() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const filteredTabs = useMemo(() => {
        if (userRole === 'superadmin') return tabs;

        // Filter by permissions
        const baseTabs = tabs.filter(tab => !tab.permissionId || userPermissions.includes(tab.permissionId));

        // Specifically hide certain tabs for employees
        if (userRole === 'employee') {
            const hiddenForEmployee = ['manual', 'leave-rules', 'company-policy', 'devices'];
            return baseTabs.filter(tab => !hiddenForEmployee.includes(tab.id));
        }

        return baseTabs;
    }, [userRole, userPermissions]);

    const activeTab = tabId || (filteredTabs.length > 0 ? filteredTabs[0].id : null);

    const setActiveTab = (id) => {
        navigate(`/attendance/${id}`);
    };

    React.useEffect(() => {
        if (!tabId || !filteredTabs.some(t => t.id === tabId)) {
            if (filteredTabs.length > 0) {
                navigate(`/attendance/${filteredTabs[0].id}`, { replace: true });
            }
        }
    }, [tabId, filteredTabs, navigate]);

    const ActiveComponent = filteredTabs.find(t => t.id === activeTab)?.component || filteredTabs[0]?.component;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white rounded-lg border-b border-gray-100 md:px-3 px-3 pt-3 pb-0 sticky top-0 z-20">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar scroll-smooth">
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
                                {tab.label}
                            </span>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-nav-indicator-attn"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    initial={false}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 md:px-1 px-0 py-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="max-w-[1600px] mx-auto h-full"
                    >
                        <div className="bg-white rounded-[8px] overflow-hidden min-h-[600px]">
                            <ActiveComponent />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}