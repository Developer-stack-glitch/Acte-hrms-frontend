import React, { useState, useEffect, useMemo } from 'react';
import {
    LifeBuoy, AlertCircle, Clock, CheckCircle2, AlertTriangle, Layers,
    RefreshCcw, Calendar, Plus, X, Search, Filter, ArrowUpRight,
    MessageSquare, User, Building2, Tag, ShieldAlert, Check,
    HelpCircle, ChevronRight, Send
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    getHelpdeskTicketsApi,
    getHelpdeskStatsApi,
    createHelpdeskTicketApi,
    updateHelpdeskStatusApi,
    getUsersApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';
import CommonSelect from '../../Common/CommonSelect';

// Stat Card Matching Asset & Recruitment Overview Style
const HelpdeskStatCard = ({ title, value, subValueLabel, subValue, icon: Icon, color, delay, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            onClick={onClick}
            className={`rounded-[12px] p-4 ${color.bg} border border-white/20 cursor-pointer shadow-lg group relative overflow-hidden flex flex-col justify-between h-full hover:scale-[1.02] active:scale-[0.98] transition-all`}
        >
            <div className="absolute -right-2 -top-2 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-white">{title}</p>
                    <div className="p-2 rounded-lg bg-white/20 text-white backdrop-blur-sm group-hover:rotate-12 transition-transform shadow-inner">
                        <Icon size={20} className="stroke-[2]" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-semibold text-white tracking-tight">
                        {value}
                    </h3>
                </div>

                <div className="mt-auto pt-3 border-t border-white/20 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-white/90">{subValueLabel}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-white">
                                {subValue}
                            </span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-xs font-semibold">{subValue}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function HelpdeskOverview() {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        urgentActive: 0,
        highUrgentTotal: 0,
        resolutionRate: 0,
        categoryBreakdown: [],
        priorityBreakdown: [],
        statusBreakdown: [],
        dailyTrend: []
    });
    const [users, setUsers] = useState([]);

    // Filters
    const [fromDate, setFromDate] = useState(subDays(new Date(), 30).toLocaleDateString('sv-SE'));
    const [toDate, setToDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [statusUpdateData, setStatusUpdateData] = useState({ status: '', resolution_notes: '' });

    // New Ticket Form State
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'HR Support',
        priority: 'Medium',
        user_id: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const CATEGORIES = [
        'HR Support',
        'Payroll & Salary',
        'IT & Devices',
        'Leave & Attendance',
        'Benefits & Policies',
        'Workplace & Facilities',
        'Other'
    ];

    const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
    const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

    useEffect(() => {
        fetchInitialData();
    }, [categoryFilter, priorityFilter, statusFilter, fromDate, toDate]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const params = {
                category: categoryFilter !== 'All' ? categoryFilter : undefined,
                priority: priorityFilter !== 'All' ? priorityFilter : undefined,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                startDate: fromDate,
                endDate: toDate
            };

            const [ticketsRes, statsRes, usersRes] = await Promise.all([
                getHelpdeskTicketsApi(params),
                getHelpdeskStatsApi(params),
                getUsersApi({ limit: 1000 }).catch(() => ({ data: { users: [] } }))
            ]);

            setTickets(ticketsRes.data || []);
            setStats(statsRes.data || {});
            setUsers(usersRes.data?.users || []);
            if (!newTicket.user_id && usersRes.data?.users?.length > 0) {
                setNewTicket(prev => ({ ...prev, user_id: usersRes.data.users[0].id }));
            }
        } catch (error) {
            console.error('Error fetching helpdesk data:', error);
            toast.error('Failed to sync helpdesk insights');
        } finally {
            setLoading(false);
        }
    };

    // Filtered Tickets by local search
    const filteredTickets = useMemo(() => {
        if (!searchTerm) return tickets;
        const q = searchTerm.toLowerCase();
        return tickets.filter(t =>
            t.ticket_code?.toLowerCase().includes(q) ||
            t.subject?.toLowerCase().includes(q) ||
            t.user_name?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q) ||
            t.priority?.toLowerCase().includes(q)
        );
    }, [tickets, searchTerm]);

    // Handle Create Ticket Submit
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await createHelpdeskTicketApi(newTicket);
            toast.success(`Ticket ${res.data.ticket_code} created successfully!`);
            setIsCreateModalOpen(false);
            setNewTicket({
                subject: '',
                category: 'HR Support',
                priority: 'Medium',
                user_id: users[0]?.id || '',
                description: ''
            });
            fetchInitialData();
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Update Status
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!selectedTicket) return;
        try {
            setSubmitting(true);
            await updateHelpdeskStatusApi(selectedTicket.id, statusUpdateData);
            toast.success(`Ticket ${selectedTicket.ticket_code} status updated`);
            setIsStatusModalOpen(false);
            fetchInitialData();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update ticket status');
        } finally {
            setSubmitting(false);
        }
    };

    // Priority Badge Helper
    const getPriorityBadge = (priority) => {
        const styles = {
            Urgent: 'bg-rose-50 text-rose-600 border-rose-200',
            High: 'bg-orange-50 text-orange-600 border-orange-200',
            Medium: 'bg-amber-50 text-amber-600 border-amber-200',
            Low: 'bg-blue-50 text-blue-600 border-blue-200'
        };
        const style = styles[priority] || 'bg-gray-50 text-gray-600 border-gray-200';
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
                {priority}
            </span>
        );
    };

    // Status Badge Helper
    const getStatusBadge = (status) => {
        const styles = {
            Open: 'bg-amber-50 text-amber-600 border-amber-200',
            'In Progress': 'bg-purple-50 text-purple-600 border-purple-200',
            Resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            Closed: 'bg-slate-50 text-slate-600 border-slate-200'
        };
        const style = styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
                {status}
            </span>
        );
    };

    // Status Pie Chart Colors
    const STATUS_COLORS = {
        Open: '#f59e0b',
        'In Progress': '#8b5cf6',
        Resolved: '#10b981',
        Closed: '#64748b'
    };

    // Formatted Status Distribution
    const statusPieData = useMemo(() => {
        const base = [
            { name: 'Open', value: stats.open || 0, color: STATUS_COLORS['Open'] },
            { name: 'In Progress', value: stats.inProgress || 0, color: STATUS_COLORS['In Progress'] },
            { name: 'Resolved', value: stats.resolved || 0, color: STATUS_COLORS['Resolved'] }
        ];
        return base.filter(b => b.value > 0);
    }, [stats]);

    // Formatted Category Breakdown for Chart
    const categoryChartData = useMemo(() => {
        if (!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) {
            return [];
        }
        return stats.categoryBreakdown.map(c => ({
            name: c.category.length > 15 ? c.category.substring(0, 13) + '..' : c.category,
            fullName: c.category,
            Total: parseInt(c.total) || 0,
            Pending: parseInt(c.pending) || 0,
            Resolved: parseInt(c.resolved) || 0
        })).slice(0, 6);
    }, [stats.categoryBreakdown]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                    <p className="text-[12px] font-bold text-gray-800 mb-1.5 uppercase tracking-wider">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                <span className="text-[11px] font-medium text-gray-500">{entry.name}:</span>
                                <span className="text-[12px] font-bold text-gray-900">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading && !tickets.length) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* Header section: Title, Primary Actions & Filter Bar */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Main Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-semibold text-[#0f172a] tracking-tight flex items-center gap-3">
                            Helpdesk Insights
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </h1>
                        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest leading-relaxed">
                            {format(new Date(), 'EEEE, MMMM do yyyy')}
                        </p>
                    </div>

                    {/* Top Actions: Raise Ticket & Refresh */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0 shadow-md shadow-primary/25 active:scale-95"
                        >
                            <Plus size={16} />
                            <span>Raise Ticket</span>
                        </button>

                        <button
                            onClick={fetchInitialData}
                            title="Refresh insights"
                            className="p-2.5 bg-white text-gray-500 rounded-xl hover:text-primary hover:bg-primary/5 transition-all shrink-0 border border-gray-200 shadow-sm active:scale-95"
                        >
                            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Sub-Header Filter Bar: Filter Pills & Date Range */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200/90 shadow-sm">
                    {/* Left: Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Category Dropdown with CommonSelect */}
                        <CommonSelect
                            icon={Tag}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={[
                                { value: 'All', label: 'All Categories' },
                                ...CATEGORIES.map(cat => ({ value: cat, label: cat }))
                            ]}
                            placeholder="All Categories"
                            searchable={false}
                        />

                        {/* Priority Dropdown with CommonSelect */}
                        <CommonSelect
                            icon={AlertTriangle}
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            options={[
                                { value: 'All', label: 'All Priorities' },
                                ...PRIORITIES.map(p => ({ value: p, label: p }))
                            ]}
                            placeholder="All Priorities"
                            searchable={false}
                        />

                        {/* Status Dropdown with CommonSelect */}
                        <CommonSelect
                            icon={Layers}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'All', label: 'All Statuses' },
                                ...STATUSES.map(s => ({ value: s, label: s }))
                            ]}
                            placeholder="All Statuses"
                            searchable={false}
                        />

                        {/* Reset Filters Chip */}
                        {(categoryFilter !== 'All' || priorityFilter !== 'All' || statusFilter !== 'All') && (
                            <button
                                onClick={() => {
                                    setCategoryFilter('All');
                                    setPriorityFilter('All');
                                    setStatusFilter('All');
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-full transition-all"
                            >
                                <X size={12} />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Date Range Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                        <button
                            onClick={() => {
                                const today = new Date();
                                const from = new Date(today.getFullYear(), today.getMonth(), 1);
                                setFromDate(from.toLocaleDateString('sv-SE'));
                                setToDate(today.toLocaleDateString('sv-SE'));
                            }}
                            className="px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors whitespace-nowrap shrink-0"
                        >
                            This Month
                        </button>

                        <div className="flex items-center justify-center gap-0 bg-gray-50/80 p-1 rounded-full border border-gray-200 transition-all focus-within:border-primary/20">
                            <div className="flex items-center gap-1 px-2 group">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">From</span>
                                <div className="relative flex items-center">
                                    <DatePicker
                                        selected={new Date(fromDate)}
                                        onChange={(date) => setFromDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                        dateFormat="yyyy-MM-dd"
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                        className="bg-transparent border-none text-[12px] sm:text-[13px] font-semibold outline-none w-[88px] sm:w-[94px] text-[#2c3e50] cursor-pointer p-0"
                                        popperPlacement="bottom-end"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors ml-1" size={14} />
                                </div>
                            </div>
                            <div className="w-[1px] h-3.5 bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-1 px-2 group">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">To</span>
                                <div className="relative flex items-center">
                                    <DatePicker
                                        selected={new Date(toDate)}
                                        onChange={(date) => setToDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                        dateFormat="yyyy-MM-dd"
                                        className="bg-transparent border-none text-[12px] sm:text-[13px] font-semibold outline-none w-[88px] sm:w-[94px] text-[#2c3e50] cursor-pointer p-0"
                                        popperPlacement="bottom-end"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors ml-1" size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6 Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <HelpdeskStatCard
                    title="Total Tickets"
                    value={stats.total || 0}
                    subValueLabel="All Recorded"
                    subValue={stats.total || 0}
                    icon={LifeBuoy}
                    color={{ bg: 'bg-gradient-to-br from-blue-500 to-blue-600' }}
                    delay={0.1}
                    onClick={() => setStatusFilter('All')}
                />
                <HelpdeskStatCard
                    title="Open Tickets"
                    value={stats.open || 0}
                    subValueLabel="Awaiting Review"
                    subValue={stats.open || 0}
                    icon={AlertCircle}
                    color={{ bg: 'bg-gradient-to-br from-amber-500 to-amber-600' }}
                    delay={0.2}
                    onClick={() => setStatusFilter('Open')}
                />
                <HelpdeskStatCard
                    title="In Progress"
                    value={stats.inProgress || 0}
                    subValueLabel="Active Working"
                    subValue={stats.inProgress || 0}
                    icon={Clock}
                    color={{ bg: 'bg-gradient-to-br from-violet-500 to-violet-600' }}
                    delay={0.3}
                    onClick={() => setStatusFilter('In Progress')}
                />
                <HelpdeskStatCard
                    title="Resolved"
                    value={stats.resolved || 0}
                    subValueLabel="Resolution Rate"
                    subValue={`${stats.resolutionRate || 0}%`}
                    icon={CheckCircle2}
                    color={{ bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' }}
                    delay={0.4}
                    onClick={() => setStatusFilter('Resolved')}
                />
                <HelpdeskStatCard
                    title="Urgent Attention"
                    value={stats.urgentActive || 0}
                    subValueLabel="Urgent Active"
                    subValue={stats.urgentActive || 0}
                    icon={AlertTriangle}
                    color={{ bg: 'bg-gradient-to-br from-rose-500 to-rose-600' }}
                    delay={0.5}
                    onClick={() => setPriorityFilter('Urgent')}
                />
                <HelpdeskStatCard
                    title="Categories"
                    value={CATEGORIES.length}
                    subValueLabel="Support Tracks"
                    subValue={CATEGORIES.length}
                    icon={Layers}
                    color={{ bg: 'bg-gradient-to-br from-slate-600 to-slate-700' }}
                    delay={0.6}
                    onClick={() => setCategoryFilter('All')}
                />
            </div>

            {/* Visual Analytics Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Ticket Volume by Category */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Tickets by Category</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Distribution across support domains</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '15px', fontSize: '11px', fontWeight: 600 }}
                                />
                                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Status Distribution (Donut Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Status Distribution</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Active resolution ratio</p>
                        </div>
                        <span className="text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            {stats.resolutionRate || 0}% Solved
                        </span>
                    </div>

                    <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                        {statusPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-sm font-semibold text-gray-400">
                                No tickets in selected period
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Ticket Timeline (Area Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Resolution Velocity</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Daily created vs resolved tickets</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="ticketCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="ticketResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }} />
                                <Area type="monotone" dataKey="created_count" name="Created" stroke="#3b82f6" fill="url(#ticketCreatedGrad)" strokeWidth={2.5} />
                                <Area type="monotone" dataKey="resolved_count" name="Resolved" stroke="#10b981" fill="url(#ticketResolvedGrad)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Dynamic Tables Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Tickets List (2 Columns Wide) */}
                <div className="lg:col-span-2 bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h3 className="text-[16px] font-semibold text-gray-800">
                                Support & Query Queue
                            </h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                                Live employee queries, complaints and technical assistance requests.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search ticket or employee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700 outline-none focus:border-primary focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase">Ticket & Requester</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase">Category</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-center">Priority</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-center">Status</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTickets.length > 0 ? (
                                    filteredTickets.map((t) => (
                                        <tr key={t.id} className="group hover:bg-gray-50/60 transition-colors">
                                            <td className="py-3.5">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5">
                                                        {t.user_name ? t.user_name.charAt(0) : 'U'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-primary">{t.ticket_code}</span>
                                                            <span className="text-xs font-semibold text-gray-800 line-clamp-1">{t.subject}</span>
                                                        </div>
                                                        <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                            <span>{t.user_name}</span>
                                                            {t.user_department && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{t.user_department}</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                {getPriorityBadge(t.priority)}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                {getStatusBadge(t.status)}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(t);
                                                        setStatusUpdateData({
                                                            status: t.status,
                                                            resolution_notes: t.resolution_notes || ''
                                                        });
                                                        setIsStatusModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-[14px] font-semibold text-gray-400">
                                            No support tickets matching filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Resolutions Feed (1 Column Wide) */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-[16px] font-semibold text-gray-800 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            Recent Resolutions
                        </h3>
                        <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                            Recently solved queries with resolution logs.
                        </p>
                    </div>

                    <div className="space-y-3.5 overflow-y-auto max-h-[420px] pr-1">
                        {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length > 0 ? (
                            tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').slice(0, 5).map((item) => (
                                <div key={item.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-emerald-200 transition-all flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-600">{item.ticket_code}</span>
                                        <span className="text-[10px] font-semibold text-gray-400">
                                            {item.resolved_at ? format(new Date(item.resolved_at), 'dd MMM, hh:mm a') : 'Resolved'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.subject}</p>
                                    {item.resolution_notes && (
                                        <p className="text-[11px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 italic">
                                            "{item.resolution_notes}"
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 pt-1 border-t border-gray-100">
                                        <span>Requester: <strong className="text-gray-600 font-semibold">{item.user_name}</strong></span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase">Closed</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center text-xs font-semibold text-gray-400">
                                No tickets marked resolved yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Raise New Ticket */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl relative"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent rounded-t-[20px]">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <LifeBuoy size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Raise Support Ticket</h3>
                                        <p className="text-xs text-gray-500">Submit employee inquiry or workplace query</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Subject <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Discrepancy in monthly allowance computation"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CommonSelect
                                        variant="form"
                                        label="Category"
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                        options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                        searchable={false}
                                    />

                                    <CommonSelect
                                        variant="form"
                                        label="Priority"
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        options={PRIORITIES.map(p => ({ value: p, label: p }))}
                                        searchable={false}
                                    />
                                </div>

                                <CommonSelect
                                    variant="form"
                                    label="Requester Employee"
                                    required
                                    value={newTicket.user_id}
                                    onChange={(e) => setNewTicket({ ...newTicket, user_id: e.target.value })}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.name} (${u.emp_id || 'ID: ' + u.id})`
                                    }))}
                                    placeholder="Select Employee..."
                                    searchable={true}
                                    searchPlaceholder="Search employee..."
                                />

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Please provide full details of the issue or inquiry..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:border-primary transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
                                    >
                                        <Send size={14} />
                                        <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Manage / Update Ticket Status */}
            <AnimatePresence>
                {isStatusModalOpen && selectedTicket && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsStatusModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl relative"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between rounded-t-[20px]">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-primary">{selectedTicket.ticket_code}</span>
                                        <span className="text-xs font-semibold text-gray-400">•</span>
                                        <span className="text-xs font-medium text-gray-500">{selectedTicket.category}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mt-0.5">{selectedTicket.subject}</h3>
                                </div>
                                <button
                                    onClick={() => setIsStatusModalOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                                    <p className="text-gray-500 font-medium"><strong>Requester:</strong> {selectedTicket.user_name} ({selectedTicket.user_department || 'General'})</p>
                                    <p className="text-gray-600 mt-1 leading-relaxed"><strong>Query:</strong> {selectedTicket.description}</p>
                                </div>

                                <CommonSelect
                                    variant="form"
                                    label="Ticket Status"
                                    value={statusUpdateData.status}
                                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
                                    options={STATUSES.map(s => ({ value: s, label: s }))}
                                    searchable={false}
                                />

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Resolution Notes / Remarks
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add resolution explanation or internal notes for employee..."
                                        value={statusUpdateData.resolution_notes}
                                        onChange={(e) => setStatusUpdateData({ ...statusUpdateData, resolution_notes: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:border-primary transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsStatusModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
                                    >
                                        <Check size={14} />
                                        <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
