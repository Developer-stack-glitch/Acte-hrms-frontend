import React, { useState, useEffect, useMemo } from 'react';
import {
    Briefcase, Users, UserCheck, CalendarCheck, Award, Clock,
    Sparkles, RefreshCcw, Calendar, ArrowUpRight,
    Building2,
    Video, ExternalLink
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getJobsApi, getApplicantsApi, getInterviewsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';
import CommonSelect from '../../Common/CommonSelect';

// Stat Card Matching AssetStatCard & PayrollStatCard Style
const RecruitmentStatCard = ({ title, value, subValueLabel, subValue, icon: Icon, color, delay, path }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            onClick={() => path && navigate(path)}
            className={`rounded-[12px] p-4 ${color.bg} border border-white/20 cursor-pointer shadow-lg group relative overflow-hidden flex flex-col justify-between h-full hover:scale-[1.02] active:scale-[0.98] transition-all`}
        >
            {/* Decorator */}
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

export default function RecruitmentOverview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [interviews, setInterviews] = useState([]);

    // Filters
    const [fromDate, setFromDate] = useState(subDays(new Date(), 30).toLocaleDateString('sv-SE'));
    const [toDate, setToDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [selectedDepartment, setSelectedDepartment] = useState('All');

    useEffect(() => {
        fetchRecruitmentData();
    }, []);

    const fetchRecruitmentData = async () => {
        try {
            setLoading(true);
            const [jobsRes, applicantsRes, interviewsRes] = await Promise.all([
                getJobsApi().catch(() => ({ data: [] })),
                getApplicantsApi().catch(() => ({ data: [] })),
                getInterviewsApi().catch(() => ({ data: [] }))
            ]);

            setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
            setApplicants(Array.isArray(applicantsRes.data) ? applicantsRes.data : []);
            setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
        } catch (error) {
            console.error('Error fetching recruitment insights:', error);
            toast.error('Failed to load recruitment data');
        } finally {
            setLoading(false);
        }
    };

    // Filtered data based on department
    const filteredJobs = useMemo(() => {
        if (selectedDepartment === 'All') return jobs;
        return jobs.filter(j => j.department?.toLowerCase() === selectedDepartment.toLowerCase());
    }, [jobs, selectedDepartment]);

    const filteredApplicants = useMemo(() => {
        if (selectedDepartment === 'All') return applicants;
        // Match applicants whose job belongs to the selected department
        const deptJobIds = new Set(
            jobs.filter(j => j.department?.toLowerCase() === selectedDepartment.toLowerCase()).map(j => j.id)
        );
        return applicants.filter(a => deptJobIds.has(a.job_id));
    }, [applicants, jobs, selectedDepartment]);

    // Unique departments
    const departments = useMemo(() => {
        const set = new Set();
        jobs.forEach(j => {
            if (j.department) set.add(j.department);
        });
        return Array.from(set).sort();
    }, [jobs]);

    // Summary Statistics
    const stats = useMemo(() => {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        const isNew = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const totalJobs = filteredJobs.length;
        const activeJobs = filteredJobs.filter(j => j.status === 'Open').length;
        const inactiveJobs = filteredJobs.filter(j => j.status !== 'Open').length;

        const totalApplicants = filteredApplicants.length;
        const applied = filteredApplicants.filter(a => a.status === 'Applied').length;
        const interviewing = filteredApplicants.filter(a => a.status === 'Interviewing').length;
        const offered = filteredApplicants.filter(a => a.status === 'Offered').length;
        const hired = filteredApplicants.filter(a => ['Hired', 'Completed'].includes(a.status)).length;
        const rejected = filteredApplicants.filter(a => a.status === 'Rejected').length;

        const activePipeline = applied + interviewing + offered;
        const conversionRate = totalApplicants > 0 ? Math.round((hired / totalApplicants) * 100) : 0;
        const newApplicants = filteredApplicants.filter(a => isNew(a.applied_at)).length;
        const scheduledRounds = interviews.length;

        return {
            totalJobs,
            activeJobs,
            inactiveJobs,
            totalApplicants,
            applied,
            interviewing,
            offered,
            hired,
            rejected,
            activePipeline,
            conversionRate,
            newApplicants,
            scheduledRounds
        };
    }, [filteredJobs, filteredApplicants, interviews, fromDate, toDate]);

    // Recruitment Pipeline Funnel Chart Data
    const pipelineFunnelData = useMemo(() => {
        return [
            { name: 'Applied', count: stats.applied, fill: '#3b82f6' },
            { name: 'Interviewing', count: stats.interviewing, fill: '#8b5cf6' },
            { name: 'Offered', count: stats.offered, fill: '#f59e0b' },
            { name: 'Hired', count: stats.hired, fill: '#10b981' },
            { name: 'Rejected', count: stats.rejected, fill: '#ef4444' }
        ];
    }, [stats]);

    // Department Distribution Chart Data
    const deptDistributionData = useMemo(() => {
        const counts = {};
        jobs.forEach(j => {
            const d = j.department || 'Other';
            if (!counts[d]) counts[d] = { name: d, OpenJobs: 0, TotalJobs: 0 };
            counts[d].TotalJobs++;
            if (j.status === 'Open') counts[d].OpenJobs++;
        });
        return Object.values(counts).sort((a, b) => b.TotalJobs - a.TotalJobs).slice(0, 6);
    }, [jobs]);

    // Application Timeline Chart Data (grouped by day)
    const timelineData = useMemo(() => {
        const map = {};
        const start = new Date(fromDate);
        const end = new Date(toDate);

        // Pre-fill days in range (limit to last 14 days if range is wide)
        const dayCount = Math.max(1, Math.min(30, Math.ceil((end - start) / (1000 * 60 * 60 * 24))));
        for (let i = dayCount - 1; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(d.getDate() - i);
            const key = format(d, 'MMM dd');
            map[key] = { date: key, Applications: 0 };
        }

        filteredApplicants.forEach(a => {
            if (a.applied_at) {
                const key = format(new Date(a.applied_at), 'MMM dd');
                if (map[key]) {
                    map[key].Applications++;
                }
            }
        });

        return Object.values(map);
    }, [filteredApplicants, fromDate, toDate]);

    // Status Badge Component
    const getStatusBadge = (status) => {
        const styles = {
            Applied: 'bg-blue-50 text-blue-600 border-blue-200',
            Interviewing: 'bg-purple-50 text-purple-600 border-purple-200',
            Offered: 'bg-amber-50 text-amber-600 border-amber-200',
            Hired: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            Rejected: 'bg-rose-50 text-rose-600 border-rose-200'
        };
        const style = styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
                {status}
            </span>
        );
    };

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

    if (loading && !jobs.length && !applicants.length) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* Header section with Title & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-[#0f172a] tracking-tight flex items-center gap-3">
                        Recruitment Insights
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h1>
                    <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest leading-relaxed">
                        {format(new Date(), 'EEEE, MMMM do yyyy')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Department Dropdown */}
                    <CommonSelect
                        icon={Building2}
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        options={[
                            { value: 'All', label: 'All Departments' },
                            ...departments.map(dept => ({ value: dept, label: dept }))
                        ]}
                        placeholder="All Departments"
                        searchable={false}
                    />

                    {/* Date Filter & Refresh */}
                    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <button
                            onClick={() => {
                                const today = new Date();
                                const from = new Date(today.getFullYear(), today.getMonth(), 1);
                                setFromDate(from.toLocaleDateString('sv-SE'));
                                setToDate(today.toLocaleDateString('sv-SE'));
                            }}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[12px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors whitespace-nowrap shrink-0"
                        >
                            This Month
                        </button>

                        <div className="flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                            <div className="flex items-center gap-1 sm:gap-1 px-1 sm:px-2 group">
                                <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-widest mr-1">From</span>
                                <div className="relative flex items-center gap-0">
                                    <DatePicker
                                        selected={new Date(fromDate)}
                                        onChange={(date) => setFromDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                        dateFormat="yyyy-MM-dd"
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                        className="bg-transparent border-none text-[12px] sm:text-[14px] font-semibold outline-none w-[90px] sm:w-[100px] text-[#2c3e50] cursor-pointer p-0"
                                        popperPlacement="bottom-end"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                </div>
                            </div>
                            <div className="w-[1px] h-4 bg-gray-200 mx-2"></div>
                            <div className="flex items-center gap-1 sm:gap-1 px-1 sm:px-2 group">
                                <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-widest mr-1">To</span>
                                <div className="relative flex items-center gap-0">
                                    <DatePicker
                                        selected={new Date(toDate)}
                                        onChange={(date) => setToDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                        dateFormat="yyyy-MM-dd"
                                        className="bg-transparent border-none text-[12px] sm:text-[14px] font-semibold outline-none w-[90px] sm:w-[100px] text-[#2c3e50] cursor-pointer p-0"
                                        popperPlacement="bottom-end"
                                        portalId="root"
                                    />
                                    <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={fetchRecruitmentData}
                            className="p-2.5 bg-white text-gray-400 rounded-xl hover:text-primary hover:bg-primary/5 transition-all shrink-0 border border-gray-200"
                        >
                            <RefreshCcw size={20} className={`${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 6 Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <RecruitmentStatCard
                    title="Job Openings"
                    value={stats.totalJobs}
                    subValueLabel="Active Open"
                    subValue={stats.activeJobs}
                    icon={Briefcase}
                    color={{ bg: 'bg-gradient-to-br from-blue-500 to-blue-600' }}
                    delay={0.1}
                    path="/job-recruitment/jobs"
                />
                <RecruitmentStatCard
                    title="Total Candidates"
                    value={stats.totalApplicants}
                    subValueLabel="In Pipeline"
                    subValue={stats.activePipeline}
                    icon={Users}
                    color={{ bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' }}
                    delay={0.2}
                    path="/job-recruitment/applicants"
                />
                <RecruitmentStatCard
                    title="New Applied"
                    value={stats.applied}
                    subValueLabel="Recent in period"
                    subValue={stats.newApplicants}
                    icon={Sparkles}
                    color={{ bg: 'bg-gradient-to-br from-orange-500 to-orange-600' }}
                    delay={0.3}
                    path="/job-recruitment/applicants"
                />
                <RecruitmentStatCard
                    title="Interviewing"
                    value={stats.interviewing}
                    subValueLabel="Scheduled Rounds"
                    subValue={stats.scheduledRounds}
                    icon={CalendarCheck}
                    color={{ bg: 'bg-gradient-to-br from-violet-500 to-violet-600' }}
                    delay={0.4}
                    path="/job-recruitment/applicants"
                />
                <RecruitmentStatCard
                    title="Offers Made"
                    value={stats.offered}
                    subValueLabel="Pending Joining"
                    subValue={stats.offered}
                    icon={Award}
                    color={{ bg: 'bg-gradient-to-br from-slate-600 to-slate-700' }}
                    delay={0.5}
                    path="/job-recruitment/applicants"
                />
                <RecruitmentStatCard
                    title="Hired Candidates"
                    value={stats.hired}
                    subValueLabel="Conversion Rate"
                    subValue={`${stats.conversionRate}%`}
                    icon={UserCheck}
                    color={{ bg: 'bg-gradient-to-br from-amber-500 to-amber-600' }}
                    delay={0.6}
                    path="/job-recruitment/applicants"
                />
            </div>

            {/* Visual Analytics Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Pipeline Funnel (Bar Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Recruitment Funnel</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Stage-by-stage candidate distribution</p>
                        </div>
                        <span className="text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            {stats.totalApplicants} Total
                        </span>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineFunnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]} barSize={34}>
                                    {pipelineFunnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Applications Trend (Area Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Application Velocity</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Daily applications timeline</p>
                        </div>
                        <span className="text-[12px] font-semibold text-gray-500">
                            {stats.newApplicants} recent
                        </span>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="applicantGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="Applications"
                                    stroke="#2563eb"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#applicantGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Open Positions by Department */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Department Demand</h3>
                            <p className="text-[11px] text-gray-400 font-medium">Job openings by team</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptDistributionData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    width={85}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="OpenJobs" name="Open Positions" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Dynamic Tables Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Active Job Postings Table */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-[16px] font-semibold text-gray-800">
                                Active Job Postings
                            </h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                                Live job openings and candidate application counts.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/job-recruitment/jobs')}
                            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group"
                        >
                            View All Jobs
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase">Role & Department</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-center">Type</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-center">Status</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-right">Applicants</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredJobs.length > 0 ? (
                                    filteredJobs.slice(0, 5).map((job) => {
                                        const jobApplicantsCount = applicants.filter(a => a.job_id === job.id).length;
                                        return (
                                            <tr key={job.id} className="group hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                                                            {job.title}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                                                            <Building2 size={12} /> {job.department || 'General'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                                                        {job.job_type || 'Full-time'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${job.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-right">
                                                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                                                        {jobApplicantsCount}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-[14px] font-semibold text-gray-400">
                                            No job postings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Recent Applicants & Pipeline */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-[16px] font-semibold text-gray-800">
                                Candidate Pipeline
                            </h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                                Active applicants currently progressing through hiring rounds.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/job-recruitment/applicants')}
                            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group"
                        >
                            View All Candidates
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase">Candidate</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase">Applied Role</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-center">Stage</th>
                                    <th className="pb-3 text-[12px] font-semibold text-gray-800 uppercase text-right">Applied</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredApplicants.length > 0 ? (
                                    filteredApplicants.slice(0, 5).map((app) => (
                                        <tr key={app.id} className="group hover:bg-gray-50/60 transition-colors">
                                            <td className="py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                                        {app.name ? app.name.charAt(0) : 'A'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-800">{app.name}</span>
                                                        <span className="text-[10px] font-medium text-gray-400">{app.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5">
                                                <span className="text-xs font-medium text-gray-600 line-clamp-1">
                                                    {app.job_title || 'General Position'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="py-3.5 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                                                {app.applied_at ? format(new Date(app.applied_at), 'dd MMM') : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-[14px] font-semibold text-gray-400">
                                            No applicants found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 3. Upcoming Scheduled Interviews Section */}
            {interviews.length > 0 && (
                <div className="bg-white rounded-[15px] border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[16px] font-semibold text-gray-800 flex items-center gap-2">
                                <CalendarCheck size={18} className="text-primary" />
                                Scheduled Interviews
                            </h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-0.5 italic">
                                Upcoming interview sessions scheduled with candidates.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {interviews.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/30 hover:shadow-md transition-all flex flex-col justify-between gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-bold text-gray-800">{item.applicant_name}</h4>
                                        <p className="text-xs font-medium text-primary">{item.job_title || 'Applicant'}</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                                        {item.round_name || 'Interview'}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Clock size={13} className="text-gray-400" />
                                        <span>{item.interview_date} at {item.interview_time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video size={13} className="text-gray-400" />
                                        <span>{item.mode || 'Online Meeting'}</span>
                                    </div>
                                </div>

                                {item.meeting_link && (
                                    <a
                                        href={item.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        <span>Join Meeting</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
