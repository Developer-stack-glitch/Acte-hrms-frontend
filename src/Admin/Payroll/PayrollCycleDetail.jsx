import React, { useState, useEffect } from 'react';
import {
    Search,
    Play,
    RefreshCcw,
    ChevronLeft,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle2,
    FileText,
    Pause,
    Lock
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getPayrollEmployeesApi, getCompanyByIdApi, togglePayrollHoldApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { PayslipView } from './PayslipTemplate';
import { X } from 'lucide-react';
import DataTable from '../../Common/DataTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export default function PayrollCycleDetail({ onBack, batchData }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payrollSummary, setPayrollSummary] = useState({
        workingDays: 0,
        totalCalendarDays: 0,
        totalEmployees: 0,
        totalAmount: 0
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => { },
        type: 'primary'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [logo, setLogo] = useState(null);
    const pageSize = 15;
    const printRefCount = React.useRef();

    useEffect(() => {
        const fetchCompany = async () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const companyId = userInfo.company;
            if (companyId) {
                try {
                    const res = await getCompanyByIdApi(companyId);
                    setCompanyInfo(res.data);
                    if (res.data.logo) {
                        setLogo(`${API_URL}/api/${res.data.logo.replace(/\\/g, '/')}`);
                    }
                } catch (err) {
                    console.error('Failed to fetch company info');
                }
            }
        };
        fetchCompany();
    }, []);

    const formatPayslipData = (emp) => {
        const monthYear = (batchData.payroll_month || new Date(batchData.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })).toUpperCase();
        const n = (v) => Number(v || 0);

        // Dyamically build earnings from breakdown
        const earningsRows = Object.entries(emp.earnings_breakdown || {}).map(([label, value]) => ({
            label: label.toUpperCase(),
            value: n(value)
        }));

        // Dyamically build deductions from breakdown
        const deductionsRows = Object.entries(emp.deductions_breakdown || {}).map(([label, value]) => ({
            label: label.toUpperCase(),
            value: n(value)
        }));

        // Add standard summary rows and LOP
        const earnings = [
            ...earningsRows,
            { label: 'GROSS', value: n(emp.gross) },
            { label: 'VARIABLE', value: n(emp.variable) },
            { label: 'BALANCE', value: 0 },
            { label: 'INCENTIVES', value: n(emp.incentives) },
        ];

        const deductions = [
            ...deductionsRows,
            { label: 'LOP', value: n(emp.lop) },
            { label: 'NET', value: n(emp.net) },
        ];

        return {
            monthYear,
            employee: {
                code: emp.emp_id || 'N/A',
                name: emp.name || 'N/A',
                designation: emp.designation || 'EMPLOYEE',
                payMode: 'BANK TRANSFER',
                department: emp.department || 'GENERAL',
                accountNo: emp.account_no || 'XXXXXXXXXXXX',
                lossOfPay: emp.absentDays || 0,
                pfNo: emp.pf_no || 'XXXXXXXXXXXX'
            },
            earnings,
            deductions,
            leaveDetails: [
                { label: 'CASUAL LEAVE', opening: emp.cl_used || 0, closing: 0 },
                { label: 'PERMISSION (HRS)', opening: ((emp.permission_used || 0) * 10).toFixed(1), closing: 0 },
                { label: 'WEEKLY OFF', opening: 0, closing: 0 },
            ]
        };
    };

    useEffect(() => {
        if (batchData?.id !== undefined && batchData?.id !== null) {
            fetchPayrollEmployees();
        }
    }, [batchData?.id]);

    const fetchPayrollEmployees = async () => {
        setLoading(true);
        try {
            const res = await getPayrollEmployeesApi(batchData.id);
            const data = res.data;
            setEmployees(data.employees || []);
            setPayrollSummary({
                workingDays: data.workingDays,
                totalCalendarDays: data.totalCalendarDays,
                totalEmployees: data.totalEmployees,
                totalAmount: data.totalAmount
            });
        } catch (error) {
            console.error('Failed to fetch payroll employees:', error);
            toast.error('Failed to fetch payroll employee data');
        } finally {
            setLoading(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleToggleHold = async (emp) => {
        try {
            const isHoldNow = !emp.is_hold;
            await togglePayrollHoldApi({
                payroll_run_id: batchData.id,
                user_id: emp.user_id,
                is_hold: isHoldNow
            });
            toast.success(`Salary ${isHoldNow ? 'held' : 'released'} for ${emp.name}`);
            fetchPayrollEmployees();
        } catch (error) {
            toast.error('Failed to update hold status');
        }
    };

    const handleFinalize = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const { finalizePayrollRunApi } = await import('../../Action/api');
            await finalizePayrollRunApi(batchData.id);
            toast.success('Payroll finalized and email sent successfully');
            onBack();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to finalize payroll');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (emp.name || '').toLowerCase().includes(term) ||
            (emp.emp_id || '').toLowerCase().includes(term) ||
            (emp.department || '').toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filteredEmployees.length / pageSize);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-4 space-y-6">
            {/* Top Navigation & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                            {batchData?.batch_name || batchData?.batch || 'Salary Cycle Detail'}
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">
                                Batch ID: {batchData?.id || 'N/A'}
                            </p>
                            {batchData?.period_start && batchData?.period_end && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                    <p className="text-[12px] font-semibold text-primary flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(batchData.period_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - {new Date(batchData.period_end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className=" pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px]"
                        />
                    </div>
                    <button
                        onClick={() => setConfirmModal({
                            isOpen: true,
                            title: batchData?.status === 'Completed' ? "Re-finalize Payroll" : "Finalize Payroll",
                            message: batchData?.status === 'Completed'
                                ? `This payroll is already finalized. Re-finalizing will update all records with current calculations and RE-SEND payslip emails to all employees. Are you sure?`
                                : `Are you sure you want to finalize the payroll for ${batchData?.batch_name || 'this cycle'}? This will lock all calculations and generate historical records and Send mail to all employees.`,
                            confirmText: batchData?.status === 'Completed' ? "Yes, Update & Re-send" : "Yes, Finalize",
                            onConfirm: handleFinalize,
                            type: batchData?.status === 'Completed' ? 'warning' : 'primary'
                        })}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium text-[13px] shadow-lg transition-all active:scale-95 ${batchData?.status === 'Completed'
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                            : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                            }`}
                    >
                        {batchData?.status === 'Completed' ? <RefreshCcw size={14} /> : <Play size={14} fill="currentColor" />}
                        {batchData?.status === 'Completed' ? 'Update & Re-send' : 'Finalize & Sent Mail'}
                    </button>
                    <button
                        onClick={() => {
                            if (batchData?.status === 'Completed') {
                                fetchPayrollEmployees();
                            } else {
                                setConfirmModal({
                                    isOpen: true,
                                    title: "Recalculate Payroll",
                                    message: "Are you sure you want to recalculate payroll? This will update all calculations based on the latest attendance and salary settings.",
                                    confirmText: "Yes, Recalculate",
                                    onConfirm: fetchPayrollEmployees,
                                    type: 'primary'
                                });
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold text-[13px] hover:bg-gray-50 transition-all"
                    >
                        <RefreshCcw size={14} />
                        {batchData?.status === 'Completed' ? 'Refresh' : 'Recalculate'}
                    </button>
                </div>
            </div>

            {/* Status Information */}
            {batchData?.status === 'Completed' && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Historical Record</p>
                        <p className="text-[12px] text-emerald-700">This payroll run is finalized and locked. Values shown are snapshots from the processing date.</p>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            {!loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                    <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[18px] font-semibold text-gray-900">
                                {payrollSummary.workingDays || 0} <span className="text-[12px] text-gray-400 font-medium">Days</span>
                            </p>
                            <p className="text-[12px] font-semibold text-gray-500">Working Days</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[18px] font-semibold text-gray-900">{payrollSummary.totalEmployees || 0}</p>
                            <p className="text-[12px] font-semibold text-gray-500">Employees</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-[18px] font-semibold text-gray-900">
                                ₹{(payrollSummary.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[12px] font-semibold text-gray-500">Total Payout</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[18px] font-semibold text-gray-900">
                                {payrollSummary.totalCalendarDays || 0} <span className="text-[12px] text-gray-400 font-medium">Days</span>
                            </p>
                            <p className="text-[12px] font-semibold text-gray-500">Calendar Days</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm overflow-hidden">
                <DataTable
                    columns={[
                        {
                            header: 'No.',
                            key: 'index',
                            align: 'center',
                            render: (_, __, index) => (
                                <span className="text-[12px] font-medium text-gray-400">
                                    {(currentPage - 1) * pageSize + index + 1}
                                </span>
                            )
                        },
                        {
                            header: 'Employee Name',
                            key: 'name',
                            render: (name, emp) => (
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-semibold text-primary hover:underline cursor-pointer">
                                        {name}
                                    </span>
                                    {emp.emp_id && (
                                        <span className="text-[11px] text-gray-400 font-medium">{emp.emp_id}</span>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: 'Allotted Salary Structure',
                            key: 'structure',
                            render: (val) => (
                                <span className="text-[13px] font-medium text-gray-600">
                                    {val || 'Standard Salary'}
                                </span>
                            )
                        },
                        {
                            header: 'Paid Days',
                            key: 'paidDays',
                            align: 'center',
                            render: (paidDays, emp) => (
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-gray-700 text-[13px]">
                                        {Number(paidDays || 0).toFixed(2)}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-medium tracking-tight">
                                        / {emp.totalWorkingDays} days
                                    </span>
                                </div>
                            )
                        },
                        {
                            header: 'Salary',
                            key: 'fullSalary',
                            align: 'right',
                            render: (val) => (
                                <span className="font-medium text-gray-500 text-[13px]">
                                    {Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            )
                        },
                        {
                            header: 'Gross',
                            key: 'gross',
                            align: 'right',
                            render: (val) => (
                                <span className="font-bold text-indigo-600 text-[13px]">
                                    {Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            )
                        },
                        {
                            header: 'CL Used',
                            key: 'cl_used',
                            align: 'center',
                            render: (val) => (
                                <span className="text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {Number(val || 0).toFixed(1)}d
                                </span>
                            )
                        },
                        {
                            header: 'Perm Used',
                            key: 'permission_used',
                            align: 'center',
                            render: (val) => (
                                <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    {Number(val || 0).toFixed(1)}d
                                </span>
                            )
                        },
                        {
                            header: 'LOP',
                            key: 'lop',
                            align: 'right',
                            render: (val) => (
                                <span className="font-bold text-rose-500 text-[13px]">
                                    {Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            )
                        },
                        {
                            header: 'Deductions',
                            key: 'deductions',
                            align: 'right',
                            render: (val) => (
                                <span className="font-medium text-gray-600 text-[13px]">
                                    {Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            )
                        },
                        {
                            header: 'Net In-Hand Salary',
                            key: 'net',
                            align: 'right',
                            render: (val) => (
                                <div className="bg-primary/5 px-2 py-1 rounded">
                                    <span className="font-extrabold text-gray-900 text-[14px]">
                                        {Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )
                        }
                    ]}
                    data={paginatedEmployees}
                    isLoading={loading}
                    emptyMessage="No employees found"
                    rowClassName={(emp) => emp.is_hold ? 'bg-amber-50/30' : ''}
                    extraActions={(emp) => (
                        <div className="flex items-center justify-center gap-2">
                            {batchData?.status === 'Completed' ? (
                                <button
                                    onClick={() => setSelectedEmployee(emp)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all border border-indigo-100 uppercase tracking-wider"
                                >
                                    <FileText size={13} />
                                    Payslip
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleToggleHold(emp)}
                                        className={`p-1.5 rounded-lg transition-all ${emp.is_hold ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        title={emp.is_hold ? "Release Hold" : "Hold Salary"}
                                    >
                                        {emp.is_hold ? <Lock size={13} /> : <Pause size={13} />}
                                    </button>
                                    <button
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all border border-emerald-100 uppercase tracking-wider"
                                        onClick={() => toast.success("Processing is happening in real-time. Use 'Finalize' to lock it.")}
                                    >
                                        <RefreshCcw size={12} />
                                        Process
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredEmployees.length,
                        onChange: (page) => setCurrentPage(page)
                    }}
                />
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText="Maybe Later"
                type={confirmModal.type}
            />

            {/* Payslip Modal */}
            <AnimatePresence>
                {selectedEmployee && companyInfo && (
                    <div className="fixed inset-0 z-[110] m-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-[1000px] flex flex-col relative h-[95vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-[20px] shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-base text-xl font-semibold text-gray-900 leading-tight">Payslip Preview</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-md uppercase tracking-wider">
                                                {selectedEmployee.name}
                                            </span>
                                            <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-widest">
                                                ID: {selectedEmployee.emp_id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-[1px] h-8 bg-gray-100 mx-1" />
                                    <button
                                        onClick={() => setSelectedEmployee(null)}
                                        className="p-2.5 hover:bg-rose-50 rounded-xl transition-all text-gray-400 hover:text-rose-500 group"
                                    >
                                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body - Document Viewport */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center custom-scrollbar">
                                <div className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-sm origin-top mb-12 transform scale-[0.85] md:scale-90 lg:scale-100">
                                    <PayslipView
                                        companyInfo={companyInfo}
                                        logo={logo}
                                        payslipData={formatPayslipData(selectedEmployee)}
                                        printRef={printRefCount}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer (Helper) */}
                            <div className="px-6 py-3 bg-white border-t border-gray-50 text-center shrink-0">
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em]">
                                    A4 Document Format • Standard Layout 2.0
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        background: white !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                        z-index: 9999;
                    }
                }
            `}</style>
        </div>
    );
}
