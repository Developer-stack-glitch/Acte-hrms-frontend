import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    CircleDollarSign,
    Wallet,
    TrendingUp,
    Users,
    BadgePercent,
    Play,
    ArrowUpRight,
    Search,
    Eye,
    Edit,
    CheckCircle2,
    Clock,
    X,
    ChevronDown,
    Loader2,
    RefreshCcw,
    AlertTriangle,
    Calendar,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getPayrollRunsApi,
    createPayrollRunApi,
    updatePayrollRunApi,
    getBatchAllocationsApi,
    getUsersApi,
    getPayrollHoldListApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import PageWithStatsSkeleton from '../../Common/CommonSkeletonLoader/PageWithStatsSkeleton';
import TableSkeleton from '../../Common/CommonSkeletonLoader/TableSkeleton';
import Tooltip from '../../Common/Tooltip';

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white rounded-[15px] p-4 border border-gray-200 transition-all group overflow-hidden relative"
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color.bg} opacity-10 group-hover:scale-125 transition-transform duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <h3 className="text-[15px] md:text-[24px] font-semibold text-gray-900">
                    {value}
                </h3>
                <p className="text-[11px] font-semibold text-[#2a2a2a]/80">
                    {title} {subValue && <span className="text-gray-400">({subValue})</span>}
                </p>
            </div>
            <div className={`w-10 h-10 md:w-10 md:h-10 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform shrink-0`}>
                <Icon size={22} />
            </div>
        </div>
    </motion.div>
);

export default function PayrollDashboard({ onEdit }) {
    const [filterTab, setFilterTab] = useState('All');
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [isReinitModalOpen, setIsReinitModalOpen] = useState(false);
    const [runToReinit, setRunToReinit] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [runToEdit, setRunToEdit] = useState(null);
    const [runLoading, setRunLoading] = useState(false);
    const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
    const [holdList, setHoldList] = useState([]);
    const [holdLoading, setHoldLoading] = useState(false);
    const navigate = useNavigate();

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [runFormData, setRunFormData] = useState({
        batch_allocation_id: '',
        pay_type: 'MONTHLY',
        payroll_month: '',
        period_start: '',
        period_end: '',
        forceGenerate: true
    });

    useEffect(() => {
        fetchData(1);
        fetchInitialData();
    }, [filterTab]);

    const fetchData = async (page = 1) => {
        if (filterTab === 'Hold List') {
            fetchHoldList();
            return;
        }
        setLoading(true);
        try {
            const [runsRes, structuresRes] = await Promise.all([
                getPayrollRunsApi({
                    company_id: companyId,
                    page,
                    limit: pagination.limit,
                    status: filterTab !== 'All' ? filterTab : undefined
                }),
                getBatchAllocationsApi({ company_id: companyId })
            ]);

            // Handle both legacy array response and new paginated object response
            if (runsRes.data.data) {
                setPayrollRuns(runsRes.data.data);
                setPagination(runsRes.data.pagination);
            } else {
                setPayrollRuns(runsRes.data);
                setPagination(prev => ({ ...prev, total: runsRes.data.length, totalPages: 1 }));
            }

            setStructures(structuresRes.data);
        } catch (error) {
            toast.error('Failed to fetch payroll data');
        } finally {
            setLoading(false);
        }
    };

    const fetchHoldList = async () => {
        setHoldLoading(true);
        try {
            const res = await getPayrollHoldListApi({ company_id: companyId });
            setHoldList(res.data);
        } catch (error) {
            toast.error('Failed to fetch hold list');
        } finally {
            setHoldLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const usersRes = await getUsersApi({ limit: 1 });
            setTotalEmployeesCount(usersRes.data.total || 0);
        } catch (error) {
            console.error('Failed to fetch employee count');
        }
    }

    const handleRunPayrollClick = () => {
        // Set default month to current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        setRunFormData({
            batch_allocation_id: '',
            pay_type: 'MONTHLY',
            payroll_month: currentMonth,
            period_start: periodStart,
            period_end: periodEnd,
            forceGenerate: true
        });
        setIsRunModalOpen(true);
    };

    const handleRunSubmit = async (e) => {
        e.preventDefault();
        if (!runFormData.batch_allocation_id) {
            toast.error('Please select a batch');
            return;
        }
        if (!runFormData.payroll_month) {
            toast.error('Please select a payroll month');
            return;
        }
        if (!runFormData.period_start || !runFormData.period_end) {
            toast.error('Please select period dates');
            return;
        }

        const [year, month] = runFormData.payroll_month.split('-').map(Number);

        // Check if month hasn't ended yet
        const now = new Date();
        const monthEnd = new Date(year, month, 0);
        if (now < monthEnd && !runFormData.forceGenerate) {
            toast.error('This month has not ended yet. Enable "Generate even if month hasn\'t ended" to proceed.');
            return;
        }

        setRunLoading(true);
        try {
            const selected = structures.find(s => s.id === parseInt(runFormData.batch_allocation_id));
            const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const data = {
                batch_allocation_id: runFormData.batch_allocation_id,
                pay_type: runFormData.pay_type,
                company_id: companyId,
                batch_name: selected ? `${selected.name} - ${selected.batch}` : 'Standard Batch',
                period_start: runFormData.period_start,
                period_end: runFormData.period_end,
                total_employees: totalEmployeesCount,
                total_amount: 0,
                status: 'Active'
            };
            await createPayrollRunApi(data);
            toast.success(`Payroll for ${monthLabel} initialized successfully`);
            setIsRunModalOpen(false);
            fetchData(1);
        } catch (error) {
            toast.error('Failed to initialize payroll run');
        } finally {
            setRunLoading(false);
        }
    };

    const handleEditRunClick = (run) => {
        setRunToEdit(run);
        setRunFormData({
            batch_allocation_id: run.batch_allocation_id || '',
            pay_type: run.pay_type || 'MONTHLY',
            payroll_month: run.payroll_month || '',
            period_start: run.period_start?.split('T')[0] || '',
            period_end: run.period_end?.split('T')[0] || '',
            forceGenerate: true,
            batch_name: run.batch_name
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setRunLoading(true);
        try {
            await updatePayrollRunApi(runToEdit.id, {
                batch_name: runFormData.batch_name,
                period_start: runFormData.period_start,
                period_end: runFormData.period_end,
                pay_type: runFormData.pay_type
            });
            toast.success('Payroll run updated successfully');
            setIsEditModalOpen(false);
            fetchData(pagination.page);
        } catch (error) {
            toast.error('Failed to update payroll run');
        } finally {
            setRunLoading(false);
        }
    };

    const filteredData = payrollRuns;

    const formatPeriod = (start, end) => {
        if (!start || !end) return 'N/A';
        const s = new Date(start);
        const e = new Date(end);
        const options = { month: 'short', day: '2-digit' };
        const year = s.getFullYear();
        return `${s.toLocaleDateString('en-US', options)} - ${e.toLocaleDateString('en-US', options)}, ${year}`;
    };

    return (
        <div className="p-3 space-y-6">
            {/* Header section with Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Payroll Overview</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">Monitor and manage payroll operations with real-time insights</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleRunPayrollClick}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-[13px] shadow-lg shadow-primary/10 hover:bg-primary-hover transition-all active:scale-95"
                    >
                        <Play size={16} fill="currentColor" />
                        Run Payroll
                    </button>
                    <button onClick={() => navigate('/reimbursements')} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold text-[13px] hover:bg-gray-50 transition-all">
                        Reimbursements
                        <ArrowUpRight size={16} className="text-gray-400" />
                    </button>
                    <button
                        onClick={() => navigate('/payroll/advance-salary')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold text-[13px] hover:bg-gray-50 transition-all"
                    >
                        Advance Salary
                        <ArrowUpRight size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {loading ? (
                <PageWithStatsSkeleton statsCount={5} rows={8} columns={7} />
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard
                            title="Reimbursements"
                            subValue="Pending"
                            value="₹ 0.0K"
                            icon={CircleDollarSign}
                            color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                            delay={0.1}
                        />
                        <StatCard
                            title="Advance Salary"
                            subValue="Deduction"
                            value="₹ 0.0K"
                            icon={Wallet}
                            color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                            delay={0.2}
                        />
                        <StatCard
                            title="Total Payroll"
                            subValue="Active"
                            value={`₹ ${((pagination.totalAmountSum || 0) / 1000).toFixed(1)}K`}
                            icon={TrendingUp}
                            color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                            delay={0.3}
                        />
                        <StatCard
                            title="Employees"
                            subValue="In Active Run"
                            value={totalEmployeesCount}
                            icon={Users}
                            color={{ bg: 'bg-violet-50', text: 'text-violet-600' }}
                            delay={0.4}
                        />
                        <StatCard
                            title="Average Salary"
                            value="₹ 0.0K"
                            icon={BadgePercent}
                            color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                            delay={0.5}
                        />
                    </div>

                    {/* Recent Payrolls Section */}
                    <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden min-h-[500px]">
                        <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="font-semibold text-gray-900 text-lg">Recent Payrolls</h2>

                            <div className="flex items-center bg-gray-50 p-1 rounded-full border border-gray-200 shadow-inner">
                                {['All', 'Active', 'Pending', 'Completed', 'Hold List'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFilterTab(tab)}
                                        className={`px-5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${filterTab === tab
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            {filterTab === 'Hold List' ? (
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-[#fff9f2]/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest">Employee</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest">Payroll Run / Batch</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest text-center">Period</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest text-center">Run Status</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest text-right">Held Since</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-amber-900 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-50">
                                        {holdLoading ? (
                                            <TableSkeleton rows={8} columns={6} />
                                        ) : holdList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                                                            <Lock size={32} className="text-amber-200" />
                                                        </div>
                                                        <p className="font-bold text-gray-500">No employees on salary hold</p>
                                                        <p className="text-[12px] mt-1">Held salaries across all payroll cycles will appear here</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : holdList.map((hold) => (
                                            <tr key={hold.id} className="hover:bg-amber-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14.5px] font-bold text-gray-900">{hold.employee_name}</span>
                                                        <span className="text-[11px] font-semibold text-amber-600/70 tracking-tight">{hold.emp_id} • {hold.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-semibold text-gray-700">{hold.batch_name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400">RUN-#{hold.payroll_run_id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[12px] font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                                                        {new Date(hold.period_start).toLocaleDateString()} - {new Date(hold.period_end).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter ${hold.run_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {hold.run_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-[12px] font-medium text-gray-500">
                                                        {new Date(hold.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => onEdit({ id: hold.payroll_run_id, status: hold.run_status, batch_name: hold.batch_name })}
                                                        className="px-4 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-[11px] font-bold hover:bg-amber-50 transition-all shadow-sm"
                                                    >
                                                        Manage Run
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-primary/4">
                                        <tr>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap">Batch</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap">Pay Type</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap text-center">Period</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap text-center">Employees</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap text-right">Amount</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap text-center">Status</th>
                                            <th className="px-5 py-4 text-[12px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            <TableSkeleton rows={8} columns={7} />
                                        ) : filteredData.map((payroll) => (
                                            <tr key={payroll.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-semibold text-gray-900 leading-snug">{payroll.batch_name}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">RUN-#{payroll.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                                        {payroll.pay_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 group/period">
                                                        <span className="text-[13px] font-semibold text-gray-600 bg-gray-50/80 px-3 py-1 rounded-lg border border-gray-100">
                                                            {formatPeriod(payroll.period_start, payroll.period_end)}
                                                        </span>
                                                        {payroll.status === 'Active' && (
                                                            <button
                                                                onClick={() => handleEditRunClick(payroll)}
                                                                className="p-1 text-gray-400 hover:text-primary opacity-0 group-hover/period:opacity-100 transition-all"
                                                                title="Edit Period/Name"
                                                            >
                                                                <Edit size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-700 text-[13px]">
                                                    {payroll.processed_employees} / {payroll.total_employees}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900 text-[13.5px]">
                                                    INR {parseFloat(payroll.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${payroll.status === 'Completed'
                                                        ? 'bg-[#d1fae5] text-[#065f46] border border-[#d1fae5]'
                                                        : payroll.status === 'Active'
                                                            ? 'bg-green-50 text-green-600 border border-green-100'
                                                            : 'bg-[#fef3c7] text-[#92400e] border border-[#fef3c7]'
                                                        }`}>
                                                        {payroll.status === 'Completed' ? <CheckCircle2 size={12} /> : payroll.status === 'Active' ? <TrendingUp size={12} /> : <Clock size={12} />}
                                                        {payroll.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {payroll.status === 'Active' && (
                                                            <button
                                                                onClick={() => {
                                                                    setRunToReinit(payroll);
                                                                    setIsReinitModalOpen(true);
                                                                }}
                                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                            >
                                                                <Tooltip text="Re-initialize">
                                                                    <RefreshCcw size={16} />
                                                                </Tooltip>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => onEdit(payroll)}
                                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${payroll.status === 'Completed'
                                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                                }`}>
                                                            {payroll.status === 'Completed' ? <Eye size={14} /> : <Edit size={14} />}
                                                            {payroll.status === 'Completed' ? 'View' : 'Process'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {!loading && filterTab !== 'Hold List' && pagination.totalPages > 1 && (
                            <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-white">
                                <div className="text-[12px] font-medium text-gray-500">
                                    Showing <span className="text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                    <span className="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                    <span className="text-gray-900">{pagination.total}</span> entries
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchData(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(pagination.totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => fetchData(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all ${pagination.page === i + 1
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => fetchData(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && filterTab !== 'Hold List' && filteredData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <Search size={32} className="opacity-70" />
                                </div>
                                <p className="font-semibold text-gray-700">No payroll records found for "{filterTab}"</p>
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* Run Payroll Modal */}
            <AnimatePresence>
                {isRunModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                <h2 className="text-lg font-semibold text-gray-900">Run Payroll</h2>
                                <button
                                    onClick={() => setIsRunModalOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleRunSubmit} className="p-5 space-y-5">
                                {/* Batch Selection */}
                                <FormSelect
                                    label="Select Batch"
                                    name="batch_allocation_id"
                                    value={runFormData.batch_allocation_id}
                                    onChange={(e) => setRunFormData(prev => ({ ...prev, batch_allocation_id: e.target.value }))}
                                    options={structures.map(s => ({
                                        value: s.id,
                                        label: `${s.name} ${s.batch ? `(${s.batch})` : ''}`
                                    }))}
                                    required
                                    placeholder="Choose a batch..."
                                    icon={ChevronDown}
                                />

                                {/* Payroll Month */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payroll Month</label>
                                    <div className="relative">
                                        <DatePicker
                                            selected={runFormData.payroll_month ? new Date(runFormData.payroll_month + '-01') : null}
                                            onChange={(date) => {
                                                if (date) {
                                                    const value = format(date, 'yyyy-MM');
                                                    const start = format(startOfMonth(date), 'yyyy-MM-dd');
                                                    const end = format(endOfMonth(date), 'yyyy-MM-dd');
                                                    setRunFormData(prev => ({
                                                        ...prev,
                                                        payroll_month: value,
                                                        period_start: start,
                                                        period_end: end
                                                    }));
                                                }
                                            }}
                                            dateFormat="MMMM, yyyy"
                                            showMonthYearPicker
                                            showYearDropdown
                                            showMonthDropdown
                                            dropdownMode="select"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                                            portalId="root"
                                        />
                                        <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                                        We will auto-generate the selected month's payroll. Holidays and payable week-offs remain paid; all other days stay absent as per existing rules.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                            Period Start
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={runFormData.period_start ? new Date(runFormData.period_start) : null}
                                                onChange={(date) => setRunFormData(prev => ({ ...prev, period_start: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                dateFormat="dd-MM-yyyy"
                                                showYearDropdown
                                                showMonthDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                                                portalId="root"
                                            />
                                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                            Period End
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={runFormData.period_end ? new Date(runFormData.period_end) : null}
                                                onChange={(date) => setRunFormData(prev => ({ ...prev, period_end: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                dateFormat="dd-MM-yyyy"
                                                showYearDropdown
                                                showMonthDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                                                portalId="root"
                                            />
                                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Force Generate Checkbox */}
                                <div
                                    onClick={() => setRunFormData(prev => ({ ...prev, forceGenerate: !prev.forceGenerate }))}
                                    className="flex items-start gap-3 cursor-pointer select-none group"
                                >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${runFormData.forceGenerate
                                        ? 'bg-primary border-primary'
                                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                                        }`}>
                                        {runFormData.forceGenerate && (
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-gray-800">Generate even if month hasn't ended yet</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed flex items-center gap-1">
                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                            Check this to generate payroll for current/incomplete months
                                        </p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed flex items-center gap-1">
                                            <AlertTriangle size={10} className="text-amber-500" />
                                            Uncheck only if you want to wait for the grace period (1 day after month end)
                                        </p>
                                    </div>
                                </div>

                                {/* Info callout */}
                                <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                                    <p className="text-[12px] text-teal-800 leading-relaxed">
                                        <span className="font-semibold">This will trigger the same auto-generate logic we use in cron,</span> but it runs immediately for the month you select.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="pt-1 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsRunModalOpen(false)}
                                        className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={runLoading}
                                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium text-[13px] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-70"
                                    >
                                        {runLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Play size={16} fill="currentColor" />
                                        )}
                                        Run Payroll
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Payroll Run Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                <h2 className="text-lg font-semibold text-gray-900">Edit Payroll Run</h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-5 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batch Name</label>
                                    <input
                                        type="text"
                                        value={runFormData.batch_name}
                                        onChange={(e) => setRunFormData(prev => ({ ...prev, batch_name: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                            Period Start
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={runFormData.period_start ? new Date(runFormData.period_start) : null}
                                                onChange={(date) => setRunFormData(prev => ({ ...prev, period_start: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                dateFormat="dd-MM-yyyy"
                                                showYearDropdown
                                                showMonthDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                                                portalId="root"
                                            />
                                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                            Period End
                                        </label>
                                        <div className="relative">
                                            <DatePicker
                                                selected={runFormData.period_end ? new Date(runFormData.period_end) : null}
                                                onChange={(date) => setRunFormData(prev => ({ ...prev, period_end: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                dateFormat="dd-MM-yyyy"
                                                showYearDropdown
                                                showMonthDropdown
                                                dropdownMode="select"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                                                portalId="root"
                                            />
                                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={runLoading}
                                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-[13px] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-70"
                                    >
                                        {runLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Re-initialize Confirmation Modal */}
            <ConfirmationModal
                isOpen={isReinitModalOpen}
                onClose={() => {
                    setIsReinitModalOpen(false);
                    setRunToReinit(null);
                }}
                onConfirm={async () => {
                    toast.success('Payroll run re-initialized successfully');
                    setIsReinitModalOpen(false);
                    setRunToReinit(null);
                    fetchData(pagination.page);
                }}
                title="Re-initialize Payroll"
                confirmText="Re-initialize"
                type="warning"
                message={`Are you sure you want to re-initialize "${runToReinit?.batch_name}"? This will reset all existing progress for this run.`}
            />
        </div>
    );
}
