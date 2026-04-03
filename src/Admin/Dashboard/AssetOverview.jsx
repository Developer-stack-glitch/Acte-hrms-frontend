import { useState, useEffect, useMemo } from 'react';
import {
    UserCheck, Wrench, ShieldCheck, Truck, AlertTriangle, RefreshCcw, Calendar, Package,
    ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    getAssetsApi,
    getAssetCategoriesApi,
    getUsersApi,
    getAssetAnalyticsApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';

// Premium Stat Card Component for Assets
const AssetStatCard = ({ title, value, subValueLabel, subValue, icon: Icon, color, delay, path }) => {
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
                    <p className="text-[14px] font-medium text-white">{title}</p>
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
                        <span className="text-[11px] font-medium text-white/90">{subValueLabel}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-white">
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

export default function AssetOverview() {
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState({
        lostDamaged: [],
        requests: [],
        chartData: [],
        requestChartData: []
    });

    // Filters
    const [fromDate, setFromDate] = useState(subDays(new Date(), 30).toLocaleDateString('sv-SE'));
    const [toDate, setToDate] = useState(new Date().toLocaleDateString('sv-SE'));
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
                ...filters,
                limit: 1000 // Get all for frontend stats
            };

            const [assetsRes, categoriesRes, usersRes, analyticsRes] = await Promise.all([
                getAssetsApi(params),
                getAssetCategoriesApi(),
                getUsersApi({ limit: 1000, ...filters }),
                getAssetAnalyticsApi(params)
            ]);

            setAssets(assetsRes.data.assets || []);
            setCategories(categoriesRes.data || []);
            setUsers(usersRes.data.users || []);
            setAnalytics(analyticsRes.data || {
                lostDamaged: [],
                requests: [],
                chartData: [],
                requestChartData: []
            });
        } catch (error) {
            console.error('Error fetching asset data:', error);
            toast.error('Failed to sync asset insights');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const start = new Date(fromDate);
        const end = new Date(toDate);

        const isNew = (date) => {
            if (!date) return false;
            const d = new Date(date);
            return d >= start && d <= end;
        };

        const total = assets.length;
        const assigned = assets.filter(a => a.status === 'Assigned').length;
        const repair = assets.filter(a => a.status === 'Maintenance').length;
        const broken = assets.filter(a => a.status === 'Broken').length;

        // Warranty info
        const inWarranty = assets.filter(a => {
            if (!a.purchaseDate || !a.warrantyInMonth) return false;
            const pDate = new Date(a.purchaseDate);
            const wDate = new Date(pDate.setMonth(pDate.getMonth() + parseInt(a.warrantyInMonth)));
            return wDate > new Date();
        }).length;

        const totalVendors = new Set(assets.filter(a => a.vendor).map(a => a.vendor)).size;

        const newAssets = assets.filter(a => isNew(a.created_at || a.purchaseDate)).length;
        const newUnassigned = assets.filter(a => a.status === 'Available' && isNew(a.updated_at)).length;
        const newRepair = assets.filter(a => a.status === 'Maintenance' && isNew(a.updated_at)).length;

        return {
            total,
            assigned,
            repair,
            broken,
            inWarranty,
            totalVendors,
            newAssets,
            newUnassigned,
            newRepair,
            pendingRequests: analytics.requests.filter(r => r.status === 'Requested').length
        };
    }, [assets, fromDate, toDate, analytics]);

    // Chart Data Calculations
    const typeCompositionData = useMemo(() => {
        const data = {};
        assets.forEach(asset => {
            const cat = asset.category || 'Other';
            if (!data[cat]) data[cat] = { name: cat, Assigned: 0, Unassigned: 0 };
            if (asset.status === 'Assigned') data[cat].Assigned++;
            else if (asset.status === 'Available') data[cat].Unassigned++;
        });
        return Object.values(data).sort((a, b) => (b.Assigned + b.Unassigned) - (a.Assigned + a.Unassigned)).slice(0, 7);
    }, [assets]);

    const deptAllocationData = useMemo(() => {
        const data = {};
        assets.forEach(asset => {
            if (asset.status === 'Assigned' && asset.assignedTo?.department) {
                const dept = asset.assignedTo.department;
                if (!data[dept]) data[dept] = { name: dept, Assigned: 0 };
                data[dept].Assigned++;
            }
        });
        return Object.values(data).sort((a, b) => b.Assigned - a.Assigned).slice(0, 7);
    }, [assets]);

    const vendorInsightData = useMemo(() => {
        const data = {};
        assets.forEach(asset => {
            const vendor = asset.vendor || 'Unknown';
            if (!data[vendor]) data[vendor] = { name: vendor, Total: 0, Repaired: 0, Lost: 0 };
            data[vendor].Total++;
            if (asset.status === 'Maintenance') data[vendor].Repaired++;
            if (asset.status === 'Broken') data[vendor].Lost++;
        });
        return Object.values(data).sort((a, b) => b.Total - a.Total).slice(0, 7);
    }, [assets]);

    // Group assets by employee for the allocation table
    const employeeAllocations = useMemo(() => {
        const allocations = {};
        assets.forEach(asset => {
            if (asset.status === 'Assigned' && asset.assignedTo) {
                const userName = asset.assignedTo.name;
                if (!allocations[userName]) {
                    allocations[userName] = {
                        name: userName,
                        emp_id: asset.assignedTo.emp_id,
                        count: 0
                    };
                }
                allocations[userName].count += 1;
            }
        });
        return Object.values(allocations).sort((a, b) => b.count - a.count);
    }, [assets]);

    // Status counts for the summary table
    const statusSummary = useMemo(() => {
        const counts = {
            Available: 0,
            Assigned: 0,
            Maintenance: 0,
            Broken: 0
        };
        assets.forEach(a => {
            if (counts[a.status] !== undefined) {
                counts[a.status]++;
            }
        });
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }, [assets]);

    // Fill in date gaps for charts
    const processedChartData = useMemo(() => {
        if (!analytics.chartData) return [];
        const dataMap = new Map(analytics.chartData.map(d => [format(new Date(d.date), 'yyyy-MM-dd'), d]));
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const result = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const existing = dataMap.get(dateStr);
            result.push({
                date: dateStr,
                assignments: existing ? parseInt(existing.assignments) : 0,
                repairs: existing ? parseInt(existing.repairs) : 0
            });
        }
        return result;
    }, [analytics.chartData, fromDate, toDate]);

    const processedRequestData = useMemo(() => {
        if (!analytics.requestChartData) return [];
        const dataMap = new Map(analytics.requestChartData.map(d => [format(new Date(d.date), 'yyyy-MM-dd'), d]));
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const result = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const existing = dataMap.get(dateStr);
            result.push({
                date: dateStr,
                requested: existing ? parseInt(existing.requested) : 0,
                approved: existing ? parseInt(existing.approved) : 0
            });
        }
        return result;
    }, [analytics.requestChartData, fromDate, toDate]);

    if (loading && !assets.length) return <DashboardSkeleton />;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                    <p className="text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wider">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[11px] font-semibold text-gray-500">{entry.name}:</span>
                                <span className="text-[11px] font-bold text-gray-900">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
            {/* Header section with Insights title and Filters on one line */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-[#0f172a] tracking-tight flex items-center gap-3">
                        Asset Insights
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h1>
                    <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest leading-relaxed">
                        {format(new Date(), 'EEEE, MMMM do yyyy')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Category:</span>
                        <select
                            className="bg-transparent text-[13px] font-semibold text-gray-700 outline-none border-none cursor-pointer focus:ring-0 p-0"
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <div className="flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                            <div className="flex items-center gap-1 sm:gap-1 px-1 sm:px-2 group">
                                <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-widest mr-1">From</span>
                                <div className="relative flex items-center gap-0">
                                    <DatePicker
                                        selected={new Date(fromDate)}
                                        onChange={(date) => setFromDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                        dateFormat="yyyy-MM-dd"
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
                            onClick={fetchData}
                            className="p-2.5 bg-white text-gray-400 rounded-xl hover:text-primary hover:bg-primary/5 transition-all shrink-0 border border-gray-200"
                        >
                            <RefreshCcw size={20} className={`${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <AssetStatCard
                    title="Total Assets"
                    value={stats.total}
                    subValueLabel="New Assets (week)"
                    subValue={stats.newAssets}
                    icon={Package}
                    color={{ bg: 'bg-gradient-to-br from-blue-500 to-blue-600' }}
                    delay={0.1}
                    path="/assets"
                />
                <AssetStatCard
                    title="Assigned Assets"
                    value={stats.assigned}
                    subValueLabel="Unassigned (week)"
                    subValue={stats.newUnassigned}
                    icon={UserCheck}
                    color={{ bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' }}
                    delay={0.2}
                    path="/assets"
                />
                <AssetStatCard
                    title="In Repair"
                    value={stats.repair}
                    subValueLabel="In Repair (week)"
                    subValue={stats.newRepair}
                    icon={Wrench}
                    color={{ bg: 'bg-gradient-to-br from-orange-500 to-orange-600' }}
                    delay={0.3}
                    path="/assets"
                />
                <AssetStatCard
                    title="In Warranty"
                    value={stats.inWarranty}
                    subValueLabel="Expired (week)"
                    subValue={0}
                    icon={ShieldCheck}
                    color={{ bg: 'bg-gradient-to-br from-violet-500 to-violet-600' }}
                    delay={0.4}
                    path="/assets"
                />
                <AssetStatCard
                    title="Total Vendors"
                    value={stats.totalVendors}
                    subValueLabel="New Vendor (week)"
                    subValue={0}
                    icon={Truck}
                    color={{ bg: 'bg-gradient-to-br from-slate-600 to-slate-700' }}
                    delay={0.5}
                    path="/assets"
                />
                <AssetStatCard
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    subValueLabel="Needs Action"
                    subValue={stats.pendingRequests}
                    icon={Clock}
                    color={{ bg: 'bg-gradient-to-br from-amber-500 to-amber-600' }}
                    delay={0.7}
                    path="/assets"
                />
            </div>

            {/* Allocation and Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Allocation */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6">
                    <div className="mb-5">
                        <h3 className="text-[16px] font-semibold text-gray-800">
                            Asset Allocation (Employee-wise)
                        </h3>
                        <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                            Currently assigned assets per employee <span className="text-rose-400 font-mono">(user_assets.status = assigned)</span>.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[13px] font-semibold text-gray-800 uppercase">Employee</th>
                                    <th className="pb-3 text-[13px] font-semibold text-gray-800 uppercase text-right">Assigned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {employeeAllocations.length > 0 ? employeeAllocations.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {item.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                                                    <span className="text-[10px] font-semibold text-gray-400">{item.emp_id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="text-md font-semibold text-gray-800">{item.count}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="py-12 text-center text-[15px] font-semibold text-gray-400">
                                            No assigned assets match filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Asset Summary */}
                <div className="bg-white rounded-[15px] border border-gray-200 p-6">
                    <div className="mb-5">
                        <h3 className="text-[16px] font-semibold text-gray-800">
                            Asset Summary (Totals & Status)
                        </h3>
                        <p className="text-[11px] font-medium text-gray-400 mt-1 italic">
                            Company assets only <span className="text-rose-400 font-mono">(assets_category = 1, excludes variant parts)</span>: totals and status mix.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-[14px] font-semibold text-gray-800 uppercase">Asset status</th>
                                    <th className="pb-3 text-[14px] font-semibold text-gray-800 uppercase text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {statusSummary.filter(s => s.count > 0).length > 0 ? (
                                    statusSummary.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 font-semibold text-gray-600 text-sm">{item.status}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-lg font-semibold text-gray-800 text-sm">{item.count}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="py-12 text-center text-[15px] font-semibold text-gray-400">
                                            No data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Visual Insights Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Asset Type Composition */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-semibold text-gray-800">Asset Type Composition</h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeCompositionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                                />
                                <Bar dataKey="Assigned" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="Unassigned" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronLeft size={16} /></button>
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronRight size={16} /></button>
                    </div>
                </div>

                {/* 2. Assets by Department */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-semibold text-gray-800">Assets by Department</h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptAllocationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                                />
                                <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronLeft size={16} /></button>
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronRight size={16} /></button>
                    </div>
                </div>

                {/* 3. Assets by Vendors */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[350px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-semibold text-gray-800">Assets by Vendors</h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vendorInsightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                                />
                                <Bar dataKey="Total" name="Total Assets" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Repaired" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Lost" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronLeft size={16} /></button>
                        <button className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Visual Insights Row 2 (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* 5. LOST / DAMAGED ASSETS */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 h-[400px] overflow-y-auto">
                    <div className="mb-4">
                        <h3 className="text-[16px] font-semibold text-gray-800">
                            Lost / Damaged Assets
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic">
                            Tracked events for assets reported as damaged or lost. <span className="text-primary/60">Open indicates pending resolution.</span>
                        </p>
                        <div className="flex gap-4 mt-3">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Period History: <span className="text-gray-900 ml-1">{analytics.lostDamaged.length}</span></span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Unresolved: <span className="text-rose-500 ml-1">{analytics.lostDamaged.filter(h => !h.assigned_to).length}</span></span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-2 px-3 text-[14px] font-semibold text-gray-800 uppercase tracking-wider">Asset Name</th>
                                    <th className="py-2 px-3 text-[14px] font-semibold text-gray-800 uppercase tracking-wider text-center">Type</th>
                                    <th className="py-2 px-3 text-[14px] font-semibold text-gray-800 uppercase tracking-wider text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {analytics.lostDamaged.length > 0 ? (
                                    analytics.lostDamaged.map((h, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-3 text-sm font-semibold text-gray-700">{h.asset_name}</td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${h.history_type === 'Lost' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {h.history_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right text-xs font-medium text-gray-500 whitespace-nowrap">
                                                {format(new Date(h.assigned_from), 'dd MMM')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="py-10 text-center text-sm font-medium text-gray-400 italic">
                                            No lost/damaged events in range
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 8. ASSET REQUESTS & APPROVALS (Line Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[16px] font-semibold text-gray-800">Asset Requests & Approvals</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <span className="text-[10px] font-semibold text-gray-500">Asset Approved</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                <span className="text-[10px] font-semibold text-gray-500">Asset Requested</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedRequestData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                                />
                                <Line type="monotone" dataKey="requested" name="Asset Requested" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="approved" name="Asset Approved" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. ASSET REQUESTS BY USER */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200">
                    <div className="mb-4">
                        <h3 className="text-[16px] font-semibold text-gray-800">
                            Asset Requests By User
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic">
                            Tracked volume of requests <span className="text-primary/60">processed through the asset query system.</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-2 text-[14px] font-semibold text-gray-800 uppercase tracking-wider">User</th>
                                    <th className="py-2 text-[14px] font-semibold text-gray-800 uppercase tracking-wider text-right">Requests</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {analytics.requests.length > 0 ? (
                                    // Aggregate requests by user for this table
                                    Object.values(analytics.requests.reduce((acc, r) => {
                                        if (!acc[r.user_name]) acc[r.user_name] = { name: r.user_name, count: 0 };
                                        acc[r.user_name].count++;
                                        return acc;
                                    }, {})).map((u, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 text-sm font-semibold text-gray-700">{u.name}</td>
                                            <td className="py-3 text-right">
                                                <span className="text-sm font-semibold text-gray-900">{u.count}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="py-10 text-center text-sm font-medium text-gray-400 italic">
                                            No requests in range
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 7. ASSIGNMENTS VS REPAIRS (Bar Chart) */}
                <div className="bg-white p-6 rounded-[15px] border border-gray-200 flex flex-col h-[400px]">
                    <div className="mb-4">
                        <h3 className="text-[16px] font-semibold text-gray-800">
                            Assignments Vs Repairs By Asset
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium italic leading-relaxed">
                            Trend comparison between new asset assignments <span className="text-primary/60">and repair events logged in history.</span>
                        </p>
                    </div>
                    <div className="flex-1 w-full min-h-0 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}
                                />
                                <Bar dataKey="assignments" name="Assignments" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                                <Bar dataKey="repairs" name="Repairs" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}