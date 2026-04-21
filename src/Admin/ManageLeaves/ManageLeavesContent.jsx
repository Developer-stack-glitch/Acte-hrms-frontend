import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    RefreshCcw,
    CheckCircle2,
    Clock,
    Users,
    Calendar,
    ArrowUpRight,
    PieChart as PieChartIcon,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isToday, addMonths } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLeavesApi, updateLeaveApi, getUsersApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X } from 'lucide-react';
import { ManageLeavesSkeleton } from '../../Common/CommonSkeletonLoader/LeaveSkeleton';
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
                        className="flex-1 px-4 py-2 border border-gray-100 text-gray-600 font-medium rounded-full hover:bg-gray-50"
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

const StatCard = ({ title, value, icon: Icon, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-[15px] border border-gray-200 transition-all group"
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl ${color.bg} ${color.text} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} />
                <span>+12%</span>
            </div>
        </div>
        <div>
            <h3 className="text-gray-500 text-[15px] font-semibold mb-1">{title}</h3>
            <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
        </div>
    </motion.div>
);

export default function ManageLeavesContent({ onViewAll }) {
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo._id || userInfo.id;

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd'));
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [employeeCount, setEmployeeCount] = useState(0);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params = {
                limit: 1000,
                startDate,
                endDate,
                ...((userRole === 'admin' || userRole === 'superadmin') ? {} :
                    {
                        reporting_manager: userId,
                        personal_user_id: userId,
                        team_lead_id: userInfo.team_lead === 'yes' ? userId : null
                    })
            };
            const response = await getLeavesApi(params); // Get more for dashboard stats
            setLeaves(response.data.leaves || []);

            // Fetch employee count
            if (userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes') {
                const userParams = {
                    limit: 1,
                    ...(userInfo.team_lead === 'yes' ? { department: userInfo.department } : {})
                };
                const usersResponse = await getUsersApi(userParams);
                setEmployeeCount(usersResponse.data.total || 0);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
            toast.error('Failed to sync leave analytics');
        } finally {
            setLoading(false);
        }
    };

    const isManagerRole = useMemo(() => {
        return userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes' ||
            leaves.some(l => String(l.reporting_manager) === String(userId) && String(l.employee_id) !== String(userId));
    }, [userRole, userInfo.team_lead, leaves, userId]);

    useEffect(() => {
        fetchLeaves();
    }, [startDate, endDate]);

    const handleReset = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const stats = useMemo(() => {
        const pending = leaves.filter(l => l.status === 'Pending').length;
        const approvedToday = leaves.filter(l => l.status === 'Approved' && isToday(new Date(l.updated_at))).length;
        const totalThisMonth = leaves.filter(l => {
            const date = new Date(l.start_date);
            return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
        }).length;
        const totalApproved = leaves.filter(l => l.status === 'Approved').length;

        return { pending, approvedToday, totalThisMonth, totalApproved };
    }, [leaves]);

    const chartData = useMemo(() => {
        const counts = {};
        leaves.forEach(l => {
            counts[l.leave_type] = (counts[l.leave_type] || 0) + 1;
        });
        return Object.keys(counts).map(name => ({ name, value: counts[name] }));
    }, [leaves]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const handleAction = async (leave, status, rejection_reason = null) => {
        try {
            setActionLoading(true);
            await updateLeaveApi(leave.id, { ...leave, status, rejection_reason, approved_by: userId });
            toast.success(`Request ${status.toLowerCase()} successfully`);
            setRejectModalOpen(false);
            setSelectedLeave(null);
            fetchLeaves();
        } catch (error) {
            toast.error('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const onRejectClick = (leave) => {
        setSelectedLeave(leave);
        setRejectModalOpen(true);
    };

    const displayLeaves = useMemo(() => {
        return leaves.filter(l => {
            const isMyRequest = String(l.employee_id) === String(userId);
            const isManagedRequest = String(l.reporting_manager) === String(userId) || String(l.team_lead_id) === String(userId);
            const canAction = userRole === 'superadmin' || userRole === 'admin' || isManagedRequest;

            // On dashboard, if manager, show pending requests from reportees. 
            // If normal employee, show all my requests.
            const matchesStatus = isManagerRole
                ? (l.status === 'Pending' && canAction && !isMyRequest)
                : isMyRequest;

            const matchesSearch = !searchTerm ||
                l.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.leave_type?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        }).slice(0, 5);
    }, [leaves, searchTerm, userRole, userId, isManagerRole]);

    if (loading) return <ManageLeavesSkeleton />;

    return (
        <div className="flex flex-col gap-6 p-4 bg-gray-50/50 min-h-full">
            <FullPageLoader isLoading={loading && leaves.length > 0} message="Syncing Leave Analytics..." />
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {(userRole === 'admin' || userRole === 'superadmin') ? 'Leave Workspace' : isManagerRole ? 'Team Leave Workspace' : 'My Leave Workspace'}
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium">
                        {(userRole === 'admin' || userRole === 'superadmin') ? 'Approval dashboard and leave distribution analytics' :
                            isManagerRole ? 'Comprehensive overview of team leaves and pending approvals' :
                                'Overview of your leave applications and personal analytics'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filters */}
                    <div className="w-full sm:w-auto flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                        <div className="flex items-center gap-2 px-2 group">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">From</span>
                            <div className="relative flex items-center gap-1">
                                <DatePicker
                                    selected={startDate ? new Date(startDate) : null}
                                    onChange={(date) => setStartDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                    showYearDropdown
                                    showMonthDropdown
                                    dropdownMode="select"
                                    dateFormat="yyyy-MM-dd"
                                    className="bg-transparent border-none text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[100px]"
                                    placeholderText="Start Date"
                                    portalId="root"
                                />
                                <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                        <div className="w-[1px] h-4 bg-gray-200"></div>
                        <div className="flex items-center gap-2 px-2 group">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">To</span>
                            <div className="relative flex items-center gap-1">
                                <DatePicker
                                    selected={endDate ? new Date(endDate) : null}
                                    onChange={(date) => setEndDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                    showYearDropdown
                                    showMonthDropdown
                                    dropdownMode="select"
                                    dateFormat="yyyy-MM-dd"
                                    className="bg-transparent border-none text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[100px]"
                                    placeholderText="End Date"
                                    portalId="root"
                                />
                                <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Find requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-primary rounded-full text-[14px] font-medium outline-none w-48 lg:w-64 focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>

                        <button
                            onClick={handleReset}
                            className="p-2.5 text-gray-400 hover:text-primary transition-all rounded-xl hover:bg-primary/5 border border-gray-200 hover:border-primary/20 bg-white"
                            title="Reset Filters"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={isManagerRole ? 'Pending Approvals' : 'My Pending'}
                    value={stats.pending}
                    icon={Clock}
                    color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                    delay={0.1}
                />
                <StatCard
                    title={isManagerRole ? 'Approved Recently' : 'Approved Recently'}
                    value={stats.approvedToday}
                    icon={CheckCircle2}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                    delay={0.2}
                />
                <StatCard
                    title={isManagerRole ? 'Team Requests (Mo)' : 'Month\'s Applications'}
                    value={stats.totalThisMonth}
                    icon={Calendar}
                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                    delay={0.3}
                />
                <StatCard
                    title={isManagerRole ? 'Total Approvals' : 'Total Approved'}
                    value={isManagerRole ? stats.totalApproved : stats.totalApproved}
                    icon={CheckCircle2}
                    color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Approval Workbench / My Requests */}
                <div className="lg:col-span-2 bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${(userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes') ? 'bg-orange-50 text-orange-600' : 'bg-primary/10 text-primary'} flex items-center justify-center`}>
                                {(userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes') ? <Clock size={20} /> : <Calendar size={20} />}
                            </div>
                            <h3 className="font-semibold text-gray-900">
                                {isManagerRole ? 'Team Approvals' : 'Recent Applications'}
                            </h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 rounded-full text-[11px] font-semibold text-gray-400">
                            {isManagerRole ? 'Pending Tasks' : 'Latest 5'}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {displayLeaves.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {displayLeaves.map((leave, idx) => (
                                    <motion.div
                                        key={leave.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-4 hover:bg-gray-50/50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-semibold relative overflow-hidden group-hover:bg-primary group-hover:text-white transition-all">
                                                    {leave.employee_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">{leave.employee_name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[12px] text-gray-500 font-medium">{leave.leave_type} • {leave.emp_id}</p>
                                                        {leave.is_half_day ? (
                                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-medium uppercase tracking-tighter border border-amber-100/50">
                                                                {leave.half_day_period} HD
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(userRole === 'superadmin' || userRole === 'admin' || String(leave.team_lead_id) === String(userId) || String(leave.reporting_manager) === String(userId)) && String(leave.employee_id) !== String(userId) ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(leave, 'Approved')}
                                                            className="px-4 py-1 bg-emerald-50 text-emerald-600 rounded-xl font-medium text-[12px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => onRejectClick(leave)}
                                                            className="px-4 py-1 bg-rose-50 text-rose-600 rounded-xl font-medium text-[12px] hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-4 py-1.5 rounded-xl font-semibold text-[12px] ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                        leave.status === 'Rejected' ? 'bg-rose-50 text-red-600' :
                                                            'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {leave.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 p-2 bg-gray-50 rounded-xl text-[12px] text-gray-600 font-medium border border-gray-100 italic">
                                            "{leave.reason}"
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <div className="p-4 bg-gray-50 rounded-full">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <p className="font-semibold">
                                    {(userRole === 'admin' || userRole === 'superadmin' || userInfo.team_lead === 'yes') ? 'No pending requests to manage!' : 'No applications found!'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
                        <button
                            onClick={onViewAll}
                            className="text-[12px] font-bold text-primary hover:underline flex items-center gap-2 mx-auto"
                        >
                            View All Requests <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Analytics Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[15px] border border-gray-200 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <PieChartIcon size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900">
                                {isManagerRole ? 'Leave Analytics' : 'My Leave Distribution'}
                            </h3>
                        </div>

                        <div className="h-[250px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-[12px] italic">
                                    No data available for chart
                                </div>
                            )}
                        </div>

                        <div className="mt-10 space-y-3">
                            <h4 className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest px-1">
                                {userRole === 'employee' ? 'My Categories' : 'Top Leave Categories'}
                            </h4>
                            {chartData.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-[10px] border border-transparent hover:border-gray-100 transition-all">
                                    <span className="text-[13px] font-semibold text-gray-700">{item.name}</span>
                                    <span className="text-[13px] font-black text-primary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <RejectionModal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onConfirm={(note) => handleAction(selectedLeave, 'Rejected', note)}
                loading={actionLoading}
            />
        </div>
    );
}
