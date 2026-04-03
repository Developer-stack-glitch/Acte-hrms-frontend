import { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Clock,
    Receipt,
    Palmtree,
    Monitor,
    Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceReport from './Tabs/AttendanceReport';
import ReimbursementsReport from './Tabs/ReimbursementsReport';
import LeaveReport from './Tabs/LeaveReport';
import AssetReport from './Tabs/AssetReport';
import PayrollReport from './Tabs/PayrollReport';

const reportTabsAll = [
    { id: 'attendance', label: 'Attendance Report', icon: Clock, component: AttendanceReport },
    { id: 'reimbursements', label: 'Reimbursements Report', icon: Receipt, component: ReimbursementsReport },
    { id: 'leave', label: 'Leave Report', icon: Palmtree, component: LeaveReport },
    { id: 'asset', label: 'Asset Report', icon: Monitor, component: AssetReport },
    { id: 'payroll', label: 'Payroll Report', icon: Wallet, component: PayrollReport },
];

export default function Reports() {
    const { tabId } = useParams();
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role || 'employee';
    const permissions = userInfo.permissions || [];

    const reportTabs = useMemo(() => {
        if (userRole === 'superadmin') return reportTabsAll;
        return reportTabsAll.filter(tab => permissions.includes(`reports_${tab.id}`));
    }, [userRole, permissions]);

    const activeTab = useMemo(() => {
        if (!tabId || !reportTabs.some(t => t.id === tabId)) {
            return reportTabs.length > 0 ? reportTabs[0].id : null;
        }
        return tabId;
    }, [tabId, reportTabs]);

    const setActiveTab = (id) => {
        navigate(`/reports/${id}`);
    };

    useEffect(() => {
        if (reportTabs.length > 0) {
            if (!tabId || !reportTabs.some(t => t.id === tabId)) {
                navigate(`/reports/${reportTabs[0].id}`, { replace: true });
            }
        }
    }, [tabId, navigate, reportTabs]);

    const ActiveComponent = useMemo(() => {
        if (!activeTab) return () => <div className="p-10 text-center text-gray-500">You don't have permission to view any reports.</div>;
        const tab = reportTabs.find(t => t.id === activeTab);
        return tab ? tab.component : () => null;
    }, [activeTab, reportTabs]);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header section with title and description */}
            <div className="bg-white px-5 pt-6 border-b border-gray-100 rounded-lg">
                <div className="mb-4">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Analytics & Reports</h1>
                    <p className="text-[14px] text-gray-500 font-medium">
                        Comprehensive insights and detailed reporting across all HR modules
                    </p>
                </div>

                {/* Horizontal Tabs Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {reportTabs.map((tab) => (
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
                                    layoutId="active-nav-indicator-reports"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    initial={false}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-0 py-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className=""
                    >
                        <ActiveComponent />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}