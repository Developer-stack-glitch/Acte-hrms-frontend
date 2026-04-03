import { useState, useEffect, useMemo, useRef } from 'react';
import { WebCalendarSkeleton } from '../../Common/CommonSkeletonLoader/WebWidgetSkeleton';
import { ChevronLeft, ChevronRight, ArrowUpRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO,
    isToday,
    isBefore,
    startOfDay,
} from 'date-fns';
import { getAttendanceApi } from '../../Action/api';
import { useNavigate } from 'react-router-dom';

const WebCalendar = ({ userId, refreshKey }) => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const containerRef = useRef(null);

    const fetchAttendance = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
            const res = await getAttendanceApi({
                user_id: userId,
                startDate: start,
                endDate: end
            });
            setAttendanceData(res.data || []);
        } catch (error) {
            console.error('Error fetching calendar attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [currentDate, userId, refreshKey]);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getAttendanceForDay = (day) => {
        return attendanceData.find(a => isSameDay(parseISO(a.date), day));
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    if (loading && attendanceData.length === 0) {
        return <WebCalendarSkeleton />;
    }

    return (
        <div
            ref={containerRef}
            className="relative bg-white rounded-[15px] border border-gray-200 p-4 min-h-[350px] flex flex-col font-sans overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-0">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    Calendar
                </h2>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <ArrowUpRight onClick={() => navigate('/attendance/manage')} size={18} />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center items-center gap-4 mb-5">
                <div className="flex items-center bg-gray-50/50 rounded-full p-1 border border-gray-50">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-white hover:text-primary rounded-full transition-all text-gray-400"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="px-4 text-[14px] font-semibold text-gray-800 tracking-tight min-w-[120px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-white hover:text-primary rounded-full transition-all text-gray-400"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-4 relative flex-grow">
                {loading && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 flex items-center justify-center font-bold">
                        <Loader2 className="animate-spin text-primary/40" size={24} />
                    </div>
                )}
                {days.map((day, idx) => {
                    const isSelectMonth = isSameMonth(day, currentDate);
                    const attendance = getAttendanceForDay(day);
                    const isTodayDay = isToday(day);
                    const isPast = isBefore(day, startOfDay(new Date())) && !isTodayDay;

                    const isLate = attendance?.late_punch_in && !/^00:00(:00)?$/.test(attendance.late_punch_in) && attendance.late_punch_in !== 'undefined';
                    const isEarly = attendance?.early_punch_out && !/^00:00(:00)?$/.test(attendance.early_punch_out) && attendance.early_punch_out !== 'undefined';
                    const hasPermissions = attendance?.permissions?.length > 0;

                    // Determine day color/status
                    let statusColor = "bg-transparent";
                    let textColor = "text-gray-700";

                    if (isTodayDay) {
                        textColor = "text-primary font-black";
                    }

                    if (attendance?.status === 'Absent') {
                        statusColor = "bg-rose-50 text-rose-600 border border-rose-100";
                    } else if (attendance?.status === 'Present' || attendance?.status === 'Incomplete') {
                        statusColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                    } else if (attendance?.status === 'Week Off') {
                        statusColor = "bg-gray-50 text-gray-500 border border-gray-100";
                    } else if (isPast && !attendance) {
                        if (day.getDay() === 0) {
                            statusColor = "bg-gray-50 text-gray-500 border border-gray-100";
                        } else {
                            statusColor = "bg-rose-50 text-rose-600 border border-rose-100";
                        }
                    }

                    return (
                        <div
                            key={day.toString()}
                            className="flex items-center justify-center relative cursor-pointer"
                            onClick={() => setSelectedDetail({ record: attendance, day })}
                        >
                            <div className={`
                                w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all relative
                                ${!isSelectMonth ? 'opacity-20' : ''}
                                ${statusColor}
                                ${textColor}
                                active:scale-95 hover:shadow-sm
                            `}>
                                {format(day, 'd')}

                                {/* Status Dots (Matching the first image) */}
                                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                    {isLate && <div className="w-2 h-2 bg-amber-500 rounded-full border-2 border-white shadow-sm" />}
                                    {isEarly && <div className="w-2 h-2 bg-fuchsia-500 rounded-full border-2 border-white shadow-sm" />}
                                    {hasPermissions && <div className="w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-sm" />}
                                </div>

                                {isTodayDay && (
                                    <div className="absolute -bottom-1 left-1/2 -track-1/2 w-1.5 h-1.5 rounded-full bg-primary -translate-x-1/2" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend - Basic version for widget */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Early Out</span>
                </div>
            </div>

            {/* Attendance Details Popup */}
            <AnimatePresence mode="wait">
                {selectedDetail && (
                    <AttendanceDetailPopup
                        detail={selectedDetail}
                        onClose={() => setSelectedDetail(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

/* --- Popup Component (Matching User Mockup) --- */
const AttendanceDetailPopup = ({ detail, onClose }) => {
    const { record, day } = detail;
    const isAbsent = record?.status === 'Absent' || !record;

    const formatTotalHours = (timeStr) => {
        if (!timeStr || timeStr === '00:00:00' || timeStr === '--:--') return '0hr 0m';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return `${h}hr ${m}m`;
    };

    // Extract shift time from name if present, e.g. "General (09:00:00 - 18:30:00)"
    const getShiftTimeRange = (shift) => {
        if (!shift) return '9:00 AM to 6:30 PM';
        const match = shift.toString().match(/\((\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2})\)/);
        if (match) {
            const formatTimePart = (t) => {
                const [h, m] = t.split(':');
                const hour = parseInt(h, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const h12 = hour % 12 || 12;
                return `${h12}:${m} ${ampm}`;
            };
            return `${formatTimePart(match[1])} to ${formatTimePart(match[2])}`;
        }
        return '9:00 AM to 6:30 PM';
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-[340px] bg-white rounded-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden font-sans p-2 border border-blue-50/50"
            >
                <div className="bg-white rounded-[15px] p-3 pt-4">
                    <X size={20} className="absolute top-4 right-4 cursor-pointer text-gray-400" onClick={onClose} />
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h3 className="text-[20px] font-medium text-gray-700 tracking-tight">
                            {format(day, 'EEE, d MMMM yyyy')}
                        </h3>
                        <p className="text-[13px] text-gray-400 font-medium mt-1">
                            Shift {getShiftTimeRange(record?.shift)}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 mb-6 px-2">
                        <div className="flex justify-between items-center text-[17px] mb-3">
                            <span className="text-[#8BC34A] font-medium">Clock In</span>
                            <span className="text-gray-400 font-medium">{record?.punch_in?.substring(0, 5) || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center text-[17px]">
                            <span className="text-[#F44336] font-medium">Clock Out</span>
                            <span className="text-gray-400 font-medium">{record?.punch_out?.substring(0, 5) || '-'}</span>
                        </div>

                        <div className="flex justify-between items-center text-[17px] pt-1 pt-2 border-t border-gray-200">
                            <span className="text-gray-600 font-medium">Total Hours</span>
                            <span className="text-gray-700 font-medium">{formatTotalHours(record?.total_hours)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            className={`
                                min-w-[140px] py-2.5 rounded-xl text-[15px] font-medium transition-all
                                ${isAbsent
                                    ? 'bg-[#FFEBEE] text-[#F44336] hover:bg-[#FFCDD2]'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}
                            `}
                        >
                            {record?.status === 'Incomplete' ? 'Shift Active' : (record?.status || 'Absent')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WebCalendar;
