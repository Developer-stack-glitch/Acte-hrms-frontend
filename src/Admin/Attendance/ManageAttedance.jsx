import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Info,
    Calendar as CalendarIcon,
    RefreshCcw,
    FileSpreadsheet,
    CalendarX,
    X,
    FileText,
    Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { getUserAttendanceApi, getAttendanceApi, getHolidaysApi, getLeavesApi, getWeekOffsApi, getCompanyWeekOffsApi } from '../../Action/api';
import { isWithinInterval, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import UserFilter from '../User/UserFilter';
import AttendanceSkeleton from '../../Common/CommonSkeletonLoader/AttendanceSkeleton';
import NoData from '../../Common/NoData';

const StatCard = ({ title, value, percentage, isPositive, todayCount, textColor, showInfo, delay = 0 }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getHoverBg = () => {
        if (title === 'On Time') return 'bg-emerald-50/50';
        if (title.includes('Late')) return 'bg-amber-50/50';
        if (title === 'On Leave') return 'bg-indigo-50/50';
        if (title === 'Absent') return 'bg-rose-50/50';
        if (title.includes('Early')) return 'bg-fuchsia-50/50';
        return 'bg-gray-50/50';
    };

    const getTooltipContent = () => {
        if (title === 'On Leave') return (
            <div className="flex flex-col gap-1">
                <span className="font-medium text-[13px] mb-1">On Leave includes:</span>
                <span className="flex items-center text-[12px] gap-2">• Paid Leave (PL)</span>
                <span className="flex items-center text-[12px] gap-2">• Unpaid Leave (UPL)</span>
                <span className="flex items-center text-[12px] gap-2">• Week Off (WO)</span>
                <span className="flex items-center text-[12px] gap-2">• Holiday (NH/NPNH)</span>
            </div>
        );
        return "Range-based % comparison with last month";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            transition={{ delay }}
            className="bg-white rounded-lg border border-gray-200 flex flex-col h-full group transition-all duration-300 hover:border-primary/10 hover:shadow-xl hover:shadow-primary/5 relative"
        >
            <div className={`p-3 flex-1 transition-colors duration-300 rounded-t-xl ${isHovered ? getHoverBg() : ''}`}>
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 relative group/info">
                        <span className="text-gray-500 text-[13px] font-medium tracking-tight">{title}</span>
                        {showInfo && (
                            <>
                                <Info size={14} className="text-blue-500 fill-blue-500/10 cursor-help" />
                                <div className="absolute bottom-full z-9999 left-0 mb-2 w-48 p-3 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg text-[10px] font-medium leading-relaxed opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-[100] shadow-xl pointer-events-none border border-white/10">
                                    {getTooltipContent()}
                                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900/95" />
                                </div>
                            </>
                        )}
                    </div>
                    {percentage !== undefined && (
                        <div className="relative group/pct">
                            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-default ${(title === 'On Time' || title === 'Total Employees')
                                ? (isPositive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500')
                                : (isPositive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500') // Actually simplified below
                                }`}>
                                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                                    {isPositive ? '▲' : '▼'} {Math.abs(percentage)}%
                                </span>
                            </div>
                            <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg text-[10px] text-center font-medium opacity-0 invisible group-hover/pct:opacity-100 group-hover/pct:visible transition-all duration-200 z-[100] shadow-xl pointer-events-none border border-white/10 text-[11px]">
                                Range-based % comparison with last month
                                <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900/95" />
                            </div>
                        </div>
                    )}
                </div>
                <div className={`md:text-2xl text-xl font-black font-semibold tabular-nums ${textColor}`}>
                    {value}
                </div>
            </div>
            <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-600 font-semibold uppercase tracking-wider">Today's</span>
                <div className="w-6 h-6 rounded-full bg-blue-600 shadow-sm flex items-center justify-center text-[10px] font-medium text-white text-[11px]">
                    {todayCount}
                </div>
            </div>
        </motion.div>
    );
};

export default function ManageAttedance() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [holidays, setHolidays] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [weekOffs, setWeekOffs] = useState([]);
    const [companyWeekOffs, setCompanyWeekOffs] = useState([]);

    // Date Range States
    const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [showFilters, setShowFilters] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [selectedDetail, setSelectedDetail] = useState(null);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo._id;

    const daysInRange = useMemo(() => {
        try {
            return eachDayOfInterval({
                start: new Date(fromDate),
                end: new Date(toDate)
            });
        } catch (e) {
            return [];
        }
    }, [fromDate, toDate]);

    const prevRange = useMemo(() => {
        try {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const duration = end.getTime() - start.getTime();

            // If it's a full month selection, use subMonths for more natural comparison
            if (format(start, 'yyyy-MM-dd') === format(startOfMonth(start), 'yyyy-MM-dd') &&
                format(end, 'yyyy-MM-dd') === format(endOfMonth(end), 'yyyy-MM-dd')) {
                const prevStart = startOfMonth(subMonths(start, 1));
                const prevEnd = endOfMonth(subMonths(start, 1));
                return {
                    start: format(prevStart, 'yyyy-MM-dd'),
                    end: format(prevEnd, 'yyyy-MM-dd')
                };
            }

            // Otherwise use same duration
            const prevStart = new Date(start.getTime() - duration - 86400000);
            const prevEnd = new Date(start.getTime() - 86400000);
            return {
                start: format(prevStart, 'yyyy-MM-dd'),
                end: format(prevEnd, 'yyyy-MM-dd')
            };
        } catch (e) {
            return null;
        }
    }, [fromDate, toDate]);

    const prevDaysInRange = useMemo(() => {
        if (!prevRange) return [];
        try {
            return eachDayOfInterval({
                start: new Date(prevRange.start),
                end: new Date(prevRange.end)
            });
        } catch (e) {
            return [];
        }
    }, [prevRange]);

    useEffect(() => {
        fetchData();
    }, [fromDate, toDate, filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const fetchStart = prevRange ? prevRange.start : fromDate;
            const [usersRes, attendanceRes, holidaysRes, leavesRes, weekoffsRes, companyWoRes] = await Promise.all([
                getUserAttendanceApi({ ...filters }),
                getAttendanceApi({ startDate: fetchStart, endDate: toDate }),
                getHolidaysApi(),
                getLeavesApi({ startDate: fetchStart, endDate: toDate, status: 'Approved' }),
                getWeekOffsApi(),
                getCompanyWeekOffsApi()
            ]);

            let emps = usersRes.data || [];
            let lvs = leavesRes.data.leaves || [];
            let atts = attendanceRes.data || [];
            let wos = weekoffsRes.data || [];
            let cwo = companyWoRes.data || [];

            if (userRole === 'employee') {
                emps = emps.filter(e => String(e.id) === String(userId));
                lvs = lvs.filter(l => String(l.employee_id) === String(userId));
                atts = atts.filter(a => String(a.user_id) === String(userId));
            }

            setEmployees(emps);
            setLeaves(lvs);
            setWeekOffs(wos);
            setCompanyWeekOffs(cwo);

            const map = {};
            atts.forEach(record => {
                const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
                map[`${record.user_id}_${dateKey}`] = record;
            });
            setAttendanceMap(map);
            setHolidays(holidaysRes.data || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Sync failed. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusForDay = (userId, day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const record = attendanceMap[`${userId}_${dateKey}`];

        if (record) {
            // If backend already flagged as week off and it's not Present/On Leave, force Week Off status
            if (record.is_week_off && (record.status === 'Absent' || record.status === 'Incomplete' || !record.status)) {
                return { ...record, status: 'Week Off' };
            }
            return record;
        }

        // Check for approved leaves
        const dayLeave = leaves.find(l =>
            String(l.employee_id) === String(userId) &&
            isWithinInterval(startOfDay(day), {
                start: startOfDay(parseISO(l.start_date)),
                end: startOfDay(parseISO(l.end_date))
            })
        );

        if (dayLeave) {
            return {
                status: dayLeave.leave_type === 'Permission' ? 'Permission' : 'On Leave',
                date: dateKey,
                leave_type: dayLeave.leave_type,
                is_half_day: !!dayLeave.is_half_day,
                half_day_period: dayLeave.half_day_period,
                reason: dayLeave.reason,
                permissions: dayLeave.leave_type === 'Permission' ? [{
                    id: dayLeave.id,
                    start_time: dayLeave.start_time,
                    end_time: dayLeave.end_time,
                    reason: dayLeave.reason
                }] : null
            };
        }

        // Check for official Holidays
        const isHoliday = holidays.some(h => format(new Date(h.date), 'yyyy-MM-dd') === dateKey);
        if (isHoliday) {
            return { status: 'Holiday', date: dateKey };
        }

        // Check for Dynamic Week Off (User Exception First)
        const isAlternativeDate = weekOffs.some(w =>
            String(w.userid) === String(userId) &&
            (
                (w.alternative_date && (w.alternative_date === dateKey || w.alternative_date.startsWith(dateKey))) ||
                (w.isweekoffend && w.alternative_day && w.alternative_day.toLowerCase() === format(day, 'EEEE').toLowerCase())
            )
        );

        if (!isAlternativeDate) {
            const isUserWeekOff = weekOffs.some(w => {
                if (String(w.userid) !== String(userId)) return false;
                if (w.isweekoffend) {
                    return w.weekoffdate.toLowerCase() === format(day, 'EEEE').toLowerCase();
                } else {
                    return w.weekoffdate === dateKey;
                }
            });

            if (isUserWeekOff) {
                return { status: 'Week Off', date: dateKey };
            }

            // Check for Company-wide Week Off
            const emp = employees.find(e => String(e.id) === String(userId));
            const companyId = emp?.company;
            const currentDayName = format(day, 'EEEE');

            const isCompanyWeekOff = companyWeekOffs.some(w =>
                String(w.company_id) === String(companyId) &&
                w.day_name.toLowerCase() === currentDayName.toLowerCase()
            );

            if (isCompanyWeekOff) {
                return { status: 'Week Off', date: dateKey };
            }

            // Fallback: Default to Sunday ONLY if no global company rule is set for this company
            const hasCompanyRules = companyWeekOffs.some(w => String(w.company_id) === String(companyId));
            if (!hasCompanyRules && format(day, 'eee').toLowerCase() === 'sun') {
                return { status: 'Week Off', date: dateKey };
            }
        }

        // If no record and it's today or in the past, mark as Absent
        if (isToday(day) || isBefore(day, startOfDay(new Date()))) {
            return { status: 'Absent', date: dateKey };
        }

        return null;
    };

    const getStatusStyles = (record) => {
        if (!record) return 'bg-white text-gray-300 border-gray-50 hover:border-gray-100';

        const { status, is_half_day, is_week_off } = record;
        if (is_half_day && status === 'On Leave') {
            return 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 shadow-sm';
        }

        // Special style for working on Week Off
        if (status === 'Present' && is_week_off) {
            return 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 shadow-sm';
        }

        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100';
            case 'Absent': return 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100';
            case 'Incomplete': return 'bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100';
            case 'On Leave': return 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100';
            case 'Permission': return 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 shadow-sm';
            case 'Holiday': return 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100';
            case 'Week Off': return 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100';
            default: return 'bg-white text-gray-300 border-gray-50 hover:border-gray-100';
        }
    };

    const filteredEmployees = useMemo(() => employees.filter(emp => {
        if (!emp) return false;
        const nameMatch = (emp.employee_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const idMatch = (emp.emp_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return nameMatch || idMatch;
    }), [employees, searchTerm]);

    const stats = useMemo(() => {
        const initial = {
            range: { present: 0, late: 0, leave: 0, absent: 0, early: 0, onTime: 0 },
            prev: { present: 0, late: 0, leave: 0, absent: 0, early: 0, onTime: 0 },
            today: { present: 0, late: 0, leave: 0, absent: 0, early: 0, onTime: 0 }
        };

        const counts = employees.reduce((acc, emp) => {
            if (!emp || !emp.id) return acc;

            daysInRange.forEach(day => {
                const record = getStatusForDay(emp.id, day);
                if (record) {
                    if (record.status === 'Present' || record.status === 'Incomplete') {
                        acc.range.present += record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1;
                        if (!record.late_punch_in || /^00:00(:00)?$/.test(record.late_punch_in) || record.late_punch_in === 'undefined') {
                            acc.range.onTime++;
                        } else {
                            acc.range.late++;
                        }
                        if (record.early_punch_out && !/^00:00(:00)?$/.test(record.early_punch_out) && record.early_punch_out !== 'undefined') {
                            acc.range.early++;
                        }
                    } else if (record.status === 'Permission') {
                        acc.range.present += record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1.0;
                        acc.range.onTime++;
                    } else if (record.status === 'On Leave' || record.status === 'Absent') {
                        if (record.status === 'On Leave') {
                            acc.range.leave++;
                        } else {
                            acc.range.absent++;
                        }
                    } else if (record.status === 'Holiday') {
                        acc.range.leave++;
                    }
                }
            });

            // Previous Range Aggregation for Comparison
            prevDaysInRange.forEach(day => {
                const record = getStatusForDay(emp.id, day);
                if (record) {
                    if (record.status === 'Present' || record.status === 'Incomplete') {
                        acc.prev.present += record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1;
                        if (!record.late_punch_in || /^00:00(:00)?$/.test(record.late_punch_in) || record.late_punch_in === 'undefined') {
                            acc.prev.onTime++;
                        } else {
                            acc.prev.late++;
                        }
                        if (record.early_punch_out && !/^00:00(:00)?$/.test(record.early_punch_out) && record.early_punch_out !== 'undefined') {
                            acc.prev.early++;
                        }
                    } else if (record.status === 'Permission') {
                        acc.prev.present += record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1.0;
                        acc.prev.onTime++;
                    } else if (record.status === 'On Leave' || record.leave_status === 'Approved' || record.status === 'Week Off') {
                        acc.prev.leave++;
                    } else if (record.status === 'Absent') {
                        acc.prev.absent++;
                    } else if (record.status === 'Holiday') {
                        acc.prev.leave++;
                    }
                }
            });

            // Today-specific Aggregation
            const recordToday = getStatusForDay(emp.id, new Date());
            if (recordToday) {
                if (recordToday.status === 'Present' || recordToday.status === 'Incomplete') {
                    acc.today.present += recordToday.working_day_value !== undefined ? parseFloat(recordToday.working_day_value) : 1;
                    if (!recordToday.late_punch_in || /^00:00(:00)?$/.test(recordToday.late_punch_in) || recordToday.late_punch_in === 'undefined') {
                        acc.today.onTime++;
                    } else {
                        acc.today.late++;
                    }
                    if (recordToday.early_punch_out && !/^00:00(:00)?$/.test(recordToday.early_punch_out) && recordToday.early_punch_out !== 'undefined') {
                        acc.today.early++;
                    }
                } else if (recordToday.status === 'Permission') {
                    acc.today.present += recordToday.working_day_value !== undefined ? parseFloat(recordToday.working_day_value) : 1.0;
                    acc.today.onTime++;
                } else if (recordToday.status === 'On Leave' || recordToday.leave_status === 'Approved' || recordToday.status === 'Week Off') {
                    acc.today.leave++;
                } else if (recordToday.status === 'Absent') {
                    acc.today.absent++;
                } else if (recordToday.status === 'Holiday') {
                    acc.today.leave++;
                }
            }
            return acc;
        }, initial);

        const currentTotal = employees.length * (daysInRange.length || 1);
        const prevTotal = employees.length * (prevDaysInRange.length || 1);

        const getPercent = (count, total) => total ? ((count / total) * 100).toFixed(2) : '0.00';

        const currentStats = {
            present: getPercent(counts.range.present, currentTotal),
            onTime: getPercent(counts.range.onTime, currentTotal),
            late: getPercent(counts.range.late, currentTotal),
            leave: getPercent(counts.range.leave, currentTotal),
            absent: getPercent(counts.range.absent, currentTotal),
            early: getPercent(counts.range.early, currentTotal)
        };

        const prevStats = {
            present: getPercent(counts.prev.present, prevTotal),
            onTime: getPercent(counts.prev.onTime, prevTotal),
            late: getPercent(counts.prev.late, prevTotal),
            leave: getPercent(counts.prev.leave, prevTotal),
            absent: getPercent(counts.prev.absent, prevTotal),
            early: getPercent(counts.prev.early, prevTotal)
        };

        const getChange = (curr, prev) => (parseFloat(curr) - parseFloat(prev)).toFixed(2);

        return {
            range: currentStats,
            comparison: {
                present: getChange(currentStats.present, prevStats.present),
                onTime: getChange(currentStats.onTime, prevStats.onTime),
                late: getChange(currentStats.late, prevStats.late),
                leave: getChange(currentStats.leave, prevStats.leave),
                absent: getChange(currentStats.absent, prevStats.absent),
                early: getChange(currentStats.early, prevStats.early)
            },
            today: counts.today
        };
    }, [employees, attendanceMap, daysInRange, prevDaysInRange]);

    // Ledger Totals for Mobile Summary
    const ledgerTotals = useMemo(() => {
        const totals = { p: 0, a: 0, l: 0, h: 0, wo: 0, li: 0, eo: 0, d: 0 };
        filteredEmployees.forEach(emp => {
            const rowStats = calculateUserStats(emp.id);
            totals.p += parseFloat(rowStats.p);
            totals.a += rowStats.a;
            totals.l += rowStats.lv;
            totals.h += rowStats.h;
            totals.wo += rowStats.wo;
            totals.li += rowStats.l;
            totals.eo += rowStats.e;
            totals.d += parseFloat(rowStats.d);
        });

        // If many employees, show totals. If just one (employee view), show their stats.
        const isSingle = filteredEmployees.length === 1;
        return {
            p: isSingle ? totals.p : totals.p.toFixed(1),
            a: totals.a,
            l: totals.l,
            h: totals.h,
            wo: totals.wo,
            li: totals.li,
            eo: totals.eo,
            d: totals.d.toFixed(1)
        };
    }, [filteredEmployees, daysInRange, attendanceMap]);

    if (loading && employees.length === 0) {
        return <AttendanceSkeleton />;
    }

    return (
        <div className="flex flex-col md:gap-8 gap-4 p-3 bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] min-h-screen">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="w-full lg:flex-1 flex items-center gap-2">
                    {userRole !== 'employee' && (
                        <div className="relative flex-1 flex items-center bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-1 transition-all focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-primary focus:ring-4 focus:ring-primary/5 h-9 md:h-10 border border-gray-200">
                            <div className="pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Search size={16} className="md:w-[18px]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="flex-1 px-2 md:px-2 py-2 bg-transparent outline-none text-[13px] md:text-[14px] font-medium text-gray-700 placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={() => setIsFilterDrawerOpen(true)}
                                className={`flex items-center gap-2 px-3 h-7 md:h-8 rounded-full font-bold text-[11px] transition-all uppercase tracking-wide mr-1 ${Object.keys(filters).some(key => filters[key]?.length > 0)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                                    }`}
                            >
                                <Filter size={14} />
                                {Object.keys(filters).some(key => filters[key]?.length > 0) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                )}
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-1 rounded-[18px]">
                        <button
                            onClick={fetchData}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-auto flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                        <div className="flex items-center gap-2 px-3 group">
                            <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">From</span>
                            <div className="relative flex items-center gap-1">
                                <DatePicker
                                    selected={fromDate ? new Date(fromDate) : null}
                                    onChange={(date) => setFromDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                    dateFormat="yyyy-MM-dd"
                                    showYearDropdown
                                    showMonthDropdown
                                    dropdownMode="select"
                                    className="bg-transparent border-none text-[12px] md:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[90px]"
                                    popperPlacement="bottom-end"
                                    portalId="root"
                                />
                                <CalendarIcon className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                        <div className="w-[1px] h-4 bg-gray-100"></div>
                        <div className="flex items-center gap-2 px-3 group">
                            <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">To</span>
                            <div className="relative flex items-center gap-1">
                                <DatePicker
                                    selected={toDate ? new Date(toDate) : null}
                                    onChange={(date) => setToDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                    dateFormat="yyyy-MM-dd"
                                    className="bg-transparent border-none text-[12px] md:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[90px]"
                                    popperPlacement="bottom-end"
                                    portalId="root"
                                />
                                <CalendarIcon className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-4 rounded-[14px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="flex items-center justify-between col-span-full">
                            <span className="text-[13px] text-gray-500 font-medium italic">Additional status-based filters can be implemented here...</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setFromDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                                        setToDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                                    }}
                                    className="px-6 py-2 rounded-full border border-gray-100 text-[14px] font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                                >
                                    Reset Range
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/10 text-[14px]"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <UserFilter
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                currentFilters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
            />

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title={userRole === 'employee' ? "My Attendance" : "Total Employees"}
                    value={userRole === 'employee' ? (getStatusForDay(userId, new Date())?.status || '---') : employees.length}
                    todayCount={userRole === 'employee' ? (attendanceMap[`${userId}_${format(new Date(), 'yyyy-MM-dd')}`] ? 1 : 0) : employees.length}
                    textColor={userRole === 'employee' ? (getStatusForDay(userId, new Date())?.status === 'Absent' ? 'text-rose-500' : 'text-emerald-500') : 'text-gray-800'}
                    delay={0.05}
                />
                <StatCard
                    title="On Time"
                    value={`${stats.range.onTime} %`}
                    percentage={stats.comparison.onTime}
                    isPositive={parseFloat(stats.comparison.onTime) >= 0}
                    todayCount={stats.today.onTime}
                    textColor="text-emerald-500"
                    delay={0.1}
                />
                <StatCard
                    title="Late Login"
                    value={`${stats.range.late} %`}
                    percentage={stats.comparison.late}
                    isPositive={parseFloat(stats.comparison.late) <= 0}
                    todayCount={stats.today.late}
                    textColor="text-amber-500"
                    delay={0.15}
                />
                <StatCard
                    title="Casual Leave"
                    value={`${stats.range.leave} %`}
                    percentage={stats.comparison.leave}
                    isPositive={true}
                    todayCount={stats.today.leave}
                    textColor="text-indigo-500"
                    showInfo={true}
                    delay={0.2}
                />
                <StatCard
                    title="Absent"
                    value={`${stats.range.absent} %`}
                    percentage={stats.comparison.absent}
                    isPositive={parseFloat(stats.comparison.absent) <= 0}
                    todayCount={stats.today.absent}
                    textColor="text-rose-500"
                    delay={0.25}
                />
                <StatCard
                    title="Early Logout"
                    value={`${stats.range.early} %`}
                    percentage={stats.comparison.early}
                    isPositive={parseFloat(stats.comparison.early) <= 0}
                    todayCount={stats.today.early}
                    textColor="text-fuchsia-500"
                    delay={0.3}
                />
            </div>

            {/* Main Attendance Grid */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white md:rounded-[15px] rounded-[15px] border border-gray-200 overflow-hidden flex flex-col"
            >
                {/* Grid Header */}
                <div className="md:px-6 md:py-5 px-3 py-3 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between md:gap-4 gap-2 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                            <CalendarIcon size={20} />
                        </div>
                        <div>
                            <h3 className="md:text-2xl text-lg font-semibold text-gray-900 leading-none mb-1.5">Attendance Ledger</h3>
                            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Breakdown: {format(new Date(fromDate), 'dd/MM/yy')} - {format(new Date(toDate), 'dd/MM/yy')}</p>
                        </div>
                    </div>

                    <div className="flex items-center bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50">
                        <button
                            onClick={() => {
                                const newDate = subMonths(new Date(fromDate), 1);
                                setFromDate(format(startOfMonth(newDate), 'yyyy-MM-dd'));
                                setToDate(format(endOfMonth(newDate), 'yyyy-MM-dd'));
                            }}
                            className="p-2 hover:bg-white hover:text-primary hover:shadow-sm rounded-xl transition-all text-gray-500"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-6 text-[13px] font-semibold text-gray-800 min-w-[140px] text-center uppercase tracking-widest">
                            {isSameMonth(new Date(fromDate), new Date(toDate)) ? format(new Date(fromDate), 'MMMM yyyy') : 'Custom Range'}
                        </div>
                        <button
                            onClick={() => {
                                const newDate = addMonths(new Date(fromDate), 1);
                                setFromDate(format(startOfMonth(newDate), 'yyyy-MM-dd'));
                                setToDate(format(endOfMonth(newDate), 'yyyy-MM-dd'));
                            }}
                            className="p-2 hover:bg-white hover:text-primary hover:shadow-sm rounded-xl transition-all text-gray-500"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="hidden xl:flex items-center gap-2">
                        <div className="flex items-center -space-x-2 mr-2">
                            {employees.slice(0, 3).map((e, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                    {e.employee_name?.charAt(0)}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
                                +{employees.length}
                            </div>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-100 mx-1" />
                        <button className="p-2 text-gray-300 hover:text-gray-500 transition-colors">
                            <Info size={18} />
                        </button>
                    </div>
                </div>

                {/* Mobile Specific Summary Grid */}
                <div className="md:hidden grid grid-cols-4 border-b border-gray-50 bg-white">
                    {[
                        { label: 'P', value: ledgerTotals.p, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                        { label: 'A', value: ledgerTotals.a, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                        { label: 'L', value: ledgerTotals.l, color: 'text-sky-500', bg: 'bg-sky-50/50' },
                        { label: 'H', value: ledgerTotals.h, color: 'text-violet-500', bg: 'bg-violet-50/50' },
                        { label: 'WO', value: ledgerTotals.wo, color: 'text-gray-500', bg: 'bg-gray-50/50' },
                        { label: 'LI', value: ledgerTotals.li, color: 'text-amber-500', bg: 'bg-amber-50/50' },
                        { label: 'EO', value: ledgerTotals.eo, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50/50' },
                        { label: 'D', value: ledgerTotals.d, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                    ].map((s, i) => (
                        <div key={i} className={`flex flex-col items-center justify-center md:py-4 py-2 gap-1 border-r border-b border-gray-50 last:border-r-0 ${s.bg}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.label}</span>
                            <span className={`md:text-lg text-[13px] font-bold tabular-nums ${s.color}`}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* The Dynamic Table */}
                <div className="overflow-x-auto relative custom-scrollbar pb-2">
                    {filteredEmployees.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-8">
                            <NoData
                                icon={Search}
                                title="No employee found"
                                description="Try adjusting your search or filters to find what you're looking for."
                            />
                        </div>
                    ) : (
                        <table className="w-full border-collapse border-spacing-0">
                            <thead>
                                <tr className="bg-white border-b border-gray-50">
                                    <th className="sticky left-0 bg-white md:px-6 px-3 md:py-6 py-3 text-center border-r border-gray-100 shadow-[4px_0_15px_-4px_rgba(0,0,0,0.05)]">
                                        <span className="md:text-[13px] text-[11px] font-black text-gray-600 uppercase md:tracking-[0.2em] tracking-wider">Employee Information</span>
                                    </th>
                                    {daysInRange.map((day) => (
                                        <th key={day.toString()} className={`md:px-4 px-2 md:py-5 py-3 border-r border-gray-100 min-w-[64px] text-center transition-colors ${isToday(day) ? 'bg-primary/5' : ''}`}>
                                            <div className="flex flex-col items-center md:gap-1 gap-0">
                                                <span className={`md:text-[15px] text-[13px] font-semibold tabular-nums ${isToday(day) ? 'text-primary' : 'text-gray-900'}`}>{format(day, 'dd')}</span>
                                                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-tighter leading-none">{format(day, 'eee')}</span>
                                                {isToday(day) && (
                                                    <motion.div layoutId="today-indicator" className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    {/* Legend Summary Headers */}
                                    {['P', 'A', 'CL', 'H', 'WO', 'LI', 'EO', 'D'].map((h, i) => (
                                        <th
                                            key={h}
                                            className={`px-4 py-5 border-r border-gray-100/50 min-w-[50px] w-[50px] text-center bg-gray-50/80 backdrop-blur-sm sticky z-18 hidden md:table-cell ${i === 0 ? 'shadow-[-4px_0_15px_-4px_rgba(0,0,0,0.05)]' : ''}`}
                                            style={{ right: `${(7 - i) * 50}px` }}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${h === 'A' ? 'text-rose-500' :
                                                h === 'P' ? 'text-emerald-500' :
                                                    h === 'H' ? 'text-violet-500' :
                                                        h === 'CL' ? 'text-sky-500' :
                                                            h === 'WO' ? 'text-gray-500' :
                                                                h === 'LI' ? 'text-amber-500' :
                                                                    h === 'EO' ? 'text-fuchsia-500' :
                                                                        h === 'D' ? 'text-orange-500' :
                                                                            'text-gray-500'
                                                }`}>{h}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredEmployees.map((emp, idx) => {
                                        const userStats = calculateUserStats(emp.id);
                                        return (
                                            <motion.tr
                                                key={emp.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group hover:bg-primary/[0.01] transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                <td className="sticky left-0 z-10 bg-white px-2 md:px-6 py-2 md:py-4 border-r border-gray-100 shadow-[4px_0_15px_-4px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-center gap-2 md:gap-4 min-w-[120px] md:min-w-[220px]">
                                                        <div className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-[10px] md:text-[12px] font-bold text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[14px] md:text-[16px] font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">{emp.employee_name || 'Unnamed Staff'}</span>
                                                            <div className="flex items-center gap-1 md:gap-2 mt-1 whitespace-nowrap">
                                                                <span className="text-[11px] md:text-[12px] font-medium text-gray-500">{emp.emp_id || '---'}</span>
                                                                <span className="w-1 h-1 rounded-full bg-primary" />
                                                                <span className="text-[11px] md:text-[12px] font-medium text-gray-500 truncate">{emp.designation_name || 'No Role Assigned'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 md:gap-2 mt-1">
                                                                <span className="text-[9px] md:text-[10px] font-semibold text-primary/90 uppercase tracking-widest truncate">{emp.department_name || 'GLOBAL'}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                                <span className="text-[9px] md:text-[10px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Shift: {emp.shift_hours || '8.0'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {daysInRange.map((day) => {
                                                    const record = getStatusForDay(emp.id, day);
                                                    const isHalfDay = record?.status === 'On Leave' && record?.is_half_day;
                                                    let cellStatus = null;
                                                    let isFirstAbsentCell = false;
                                                    if (record) {
                                                        if (record.status === 'Present') cellStatus = 'P';
                                                        else if (record.status === 'Absent' || record.status === 'On Leave') {
                                                            const isFullDay = record.status === 'Absent' || !isHalfDay;
                                                            if (record.status === 'On Leave') {
                                                                cellStatus = isFullDay ? 'CL' : '0.5 CL';
                                                            } else {
                                                                cellStatus = isFullDay ? 'A' : '0.5 A';
                                                            }
                                                        } else if (record.status === 'Holiday') cellStatus = 'H';
                                                        else if (record.status === 'Week Off') cellStatus = 'WO';
                                                        else if (record.status === 'Permission') cellStatus = 'P';
                                                    }

                                                    const isLate = record?.late_punch_in && !/^00:00(:00)?$/.test(record.late_punch_in) && record.late_punch_in !== 'undefined';
                                                    const isEarly = record?.early_punch_out && !/^00:00(:00)?$/.test(record.early_punch_out) && record.early_punch_out !== 'undefined';
                                                    const isIncomplete = record?.status === 'Incomplete';

                                                    let cellStyles = getStatusStyles(record);
                                                    if (record?.status === 'On Leave') {
                                                        cellStyles = isHalfDay ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-sky-50 text-sky-600 border-sky-100';
                                                    } else if (record?.status === 'Absent') {
                                                        cellStyles = 'bg-rose-50 text-rose-600 border-rose-100';
                                                    }
                                                    return (
                                                        <td key={day.toString()} className={`px-2 py-4 border-r border-gray-100/90 text-center transition-colors ${isToday(day) ? 'bg-primary/[0.02]' : ''}`}>
                                                            <div
                                                                className={`mx-auto md:w-10 w-8 md:h-10 h-8 rounded-full flex items-center justify-center md:text-[12px] text-[10px] font-bold border transition-all duration-300 hover:scale-110 relative cursor-pointer ${cellStyles}`}
                                                                title={isHalfDay ? `Half Day Leave (${record.half_day_period})` : (isIncomplete ? 'Missing Punch Out' : `${record?.status || ''}${isLate ? ` | Late: ${record.late_punch_in}` : ''}${isEarly ? ` | Early Out: ${record.early_punch_out}` : ''}`)}
                                                                onClick={() => record && setSelectedDetail({ record, day, employee: emp })}
                                                            >
                                                                <span className={isHalfDay ? 'text-[10px]' : ''}>{isIncomplete ? 'P' : (cellStatus || <span className="text-gray-100 font-normal">-</span>)}</span>
                                                                {record?.is_week_off && record?.status === 'Present' && (
                                                                    <div className="absolute -bottom-1 -left-1 px-1 bg-gray-900 text-white text-[7px] font-black rounded-sm leading-tight border border-white z-3" title="Worked on Week Off">WO</div>
                                                                )}
                                                                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                                                    {isIncomplete && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                                                                            title="Missing Punch Out"
                                                                        >
                                                                            <span className="text-white text-[7px] font-black leading-none">!</span>
                                                                        </motion.div>
                                                                    )}
                                                                    {!isIncomplete && isLate && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white shadow-sm"
                                                                            title={`Late In: ${record.late_punch_in || '00:00'}${record.late_penalty && record.late_penalty !== '00:00' ? ` | Penalty: ${record.late_penalty}` : ''}`}
                                                                        />
                                                                    )}
                                                                    {!isIncomplete && isEarly && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full border-2 border-white shadow-sm"
                                                                            title={`Early Logout: ${record.early_punch_out || '00:00'}`}
                                                                        />
                                                                    )}
                                                                    {record?.permissions && record.permissions.length > 0 && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                            className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"
                                                                            title={`Permission: ${record.permissions.map(p => `${(p.start_time || '').slice(0, 5)}-${(p.end_time || '').slice(0, 5)}`).join(', ')}`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                {/* Final Aggregates */}
                                                <td className="sticky right-[350px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-emerald-600 bg-emerald-50 tabular-nums min-w-[50px] w-[50px] shadow-[-4px_0_15px_-4px_rgba(0,0,0,0.05)] hidden md:table-cell">{userStats.p}</td>
                                                <td className="sticky right-[300px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-rose-600 bg-rose-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.a}</td>
                                                <td className="sticky right-[250px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-sky-600 bg-sky-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.lv}</td>
                                                <td className="sticky right-[200px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-violet-600 bg-violet-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.h}</td>
                                                <td className="sticky right-[150px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-gray-600 bg-gray-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.wo}</td>
                                                <td className="sticky right-[100px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-amber-600 bg-amber-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.l}</td>
                                                <td className="sticky right-[50px] z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-fuchsia-600 bg-fuchsia-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.e}</td>
                                                <td className="sticky right-0 z-10 px-2 py-4 border-r border-gray-100/50 text-center text-[13px] font-bold text-orange-600 bg-orange-50 tabular-nums min-w-[50px] w-[50px] hidden md:table-cell">{userStats.d}</td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Legend */}
                <div className="md:px-6 md:py-6 px-3 py-3 bg-gray-50/30 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center md:gap-7 gap-x-1 gap-y-4 w-full md:w-auto">
                        {[
                            { code: 'P', label: 'Present', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            { code: 'A', label: 'Absent', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                            { code: '!', label: 'Missing Punch Out', color: 'bg-orange-50 text-orange-500 border-orange-200' },
                            { code: 'CL', label: 'Casual Leave', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                            { code: '0.5', label: 'Half Day CL', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                            { code: 'H', label: 'Holiday', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                            { code: 'WO', label: 'Week Off', color: 'bg-gray-50 text-gray-500 border-gray-100' },
                            { code: '●', label: 'Permission', color: 'text-blue-500' },
                            { code: '●', label: 'Late Arrival', color: 'text-amber-500' },
                            { code: '●', label: 'Early Logout', color: 'text-fuchsia-500' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3 md:gap-4">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black border tracking-tighter shrink-0 ${item.code === '●' ? 'border-transparent ' + item.color : item.color}`}>
                                    {item.code}
                                </div>
                                <span className="text-[12px] font-bold text-gray-500 truncate">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {selectedDetail && (
                    <AttendanceDetailModal
                        detail={selectedDetail}
                        onClose={() => setSelectedDetail(null)}
                        getStatusForDay={getStatusForDay}
                    />
                )}
            </AnimatePresence>
        </div>
    );

    function calculateUserStats(userId) {
        let p = 0, a = 0, h = 0, l = 0, e = 0, lv = 0, d = 0, hrs = 0, wo = 0;

        daysInRange.forEach(day => {
            const record = getStatusForDay(userId, day);
            if (record) {
                if (record.status === 'Present') {
                    const [hPart, mPart] = (record.total_hours || "00:00").split(':').map(Number);
                    if (!isNaN(hPart) && !isNaN(mPart)) {
                        hrs += (hPart + mPart / 60);
                    }
                    const wdv = record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1;
                    p += wdv;
                    d += (1.0 - wdv);
                    if (record.late_punch_in && !/^00:00(:00)?$/.test(record.late_punch_in) && record.late_punch_in !== 'undefined') {
                        l++;
                    }
                    if (record.early_punch_out && !/^00:00(:00)?$/.test(record.early_punch_out) && record.early_punch_out !== 'undefined') {
                        e++;
                    }
                } else if (record.status === 'Absent' || record.status === 'On Leave') {
                    const isFullDay = record.status === 'Absent' || !record.is_half_day;
                    const val = isFullDay ? 1.0 : 0.5;

                    if (record.status === 'On Leave') {
                        lv += val;
                    } else {
                        a += val;
                    }
                    d += val;
                } else if (record.status === 'Incomplete') {
                    const wdv = record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1;
                    p += wdv;
                    d += (1.0 - wdv);
                } else if (record.status === 'Holiday') {
                    h++;
                } else if (record.status === 'Permission') {
                    const wdv = record.working_day_value !== undefined ? parseFloat(record.working_day_value) : 1;
                    p += wdv;
                    d += (1.0 - wdv);
                } else if (record.status === 'Week Off') {
                    wo++;
                }
            }
        });
        return { p: p.toFixed(1), a, h, l, e, lv, d: d.toFixed(1), wo };
    }
}

function AttendanceDetailModal({ detail, onClose, getStatusForDay }) {
    const [currentDay, setCurrentDay] = useState(null);
    const [currentRecord, setCurrentRecord] = useState(null);

    useEffect(() => {
        if (detail) {
            setCurrentDay(detail.day);
            setCurrentRecord(detail.record);
        }
    }, [detail]);

    if (!detail) return null;
    const { employee } = detail;

    const navigateDay = (direction) => {
        if (!currentDay) return;
        const newDay = direction === 'prev'
            ? new Date(currentDay.getTime() - 86400000)
            : new Date(currentDay.getTime() + 86400000);
        setCurrentDay(newDay);
        // Look up the record for this employee on the new date
        if (getStatusForDay && employee?.id) {
            const newRecord = getStatusForDay(employee.id, newDay);
            setCurrentRecord(newRecord);
        } else {
            setCurrentRecord(null);
        }
    };

    const dateStr = currentDay ? format(currentDay, 'EEE, MMM dd, yyyy') : '';
    const record = currentRecord || detail.record;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
            case 'Absent': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
            case 'Incomplete': return { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' };
            case 'On Leave': return { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' };
            case 'Permission': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
            case 'Holiday': return { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' };
            case 'Week Off': return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' };
        }
    };

    const statusColors = getStatusColor(record?.status);

    // Dynamic running time calculation
    const [runningTime, setRunningTime] = useState('00:00:00');

    useEffect(() => {
        if (!record?.punch_in || (record?.status !== 'Present' && record?.status !== 'Incomplete')) {
            setRunningTime('00:00:00');
            return;
        }

        const calculateElapsed = () => {
            try {
                const punchInParts = record.punch_in.split(':');
                if (punchInParts.length < 2) return '00:00:00';

                const now = new Date();
                const punchInDate = currentDay ? new Date(currentDay) : new Date();
                punchInDate.setHours(parseInt(punchInParts[0]), parseInt(punchInParts[1]), punchInParts[2] ? parseInt(punchInParts[2]) : 0, 0);

                let endTime;
                if (record.punch_out && record.punch_out !== '--:--') {
                    // Already clocked out - calculate static duration
                    const punchOutParts = record.punch_out.split(':');
                    endTime = currentDay ? new Date(currentDay) : new Date();
                    endTime.setHours(parseInt(punchOutParts[0]), parseInt(punchOutParts[1]), punchOutParts[2] ? parseInt(punchOutParts[2]) : 0, 0);
                } else {
                    // Still clocked in - use current time for live count
                    endTime = now;
                }

                const diffMs = endTime.getTime() - punchInDate.getTime();
                if (diffMs < 0) return '00:00:00';

                const totalSeconds = Math.floor(diffMs / 1000);
                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;

                return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            } catch (e) {
                return '00:00:00';
            }
        };

        setRunningTime(calculateElapsed());

        // Only set interval if employee is still clocked in (no punch_out)
        const isStillClockedIn = !record.punch_out || record.punch_out === '--:--';
        if (isStillClockedIn) {
            const interval = setInterval(() => {
                setRunningTime(calculateElapsed());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [record?.punch_in, record?.punch_out, record?.status, currentDay]);

    // Format total hours to HH:MM:SS
    const formatWorkingHours = (totalHours) => {
        if (!totalHours || totalHours === '00:00') return '00:00:00';
        const parts = totalHours.split(':');
        if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        if (parts.length === 3) return totalHours;
        return '00:00:00';
    };

    return (
        <>
            {/* Backdrop overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99] bg-black/40"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 z-[100] h-full w-full max-w-[420px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.1)] flex flex-col"
            >
                {/* Header - Employee Info */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 border-2 border-gray-200">
                                {employee?.employee_name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                                    <span className="text-gray-400 font-semibold">#{employee?.emp_id}</span>{' '}
                                    {employee?.employee_name}
                                </h3>
                                <p className="text-[13px] text-gray-500 font-medium mt-0.5 truncate">
                                    {employee?.department_name || 'No Department'}
                                </p>
                                <p className="text-[12px] text-gray-400 font-medium truncate">
                                    {employee?.designation_name || 'No Designation'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 -mr-1 -mt-1"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigateDay('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center">
                            <p className="text-[15px] font-semibold text-gray-800">{dateStr}</p>
                        </div>
                        <button
                            onClick={() => navigateDay('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-6 py-5 space-y-5">

                        {/* Working Hours & Break Hours Summary */}
                        {(record?.status === 'Present' || record?.status === 'Incomplete') && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-[14px] font-semibold text-gray-600">Working Hours</span>
                                    <span className="text-[16px] font-semibold text-gray-900 tabular-nums">{formatWorkingHours(record.total_hours)}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-[14px] font-semibold text-gray-600">Running Time</span>
                                    <span className="text-[16px] font-semibold text-gray-900 tabular-nums">{runningTime}</span>
                                </div>
                            </div>
                        )}

                        {/* Punch In / Punch Out Cards */}
                        {(record?.status === 'Present' || record?.status === 'Incomplete') && (
                            <div className="grid grid-cols-2 gap-4 mb-8 mt-8">
                                {/* Clocked In Card */}
                                <div className="relative rounded-xl border-2 border-emerald-400 bg-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">Clocked In</span>
                                    </div>
                                    <p className="text-[20px] font-semibold text-gray-900 tabular-nums">
                                        {record.punch_in ? (() => {
                                            const parts = record.punch_in.split(':');
                                            if (parts.length >= 2) {
                                                let h = parseInt(parts[0]);
                                                const m = parts[1];
                                                const ampm = h >= 12 ? 'pm' : 'am';
                                                h = h % 12 || 12;
                                                return `${h}:${m} ${ampm}`;
                                            }
                                            return record.punch_in;
                                        })() : '--:--'}
                                    </p>
                                    {record.late_punch_in && !/^00:00(:00)?$/.test(record.late_punch_in) && record.late_punch_in !== 'undefined' && (
                                        <span className="inline-block mt-2 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            Late by {record.late_punch_in}
                                        </span>
                                    )}
                                </div>

                                {/* Clocked Out Card */}
                                <div className="relative rounded-xl border-2 border-rose-400 bg-white p-4 overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-[12px] font-semibold text-rose-600 uppercase tracking-wider">Clocked Out</span>
                                    </div>
                                    <p className="text-[20px] font-semibold text-gray-900 tabular-nums">
                                        {record.punch_out ? (() => {
                                            const parts = record.punch_out.split(':');
                                            if (parts.length >= 2) {
                                                let h = parseInt(parts[0]);
                                                const m = parts[1];
                                                const ampm = h >= 12 ? 'pm' : 'am';
                                                h = h % 12 || 12;
                                                return `${h}:${m} ${ampm}`;
                                            }
                                            return record.punch_out;
                                        })() : '--:--'}
                                    </p>
                                    {record.early_punch_out && !/^00:00(:00)?$/.test(record.early_punch_out) && record.early_punch_out !== 'undefined' && (
                                        <span className="inline-block mt-2 text-[10px] font-semibold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-200">
                                            Early by {record.early_punch_out}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Badge for all cases */}
                        <div className={`flex items-center mb-3 justify-between p-3 rounded-[10px] border ${statusColors.border} ${statusColors.bg}`}>
                            <span className="text-[13px] font-semibold text-gray-600">Status</span>
                            <span className={`text-[13px] font-semibold uppercase tracking-wider ${statusColors.text}`}>
                                {record?.status === 'Incomplete' ? 'Missing Punch Out' : (record?.status || '---')}
                            </span>
                        </div>

                        {/* Late & Early Penalties */}
                        {(record?.status === 'Present' || record?.status === 'Incomplete') && (
                            <>
                                {record.late_penalty && record.late_penalty !== '00:00' && (
                                    <div className="flex items-center mb-3 justify-between p-3 rounded-[10px] border border-amber-200 bg-amber-50">
                                        <span className="text-[13px] font-semibold text-gray-600">Late Penalty</span>
                                        <span className="text-[13px] font-black text-amber-700 tabular-nums">{record.late_penalty}</span>
                                    </div>
                                )}
                                {record.early_penalty && record.early_penalty !== '00:00' && (
                                    <div className="flex items-center mb-3 justify-between p-3 rounded-[10px] border border-fuchsia-200 bg-fuchsia-50">
                                        <span className="text-[13px] font-semibold text-gray-600">Early Penalty</span>
                                        <span className="text-[13px] font-black text-fuchsia-700 tabular-nums">{record.early_penalty}</span>
                                    </div>
                                )}
                                {record.working_day_value !== undefined && parseFloat(record.working_day_value) < 1 && (
                                    <div className="flex items-center mb-3 justify-between p-3 rounded-[10px] border border-orange-200 bg-orange-50">
                                        <span className="text-[13px] font-semibold text-gray-600">Working Day Value</span>
                                        <span className="text-[13px] font-semibold text-orange-700 tabular-nums">{record.working_day_value}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Absent Details */}
                        {record?.status === 'Absent' && (
                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-center flex flex-col items-center">
                                <CalendarX size={36} className="text-rose-300 mb-3" />
                                <h4 className="text-rose-900 font-bold mb-1 text-[15px]">Marked as Absent</h4>
                                <p className="text-rose-600/70 text-[13px] font-medium">No attendance record found for this working day.</p>
                            </div>
                        )}

                        {/* Leave Details */}
                        {(record?.status === 'On Leave' || record?.status === 'Permission') && (
                            <div className={`p-4 rounded-xl border ${record.status === 'Permission' ? 'bg-blue-50 border-blue-100' : 'bg-sky-50 border-sky-100'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2.5 rounded-xl ${record.status === 'Permission' ? 'bg-blue-500 text-white' : 'bg-sky-500 text-white'}`}>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-[14px] ${record.status === 'Permission' ? 'text-blue-900' : 'text-sky-900'}`}>
                                            {record.leave_type || record.status} Details
                                        </h4>
                                        {record.is_half_day && (
                                            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                Half Day ({record.half_day_period})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {record.status === 'Permission' && record.permissions && record.permissions[0] && (
                                    <div className="mb-3 p-3 bg-white/60 rounded-lg">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-gray-500">Duration</span>
                                            <span className="font-black text-blue-700">{record.permissions[0].start_time?.slice(0, 5)} - {record.permissions[0].end_time?.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${record.status === 'Permission' ? 'text-blue-600/60' : 'text-sky-600/60'}`}>
                                        Reason / Remark
                                    </span>
                                    <p className={`text-[13px] font-medium leading-relaxed ${record.status === 'Permission' ? 'text-blue-800' : 'text-sky-800'}`}>
                                        {record.reason || record.remark || "No reason provided."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Week Off / Holiday */}
                        {(record?.status === 'Week Off' || record?.status === 'Holiday') && (
                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl text-center flex flex-col items-center">
                                <CalendarIcon size={36} className="text-gray-300 mb-3" />
                                <h4 className="text-gray-900 font-bold mb-1 text-[15px]">{record.status} Day</h4>
                                <p className="text-gray-500 text-[13px] font-medium">Enjoy your break! This is a non-working day.</p>
                            </div>
                        )}

                        {/* Week Off Work indicator */}
                        {record?.is_week_off && record?.status === 'Present' && (
                            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-gray-300 bg-gray-50">
                                <div className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-black rounded">WO</div>
                                <span className="text-[13px] font-semibold text-gray-700">Worked on a Week Off day</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
