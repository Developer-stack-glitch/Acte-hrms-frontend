import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, TrendingUp, History,
    Eye, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
    getRegularisationCountsApi,
    getRegularisationsApi,
    updateRegularisationStatusApi
} from '../../Action/api';
import FullPageLoader from '../../Common/FullPageLoader';
import toast from 'react-hot-toast';
import Tooltip from '../../Common/Tooltip';

const ReasonModal = ({ isOpen, onClose, request }) => {
    if (!request) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
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
                        className="bg-white rounded-[15px] w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-semibold text-gray-900">Request Details</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[12px] font-semibold text-gray-600 block">Employee</span>
                                    <p className="font-semibold text-gray-800 mt-1">{request.employee_name}</p>
                                </div>
                                <div>
                                    <span className="text-[12px] font-semibold text-gray-600 block">Date</span>
                                    <p className="font-semibold text-gray-800 mt-1">{format(parseISO(request.date), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-[12px] font-semibold text-gray-600 block">Shift Time</span>
                                <p className="font-semibold text-gray-800 mt-1">{request.check_in?.substring(0, 5)} - {request.check_out?.substring(0, 5)}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-[12px] font-semibold text-gray-600 block mb-1">Reason</span>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">"{request.reason}"</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-all mt-2"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

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

const StatCard = ({ label, value, color, icon: Icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-[13px] border border-gray-200 hover:shadow-gray-200/40 transition-all group"
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl ${color.bg} flex items-center justify-center ${color.text} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
            </div>
            <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-600">
                Analytics <TrendingUp size={12} />
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-3xl font-semibold text-gray-900 leading-tight">{value}</h3>
            <p className="text-[15px] font-semibold text-gray-600">{label}</p>
        </div>
    </motion.div>
);

const ManageRegularisationsOverview = ({ onApplyQuickly, onViewAll }) => {
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ Requested: 0, Pending: 0, Approved: 0, Rejected: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [requestToReject, setRequestToReject] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role;
    const userId = userInfo._id || userInfo.id;

    const isManagerRole = useMemo(() =>
        userRole === 'admin' || userRole === 'superadmin' ||
        recentRequests.some(r => String(r.user_id) !== String(userId))
        , [userRole, recentRequests, userId]);

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        try {
            setLoading(true);
            const [countsRes, recentRes] = await Promise.all([
                getRegularisationCountsApi(),
                getRegularisationsApi({
                    limit: 5,
                    ...(userRole !== 'admin' && userRole !== 'superadmin' ? {
                        reporting_manager: userId,
                        personal_user_id: userId
                    } : {})
                })
            ]);
            setCounts(countsRes.data || { Requested: 0, Pending: 0, Approved: 0, Rejected: 0 });
            setRecentRequests(recentRes.data || []);
        } catch (error) {
            console.error('Error fetching regularisation overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, rejectionReason = '') => {
        try {
            setLoading(true);
            await updateRegularisationStatusApi(id, { status, rejection_reason: rejectionReason });
            toast.success(`Request ${status.toLowerCase()}ed successfully`);
            setIsRejectionModalOpen(false);
            setRequestToReject(null);
            fetchOverviewData();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-3">
            <FullPageLoader isLoading={loading && recentRequests.length > 0} message="Loading overview..." />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
                <StatCard
                    label={isManagerRole ? "Team Requests" : "Requested"} value={counts.Requested}
                    color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                    icon={History} delay={0.1}
                />
                <StatCard
                    label={isManagerRole ? "Awaiting Action" : "Pending"} value={counts.Pending}
                    color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                    icon={AlertCircle} delay={0.2}
                />
                <StatCard
                    label={isManagerRole ? "Approved Recently" : "Approved"} value={counts.Approved}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                    icon={CheckCircle2} delay={0.3}
                />
                <StatCard
                    label={isManagerRole ? "Rejected Recently" : "Rejected"} value={counts.Rejected}
                    color={{ bg: 'bg-rose-50', text: 'text-rose-600' }}
                    icon={XCircle} delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* quick Action & Policy Info */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-[15px] bg-primary text-white space-y-6 relative overflow-hidden group shadow-md shadow-primary/20"
                    >
                        <div className="relative z-10 space-y-4 mb-0">
                            <h4 className="text-2xl font-semibold leading-tight tracking-tight">Missed a punch?<br />Regularise it now.</h4>
                            <p className="text-white/70 text-sm font-medium leading-relaxed">Ensure your attendance record is accurate for payroll processing.</p>
                            <button
                                onClick={onApplyQuickly}
                                className="px-6 py-3 bg-white text-primary rounded-full font-semibold text-sm transition-all hover:bg-gray-50 active:scale-95 flex items-center gap-2 group/btn"
                            >
                                Apply Now
                                <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                        <Clock className="absolute top-[-20px] right-[-20px] w-48 h-48 text-white/5 -rotate-12" />
                    </motion.div>

                    <div className="p-4 rounded-[15px] border border-gray-200 bg-white space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 font-semibold uppercase tracking-wider text-[16px]">
                            <AlertCircle size={16} className="text-primary" />
                            Good to know
                        </div>
                        <ul className="space-y-3">
                            {[
                                "Regularisation must be applied within 7 days.",
                                "Approval takes 24-48 working hours.",
                                "Misuse may lead to policy violations."
                            ].map((rule, i) => (
                                <li key={i} className="flex gap-3 text-[13px] font-medium text-gray-500 leading-tight">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/20 mt-1.5 shrink-0" />
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                <History size={20} />
                            </div>
                            <h4 className="font-semibold text-gray-900 tracking-tight">
                                {isManagerRole && recentRequests.some(r => String(r.user_id) !== String(userId)) ? 'Team Action Items' : 'Recent Activity'}
                            </h4>
                        </div>
                        <button
                            onClick={onViewAll}
                            className="text-[12px] font-semibold text-primary hover:opacity-70 transition-opacity"
                        >
                            View All Requests
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {recentRequests.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {recentRequests.map((req, i) => (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg font-semibold text-gray-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                {req.employee_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-sm text-gray-700 leading-tight flex items-center gap-2">
                                                    {String(req.user_id) === String(userId) ? (
                                                        <>
                                                            {`Correction for ${format(parseISO(req.date), 'MMM dd')}`}
                                                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold uppercase tracking-wider">Self</span>

                                                        </>
                                                    ) : (
                                                        <>
                                                            {req.employee_name}
                                                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider">Team</span>
                                                        </>
                                                    )}
                                                </h5>
                                                <p className="text-[12px] font-semibold text-gray-500 mt-0.5">
                                                    {String(req.user_id) !== String(userId) && `${format(parseISO(req.date), 'MMM dd')} • `}
                                                    {req.reason?.length > 40 ? `${req.reason?.substring(0, 40)}...` : req.reason}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full border text-[12px] font-semibold ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                {req.status}
                                            </div>

                                            <Tooltip text="View Details">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </Tooltip>

                                            {(userRole === 'admin' || userRole === 'superadmin' || String(req.reporting_manager) === String(userId)) && req.status === 'Pending' && String(req.user_id) !== String(userId) && (
                                                <div className="flex items-center gap-2 border-l pl-3 ml-1 border-gray-100">
                                                    <Tooltip text="Approve">
                                                        <button
                                                            onClick={() => handleStatusUpdate(req.id, 'Approved')}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-all"
                                                        >
                                                            <Check size={18} strokeWidth={3} />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip text="Reject">
                                                        <button
                                                            onClick={() => {
                                                                setRequestToReject(req);
                                                                setIsRejectionModalOpen(true);
                                                            }}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                                        >
                                                            <X size={18} strokeWidth={3} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3 opacity-50">
                                <History size={48} className="text-gray-200" />
                                <p className="text-sm font-bold text-gray-400">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReasonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
            />

            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onConfirm={(reason) => handleStatusUpdate(requestToReject?.id, 'Rejected', reason)}
                loading={loading}
            />
        </div>
    );
};

export default ManageRegularisationsOverview;
