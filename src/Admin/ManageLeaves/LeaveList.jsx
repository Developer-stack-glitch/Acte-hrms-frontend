import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    Calendar,
} from 'lucide-react';
import DataTable from '../../Common/DataTable';
import { getLeavesApi, updateLeaveApi, deleteLeaveApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { LeaveListSkeleton } from '../../Common/CommonSkeletonLoader/LeaveSkeleton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import FullPageLoader from '../../Common/FullPageLoader';

const RejectionModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-0">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Rejection Reason</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
                    autoFocus
                />
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-100 text-gray-600 font-semibold rounded-full hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(note)}
                        disabled={loading || !note.trim()}
                        className="flex-1 px-4 py-2 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Confirm Reject
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ReasonModal = ({ isOpen, onClose, reason, title = "Leave Reason" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden p-6"
            >
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="py-2">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {reason || "No reason provided."}
                    </p>
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-all text-sm"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function LeaveList() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd'));
    const [allTotal, setAllTotal] = useState(0);
    const [approvedTotal, setApprovedTotal] = useState(0);
    const [rejectedTotal, setRejectedTotal] = useState(0);
    const [pendingTotal, setPendingTotal] = useState(0);

    const userInfo = React.useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo._id || userInfo.id;

    const isManagerForSome = useMemo(() => leaves && leaves.length > 0 && leaves.some(l => 
        l.reporting_manager && String(l.reporting_manager) === String(userId) && String(l.employee_id) !== String(userId)
    ), [leaves, userId]);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [reasonModal, setReasonModal] = useState({ open: false, content: '', title: '' });

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
                search: debouncedSearch,
                status: statusFilter,
                startDate,
                endDate,
                ...((userRole === 'admin' || userRole === 'superadmin') ? {} :
                    { 
                        reporting_manager: userId, 
                        personal_user_id: userId,
                        team_lead_id: userInfo.team_lead === 'yes' ? userId : null 
                    })
            };
            const response = await getLeavesApi(params);
            setLeaves(response.data.leaves || []);
            setTotal(response.data.total || 0);
            setAllTotal(response.data.counts?.all || 0);
            setApprovedTotal(response.data.counts?.approved || 0);
            setRejectedTotal(response.data.counts?.rejected || 0);
            setPendingTotal(response.data.counts?.pending || 0);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            toast.error('Failed to fetch leave records');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchLeaves();
    }, [page, pageSize, debouncedSearch, statusFilter, startDate, endDate]);

    // Reset page on filter/search change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, startDate, endDate]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
        setPage(1);
    };

    const handleStatusUpdate = async (leave, newStatus, rejection_reason = null) => {
        try {
            setActionLoading(true);
            await updateLeaveApi(leave.id, { ...leave, status: newStatus, rejection_reason, approved_by: userId });
            toast.success(`Leave ${newStatus.toLowerCase()} successfully`);
            setRejectModalOpen(false);
            setSelectedLeave(null);
            fetchLeaves();
        } catch (error) {
            console.error('Error updating leave status:', error);
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const onRejectClick = (leave) => {
        setSelectedLeave(leave);
        setRejectModalOpen(true);
    };

    const handleDelete = (leave) => {
        setLeaveToDelete(leave);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!leaveToDelete) return;
        setIsDeleting(true);
        try {
            await deleteLeaveApi(leaveToDelete.id);
            toast.success('Leave record deleted');
            setDeleteModalOpen(false);
            setLeaveToDelete(null);
            fetchLeaves();
        } catch (error) {
            console.error('Error deleting leave:', error);
            toast.error('Failed to delete record');
        } finally {
            setIsDeleting(false);
        }
    };

    const counts = {
        All: allTotal,
        Approved: approvedTotal,
        Rejected: rejectedTotal,
        Pending: pendingTotal
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    const columns = useMemo(() => {
        const cols = [
            {
                header: 'S. No.',
                key: 'id',
                render: (val, row, idx) => (
                    <span className="text-[13px] font-medium text-gray-600">
                        {((page - 1) * pageSize) + idx + 1}
                    </span>
                )
            },
            {
                header: 'Employee Name',
                key: 'employee_name',
                render: (val, row) => (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-[12px] border border-primary/10">
                            {(val || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-gray-800">{val}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500">{row.emp_id}</span>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                header: 'Leave Type',
                key: 'leave_type',
                render: (val, row) => (
                    <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[12px] font-semibold text-gray-600 border border-gray-200 w-fit">
                            {val}
                        </span>
                        {row.is_half_day ? (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1">
                                {row.half_day_period} Half Day
                            </span>
                        ) : null}
                    </div>
                )
            },
            {
                header: 'Duration',
                key: 'duration',
                render: (val, row) => {
                    const start = new Date(row.start_date);
                    const end = new Date(row.end_date);
                    const diffTime = Math.abs(end - start);
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    if (row.is_half_day) diffDays = 0.5;

                    return (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-bold text-gray-700">
                                    {row.leave_type === 'Permission' ? 'Short Duration' : `${diffDays} ${diffDays === 1 || diffDays === 0.5 ? 'Day' : 'Days'}`}
                                </span>
                                {row.is_half_day ? (
                                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Half Day Application"></span>
                                ) : null}
                            </div>
                            <span className="text-[11px] text-gray-400">
                                {row.leave_type === 'Permission' && row.start_time && row.end_time
                                    ? `${formatDate(row.start_date)} (${row.start_time.slice(0, 5)} - ${row.end_time.slice(0, 5)})`
                                    : `${formatDate(row.start_date)} ${row.is_half_day ? '' : `- ${formatDate(row.end_date)}`}`
                                }
                            </span>
                        </div>
                    );
                }
            },
            {
                header: 'Reason',
                key: 'reason',
                render: (val) => {
                    const limit = 30;
                    const isLong = val && val.length > limit;
                    return (
                        <div className="flex flex-col max-w-[200px]">
                            <span className="text-[13px] text-gray-600 truncate font-medium">
                                {isLong ? `${val.substring(0, limit)}...` : (val || 'N/A')}
                            </span>
                            {isLong && (
                                <button
                                    onClick={() => setReasonModal({ open: true, content: val, title: 'Leave Reason' })}
                                    className="text-[11px] text-primary font-bold hover:underline w-fit mt-1"
                                >
                                    View More
                                </button>
                            )}
                        </div>
                    );
                }
            },
            {
                header: 'Status',
                key: 'status',
                render: (val, row) => {
                    const styles = {
                        'Approved': 'bg-green-50 text-green-600 border-green-100',
                        'Rejected': 'bg-red-50 text-red-600 border-red-100',
                        'Pending': 'bg-amber-50 text-amber-600 border-amber-100'
                    };
                    return (
                        <div className="">
                            <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${styles[val] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                {val}
                            </span><br />
                            {row.rejection_reason && (
                                <span className="text-[10px] text-rose-500 font-medium italic break-words max-w-[150px]">
                                    Note: {row.rejection_reason}
                                </span>
                            )}
                        </div>
                    );
                }
            },
            {
                header: 'Processed By',
                key: 'approved_by_name',
                render: (val, row) => (
                    <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-gray-700">
                            {val || (row.status === 'Pending' ? '-' : 'System')}
                        </span>
                        {row.status !== 'Pending' && (
                            <span className="text-[10px] text-gray-400">
                                {row.status === 'Approved' ? 'Approver' : 'Rejecter'}
                            </span>
                        )}
                    </div>
                )
            }
        ];

        if (userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes' || isManagerForSome) {
            cols.push({
                header: 'Actions',
                key: 'actions',
                render: (val, row) => (
                    <div className="flex items-center gap-2">
                        {row.status === 'Pending' && String(row.employee_id) !== String(userId) && (
                            userRole === 'superadmin' || 
                            userRole === 'admin' || 
                            String(row.team_lead_id) === String(userId) || 
                            String(row.reporting_manager) === String(userId)
                        ) && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(row, 'Approved')}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                        title="Approve"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onRejectClick(row)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        title="Reject"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </>
                            )}
                    </div>
                )
            });
        }

        return cols;
    }, [page, pageSize, userRole, userInfo.team_lead, leaves, userId, isManagerForSome]);

    if (loading) return <LeaveListSkeleton />;

    return (
        <div className="flex flex-col h-full bg-white">
            <FullPageLoader isLoading={loading && leaves.length > 0} message="Syncing Leave Records..." />
            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            {(userRole === 'admin' || userRole === 'superadmin') ? "Leave Management" : (userInfo.team_lead === 'yes' || isManagerForSome) ? "Team Leave Approval" : "My Leave Requests"}
                        </h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">
                            {(userRole === 'admin' || userRole === 'superadmin') ? "Review and manage employee leave requests" :
                                (userInfo.team_lead === 'yes' || isManagerForSome) ? "Review and manage leave requests for your team" :
                                    "Track and manage your leave applications"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Date Filters */}
                        <div className="w-full sm:w-auto flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                            <div className="flex items-center gap-2 px-2 relative group">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">From</span>
                                <div className="relative flex items-center">
                                    <DatePicker
                                        selected={startDate ? new Date(startDate) : null}
                                        onChange={(date) => setStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                        dateFormat="dd/MM/yyyy"
                                        className="bg-transparent border-none text-[13px] font-medium outline-none focus:ring-0 text-gray-600 cursor-pointer w-24"
                                        placeholderText="Start Date"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                                </div>
                            </div>
                            <div className="w-[1px] h-4 bg-gray-200"></div>
                            <div className="flex items-center gap-2 px-2 relative group">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">To</span>
                                <div className="relative flex items-center">
                                    <DatePicker
                                        selected={endDate ? new Date(endDate) : null}
                                        onChange={(date) => setEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                        dateFormat="dd/MM/yyyy"
                                        className="bg-transparent border-none text-[13px] font-medium outline-none focus:ring-0 text-gray-600 cursor-pointer w-24"
                                        placeholderText="End Date"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {(userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes') && (
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className=" pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px]"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleReset}
                                className="p-2.5 text-gray-400 hover:text-primary transition-all rounded-xl hover:bg-primary/5 border border-gray-100 hover:border-primary/20 bg-white"
                                title="Reset All Filters"
                            >
                                <RefreshCcw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4 overflow-x-auto no-scrollbar">
                {[
                    { label: 'All Status', value: 'All', color: 'text-gray-500', activeClass: 'border-slate-300 bg-white' },
                    { label: 'Approved', value: 'Approved', color: 'text-green-600', activeClass: 'border-green-300 bg-green-50' },
                    { label: 'Rejected', value: 'Rejected', color: 'text-red-500', activeClass: 'border-red-300 bg-red-50' },
                    { label: 'Pending', value: 'Pending', color: 'text-orange-500', activeClass: 'border-orange-300 bg-orange-50' }
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setStatusFilter(item.value)}
                        className={`flex items-center gap-3 px-5 py-2.5 bg-white rounded-xl border transition-all duration-200 min-w-fit active:scale-[0.98] ${statusFilter === item.value
                            ? `${item.activeClass}`
                            : 'border-gray-200'
                            }`}
                    >
                        <span className={`text-[13.5px] font-semibold ${statusFilter === item.value ? 'text-gray-900' : 'text-gray-600'}`}>
                            {item.label}
                        </span>
                        <span className={`text-[14px] font-semibold ${item.color}`}>
                            {counts[item.value]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex-1">
                <DataTable
                    columns={columns}
                    data={leaves}
                    isLoading={loading}
                    emptyMessage="No leave requests found"
                    onDelete={userRole === 'superadmin' ? handleDelete : null}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        onChange: (p) => setPage(p),
                        onPageSizeChange: (s) => {
                            setPageSize(s);
                            setPage(1);
                        }
                    }}
                />
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                loading={isDeleting}
                title="Delete Leave Record"
                message="Are you sure you want to delete this leave record? This action cannot be undone."
                type="danger"
            />
            <RejectionModal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onConfirm={(note) => handleStatusUpdate(selectedLeave, 'Rejected', note)}
                loading={actionLoading}
            />
            <ReasonModal
                isOpen={reasonModal.open}
                onClose={() => setReasonModal({ ...reasonModal, open: false })}
                reason={reasonModal.content}
                title={reasonModal.title}
            />
        </div>
    );
}
