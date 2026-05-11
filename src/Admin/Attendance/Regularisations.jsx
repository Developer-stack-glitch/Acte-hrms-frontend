import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, RefreshCcw, Clock, Calendar, AlertCircle,
    CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { getRegularisationsApi, updateRegularisationStatusApi, getRegularisationCountsApi } from '../../Action/api';
import NoData from '../../Common/NoData';
import FullPageLoader from '../../Common/FullPageLoader';
import DataTable from '../../Common/DataTable';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Tooltip from '../../Common/Tooltip';

const RejectionModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) setReason('');
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return toast.error('Please provide a rejection reason');
        onConfirm(reason);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[15px] w-full max-w-md overflow-hidden shadow-md relative z-10 p-8 space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 leading-tight">Reason for Rejection</h3>
                            <p className="text-sm font-medium text-gray-500">Please provide a valid reason for declining this request.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Example: Incorrect punch timings, proof missing..."
                                className="w-full py-4 px-5 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/2 focus:border-primary outline-none transition-all font-semibold text-gray-800 min-h-[120px] resize-none"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all shadow-sm shadow-red-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'Rejecting...' : 'Confirm Reject'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const ReasonModal = ({ isOpen, onClose, request }) => {
    if (!request || !isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                    <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                            {request.employee_name?.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">{request.employee_name}</h4>
                            <p className="text-sm text-gray-500">{request.emp_id}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl">
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Date</span>
                            <p className="text-[13px] font-semibold text-gray-700">{format(parseISO(request.date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Shift Time</span>
                            <p className="text-[13px] font-semibold text-gray-700">{request.check_in?.substring(0, 5)} - {request.check_out?.substring(0, 5)}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <span className="text-[11px] font-bold text-gray-400 uppercase mb-1 block">Reason</span>
                        <p className="text-[13px] text-gray-600 font-medium leading-relaxed italic">"{request.reason}"</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

const Regularisations = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('regularisations_searchTerm') || '');
    const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('regularisations_statusFilter') || 'All');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [requestToReject, setRequestToReject] = useState(null);
    const [counts, setCounts] = useState({ All: 0, Pending: 0, Approved: 0, Rejected: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRequestForReason, setSelectedRequestForReason] = useState(null);
    const [reasonModalOpen, setReasonModalOpen] = useState(false);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo._id || userInfo.id;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const isReportingManager = useMemo(() => requests.some(r => String(r.reporting_manager) === String(userId) && String(r.user_id) !== String(userId)), [requests, userId]);

    useEffect(() => {
        localStorage.setItem('regularisations_searchTerm', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('regularisations_statusFilter', statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        fetchRequests();
    }, [refreshKey, statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {
                ...(statusFilter !== 'All' ? { status: statusFilter } : {}),
                ...(userRole !== 'admin' && userRole !== 'superadmin' ? { reporting_manager: userId, personal_user_id: userId } : {})
            };
            const [res, countsRes] = await Promise.all([
                getRegularisationsApi(params),
                getRegularisationCountsApi()
            ]);
            setRequests(res.data || []);
            setCounts({
                All: countsRes.data?.Requested || 0,
                Pending: countsRes.data?.Pending || 0,
                Approved: countsRes.data?.Approved || 0,
                Rejected: countsRes.data?.Rejected || 0
            });
        } catch (error) {
            console.error('Error fetching regularisations:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, rejectionReason = null) => {
        try {
            await updateRegularisationStatusApi(id, { status, rejection_reason: rejectionReason });
            toast.success(`Request ${status.toLowerCase()} successfully`);
            setIsRejectionModalOpen(false);
            setRequestToReject(null);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req =>
            req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requests, searchTerm]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-orange-50 text-orange-600 border-orange-100';
        }
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
                            <div className="flex items-center gap-1.5">
                                {String(row.user_id) === String(userId) ? (
                                    <>
                                        <span className="text-[13px] font-semibold text-gray-800">{val}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider border border-blue-100">Self</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[13px] font-semibold text-gray-800">{val}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-100">Team</span>
                                    </>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-500">{row.emp_id}</span>
                        </div>
                    </div>
                )
            },
            {
                header: 'Date',
                key: 'date',
                render: (val) => (
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                        <Calendar size={14} className="text-primary/60" />
                        {format(parseISO(val), 'MMM dd, yyyy')}
                    </div>
                )
            },
            {
                header: 'Correction',
                key: 'shift_time',
                render: (val, row) => (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                            <Clock size={14} className="text-primary/60" />
                            {row.check_in?.substring(0, 5)} - {row.check_out?.substring(0, 5)}
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">Punch In/Out Update</span>
                    </div>
                )
            },
            {
                header: 'Reason',
                key: 'reason',
                render: (val, row) => {
                    const limit = 30;
                    const isLong = val && val.length > limit;
                    return (
                        <div className="flex flex-col max-w-[200px]">
                            <span className="text-[13px] text-gray-600 truncate font-medium">
                                {isLong ? `${val.substring(0, limit)}...` : (val || 'N/A')}
                            </span>
                            {isLong && (
                                <button
                                    onClick={() => {
                                        setSelectedRequestForReason(row);
                                        setReasonModalOpen(true);
                                    }}
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
                render: (val, row) => (
                    <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border w-fit ${getStatusColor(val)}`}>
                            {val}
                        </span>
                        {row.rejection_reason && (
                            <span className="text-[10px] text-rose-500 font-medium italic mt-1 max-w-[150px] break-words">
                                Note: {row.rejection_reason}
                            </span>
                        )}
                    </div>
                )
            }
        ];

        const isManagerForAny = requests.some(r =>
            (isAdmin || String(r.reporting_manager) === String(userId)) &&
            r.status === 'Pending' && String(r.user_id) !== String(userId)
        );

        if (isAdmin || isManagerForAny) {
            cols.push({
                header: 'Actions',
                key: 'actions',
                render: (val, row) => (
                    <div className="flex items-center gap-2">
                        {row.status === 'Pending' && String(row.user_id) !== String(userId) && (isAdmin || String(row.reporting_manager) === String(userId)) && (
                            <>
                                <Tooltip text="Approve" position="bottom">
                                    <button
                                        onClick={() => handleStatusUpdate(row.id, 'Approved')}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip text="Reject" position="bottom">
                                    <button
                                        onClick={() => {
                                            setRequestToReject(row);
                                            setIsRejectionModalOpen(true);
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                    >
                                        <X size={16} />
                                    </button>
                                </Tooltip>
                            </>
                        )}
                    </div>
                )
            });
        }

        return cols;
    }, [requests, page, pageSize, isAdmin, userId]);

    if (loading && requests.length === 0) return null; // Or a skeleton

    return (
        <div className="flex flex-col h-full bg-white space-y-0">
            <FullPageLoader isLoading={loading && requests.length > 0} message="Syncing Regularisations..." />

            <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                            {isAdmin || isReportingManager ? 'Team Regularisations' : 'My Regularisations'}
                            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
                                {requests.length} Total
                            </div>
                        </h2>
                        <p className="text-[14px] font-medium text-gray-500 mt-1">
                            {isAdmin || isReportingManager ? 'Review and manage attendance correction requests for your team' : 'Manage and track your attendance correction requests'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-full text-[14px] font-medium outline-none w-64 lg:w-80 focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            className="p-2.5 text-gray-400 hover:text-primary transition-all rounded-xl hover:bg-primary/5 border border-gray-100 hover:border-primary/20 bg-white"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
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
                    data={filteredRequests}
                    isLoading={loading}
                    emptyMessage="No regularisation requests found"
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: filteredRequests.length,
                        onChange: (p) => setPage(p),
                        onPageSizeChange: (s) => {
                            setPageSize(s);
                            setPage(1);
                        }
                    }}
                />
            </div>

            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onConfirm={(reason) => handleStatusUpdate(requestToReject?.id, 'Rejected', reason)}
                loading={loading}
            />

            <ReasonModal
                isOpen={reasonModalOpen}
                onClose={() => setReasonModalOpen(false)}
                request={selectedRequestForReason}
            />
        </div>
    );
};

export default Regularisations;
