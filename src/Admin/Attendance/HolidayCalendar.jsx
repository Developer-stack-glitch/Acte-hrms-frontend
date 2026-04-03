import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Info,
    MapPin,
    Trophy,
    Star,
    Sparkles,
    Loader2,
    X
} from 'lucide-react';
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
    isToday
} from 'date-fns';
import { getHolidaysApi } from '../../Action/api';
import toast from 'react-hot-toast';

const holidayTypeColors = {
    'National': {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-100',
        dot: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-blue-500'
    },
    'Restricted': {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        dot: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500'
    },
    'Company Specific': {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        dot: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-teal-500'
    },
    'default': {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-100',
        dot: 'bg-gray-400',
        gradient: 'from-gray-400 to-gray-500'
    }
};

const HolidayDetail = ({ holiday }) => {
    const colors = holidayTypeColors[holiday?.type] || holidayTypeColors.default;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-[15px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                    <Star size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate tracking-tight">{holiday?.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                        {holiday?.type}
                    </span>
                </div>
            </div>
            {holiday?.description && (
                <p className="text-[13px] text-gray-500 leading-relaxed mb-3 line-clamp-2">
                    {holiday.description}
                </p>
            )}
            <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    {format(parseISO(holiday?.date), 'EEEE, MMM dd')}
                </div>
                {holiday?.company_name && (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        {holiday.company_name}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default function HolidayCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [userInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));

    useEffect(() => {
        fetchHolidays();
    }, [currentDate]);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const params = { year: currentDate.getFullYear() };
            if (userInfo.database !== 'hrm_database') {
                params.company_id = userInfo.company_id;
            }
            const res = await getHolidaysApi(params);
            setHolidays(res.data || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const currentMonthHolidays = useMemo(() => {
        return holidays.filter(h => isSameMonth(parseISO(h.date), currentDate));
    }, [holidays, currentDate]);

    const nextHoliday = useMemo(() => {
        const upcoming = holidays
            .filter(h => new Date(h.date) >= new Date().setHours(0, 0, 0, 0))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return upcoming[0];
    }, [holidays]);

    const getHolidaysForDay = (day) => {
        return holidays.filter(h => isSameDay(parseISO(h.date), day));
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* Main Calendar Section */}
            <div className="flex-1 p-6 border-r border-gray-50 flex flex-col h-full overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 shrink-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                            <CalendarIcon className="text-primary" />
                            Holiday Calendar
                        </h2>
                        <p className="text-gray-500 font-medium text-[14px]">
                            Organizational vacation & event tracker
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-50/80 backdrop-blur-sm p-1 rounded-xl border border-gray-200">
                            <button
                                onClick={prevMonth}
                                className="p-2 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg transition-all text-gray-500"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-4 flex flex-col items-center min-w-[120px]">
                                <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-[0.2em] leading-none mb-0">
                                    {format(currentDate, 'yyyy')}
                                </span>
                                <span className="text-[14px] font-semibold text-gray-800 tracking-tight">
                                    {format(currentDate, 'MMMM')}
                                </span>
                            </div>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg transition-all text-gray-500"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button
                            onClick={goToToday}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-[13px] hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 mb-2 shrink-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center py-2 text-[12px] font-semibold text-gray-600 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 min-h-0">
                    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-[10px] overflow-hidden relative h-full">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="text-primary animate-spin" size={32} />
                                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Updating...</span>
                                </div>
                            </div>
                        )}
                        {days.map((day, idx) => {
                            const dayHolidays = getHolidaysForDay(day);
                            const isSelectedMonth = isSameMonth(day, currentDate);
                            const isCurrentDay = isToday(day);

                            return (
                                <motion.div
                                    key={day.toString()}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.005 }}
                                    className={`bg-white p-2 flex flex-col group transition-all relative ${!isSelectedMonth ? 'opacity-30 bg-gray-50/30' : ''
                                        } ${dayHolidays.length > 0 && isSelectedMonth ? 'bg-primary/[0.02]' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[13px] font-semibold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isCurrentDay
                                            ? 'bg-primary text-white'
                                            : 'text-gray-900 group-hover:bg-gray-50'
                                            }`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                                        {dayHolidays.map((holiday) => {
                                            const colors = holidayTypeColors[holiday.type] || holidayTypeColors.default;
                                            return (
                                                <motion.button
                                                    key={holiday.id}
                                                    whileHover={{ x: 2 }}
                                                    onClick={() => setSelectedHoliday(holiday)}
                                                    className={`w-full text-left px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text} border ${colors.border} transition-all relative overflow-hidden flex items-center gap-1`}
                                                >
                                                    <div className={`w-1 h-3 rounded-full ${colors.dot} shrink-0`} />
                                                    <p className="text-[9px] font-bold truncate tracking-tight uppercase">
                                                        {holiday.name}
                                                    </p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar Details Section */}
            <div className="w-full lg:w-[380px] bg-gray-50/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                {nextHoliday && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary p-5 rounded-[15px] text-white relative overflow-hidden group"
                    >
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                        <div className="relative z-10">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70 mb-2 block">Next Holiday</span>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                    <Sparkles size={20} className="text-amber-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-[18px] truncate">{nextHoliday.name}</h4>
                                    <p className="text-[12px] opacity-80">{format(parseISO(nextHoliday.date), 'MMMM dd, yyyy')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedHoliday(nextHoliday)}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[14px] font-medium transition-all"
                            >
                                View Details
                            </button>
                        </div>
                    </motion.div>
                )}

                <div>
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        {format(currentDate, 'MMMM yyyy')}
                    </h3>
                    <p className="text-[12px] text-gray-500 font-medium">
                        {currentMonthHolidays.length} holidays scheduled
                    </p>
                </div>

                <div className="flex-1 space-y-3">
                    {currentMonthHolidays.length > 0 ? (
                        currentMonthHolidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map((holiday) => (
                            <HolidayDetail key={holiday.id} holiday={holiday} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-[24px] border border-dashed border-gray-200 p-6">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                                <Info size={24} />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-[14px] mb-1">No Holidays</h4>
                            <p className="text-[12px] text-gray-500 px-4">
                                No public events or holidays found for this month.
                            </p>
                        </div>
                    )}
                </div>

                {/* legend */}
                <div className="bg-white p-5 rounded-[15px] border border-gray-200 mt-auto">
                    <h4 className="text-[14px] font-semibold text-gray-600 mb-4">Color Guide</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(holidayTypeColors).filter(([key]) => key !== 'default').map(([key, value]) => (
                            <div key={key} className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${value.dot}`} />
                                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Modal for Holiday Details */}
            <AnimatePresence>
                {selectedHoliday && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedHoliday(null)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[15px] shadow-2xl relative overflow-hidden"
                        >
                            <div className={`h-26 bg-gradient-to-br ${holidayTypeColors[selectedHoliday.type]?.gradient || holidayTypeColors.default.gradient} relative px-6 py-0 flex flex-col justify-center`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold text-white tracking-tight">{selectedHoliday.name}</h3>
                                        <span className="text-[11px] font-black text-white/80 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                                            {selectedHoliday.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    <div className="bg-gray-50 p-4 rounded-[15px]">
                                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Date</p>
                                        <p className="font-semibold text-gray-900">{format(parseISO(selectedHoliday.date), 'MMMM dd, yyyy')}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-[15px]">
                                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Weekday</p>
                                        <p className="font-semibold text-gray-900">{format(parseISO(selectedHoliday.date), 'EEEE')}</p>
                                    </div>
                                </div>

                                {selectedHoliday.description && (
                                    <div className="mb-8">
                                        <h4 className="text-[12px] font-semibold text-gray-600 uppercase tracking-widest mb-3">About Holiday</h4>
                                        <p className="text-[14px] text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-[10px] border border-gray-100 italic">
                                            "{selectedHoliday.description}"
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedHoliday(null)}
                                    className="w-full h-11 bg-gray-900 text-white rounded-full font-medium tracking-tight hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
                                >
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}