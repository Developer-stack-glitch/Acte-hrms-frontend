import React, { useMemo, useState } from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    FileText,
    Wallet,
    Layers,
    Puzzle,
    Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

import PayrollDashboard from './PayrollDashboard';
import PayrollCycleDetail from './PayrollCycleDetail';
import SalaryStructure from './SalaryStructure';
import StatutoryCompliance from './StatutoryCompliance';
import PayslipTemplate from './PayslipTemplate';
import MyPayslips from './MyPayslips';
import AdvanceSalary from './AdvanceSalary';
import SalaryComponents from './SalaryComponents';
import SalaryFormulas from './SalaryFormulas';
import StatutoryComplianceSettings from './StatutoryComplianceSettings';

const tabs = [
    { id: 'dashboard', label: 'Payroll Dashboard', icon: LayoutDashboard, permissionId: 'payroll_dashboard' },
    { id: 'salary-structure', label: 'Salary Structure', icon: Layers, permissionId: 'payroll_structure' },
    { id: 'salary-components', label: 'Salary Components', icon: Puzzle, permissionId: 'payroll_components' },
    { id: 'salary-formulas', label: 'Formulas', icon: Calculator, permissionId: 'payroll_formulas' },
    { id: 'payslip-templates', label: 'Payslip Templates', icon: FileText, permissionId: 'payroll_templates' },
    { id: 'advance-salary', label: 'Advance Salary', icon: Wallet, permissionId: 'payroll_advance_salary' },
];

const employeeTabs = [
    { id: 'my-payslips', label: 'My Payslips', icon: FileText, permissionId: 'payroll_payslips' },
    { id: 'advance-salary', label: 'Advance Salary', icon: Wallet, permissionId: 'payroll_advance_salary' },
];

const Placeholder = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p>This module is coming soon...</p>
    </div>
);

export default function Payroll() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const [selectedBatch, setSelectedBatch] = useState(null);
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const filteredTabs = useMemo(() => {
        const baseTabs = userRole === 'employee' ? employeeTabs : tabs;
        if (userRole === 'superadmin') return baseTabs;
        
        return baseTabs.filter(tab => !tab.permissionId || userPermissions.includes(tab.permissionId));
    }, [userRole, userPermissions]);

    const activeTab = tabId || (filteredTabs.length > 0 ? filteredTabs[0].id : null);

    const setActiveTab = (id) => {
        setSelectedBatch(null); // Reset detail view when switching tabs
        navigate(`/payroll/${id}`);
    };

    React.useEffect(() => {
        if (!tabId || !filteredTabs.some(t => t.id === tabId)) {
            if (filteredTabs.length > 0) {
                navigate(`/payroll/${filteredTabs[0].id}`, { replace: true });
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
                                {tab.label}
                            </span>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-nav-indicator-payroll"
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
                        key={activeTab + (selectedBatch ? '-detail' : '-list')}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="max-w-[1600px] mx-auto h-full"
                    >
                        <div className="overflow-hidden min-h-[600px]">
                            {activeTab === 'dashboard' ? (
                                selectedBatch ? (
                                    <PayrollCycleDetail
                                        batchData={selectedBatch}
                                        onBack={() => setSelectedBatch(null)}
                                    />
                                ) : (
                                    <PayrollDashboard onEdit={(batch) => setSelectedBatch(batch)} />
                                )
                            ) : activeTab === 'salary-structure' ? (
                                <SalaryStructure />
                            ) : activeTab === 'salary-components' ? (
                                <SalaryComponents />
                            ) :
                                activeTab === 'statutory-compliance' ? (
                                    <StatutoryCompliance />
                                ) :
                                    activeTab === 'compliance-settings' ? (
                                        <StatutoryComplianceSettings />
                                    ) :
                                        activeTab === 'payslip-templates' ? (
                                            <PayslipTemplate />
                                        ) :
                                            activeTab === 'my-payslips' ? (
                                                <MyPayslips />
                                            ) : activeTab === 'salary-formulas' ? (
                                                <SalaryFormulas />
                                            ) : activeTab === 'advance-salary' ? (
                                                <AdvanceSalary />
                                            ) : activeTab === 'reimbursements' ? (
                                                <Placeholder title="Reimbursements" />
                                            ) :
                                                (
                                                    <Placeholder title={filteredTabs.find(t => t.id === activeTab)?.label || 'Payroll'} />
                                                )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
