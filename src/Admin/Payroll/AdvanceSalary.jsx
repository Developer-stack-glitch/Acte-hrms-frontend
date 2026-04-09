import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    HandCoins,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    Loader2,
    X,
    ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getAdvanceSalariesApi,
    getMyAdvanceSalariesApi,
    createAdvanceSalaryApi,
    updateAdvanceSalaryStatusApi,
} from '../../Action/api';
import toast from 'react-hot-toast';
import DataTable from '../../Common/DataTable';
import { FormInput, FormSelect, FormTextarea } from '../../Common/Form';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white rounded-[12px] p-4 border border-gray-200 transition-all group overflow-hidden relative"
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color.bg} opacity-10 group-hover:scale-125 transition-transform duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <h3 className="text-[15px] md:text-[24px] font-semibold text-gray-900">
                    {value}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#2a2a2a]/60 uppercase tracking-widest leading-tight">
                    {title} {subValue && <span className="text-gray-400">({subValue})</span>}
                </p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform shrink-0`}>
                <Icon size={24} />
            </div>
        </div>
    </motion.div>
);

export default function AdvanceSalary() {
    const [filterTab, setFilterTab] = useState('All');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminComment, setAdminComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [amountSortOrder, setAmountSortOrder] = useState('DESC');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const navigate = useNavigate();
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const isAdmin = userInfo.role === 'admin' || userInfo.role === 'superadmin';

    // Mock stats for demo purposes
    const stats = useMemo(() => {
        const approved = requests.filter(r => r.status === 'Approved' || r.status === 'Paid').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        const pending = requests.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        return {
            totalApproved: approved.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            totalPending: pending.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            requestCount: requests.length,
            activeAdvance: requests.filter(r => r.status === 'Approved').length
        };
    }, [requests]);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const apiCall = isAdmin ? getAdvanceSalariesApi : getMyAdvanceSalariesApi;
            const res = await apiCall({
                page,
                limit: pagination.pageSize,
                status: filterTab !== 'All' ? filterTab : undefined,
                search: searchTerm.trim() || undefined,
                sortBy: 'amount',
                sortOrder: amountSortOrder
            });

            if (res.data) {
                setRequests(res.data.data || res.data || []);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: res.data.total || (res.data.data ? res.data.data.length : res.data.length)
                }));
            }
        } catch (error) {
            console.error('Failed to fetch advance salary requests:', error);
            // Fallback for visual demo if API fails
            setRequests([
                { id: 1, employee_name: 'John Doe', amount: 50000, request_date: '2025-03-10', status: 'Pending', reason: 'Medical Emergency', repayment_months: 5 },
                { id: 2, employee_name: 'Jane Smith', amount: 30000, request_date: '2025-03-05', status: 'Approved', reason: 'Higher Education', repayment_months: 3 },
                { id: 3, employee_name: 'Bob Wilson', amount: 15000, request_date: '2025-03-01', status: 'Paid', reason: 'Personal Use', repayment_months: 1 },
                { id: 4, employee_name: 'Alice Brown', amount: 20000, request_date: '2025-02-25', status: 'Rejected', reason: 'Invalid Purpose', repayment_months: 2 },
            ].filter(r => filterTab === 'All' || r.status === filterTab));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterTab, amountSortOrder]);

    const handleAction = async (id, status) => {
        if (status === 'Rejected' && !adminComment.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        try {
            await updateAdvanceSalaryStatusApi(id, { status, admin_comments: adminComment });
            toast.success(`Request ${status.toLowerCase()} successfully`);
            setIsReviewModalOpen(false);
            setAdminComment('');
            fetchData(pagination.current);
        } catch (error) {
            toast.error('Failed to update request status');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        ...(isAdmin ? [{
            header: 'Employee',
            key: 'employee_name',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]">
                        {val?.charAt(0) || 'E'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-gray-900">{val}</span>
                        <span className="text-[11px] text-gray-400 font-medium">EMP-#{row.user_id || row.id}</span>
                    </div>
                </div>
            )
        }] : []),
        {
            header: 'Amount',
            key: 'amount',
            render: (val) => (
                <span className="text-[14px] font-semibold text-gray-900">
                    {parseFloat(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </span>
            )
        },
        {
            header: 'Period',
            key: 'repayment_months',
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-[13px] font-medium text-gray-600">{val} Months</span>
                </div>
            )
        },
        {
            header: 'Request Date',
            key: 'request_date',
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-[13px] font-medium text-gray-600">
                        {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${val === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    val === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        val === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                    {val}
                </span>
            )
        },
        {
            header: 'Reason',
            key: 'reason',
            render: (val) => (
                <p className="text-[13px] text-gray-500 max-w-[200px] truncate" title={val}>
                    {val}
                </p>
            )
        }
    ];

    return (
        <div className="space-y-6 px-2">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Advance Salary</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                        {isAdmin ? 'Manage and review staff advance salary requests' : 'Apply for and track your advance salary requests'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!isAdmin && (
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium text-[14px] shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            New Request
                        </button>
                    )}
                    <button onClick={() => navigate('/policies')} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium text-[14px] hover:bg-gray-50 transition-all">
                        Policy Guide
                        <ArrowUpRight size={16} className="text-primary" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={isAdmin ? "Total Approved" : "My Approved Advance"}
                    value={stats.totalApproved}
                    icon={CheckCircle2}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                    delay={0.1}
                />
                <StatCard
                    title={isAdmin ? "Pending Requests" : "My Pending Amount"}
                    value={stats.totalPending}
                    icon={Clock}
                    color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                    delay={0.2}
                />
                <StatCard
                    title={isAdmin ? "Active Advances" : "Approved Requests"}
                    value={stats.activeAdvance}
                    subValue={isAdmin ? "Across Staff" : "Total Count"}
                    icon={HandCoins}
                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                    delay={0.3}
                />
                <StatCard
                    title={isAdmin ? "Next Deduction" : "Monthly EMI"}
                    value="₹ 0.00"
                    icon={TrendingDown}
                    color={{ bg: 'bg-rose-50', text: 'text-rose-600' }}
                    delay={0.4}
                />
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-semibold text-gray-900 text-lg">{isAdmin ? "All Multi-Advance Requests" : "My Salary Advance History"}</h2>
                        <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />
                        <div className="flex items-center bg-gray-50 p-1 rounded-full border border-gray-200 shadow-inner">
                            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
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

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search employees..."
                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px] shadow-xs"
                            />
                        </div>
                        <button
                            onClick={() => setAmountSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                            className={`px-4 py-2 border rounded-full transition-all flex items-center gap-2 text-[13px] font-medium ${amountSortOrder === 'ASC' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-primary'
                                }`}
                            title="Sort by Amount"
                        >
                            <ArrowUpDown size={16} />
                            <span className="hidden md:inline">Amount</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <DataTable
                        columns={columns}
                        data={requests}
                        isLoading={loading}
                        onView={(row) => {
                            setSelectedRequest(row);
                            setAdminComment('');
                            setIsReviewModalOpen(true);
                        }}
                        pagination={{
                            ...pagination,
                            onChange: (page) => fetchData(page),
                            onPageSizeChange: (size) => setPagination(prev => ({ ...prev, pageSize: size }))
                        }}
                        emptyMessage={isAdmin ? "No advance salary requests found from staff" : "You haven't applied for any salary advances yet"}
                    />
                </div>
            </div>

            {/* Request Modal (For Employees) */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <Modal onClose={() => setIsRequestModalOpen(false)} title="New Advance Salary Request">
                        <RequestForm
                            onClose={() => setIsRequestModalOpen(false)}
                            onRefresh={() => fetchData(1)}
                        />
                    </Modal>
                )}
            </AnimatePresence>

            {/* Review Modal (For Admins) */}
            <AnimatePresence>
                {isReviewModalOpen && selectedRequest && (
                    <Modal onClose={() => setIsReviewModalOpen(false)} title="Advance Request Details">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Employee Name" value={selectedRequest.employee_name} />
                                <DetailItem label="Amount Requested" value={`₹ ${selectedRequest.amount}`} />
                                <DetailItem label="Repayment Period" value={`${selectedRequest.repayment_months} Months`} />
                                <DetailItem label="Request Date" value={new Date(selectedRequest.request_date).toLocaleDateString()} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-600 uppercase tracking-widest">Reason for Advance</label>
                                <div className="p-3 bg-gray-50 rounded-[10px] text-[14px] text-gray-700 leading-relaxed border border-gray-100 font-medium mt-2">
                                    {selectedRequest.reason}
                                </div>
                            </div>

                            {selectedRequest.admin_comments && (
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-gray-600 uppercase tracking-widest">Admin Remarks</label>
                                    <div className="p-3 bg-gray-50 rounded-[10px] text-[14px] text-gray-700 leading-relaxed border border-gray-100 font-medium mt-2">
                                        {selectedRequest.admin_comments}
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === 'Pending' && isAdmin && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-semibold text-gray-600 uppercase tracking-widest">Admin Remarks / Rejection Reason</label>
                                        <FormTextarea
                                            placeholder="Add a reason for approval or rejection..."
                                            value={adminComment}
                                            onChange={(e) => setAdminComment(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => handleAction(selectedRequest.id, 'Rejected')}
                                            disabled={actionLoading}
                                            className="flex items-center gap-2 px-6 py-2.5 text-rose-600 font-medium text-[14px] hover:bg-rose-50 rounded-full transition-all"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedRequest.id, 'Approved')}
                                            disabled={actionLoading}
                                            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white font-medium text-[14px] rounded-full shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                                        >
                                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Approve Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub-components for cleaner structure
const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[15px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
        >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
                {children}
            </div>
        </motion.div>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div className="space-y-2">
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[15px] font-semibold text-gray-900">{value}</p>
    </div>
);

const RequestForm = ({ onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        amount: '',
        repayment_months: '1',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.reason) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await createAdvanceSalaryApi({
                ...formData,
                request_date: new Date().toISOString()
            });
            toast.success('Advance salary request submitted successfully');
            onRefresh();
            onClose();
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Request Amount (₹)</label>
                    <FormInput
                        isNumber={true}
                        placeholder="e.g. 25000"
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        required
                    />
                </div>
                <FormSelect
                    label="Repayment Period"
                    value={formData.repayment_months}
                    onChange={(e) => setFormData(p => ({ ...p, repayment_months: e.target.value }))}
                    options={[
                        { value: '1', label: '1 Month' },
                        { value: '2', label: '2 Months' },
                        { value: '3', label: '3 Months' },
                        { value: '6', label: '6 Months' },
                        { value: '12', label: '12 Months' }
                    ]}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Reason for Advance</label>
                <FormTextarea
                    rows={4}
                    placeholder="Briefly explain why you need this advance..."
                    value={formData.reason}
                    onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                    required
                />
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                <HandCoins size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
                    <span className="font-bold">Note:</span> Approved amount will be deducted from your monthly salary in equal installments as per policy.
                </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-500 font-medium text-[13px] hover:bg-gray-100 rounded-full transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white font-medium text-[13px] rounded-full shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-70"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Submit Request
                </button>
            </div>
        </form>
    );
};