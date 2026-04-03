import { useState, useEffect, useMemo } from 'react';
import {
    Banknote, Wallet, Users, Receipt, Landmark, Filter, RefreshCcw,
    Calendar,
    ArrowUpRight, MinusCircle,
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { format, subMonths, eachMonthOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    getPayrollRunsApi,
    getReimbursementsApi,
    getAdvanceSalariesApi,
    getPayrollAnalyticsApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { Search, Clock, Award, Gift, CheckCircle2, AlertCircle, TrendingUp, LineChart as LucideLineChart, PieChart as LucidePieChart, PieChartIcon } from 'lucide-react';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';
import { LineChart, Line } from 'recharts';

// Premium Stat Card Component
const PayrollStatCard = ({ title, value, subValue, icon: Icon, color, delay, path }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: "easeOut" }}
            onClick={() => path && navigate(path)}
            className={`rounded-[12px] p-3 ${color.bg} border border-white/20 cursor-pointer shadow-lg group relative overflow-hidden flex flex-col justify-between h-full hover:scale-[1.02] active:scale-[0.98] transition-all`}
        >
            {/* Decorator */}
            <div className="absolute -right-2 -top-2 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col h-full gap-3">
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-white">{title}</p>
                    <div className="p-2 rounded-lg bg-white/20 text-white backdrop-blur-sm group-hover:rotate-12 transition-transform shadow-inner">
                        <Icon size={20} className="stroke-[2]" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1">
                        {typeof value === 'number' ? <span className="text-xl opacity-80">₹</span> : null}
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>
                </div>

                <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-white">{subValue.label}</span>
                        <span className="text-[14px] font-medium text-white">
                            {typeof subValue.value === 'number' ? `₹${subValue.value.toLocaleString()}` : subValue.value}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/90 backdrop-blur-md group-hover:bg-white group-hover:text-primary transition-colors">
                        <ArrowUpRight size={18} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function PayrollDashboard() {
    const [loading, setLoading] = useState(true);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [analytics, setAnalytics] = useState({
        topEarners: [],
        topDeductions: [],
        holds: [],
        allItems: [],
        pfEsiTrend: [],
        reimbursementReport: [],
        loanTracker: [],
        payEquity: []
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Filters & Range
    const [fromDate, setFromDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [filters, setFilters] = useState({});

    useEffect(() => {
        fetchData();
    }, [fromDate, toDate, filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {
                startDate: fromDate,
                endDate: toDate,
                ...filters
            };

            const [runsRes, reimRes, advRes, analyticsRes] = await Promise.all([
                getPayrollRunsApi({ ...params, limit: 1000 }),
                getReimbursementsApi(params),
                getAdvanceSalariesApi(params),
                getPayrollAnalyticsApi(params)
            ]);

            setPayrollRuns(runsRes.data?.data || []);
            setReimbursements(reimRes.data || []);
            setAdvances(advRes.data?.data || []);
            setAnalytics(analyticsRes.data || {
                topEarners: [],
                topDeductions: [],
                holds: [],
                allItems: [],
                pfEsiTrend: [],
                reimbursementReport: [],
                loanTracker: [],
                payEquity: []
            });
        } catch (error) {
            console.error('Error fetching payroll data:', error);
            toast.error('Failed to sync payroll data');
        } finally {
            setLoading(false);
        }
    };

    // Aggregate statistics
    const stats = useMemo(() => {
        const startDate = fromDate ? new Date(fromDate) : null;
        const endDate = toDate ? new Date(toDate) : null;

        const isWithinRange = (dateStr) => {
            if (!dateStr || !startDate || !endDate) return true;
            const d = new Date(dateStr);
            const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
            return d >= startOfDay && d <= endOfDay;
        };

        const filteredRuns = payrollRuns.filter(r => isWithinRange(r.period_start));
        const filteredReims = reimbursements.filter(r => r.status === 'Approved' && isWithinRange(r.created_at || r.date));
        const filteredAdvances = advances.filter(a => a.status === 'Approved' && isWithinRange(a.request_date || a.date));

        const netPaid = filteredRuns.reduce((sum, run) => sum + (parseFloat(run.total_amount) || 0), 0);
        const totalEmployees = filteredRuns.reduce((sum, run) => sum + (parseInt(run.processed_employees) || 0), 0);
        const totalPossibleEmployees = filteredRuns.reduce((sum, run) => sum + (parseInt(run.total_employees) || 0), 0);
        const onHold = Math.max(0, totalPossibleEmployees - totalEmployees);

        const approvedReimbursements = filteredReims
            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        const reimbursementCount = filteredReims.length;

        const activeAdvances = filteredAdvances
            .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

        const activeAdvanceCount = filteredAdvances.length;

        const grossSalary = netPaid / 0.85;
        const deductions = grossSalary - netPaid;

        return {
            grossSalary,
            netPaid,
            deductions,
            reimbursements: approvedReimbursements,
            reimbursementCount,
            advances: activeAdvances,
            activeAdvanceCount,
            totalEmployees: totalEmployees || 0,
            onHold
        };
    }, [payrollRuns, reimbursements, advances, fromDate, toDate]);

    // Monthly breakdown data for last 6 months
    const monthlyData = useMemo(() => {
        const startDate = fromDate ? new Date(fromDate) : null;
        const endDate = toDate ? new Date(toDate) : null;

        const isWithinGlobalRange = (dateStr) => {
            if (!dateStr || !startDate || !endDate) return true;
            const d = new Date(dateStr);
            const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
            return d >= startOfDay && d <= endOfDay;
        };

        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 6),
            end: new Date()
        });

        return months.map(month => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const monthStr = format(month, 'MMM yyyy');

            // Filter runs within this month
            const monthRuns = payrollRuns.filter(r => {
                const runDate = parseISO(r.period_start);
                return runDate >= mStart && runDate <= mEnd;
            });

            const net = monthRuns.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
            const reim = reimbursements
                .filter(r => {
                    if (!r.created_at) return false;
                    const d = parseISO(r.created_at);
                    return r.status === 'Approved' && d >= mStart && d <= mEnd;
                })
                .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

            return {
                name: monthStr,
                'Net Salary': net,
                'Deductions': net * 0.15,
                'Reimbursements': reim
            };
        });
    }, [payrollRuns, reimbursements]);

    const compositionData = [
        { name: 'Net Salary', value: stats.netPaid, color: '#10b981' },
        { name: 'Deductions', value: stats.deductions, color: '#8b5cf6' },
        { name: 'Reimbursements', value: stats.reimbursements, color: '#ec4899' }
    ];

    const filteredItems = useMemo(() => {
        return (analytics.allItems || []).filter(item =>
            item.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [analytics.allItems, searchTerm]);

    if (loading && !payrollRuns.length) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* Horizontal Header & Filter Bar */}
            <div className="flex flex-col md:mt-0 mt-3 md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                        Payroll Insights
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h1>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">
                        {format(new Date(), 'EEEE, MMMM do yyyy')}
                    </p>
                </div>

                <div className="flex items-center md:justify-end justify-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <div className="w-full sm:w-auto flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                        <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 group">
                            <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">From</span>
                            <div className="relative flex items-center gap-0">
                                <DatePicker
                                    selected={fromDate ? new Date(fromDate) : null}
                                    onChange={(date) => setFromDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                    dateFormat="yyyy-MM-dd"
                                    className="bg-transparent border-none text-[11px] sm:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[80px] sm:w-[100px]"
                                    popperPlacement="bottom-end"
                                    portalId="root"
                                />
                                <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                        <div className="w-[1px] h-4 bg-gray-100 mx-1"></div>
                        <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 group">
                            <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">To</span>
                            <div className="relative flex items-center gap-2">
                                <DatePicker
                                    selected={toDate ? new Date(toDate) : null}
                                    onChange={(date) => setToDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                    dateFormat="yyyy-MM-dd"
                                    className="bg-transparent border-none text-[11px] sm:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[80px] sm:w-[100px]"
                                    popperPlacement="bottom-end"
                                    portalId="root"
                                />
                                <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="p-3 bg-white border border-gray-100 text-gray-400 rounded-full hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <PayrollStatCard
                    title="Gross Salary"
                    value={stats.grossSalary}
                    subValue={{ label: "Avg Gross", value: stats.grossSalary / (stats.totalEmployees || 1) }}
                    icon={Banknote}
                    color={{ bg: 'bg-gradient-to-br from-blue-500 to-blue-600' }}
                    delay={0.1}
                    path="/payroll/salary-structure"
                />
                <PayrollStatCard
                    title="Net Salary Paid"
                    value={stats.netPaid}
                    subValue={{ label: "Avg Net", value: stats.netPaid / (stats.totalEmployees || 1) }}
                    icon={Wallet}
                    color={{ bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' }}
                    delay={0.2}
                    path="/payroll/dashboard"
                />
                <PayrollStatCard
                    title="Deductions"
                    value={stats.deductions}
                    subValue={{ label: "Avg Deduction", value: stats.deductions / (stats.totalEmployees || 1) }}
                    icon={MinusCircle}
                    color={{ bg: 'bg-gradient-to-br from-violet-500 to-violet-600' }}
                    delay={0.3}
                    path="/payroll/salary-components"
                />
                <PayrollStatCard
                    title="Reimbursements"
                    value={stats.reimbursements}
                    subValue={{ label: "Claims", value: stats.reimbursementCount }}
                    icon={Receipt}
                    color={{ bg: 'bg-gradient-to-br from-pink-500 to-pink-600' }}
                    delay={0.4}
                    path="/reimbursements"
                />
                <PayrollStatCard
                    title="Advances & Loans"
                    value={stats.advances}
                    subValue={{ label: "Active", value: stats.activeAdvanceCount }}
                    icon={Landmark}
                    color={{ bg: 'bg-gradient-to-br from-orange-500 to-orange-600' }}
                    delay={0.5}
                    path="/payroll/advance-salary"
                />
                <PayrollStatCard
                    title="Employees Paid"
                    value={stats.totalEmployees}
                    subValue={{ label: "On Hold", value: stats.onHold }}
                    icon={Users}
                    color={{ bg: 'bg-gradient-to-br from-slate-600 to-slate-700' }}
                    delay={0.6}
                    path="/users"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Breakdown Chart */}
                <div className="lg:col-span-2 bg-white rounded-[15px] border border-gray-200 p-6 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-gray-900 leading-none">Monthly Payroll Breakdown</h3>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">6-Month Trend Overview</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">Net Salary</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">Deductions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ec4899]" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">Claims</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} barGap={8}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
                                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 8 }}
                                    formatter={(value) => `₹${Math.round(value).toLocaleString()}`}
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                        fontSize: '12px',
                                        fontWeight: '900',
                                        padding: '12px'
                                    }}
                                />
                                <Bar dataKey="Net Salary" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="Deductions" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="Reimbursements" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Composition Pie Chart */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-gray-900 leading-none">Payroll Composition</h3>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">Expense Segmentation</p>
                    </div>

                    <div className="h-[250px] relative my-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={10}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {compositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `₹${Math.round(value).toLocaleString()}`}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Aggregate</span>
                            <span className="text-2xl font-semibold text-gray-900">₹{(stats.grossSalary / 1000).toFixed(1)}k</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {compositionData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-[13px] bg-gray-100/50 hover:bg-gray-50 transition-colors mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{item.name}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-semibold text-gray-900">₹{Math.round(item.value).toLocaleString()}</span>
                                    <span className="text-[10px] font-semibold text-gray-400">
                                        {((item.value / (stats.grossSalary || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Analytics Section - TOP EARNERS, DEDUCTIONS, HOLDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Top Earner Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[400px]"
                >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Banknote size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900">Top 5 Highest Earners <span className="text-gray-400 text-[10px] uppercase font-semibold tracking-widest ml-1">(Gross)</span></h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        {analytics.topEarners.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {analytics.topEarners.map((user, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                {user.employee_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{user.department_name} • {user.emp_id}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-emerald-600">₹{(user.total_gross / 1000).toFixed(1)}K</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <TrendingUp size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No earners data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Top Deductions Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[400px]"
                >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <MinusCircle size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900">Top 5 Highest Deductions</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        {analytics.topDeductions.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {analytics.topDeductions.map((user, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xs">
                                                {user.employee_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{user.department_name} • {user.emp_id}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-rose-600">₹{(user.total_deductions / 1000).toFixed(1)}K</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <AlertCircle size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No deductions data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Employees on Hold Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[400px]"
                >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Clock size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900">Employees on Hold</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        {analytics.holds.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {analytics.holds.map((user, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                                                {user.employee_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">{user.department_name} • {user.emp_id}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">ON HOLD</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <CheckCircle2 size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No salaries on hold</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* LOAN & REIMBURSEMENT REPORTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* 10. Loan & Advance Deduction Tracker */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Award size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900 leading-tight">Loan & Advance Deduction Tracker <br /> <span className="text-[12px] font-medium text-gray-400">Monthly EMI deductions by employee</span></h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {analytics.loanTracker.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Employee</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Count</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-left">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {analytics.loanTracker.map((loan, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-700 text-left">{loan.employee_name}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-left">{loan.advance_count}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-indigo-600 text-left">₹{(loan.total_advance || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <p className="text-sm font-medium">No deductions in selected period.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 11. Reimbursement Claims Report */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
                                <Receipt size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-900 leading-tight">Reimbursement Claims Report <br /> <span className="text-[12px] font-medium text-gray-400">Claims grouped by status and type</span></h3>
                        </div>
                    </div>
                    <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">BY STATUS</h4>
                            {analytics.reimbursementReport.length > 0 ? (
                                <div className="space-y-2">
                                    {Array.from(new Set(analytics.reimbursementReport.map(r => r.status))).map(status => {
                                        const count = analytics.reimbursementReport.filter(r => r.status === status).reduce((sum, r) => sum + r.count, 0);
                                        return (
                                            <div key={status} className="flex items-center justify-between p-2 bg-gray-50">
                                                <span className="text-xs font-semibold text-gray-600">{status}</span>
                                                <span className="text-xs font-semibold text-gray-900">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-[11px] text-gray-400">No status-wise data.</p>}
                        </div>
                        <div className="space-y-4 border-l border-gray-100 pl-4">
                            <h4 className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Top Expense Types</h4>
                            {analytics.reimbursementReport.length > 0 ? (
                                <div className="space-y-2">
                                    {analytics.reimbursementReport.slice(0, 4).map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50">
                                            <span className="text-xs font-semibold text-gray-600 truncate max-w-[100px]">{r.type}</span>
                                            <span className="text-xs font-semibold text-fuchsia-600">₹{(r.totalAmount / 1000).toFixed(1)}k</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-[11px] text-gray-400">No type-wise data.</p>}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* PAY EQUITY & PF/ESI TREND SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* 12. Pay Equity / Gender Pay Gap */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col h-[400px]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900">Pay Equity / Gender Pay Gap</h3>
                            <p className="text-[12px] font-medium text-gray-400">Average net salary by gender and gap vs male average.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Gap</span>
                            <span className="text-lg font-semibold text-rose-500 leading-none">
                                {(() => {
                                    const male = analytics.payEquity.find(p => p.gender === 'MALE')?.avgNet || 0;
                                    const female = analytics.payEquity.find(p => p.gender === 'FEMALE')?.avgNet || 0;
                                    if (male === 0) return '0%';
                                    const gap = ((male - female) / male) * 100;
                                    return `${gap.toFixed(1)}%`;
                                })()}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.payEquity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="gender" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `₹${Math.round(value).toLocaleString()}`}
                                />
                                <Bar dataKey="avgNet" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60}>
                                    {analytics.payEquity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.gender === 'MALE' ? '#3b82f6' : entry.gender === 'FEMALE' ? '#ec4899' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 13. PF / ESI Monthly Contribution Report */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[15px] border border-gray-200 p-6 flex flex-col h-[400px]"
                >
                    <div className="space-y-1 mb-6">
                        <h3 className="font-semibold text-gray-900">PF / ESI Monthly Contribution Report</h3>
                        <p className="text-[12px] font-medium text-gray-400">Employee and employer contribution trend for last 6 months.</p>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.pfEsiTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `₹${Math.round(value).toLocaleString()}`}
                                />
                                <Line type="monotone" dataKey="pfEmployee" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="PF Employee" />
                                <Line type="monotone" dataKey="pfEmployer" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name="PF Employer" />
                                <Line type="monotone" dataKey="esiEmployee" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} name="ESI Employee" />
                                <Line type="monotone" dataKey="esiEmployer" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} name="ESI Employer" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase">PF Emp.</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase">PF Empr.</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500 mb-1" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase">ESI Emp.</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-rose-500 mb-1" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase">ESI Empr.</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Employee Salary Details Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col mt-8"
            >
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between bg-white gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 md:text-lg">Employee Salary Details</h3>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Detailed breakdown of processed salaries</p>
                        </div>
                    </div>
                    <div className="relative group min-w-[300px]">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or employee ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full text-sm font-medium"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar -mb-px">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Gross Salary</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Deductions</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Net Paid</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-sm group-hover:bg-blue-100 transition-colors">
                                                {item.employee_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{item.employee_name}</span>
                                                <span className="text-[11px] font-semibold text-gray-400">{item.emp_id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[13px] font-semibold text-gray-600">{item.department_name || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[14px] font-semibold text-gray-900">₹{(item.total_gross || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[14px] font-semibold text-rose-500">₹{(item.total_deductions || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[14px] font-semibold text-emerald-600">₹{(item.total_net || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase ${item.is_hold ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {item.is_hold ? 'ON HOLD' : 'PROCESSED'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                <Users size={32} className="opacity-20" />
                                            </div>
                                            <p className="text-gray-400 font-semibold">No salary records found for this period</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

