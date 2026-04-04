import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Users, UserCheck, Clock, AlertCircle, CalendarClock,
    LogOut, Calendar, TrendingUp, CheckCircle2, Search, Filter,
    RefreshCcw, Cake, Gift, Award, Sparkles, PartyPopper, CalendarDays,
    Ban, Building2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
    format,
    eachDayOfInterval,
    parseISO,
    isBefore,
    differenceInDays,
    startOfDay,
    isSameDay,
} from 'date-fns';
import { getUsersApi, getAttendanceApi, getHolidaysApi, getMilestonesApi, getLeavesApi, getReimbursementsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import UserFilter from '../User/UserFilter';
import WebClockWidget from './WebClockWidget';
import WebCalendar from './WebCalendar';
import PayrollOverview from './PayrollOverview';
import AssetOverview from './AssetOverview';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';

const DASHBOARD_TABS = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'asset', label: 'Asset Management' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'employee', label: 'Employee' },
    { id: 'recruitment', label: 'Recruitment' },
    { id: 'helpdesk', label: 'Helpdesk' }
];

// Modern Stat Card Component
const DashboardStatCard = ({ title, value, subValue, icon: Icon, color, delay, path }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            onClick={() => path && navigate(path)}
            className={`bg-white rounded-[15px] p-3 sm:p-6 border border-gray-200 transition-all group overflow-hidden relative ${path ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color.bg} opacity-10 group-hover:scale-125 transition-transform duration-500`} />
            <div className="flex items-center justify-between relative z-10">
                <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-[#2a2a2a] uppercase tracking-widest">
                        {title}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <h3 className={`text-[15px] sm:text-2xl font-semibold ${color.text}`}>
                            {value}
                        </h3>
                        {subValue && (
                            <span className="text-[11px] font-semibold text-gray-600">
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shadow-xs shadow-${color.shadow}/10 group-hover:rotate-6 transition-transform shrink-0`}>
                    <Icon size={22} className="sm:w-7 sm:h-7 w-5 h-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
                <div className={`h-1.5 flex-1 rounded-full bg-gray-50 overflow-hidden`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: typeof value === 'string' && value.includes('%') ? value : '100%' }}
                        className={`h-1 ${color.main}`}
                        transition={{ duration: 1, delay: delay + 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Request Overview Card Component
const RequestOverviewCard = ({ title, stats, actionLabel, onAction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[15px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col"
        >
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <h3 className="font-semibold text-gray-800 text-[14px]">{title}</h3>
                <button
                    onClick={onAction}
                    className="text-primary text-[12px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                    <Plus size={14} className="stroke-[3px]" />
                    <span className="uppercase tracking-wider">{actionLabel}</span>
                </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} rounded-[8px] p-3 flex items-center justify-between group cursor-default transition-all hover:scale-[1.02]`}>
                        <span className={`text-[12px] font-semibold ${stat.textColor}`}>{stat.label}</span>
                        <span className={`text-[15px] font-black ${stat.textColor}`}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [empLeaves, setEmpLeaves] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [empReimbursements, setEmpReimbursements] = useState([]);
    const navigate = useNavigate();

    // Filter & Date Range States
    const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [absentSearchTerm, setAbsentSearchTerm] = useState('');
    const [branchSearchTerm, setBranchSearchTerm] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const { tabId } = useParams();
    const handleActionSuccess = () => setRefreshKey(prev => prev + 1);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo.id || userInfo._id;

    const activeTab = useMemo(() => {
        if (!tabId) return 'attendance';
        // Map from slug to tab id if needed, but for now we'll assume they match
        // and adjust the tabs to look more premium like "payroll-overview"
        if (tabId === 'payroll-overview') return 'payroll';
        if (tabId === 'attendance-overview') return 'attendance';
        return tabId;
    }, [tabId]);

    const setActiveTab = (id) => {
        const slug = id === 'payroll' ? 'payroll-overview' : id === 'attendance' ? 'attendance-overview' : id;
        navigate(`/dashboard/${slug}`);
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fromDate, toDate, filters]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const params = {
                startDate: fromDate,
                endDate: toDate,
                ...filters
            };

            const [usersRes, attendanceRes, holidaysRes, milestonesRes, leavesRes] = await Promise.all([
                getUsersApi({ limit: 1000, ...filters }),
                getAttendanceApi(params),
                getHolidaysApi(),
                getMilestonesApi(),
                userRole !== 'employee' ? getLeavesApi(params) : Promise.resolve({ data: { leaves: [] } })
            ]);

            const empsAll = usersRes.data.users || [];
            let empsFiltered = [...empsAll];
            let attsFiltered = attendanceRes.data || [];

            if (userRole === 'employee') {
                empsFiltered = empsFiltered.filter(e => String(e.id) === String(userId));
                attsFiltered = attsFiltered.filter(a => String(a.user_id) === String(userId));
            }

            setEmployees(empsFiltered);
            setMilestones(milestonesRes.data || []);
            setAttendanceData(attsFiltered);
            setHolidays(holidaysRes.data || []);
            if (userRole !== 'employee') {
                setAllLeaves(leavesRes.data.leaves || []);
            }

            // Specific data for employee's own requests
            if (userRole === 'employee') {
                const [leavesRes, reimRes] = await Promise.all([
                    getLeavesApi({ employee_id: userId, limit: 1000 }),
                    getReimbursementsApi()
                ]);
                setEmpLeaves(leavesRes.data.leaves || []);
                setEmpReimbursements(reimRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to sync dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Dashboard Statistics
    const stats = useMemo(() => {
        if (!employees.length) return null;

        const rangeDays = eachDayOfInterval({
            start: new Date(fromDate),
            end: new Date(toDate)
        });

        const isSingleDay = fromDate === toDate;

        // Aggregate stats across the range
        const presentCount = attendanceData.filter(a => ['Present', 'Incomplete', 'Permission'].includes(a.status)).length;
        const onLeaveCount = attendanceData.filter(a => a.status === 'On Leave').length;
        const lateCount = attendanceData.filter(a => a.late_punch_in && !/^00:00(:00)?$/.test(a.late_punch_in) && a.late_punch_in !== 'undefined').length;
        const earlyCount = attendanceData.filter(a => a.early_punch_out && !/^00:00(:00)?$/.test(a.early_punch_out) && a.early_punch_out !== 'undefined').length;
        const onTimeCount = Math.max(0, presentCount - lateCount);

        // Absence calculation per day in range
        let totalAbsent = 0;
        rangeDays.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isHoliday = holidays.some(h => {
                const hDate = h.date ? format(parseISO(h.date), 'yyyy-MM-dd') : null;
                return hDate === dayStr;
            });

            if (!isHoliday) {
                const dayAttendance = attendanceData.filter(a => format(parseISO(a.date), 'yyyy-MM-dd') === dayStr);
                const dayPresent = dayAttendance.filter(a => ['Present', 'Incomplete', 'Permission'].includes(a.status)).length;
                const dayOnLeave = dayAttendance.filter(a => a.status === 'On Leave').length;
                totalAbsent += Math.max(0, employees.length - dayPresent - dayOnLeave);
            }
        });

        const totalPotentialDays = employees.length * rangeDays.length;
        const getPercent = (count) => ((count / (totalPotentialDays || 1)) * 100).toFixed(1) + '%';

        return {
            totalEmployees: employees.length,
            hasAttendance: attendanceData.length > 0,
            present: { count: presentCount, percent: getPercent(presentCount) },
            absent: { count: totalAbsent, percent: getPercent(totalAbsent) },
            onLeave: { count: onLeaveCount, percent: getPercent(onLeaveCount) },
            onTime: { count: onTimeCount, percent: getPercent(onTimeCount) },
            late: { count: lateCount, percent: getPercent(lateCount) },
            early: { count: earlyCount, percent: getPercent(earlyCount) },
            isSingleDay
        };
    }, [employees, attendanceData, holidays, fromDate, toDate]);

    // Calculate Request Overview Stats for Employee
    const requestStats = useMemo(() => {
        if (userRole !== 'employee') return null;

        const leaves = {
            requested: empLeaves.length,
            pending: empLeaves.filter(l => l.status === 'Pending').length,
            approved: empLeaves.filter(l => l.status === 'Approved').length,
            rejected: empLeaves.filter(l => l.status === 'Rejected').length
        };

        const reimbursements = {
            requested: empReimbursements.length,
            pending: empReimbursements.filter(r => r.status === 'Pending').length,
            approved: empReimbursements.filter(r => r.status === 'Approved').length,
            rejected: empReimbursements.filter(r => r.status === 'Rejected').length
        };

        return { leaves, reimbursements };
    }, [userRole, empLeaves, empReimbursements]);

    const presentUsers = useMemo(() => {
        return employees.flatMap(emp =>
            attendanceData
                .filter(a => a.user_id === emp.id && ['Present', 'Incomplete', 'Permission'].includes(a.status))
                .map(a => ({ ...emp, attendanceDate: a.date }))
        );
    }, [employees, attendanceData]);

    const filteredPresentUsers = useMemo(() => {
        if (!searchTerm) return presentUsers;
        const lowerSearch = searchTerm.toLowerCase();
        return presentUsers.filter(user =>
            user.employee_name?.toLowerCase().includes(lowerSearch) ||
            user.department_name?.toLowerCase().includes(lowerSearch) ||
            user.branch_name?.toLowerCase().includes(lowerSearch)
        );
    }, [presentUsers, searchTerm]);

    // List of Late Logins
    const lateLogins = useMemo(() => {
        return attendanceData
            .filter(a => a.late_punch_in && !/^00:00(:00)?$/.test(a.late_punch_in) && a.late_punch_in !== 'undefined')
            .map(a => ({
                ...employees.find(e => e.id === a.user_id),
                lateTime: a.late_punch_in,
                attendanceDate: a.date
            }))
            .filter(e => e && e.id);
    }, [employees, attendanceData]);

    // List of Users on Leave
    const usersOnLeave = useMemo(() => {
        return attendanceData
            .filter(a => a.status === 'On Leave')
            .map(a => ({
                ...employees.find(e => e.id === a.user_id),
                attendanceDate: a.date
            }))
            .filter(e => e && e.id);
    }, [employees, attendanceData]);

    // Upcoming Birthdays and Anniversaries
    const upcomingEvents = useMemo(() => {
        if (!milestones.length) return { birthdays: [], anniversaries: [] };

        const today = startOfDay(new Date());

        const processEvents = (dateField, type) => {
            return milestones
                .map(emp => {
                    if (!emp[dateField]) return null;
                    const originalDate = new Date(emp[dateField]);
                    if (isNaN(originalDate.getTime())) return null;

                    // Create event date for THIS year
                    let eventDate = new Date(today.getFullYear(), originalDate.getMonth(), originalDate.getDate());

                    // If it already passed this year, move to next year
                    if (isBefore(eventDate, today)) {
                        eventDate = new Date(today.getFullYear() + 1, originalDate.getMonth(), originalDate.getDate());
                    }

                    const daysRemaining = differenceInDays(eventDate, today);

                    if (daysRemaining <= 30) {
                        return {
                            ...emp,
                            eventDate,
                            daysRemaining,
                            isToday: isSameDay(eventDate, today),
                            years: type === 'anniversary' ? (eventDate.getFullYear() - originalDate.getFullYear()) : null
                        };
                    }
                    return null;
                })
                .filter(Boolean)
                .sort((a, b) => a.daysRemaining - b.daysRemaining);
        };

        return {
            birthdays: processEvents('dob', 'birthday'),
            anniversaries: processEvents('doj', 'anniversary')
        };
    }, [milestones]);

    // Trigger Celebration Confetti
    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    useEffect(() => {
        const hasTodayEvents = [...upcomingEvents.birthdays, ...upcomingEvents.anniversaries].some(e => e.isToday);
        if (hasTodayEvents) {
            triggerConfetti();
        }
    }, [upcomingEvents]);


    // Trend Data for Area Chart
    const trendData = useMemo(() => {
        if (!attendanceData.length) return [];

        const dates = eachDayOfInterval({
            start: new Date(fromDate),
            end: new Date(toDate)
        });

        return dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayAttendance = attendanceData.filter(a => format(parseISO(a.date), 'yyyy-MM-dd') === dateStr);
            const present = dayAttendance.filter(a => ['Present', 'Incomplete', 'Permission'].includes(a.status)).length;
            const late = dayAttendance.filter(a => a.late_punch_in && !/^00:00(:00)?$/.test(a.late_punch_in) && a.late_punch_in !== 'undefined').length;

            return {
                name: format(date, 'MMM dd'),
                Present: present,
                Late: late,
                OnTime: present - late
            };
        });
    }, [attendanceData, fromDate, toDate]);

    // Pie Chart Data
    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Present', value: stats.present.count, color: '#10b981' },
            { name: 'Absent', value: stats.absent.count, color: '#f43f5e' },
            { name: 'Leave', value: stats.onLeave.count, color: '#6366f1' },
        ];
    }, [stats]);

    // Department-wise Data
    const deptData = useMemo(() => {
        if (!employees.length) return [];
        const departments = [...new Set(employees.map(e => e.department_name || 'Unassigned'))];
        const rangeLength = eachDayOfInterval({ start: new Date(fromDate), end: new Date(toDate) }).length;

        return departments.map(dept => {
            const deptEmployees = employees.filter(e => (e.department_name || 'Unassigned') === dept);
            const deptEmployeeIds = deptEmployees.map(e => e.id);
            const present = attendanceData.filter(a =>
                deptEmployeeIds.includes(a.user_id) &&
                ['Present', 'Incomplete', 'Permission'].includes(a.status)
            ).length;

            return {
                name: dept,
                Present: present,
                Total: deptEmployees.length * rangeLength
            };
        });
    }, [employees, attendanceData, fromDate, toDate]);

    // Absenteeism Data
    const absenteeismData = useMemo(() => {
        if (!deptData.length) return [];
        return deptData.map(d => {
            const absentCount = Math.max(0, d.Total - d.Present);
            return {
                name: d.name,
                absenteeism: absentCount,
                percentage: parseFloat((((d.Total - d.Present) / (d.Total || 1)) * 100).toFixed(1))
            };
        }).sort((a, b) => b.absenteeism - a.absenteeism);
    }, [deptData]);

    // Non-approved Absences Calculation
    const nonApprovedAbsences = useMemo(() => {
        if (!employees.length) return [];
        const rangeDays = eachDayOfInterval({
            start: new Date(fromDate),
            end: new Date(toDate)
        });

        const absences = [];
        employees.forEach(emp => {
            let absentCount = 0;
            rangeDays.forEach(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isHoliday = holidays.some(h => {
                    const hDate = h.date ? format(parseISO(h.date), 'yyyy-MM-dd') : null;
                    return hDate === dayStr;
                });
                if (isHoliday) return;

                const att = attendanceData.find(a => a.user_id === emp.id && format(parseISO(a.date), 'yyyy-MM-dd') === dayStr);
                if (!att || !['Present', 'Incomplete', 'Permission', 'On Leave', 'Holiday'].includes(att.status)) {
                    absentCount++;
                }
            });
            if (absentCount > 0) {
                absences.push({ ...emp, absentCount });
            }
        });
        return absences.sort((a, b) => b.absentCount - a.absentCount);
    }, [employees, attendanceData, holidays, fromDate, toDate]);

    const filteredAbsentUsers = useMemo(() => {
        if (!absentSearchTerm) return nonApprovedAbsences;
        const lowerSearch = absentSearchTerm.toLowerCase();
        return nonApprovedAbsences.filter(user =>
            user.employee_name?.toLowerCase().includes(lowerSearch) ||
            user.department_name?.toLowerCase().includes(lowerSearch) ||
            user.branch_name?.toLowerCase().includes(lowerSearch)
        );
    }, [nonApprovedAbsences, absentSearchTerm]);

    // Branch-wise attendance report
    const branchData = useMemo(() => {
        if (!employees.length) return [];
        const branches = [...new Set(employees.map(e => e.branch_name || 'Unassigned'))];
        const rangeLength = eachDayOfInterval({ start: new Date(fromDate), end: new Date(toDate) }).length;

        return branches.map(branch => {
            const branchEmployees = employees.filter(e => (e.branch_name || 'Unassigned') === branch);
            const branchEmployeeIds = branchEmployees.map(e => e.id);
            const present = attendanceData.filter(a =>
                branchEmployeeIds.includes(a.user_id) &&
                ['Present', 'Incomplete', 'Permission'].includes(a.status)
            ).length;

            const totalPotential = branchEmployees.length * rangeLength;
            const avgAttendance = totalPotential > 0 ? (present / totalPotential) * 100 : 0;

            return {
                name: branch,
                employeeCount: branchEmployees.length,
                presentCount: present,
                avgAttendance: avgAttendance.toFixed(1)
            };
        }).sort((a, b) => b.avgAttendance - a.avgAttendance);
    }, [employees, attendanceData, fromDate, toDate]);

    const filteredBranchData = useMemo(() => {
        if (!branchSearchTerm) return branchData;
        const lowerSearch = branchSearchTerm.toLowerCase();
        return branchData.filter(branch =>
            branch.name?.toLowerCase().includes(lowerSearch)
        );
    }, [branchData, branchSearchTerm]);

    // Shift-wise attendance report calculation
    const shiftData = useMemo(() => {
        if (!employees.length) return [];
        const shifts = [...new Set(employees.map(e => e.shift || 'Unassigned'))];
        const rangeLength = eachDayOfInterval({ start: new Date(fromDate), end: new Date(toDate) }).length;

        return shifts.map(shift => {
            const shiftEmployees = employees.filter(e => (e.shift || 'Unassigned') === shift);
            const shiftEmployeeIds = shiftEmployees.map(e => e.id);
            const present = attendanceData.filter(a =>
                shiftEmployeeIds.includes(a.user_id) &&
                ['Present', 'Incomplete', 'Permission'].includes(a.status)
            ).length;

            const totalPotential = shiftEmployees.length * rangeLength;
            const avgAttendance = totalPotential > 0 ? (present / totalPotential) * 100 : 0;

            return {
                name: shift.length > 12 ? shift.substring(0, 10) + '...' : shift,
                attendance: parseFloat(avgAttendance.toFixed(1))
            };
        }).sort((a, b) => b.attendance - a.attendance);
    }, [employees, attendanceData, fromDate, toDate]);

    // Leave balance summary data
    const leaveBalanceData = useMemo(() => {
        if (!allLeaves?.length) return [];
        const types = {};
        allLeaves.forEach(l => {
            if (l.status === 'Approved') {
                const type = l.leave_type || 'Other';
                types[type] = (types[type] || 0) + 1;
            }
        });

        const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
        return Object.entries(types).map(([name, value], idx) => ({
            name,
            value,
            color: COLORS[idx % COLORS.length]
        }));
    }, [allLeaves]);

    if (loading && !employees.length) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Main Tabs Control */}
            {userRole !== 'employee' && (
                <div className="flex gap-2 bg-white p-1 rounded-full border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                    {DASHBOARD_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 sm:px-8 py-2.5 rounded-full text-[15px] font-medium transition-all whitespace-nowrap flex-1 lg:flex-none ${activeTab === tab.id
                                ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/10 active:scale-95'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-none'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Attendance Tab Content */}
            {activeTab === 'attendance' && (
                <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:mt-0 mt-3 md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                                {userRole === 'employee' ? "My Insights" : "Workforce Insights"}
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </h1>
                            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">
                                {fromDate === toDate ? format(parseISO(fromDate), 'EEEE, MMMM do yyyy') : `${format(parseISO(fromDate), 'MMM dd')} - ${format(parseISO(toDate), 'MMM dd, yyyy')}`}
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex items-center md:justify-end justify-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                            <div className="w-full sm:w-auto flex items-center justify-center gap-0 bg-white p-1.5 rounded-[20px] border border-gray-200 transition-all focus-within:border-primary/20">
                                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 group">
                                    <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">From</span>
                                    <div className="relative flex items-center gap-1">
                                        <DatePicker
                                            selected={fromDate ? new Date(fromDate) : null}
                                            onChange={(date) => setFromDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                            dateFormat="yyyy-MM-dd"
                                            showYearDropdown
                                            showMonthDropdown
                                            dropdownMode="select"
                                            className="bg-transparent border-none text-[11px] sm:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[80px] sm:w-[110px]"
                                            popperPlacement="bottom-end"
                                            portalId="root"
                                        />
                                        <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                                    </div>
                                </div>
                                <div className="w-[1px] h-4 bg-gray-200"></div>
                                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 group">
                                    <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">To</span>
                                    <div className="relative flex items-center gap-1">
                                        <DatePicker
                                            selected={toDate ? new Date(toDate) : null}
                                            onChange={(date) => setToDate(date ? date.toLocaleDateString('sv-SE') : '')}
                                            dateFormat="yyyy-MM-dd"
                                            className="bg-transparent border-none text-[11px] sm:text-[13px] font-semibold outline-none focus:ring-0 text-gray-700 cursor-pointer p-0 w-[80px] sm:w-[100px]"
                                            popperPlacement="bottom-end"
                                            portalId="root"
                                        />
                                        <Calendar className="text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                                    </div>
                                </div>
                            </div>

                            {userRole !== 'employee' && (
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className={`flex items-center gap-2 px-2 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-[11px] sm:text-[13px] border transition-all shrink-0 ${Object.keys(filters).length > 0
                                        ? 'bg-primary/5 border-primary/20 text-primary shadow-sm shadow-primary/5'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Filter size={14} className="sm:w-4 sm:h-4" />
                                    <span className="xs:inline">Filter</span>
                                </button>
                            )}

                            <button
                                onClick={fetchDashboardData}
                                className="p-2 sm:p-2.5 bg-white text-gray-400 rounded-full hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                            >
                                <RefreshCcw size={16} className={`${loading ? 'animate-spin' : ''} sm:w-[18px] sm:h-[18px]`} />
                            </button>
                        </div>
                    </div>

                    {/* Celebration Banner */}
                    {[...upcomingEvents.birthdays, ...upcomingEvents.anniversaries].some(e => e.isToday) && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-[10px] shadow-md shadow-orange-500/20"
                        >
                            <div className="bg-white/95 backdrop-blur-sm p-4 md:py-2 md:px-6 rounded-[22px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner group">
                                        <Cake size={20} className="group-hover:rotate-12 transition-transform" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl md:text-xl font-black text-gray-900 tracking-tight mb-0">
                                            Today's <span className="text-orange-600">Celebrations!</span>
                                        </h2>
                                        <p className="text-gray-500 font-medium text-[12px]">
                                            {[...upcomingEvents.birthdays, ...upcomingEvents.anniversaries]
                                                .filter(e => e.isToday)
                                                .map(e => `${e.employee_name} (${e.years ? e.years + 'y Anniversary' : 'Birthday'})`)
                                                .join(', ')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={triggerConfetti}
                                    className="shrink-0 px-6 py-2 bg-gray-900 text-white rounded-full font-semibold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center gap-3 group"
                                >
                                    Celebrate Together
                                    <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                </button>

                                {/* Decorative Icons */}
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <PartyPopper size={120} className="text-orange-500 rotate-12" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Filter Drawer */}
                    <UserFilter
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        currentFilters={filters}
                        onApply={(newFilters) => setFilters(newFilters)}
                    />

                    {/* Web Clock Widget - Employee / Admin Personalized */}
                    {userRole === 'employee' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <WebClockWidget userId={userId} onActionSuccess={handleActionSuccess} />
                            <WebCalendar userId={userId} refreshKey={refreshKey} />
                        </div>
                    )}

                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-5">
                        <DashboardStatCard
                            title={userRole === 'employee' ? "Status" : "Workforce"}
                            value={userRole === 'employee' ? (stats?.present.count > 0 ? 'Present' : stats?.onLeave.count > 0 ? 'On Leave' : stats?.absent.count > 0 ? 'Absent' : '---') : (stats?.totalEmployees || 0)}
                            icon={Users}
                            color={userRole === 'employee'
                                ? (stats?.present.count > 0 ? { bg: 'bg-emerald-50', text: 'text-emerald-600', main: 'bg-emerald-600', shadow: 'emerald' }
                                    : stats?.absent.count > 0 ? { bg: 'bg-rose-50', text: 'text-rose-600', main: 'bg-rose-600', shadow: 'rose' }
                                        : { bg: 'bg-blue-50', text: 'text-blue-600', main: 'bg-blue-600', shadow: 'blue' })
                                : { bg: 'bg-blue-50', text: 'text-blue-600', main: 'bg-blue-600', shadow: 'blue' }}
                            delay={0.1}
                            path={userRole === 'employee' ? "/profile" : "/users"}
                        />
                        <DashboardStatCard
                            title="Present"
                            value={stats?.present.percent || '0%'}
                            subValue={`${stats?.present.count || 0} Staff`}
                            icon={UserCheck}
                            color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', main: 'bg-emerald-600', shadow: 'emerald' }}
                            delay={0.2}
                            path="/attendance"
                        />
                        <DashboardStatCard
                            title="On Time"
                            value={stats?.onTime.percent || '0%'}
                            subValue={`${stats?.onTime.count || 0} Staff`}
                            icon={Clock}
                            color={{ bg: 'bg-indigo-50', text: 'text-indigo-600', main: 'bg-indigo-600', shadow: 'indigo' }}
                            delay={0.3}
                            path="/attendance"
                        />
                        <DashboardStatCard
                            title="Absence"
                            value={stats?.absent.percent || '0%'}
                            subValue={`${stats?.absent.count || 0} Staff`}
                            icon={AlertCircle}
                            color={{ bg: 'bg-rose-50', text: 'text-rose-600', main: 'bg-rose-600', shadow: 'rose' }}
                            delay={0.4}
                            path="/attendance"
                        />
                    </div>

                    {/* Secondary Stats Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-8">
                        <div
                            onClick={() => navigate('/attendance')}
                            className="bg-white p-4 sm:p-6 rounded-[15px] border border-gray-200 flex items-center justify-between group transition-all hover:bg-amber-50/30 cursor-pointer active:scale-95"
                        >
                            <div className="space-y-1">
                                <span className="text-[10px] sm:text-[11px] font-black text-[#2a2a2a] uppercase tracking-widest">Late Arrivals</span>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-xl sm:text-2xl font-black text-amber-600">{stats?.late.count || 0}</h4>
                                    <span className="text-[11px] sm:text-[12px] font-semibold text-amber-600/60">{stats?.late.percent}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <CalendarClock size={20} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <div
                            onClick={() => navigate('/attendance')}
                            className="bg-white p-4 sm:p-6 rounded-[15px] border border-gray-200 flex items-center justify-between group transition-all hover:bg-fuchsia-50/30 cursor-pointer active:scale-95"
                        >
                            <div className="space-y-1">
                                <span className="text-[10px] sm:text-[11px] font-black text-[#2a2a2a] uppercase tracking-widest">Early Logout</span>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-xl sm:text-2xl font-black text-fuchsia-600">{stats?.early.count || 0}</h4>
                                    <span className="text-[11px] sm:text-[12px] font-semibold text-fuchsia-600/60">{stats?.early.percent}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                                <LogOut size={20} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-[15px] border border-gray-200 flex items-center justify-between group transition-all hover:bg-violet-50/30">
                            <div className="space-y-1">
                                <span className="text-[10px] sm:text-[11px] font-black text-[#2a2a2a] uppercase tracking-widest">On Leave</span>
                                <div className="flex items_baseline gap-2">
                                    <h4 className="text-xl sm:text-2xl font-black text-violet-600">{stats?.onLeave.count || 0}</h4>
                                    <span className="text-[11px] sm:text-[12px] font-semibold text-violet-600/60">{stats?.onLeave.percent}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                <Calendar size={20} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Trend Chart */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white md:p-5 p-3 rounded-[15px] border border-gray-200"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                        <TrendingUp size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-none mb-1">Attendance Dynamics</h3>
                                        <p className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Active Staff Monitoring</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[280px] sm:h-[350px]">
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#111827',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    color: '#fff',
                                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="Present"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorPresent)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="OnTime"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorOnTime)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                            <TrendingUp size={32} className="opacity-20" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-500 text-sm">No Attendance Trends</p>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Data will appear once records are synced</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Distribution Chart */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white md:p-5 p-3 rounded-[15px] border border-gray-200"
                        >
                            <div className="flex items-center gap-3 md:mb-4 mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                    <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-none mb-1">Status Distribution</h3>
                                    <p className="text-[10px] sm:text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Real-time breakdown</p>
                                </div>
                            </div>
                            <div className="h-[280px] sm:h-[350px] flex items-center">
                                {stats?.hasAttendance ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid #f1f5f9',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    padding: '10px 14px'
                                                }}
                                                itemStyle={{
                                                    color: '#1f2937',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase'
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                align="center"
                                                layout="horizontal"
                                                iconType="circle"
                                                formatter={(value) => (
                                                    <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider ml-1">{value}</span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                            <AlertCircle size={32} className="opacity-20" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-500 text-sm">No Distribution Data</p>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">No attendance records found for today</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>


                    {/* Detailed Lists Section - Admin Only */}
                    {userRole !== 'employee' && (

                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col md:h-[470px] h-auto mb-6"
                            >
                                <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Users size={20} />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 md:text-lg text-xs">Present Users <span className="text-gray-600 font-medium text-xs ml-1">{stats?.isSingleDay ? '(Today)' : '(Selected Period)'}</span></h3>
                                    </div>
                                    {userRole !== 'employee' && (
                                        <div className="relative group">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-80 text-[14px] shadow-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white sticky top-0 z-10">
                                                <th className="md:px-6 px-3 md:py-3 py-3 text-[11px] font-semibold text-black uppercase tracking-wider">Name</th>
                                                <th className="md:px-6 px-3 md:py-3 py-3 text-[11px] font-semibold text-black uppercase tracking-wider">Department</th>
                                                <th className="md:px-6 px-3 md:py-3 py-3 text-[11px] font-semibold text-black uppercase tracking-wider">Branch</th>
                                                {!stats?.isSingleDay && <th className="md:px-6 px-3 md:py-3 py-3 text-[11px] font-semibold text-black uppercase tracking-wider">Date</th>}
                                                <th className="md:px-6 px-3 md:py-3 py-3 text-[11px] font-semibold text-black uppercase tracking-wider text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredPresentUsers.length > 0 ? filteredPresentUsers.map((user, idx) => (
                                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="md:px-6 px-2 md:py-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                                {user.employee_name?.charAt(0)}
                                                            </div>
                                                            <span className="md:text-sm text-xs font-semibold text-gray-700">{user.employee_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="md:px-4 px-2 md:py-3 py-2 md:text-sm text-xs text-gray-500 font-medium">{user.department_name || '---'}</td>
                                                    <td className="md:px-4 px-2 md:py-3 py-2 md:text-sm text-xs text-gray-500 font-medium">{user.branch_name || '---'}</td>
                                                    {!stats?.isSingleDay && <td className="md:px-4 px-2 md:py-3 py-2 md:text-sm text-xs text-gray-500 font-medium">{user.attendanceDate ? format(parseISO(user.attendanceDate), 'MMM dd') : '---'}</td>}
                                                    <td className="md:px-4 px-2 md:py-3 py-2 text-center">
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-semibold">PRESENT</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-12 text-center text-gray-400 font-medium text-sm">No present users found today</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Present Users Table */}

                                {/* Late Logins & Early Logouts Combined */}
                                {/* Late Logins */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                                >
                                    <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                                <Clock size={20} />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Late Logins <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span></h3>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                                        {lateLogins.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {lateLogins.map(user => (
                                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                                                    {user.department_name} • {user.branch_name}
                                                                    {!stats?.isSingleDay && user.attendanceDate && ` • ${format(parseISO(user.attendanceDate), 'MMM dd')}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-semibold">{user.lateTime} MIN</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">Clear morning! No late logins.</div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Users on Leave */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                                >
                                    <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <CalendarDays size={20} />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Users on Leave <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span></h3>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                                        {usersOnLeave.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {usersOnLeave.map(user => (
                                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                                                    {user.department_name} • {user.branch_name}
                                                                    {!stats?.isSingleDay && user.attendanceDate && ` • ${format(parseISO(user.attendanceDate), 'MMM dd')}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-semibold uppercase">APPROVED</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">No one is on leave today!</div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Non-approved Absences */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[400px]"
                                >
                                    <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10 gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                                <Ban size={20} />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Non-approved Absences <span className="text-gray-600 font-medium text-[12px] lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span></h3>
                                        </div>
                                        <div className="relative group flex-1 max-w-[150px]">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={absentSearchTerm}
                                                onChange={(e) => setAbsentSearchTerm(e.target.value)}
                                                className="pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-38 text-[13px] shadow-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <div className="grid grid-cols-2 px-6 py-3 border-b border-gray-50 bg-white sticky top-0 z-10">
                                            <span className="text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Name</span>
                                            <span className="text-[11px] font-semibold text-gray-800 uppercase tracking-wider text-right">Count</span>
                                        </div>
                                        {filteredAbsentUsers.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {filteredAbsentUsers.map((user, idx) => (
                                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[12px] font-semibold text-gray-600 w-4">{idx + 1}.</span>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                                <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                                                    {user.branch_name} • {user.department_name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-semibold uppercase">
                                                            {user.absentCount}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">Full attendance! No unapproved absences.</div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Branch-wise attendance report */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[400px]"
                                >
                                    <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10 gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Building2 size={20} />
                                            </div>
                                            <h3 className="font-semibold text-gray-900">Branch-wise attendance report <span className="text-gray-600 font-medium text-[12px] lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span></h3>
                                        </div>
                                        <div className="relative group flex-1 max-w-[150px]">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={branchSearchTerm}
                                                onChange={(e) => setBranchSearchTerm(e.target.value)}
                                                className="pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-38 text-[13px] shadow-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white sticky top-0 z-10">
                                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Branch</th>
                                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Employees</th>
                                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wider">Avg attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredBranchData.length > 0 ? filteredBranchData.map((branch, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[12px] font-semibold text-gray-600 w-4">{idx + 1}.</span>
                                                                <span className="text-sm font-semibold text-gray-700">{branch.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{branch.employeeCount}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-xs font-semibold text-gray-700">{branch.avgAttendance}%</span>
                                                                <div className="w-24 bg-gray-100 h-1 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-blue-600 h-full transition-all duration-500"
                                                                        style={{ width: `${branch.avgAttendance}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-medium text-sm">No branch data found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Shift-wise Attendance Report */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white p-5 rounded-[15px] border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 leading-none">
                                            Shift-wise attendance report <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span>
                                        </h3>
                                    </div>
                                    <div className="h-[350px]">
                                        {stats?.hasAttendance ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={shiftData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                                                        domain={[0, 100]}
                                                        ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            borderRadius: '12px',
                                                            border: '1px solid #f1f5f9',
                                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                            padding: '10px 14px'
                                                        }}
                                                        formatter={(value) => [`${value}%`, 'Attendance']}
                                                    />
                                                    <Bar
                                                        dataKey="attendance"
                                                        fill="#5eead4"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={60}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <Clock size={32} className="opacity-20" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-gray-500 text-sm">No Shift Data</p>
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Attendance records required for shift breakdown</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Leave Balance Summary */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white p-5 rounded-[15px] border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <h3 className="text-xl font-semibold text-gray-900 leading-none">
                                            Leave balance summary <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span>
                                        </h3>
                                    </div>
                                    <div className="h-[350px] flex items-center">
                                        {leaveBalanceData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={leaveBalanceData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={80}
                                                        outerRadius={120}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {leaveBalanceData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            borderRadius: '12px',
                                                            border: '1px solid #f1f5f9',
                                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                            padding: '10px 14px'
                                                        }}
                                                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        align="center"
                                                        layout="horizontal"
                                                        iconType="rect"
                                                        formatter={(value) => (
                                                            <span className="text-[12px] font-semibold text-gray-600 ml-1">{value}</span>
                                                        )}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <CalendarDays size={32} className="opacity-20" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-semibold text-gray-500 text-sm">No Leave Data</p>
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">No approved leaves in this period</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}

                    {/* Request Overview - Personal Request Tracking */}
                    {userRole === 'employee' && (
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight">Request Overview</h2>
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-xl text-[11px] font-semibold text-gray-600 uppercase tracking-widest cursor-default shadow-sm">
                                    last 7 days
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <RequestOverviewCard
                                    title="Leaves"
                                    actionLabel="Request"
                                    onAction={() => navigate('/leaves/add-leave')}
                                    stats={[
                                        { label: "Requested", value: requestStats?.leaves.requested || 0, bg: "bg-blue-50/50", textColor: "text-blue-600" },
                                        { label: "Pending", value: requestStats?.leaves.pending || 0, bg: "bg-orange-50/50", textColor: "text-orange-600" },
                                        { label: "Approved", value: requestStats?.leaves.approved || 0, bg: "bg-emerald-50/50", textColor: "text-emerald-600" },
                                        { label: "Rejected", value: requestStats?.leaves.rejected || 0, bg: "bg-rose-50/50", textColor: "text-rose-600" },
                                    ]}
                                />
                                <RequestOverviewCard
                                    title="Regularisations"
                                    actionLabel="Request"
                                    onAction={() => navigate('/attendance/manage')}
                                    stats={[
                                        { label: "Requested", value: 0, bg: "bg-blue-50/50", textColor: "text-blue-600" },
                                        { label: "Pending", value: 0, bg: "bg-orange-50/50", textColor: "text-orange-600" },
                                        { label: "Approved", value: 0, bg: "bg-emerald-50/50", textColor: "text-emerald-600" },
                                        { label: "Rejected", value: 0, bg: "bg-rose-50/50", textColor: "text-rose-600" },
                                    ]}
                                />
                                <RequestOverviewCard
                                    title="Reimbursements"
                                    actionLabel="Request"
                                    onAction={() => navigate('/reimbursements')}
                                    stats={[
                                        { label: "Requested", value: requestStats?.reimbursements.requested || 0, bg: "bg-blue-50/50", textColor: "text-blue-600" },
                                        { label: "Pending", value: requestStats?.reimbursements.pending || 0, bg: "bg-orange-50/50", textColor: "text-orange-600" },
                                        { label: "Approved", value: requestStats?.reimbursements.approved || 0, bg: "bg-emerald-50/50", textColor: "text-emerald-600" },
                                        { label: "Rejected", value: requestStats?.reimbursements.rejected || 0, bg: "bg-rose-50/50", textColor: "text-rose-600" },
                                    ]}
                                />
                                <RequestOverviewCard
                                    title="Helpdesk"
                                    actionLabel="ticket"
                                    onAction={() => toast('Helpdesk module coming soon!', { icon: '🎫' })}
                                    stats={[
                                        { label: "Closed", value: 0, bg: "bg-emerald-50/50", textColor: "text-emerald-600" },
                                        { label: "Opened", value: 0, bg: "bg-rose-50/50", textColor: "text-rose-600" },
                                        { label: "In Progress", value: 0, bg: "bg-orange-50/50", textColor: "text-orange-600" },
                                        { label: "Escalated", value: 0, bg: "bg-blue-50/50", textColor: "text-blue-600" },
                                    ]}
                                />
                            </div>
                        </div>
                    )}

                    {/* Birthday & Anniversary Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Upcoming Birthdays */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                        >
                            <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                        <Cake size={20} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Upcoming Birthdays</h3>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next 30 Days</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                {upcomingEvents.birthdays.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {upcomingEvents.birthdays.map((user) => (
                                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-sm">
                                                        {user.employee_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase">{user.department_name} • {format(new Date(user.dob), 'MMM dd')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {user.isToday ? (
                                                        <span className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black animate-bounce inline-block">TODAY! 🎂</span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-gray-500">{user.daysRemaining} days left</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <Gift size={32} className="opacity-20" />
                                        <p className="text-sm font-medium">No birthdays in the next 30 days</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Work Anniversaries */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[15px] border border-gray-200 overflow-hidden flex flex-col h-[350px]"
                        >
                            <div className="md:p-4 p-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <Award size={20} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Work Anniversaries</h3>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next 30 Days</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                {upcomingEvents.anniversaries.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {upcomingEvents.anniversaries.map((user) => (
                                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 font-bold text-sm">
                                                        {user.employee_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-700">{user.employee_name}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase">{user.department_name} • Joined {format(new Date(user.doj), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">
                                                        {user.years} {user.years === 1 ? 'YEAR' : 'YEARS'}
                                                    </span>
                                                    {user.isToday ? (
                                                        <span className="text-[10px] font-semibold text-amber-600 animate-pulse uppercase tracking-tighter">Anniversary Today! ✨</span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-gray-500">{user.daysRemaining} days left</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <Award size={32} className="opacity-20" />
                                        <p className="text-sm font-medium">No anniversaries in the next 30 days</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>


                    {/* Department Charts - Admin Only */}
                    {userRole !== 'employee' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Presence Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white md:p-5 p-3 rounded-[15px] border border-gray-200"
                            >
                                <div className="flex items-center gap-3 md:mb-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="md:text-xl text-lg font-semibold text-gray-900 leading-none mb-1">
                                            Departmental Breakdown <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span>
                                        </h3>
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">
                                            Staff presence by division
                                        </p>
                                    </div>
                                </div>
                                <div className="h-[350px]">
                                    {stats?.hasAttendance ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <BarChart data={deptData} layout="vertical" margin={{ left: 20, right: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                                                    width={70}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        backgroundColor: '#111827',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        color: '#fff'
                                                    }}
                                                />
                                                <Bar dataKey="Present" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="Total" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                <Users size={32} className="opacity-20" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-gray-500 text-sm">No Departmental Data</p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Assign employees to departments to see breakdown</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Absenteeism Rate */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white md:p-5 p-3 rounded-[15px] border border-gray-200"
                            >
                                <div className="flex items-center gap-3 md:mb-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="md:text-xl text-lg font-semibold text-gray-900 leading-none mb-1">
                                            Absenteeism by department <span className="text-gray-600 text-sm font-medium lowercase">({stats?.isSingleDay ? 'day' : 'range'})</span>
                                        </h3>
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest leading-relaxed">
                                            Total absent instances = Total potential - Present
                                        </p>
                                    </div>
                                </div>
                                <div className="h-[350px]">
                                    {stats?.hasAttendance ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <BarChart data={absenteeismData} layout="vertical" margin={{ left: 20, right: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    type="number"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                                />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                                                    width={70}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        backgroundColor: '#111827',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        color: '#fff'
                                                    }}
                                                    formatter={(value, name, props) => [`${value} instances (${props.payload.percentage}%)`, 'Absenteeism']}
                                                />
                                                <Bar
                                                    dataKey="absenteeism"
                                                    fill="#f87171"
                                                    radius={[0, 4, 4, 0]}
                                                    barSize={20}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                                <AlertCircle size={32} className="opacity-20" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-gray-500 text-sm">No Absenteeism Data</p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Data will appear once records are synced</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            )}

            {/* Payroll Tab Content */}
            {activeTab === 'payroll' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <PayrollOverview />
                </div>
            )}

            {/* Asset Management Tab Content */}
            {activeTab === 'asset' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <AssetOverview />
                </div>
            )}

            {/* Other Coming Soon Tabs */}
            {['inventory', 'employee', 'recruitment', 'helpdesk'].includes(activeTab) && (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-dashed border-gray-200 shadow-inner group">
                    <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:rotate-12 transition-transform duration-500">
                        <Sparkles size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Coming Soon</h2>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[11px] mt-3">We're building something amazing!</p>
                    <div className="mt-8 px-6 py-2 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stay Tuned for updates</div>
                </div>
            )}
        </div>
    );
}
