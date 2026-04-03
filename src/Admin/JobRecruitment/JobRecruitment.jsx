import React, { useState, useMemo } from 'react';
import {
    Briefcase,
    Users,
    BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import RecruitmentDashboard from './RecruitmentDashboard.jsx';
import JobBoard from './JobBoard.jsx';
import ApplicantsList from './ApplicantsList.jsx';

const tabs = [
    { id: 'dashboard', label: 'Recruitment Overview', icon: BarChart3, component: RecruitmentDashboard, permissionId: 'jobs_recruitment_overview' },
    { id: 'jobs', label: 'Job Board', icon: Briefcase, component: JobBoard, permissionId: 'jobs_recruitment_board' },
    { id: 'applicants', label: 'Applicants', icon: Users, component: ApplicantsList, permissionId: 'jobs_recruitment_applicants' },
];

export default function JobRecruitment() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const filteredTabs = useMemo(() => {
        if (userRole === 'superadmin') return tabs;
        if (userRole === 'employee') return []; // Employees use the Career Portal page
        return tabs.filter(tab => userPermissions.includes(tab.permissionId));
    }, [userRole, userPermissions]);

    const activeTab = tabId || (filteredTabs.length > 0 ? filteredTabs[0].id : 'dashboard');

    const setActiveTab = (id) => {
        navigate(`/job-recruitment/${id}`);
    };

    React.useEffect(() => {
        if (!tabId || !filteredTabs.some(t => t.id === tabId)) {
            if (filteredTabs.length > 0) {
                navigate(`/job-recruitment/${filteredTabs[0].id}`, { replace: true });
            }
        }
    }, [tabId, filteredTabs, navigate]);

    const ActiveComponent = filteredTabs.find(t => t.id === activeTab)?.component || filteredTabs[0]?.component || RecruitmentDashboard;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white rounded-lg border-b border-gray-100 md:px-3 px-3 pt-3 pb-0 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar scroll-smooth">
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
                                    layoutId="active-nav-indicator-recruitment"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    initial={false}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 py-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="max-w-[1600px] mx-auto h-full"
                    >
                        <div className="bg-white rounded-[15px] border border-gray-100 shadow-xl shadow-gray-200/50 min-h-[700px] overflow-hidden">
                            <ActiveComponent />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}