import React, { useState, useEffect, useCallback } from 'react';
import { WebClockWidgetSkeleton } from '../../Common/CommonSkeletonLoader/WebWidgetSkeleton';
import { LogIn, LogOut, Coffee, MapPin, Loader2, Timer, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getTodayStatusApi, webClockInApi, webClockOutApi, startBreakApi, endBreakApi } from '../../Action/api';
import { format } from 'date-fns';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Tooltip from '../../Common/Tooltip';

// User Defined Audio Assets (from public directory)
const clockInSound = '/clock-in.mp3';
const clockOutSound = '/clock-out.mp3';
const breakStartSound = '/break.mp3';
const breakEndSound = '/resume-work.mp3';

const WebClockWidget = ({ userId, onActionSuccess }) => {
    const [status, setStatus] = useState('loading');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendance, setAttendance] = useState(null);
    const [activeBreak, setActiveBreak] = useState(null);
    const [shiftInfo, setShiftInfo] = useState(null);
    const [shiftTimer, setShiftTimer] = useState('00:00:00');
    const [breakTimer, setBreakTimer] = useState('00:00:00');
    const [netShiftTimer, setNetShiftTimer] = useState('00:00:00');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [location, setLocation] = useState({ lat: null, lng: null, address: 'Fetching location...' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [activeTeamCount, setActiveTeamCount] = useState(0);
    const [userData, setUserData] = useState(null);
    const [quote, setQuote] = useState('');

    const quotes = [
        "The only way to do great work is to love what you do.",
        "Precision in your punch is precision in your progress.",
        "Your hard work today is the foundation for your success tomorrow.",
        "The secret of getting ahead is getting started.",
        "Choose a job you love, and you will never have to work a day in your life.",
        "Excellence is not a skill, it is an attitude."
    ];

    useEffect(() => {
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        const info = localStorage.getItem('userInfo');
        if (info) setUserData(JSON.parse(info));
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const playSound = (soundFile) => {
        const audio = new Audio(soundFile);
        audio.play().catch(error => console.error("Error playing sound:", error));
    };

    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m, s] = timeStr.split(':').map(Number);
        return (h * 3600 + m * 60 + (s || 0)) * 1000;
    };

    const formatTime = (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const fetchStatus = useCallback(async () => {
        try {
            const res = await getTodayStatusApi(userId);
            setStatus(res.data.status);
            setAttendance(res.data.attendance);
            setActiveBreak(res.data.activeBreak);
            setShiftInfo(res.data.shiftInfo);
            setActiveTeamCount(res.data.activeTeamCount || 0);
        } catch (error) {
            console.error('Error fetching attendance status:', error);
            setStatus('error');
        }
    }, [userId]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Update timers
    useEffect(() => {
        let timerInterval;

        if (status === 'clocked_in' || status === 'on_break') {
            timerInterval = setInterval(() => {
                if (attendance?.punch_in) {
                    const [h, m, s] = attendance.punch_in.split(':').map(Number);
                    const punchInTime = new Date();
                    punchInTime.setHours(h, m, s || 0, 0);

                    const now = new Date();
                    const grossDiff = now - punchInTime;

                    if (grossDiff > 0) {
                        setShiftTimer(formatTime(grossDiff));

                        // Calculate Break Time
                        let totalBreakMs = parseTime(attendance.total_break_time);
                        let activeBreakMs = 0;

                        if (status === 'on_break' && activeBreak?.break_start) {
                            activeBreakMs = now - new Date(activeBreak.break_start);
                            setBreakTimer(formatTime(activeBreakMs));
                        } else {
                            setBreakTimer('00:00:00');
                        }

                        const netDiff = grossDiff - (totalBreakMs + activeBreakMs);
                        setNetShiftTimer(formatTime(netDiff > 0 ? netDiff : 0));
                    }
                }
            }, 1000);
        } else if (status === 'clocked_out' && attendance?.total_hours) {
            setShiftTimer(attendance.total_hours + (attendance.total_hours.split(':').length === 2 ? ':00' : ''));

            // Calculate Net for clocked out
            const grossMs = parseTime(attendance.total_hours);
            const breakMs = parseTime(attendance.total_break_time);
            setNetShiftTimer(formatTime(grossMs - breakMs));

            setBreakTimer(attendance.total_break_time || '00:00:00');
        }

        return () => clearInterval(timerInterval);
    }, [status, attendance, activeBreak]);

    // Geolocation
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation(prev => ({ ...prev, lat: latitude, lng: longitude }));
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        setLocation(prev => ({ ...prev, address: data.display_name || 'Location recognized' }));
                    } catch (e) {
                        setLocation(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocation({ lat: null, lng: null, address: 'Location access denied' });
                }
            );
        }
    }, []);

    const handleClockIn = async () => {
        setIsActionLoading(true);
        try {
            await webClockInApi({
                user_id: userId,
                latitude: location.lat,
                longitude: location.lng,
                location: location.address
            });
            playSound(clockInSound);
            toast.success('Successfully clocked in!');
            fetchStatus();
            if (onActionSuccess) onActionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to clock in');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setIsConfirmModalOpen(false);
        setIsActionLoading(true);
        try {
            await webClockOutApi({
                user_id: userId,
                latitude: location.lat,
                longitude: location.lng,
                location: location.address
            });
            playSound(clockOutSound);
            toast.success('Successfully clocked out!');
            fetchStatus();
            if (onActionSuccess) onActionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to clock out');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStartBreak = async () => {
        setIsActionLoading(true);
        try {
            await startBreakApi({
                user_id: userId,
                latitude: location.lat,
                longitude: location.lng,
                location: location.address
            });
            playSound(breakStartSound);
            toast.success('Break started');
            fetchStatus();
            if (onActionSuccess) onActionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start break');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleEndBreak = async () => {
        setIsActionLoading(true);
        try {
            await endBreakApi({ user_id: userId });
            playSound(breakEndSound);
            toast.success('Break ended');
            fetchStatus();
            if (onActionSuccess) onActionSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to end break');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (status === 'loading') {
        return <WebClockWidgetSkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#0F172A] rounded-[15px] border border-white/5 group min-h-[350px] flex flex-col overflow-hidden"
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] opacity-30" />

            {/* Top Greeting Section */}
            <div className="relative z-10 p-6 pb-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-xl font-mediu text-white tracking-tight flex items-center gap-2"
                        >
                            {getGreeting()}, {userData?.name?.split(' ')[0] || 'Member'}! <span className="inline-block transform hover:rotate-12 transition-transform cursor-pointer">👋</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 text-sm font-medium italic"
                        >
                            "{quote}"
                        </motion.p>
                    </div>
                    {/* Abstract Star Decorative SVG */}
                    <div className="hidden md:block opacity-20 transform scale-150 rotate-12">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L14.5 9L22 12L14.5 15L12 22L9.5 15L2 12L9.5 9L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Content Area (Now with a slight overlap or transition) */}
            <div className="relative z-10 p-4 flex-grow flex flex-col md:flex-row items-center gap-10 bg-white/5 backdrop-blur-xl m-4 rounded-[20px] border border-white/5">
                {/* Visual Clock */}
                <div className="flex-shrink-0 relative group/clock">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl group-hover/clock:scale-110 transition-transform duration-500" />
                    <div className="relative w-40 h-40 rounded-full bg-white/5 shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                        {/* Progress ring base */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="74" className="stroke-white/5 fill-none" strokeWidth="4" />
                            <motion.circle
                                cx="80" cy="80" r="74"
                                className={`fill-none stroke-current ${status === 'clocked_in' ? 'text-emerald-500' :
                                    status === 'on_break' ? 'text-amber-500' :
                                        status === 'clocked_out' ? 'text-primary' : 'text-gray-600'
                                    }`}
                                strokeWidth="4"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "465 465", strokeDashoffset: 465 }}
                                animate={{
                                    strokeDashoffset: status === 'clocked_in' ? 100 : status === 'on_break' ? 300 : status === 'clocked_out' ? 0 : 465
                                }}
                                transition={{ duration: 2, ease: "circOut" }}
                            />
                        </svg>

                        <div className="relative flex flex-col items-center">
                            <span className="text-3xl font-semibold text-white tabular-nums">
                                {format(currentTime, 'HH:mm')}
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">
                                {format(currentTime, 'ss')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details and Actions */}
                <div className="flex-grow w-full space-y-6">
                    <div className="space-y-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'clocked_in' ? 'bg-emerald-500' :
                                status === 'on_break' ? 'bg-amber-500' :
                                    status === 'not_clocked_in' ? 'bg-blue-500' : 'bg-gray-500'
                                }`} />
                            <h2 className="text-xl font-medium text-white">
                                {status === 'not_clocked_in' ? 'Ready to Start?' :
                                    status === 'clocked_in' ? 'Shift Active' :
                                        status === 'on_break' ? 'In Break' :
                                            status === 'clocked_out' ? 'Shift Ended' : 'Processing...'}
                            </h2>
                        </div>
                        <Tooltip text={location.address} position="top">
                            <div className="flex items-center justify-center md:justify-start gap-1.5 opacity-60 cursor-help">
                                <MapPin size={10} className="text-white" />
                                <span className="truncate max-w-[200px] text-[10px] font-medium text-white block uppercase tracking-widest">
                                    {location.address.length > 35 ? location.address.substring(0, 35) + '...' : location.address}
                                </span>
                            </div>
                        </Tooltip>
                    </div>

                    {/* Stats Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-[10px] border border-white/5 flex flex-col gap-1 shadow-sm transition-all hover:bg-white/[0.06]"
                        >
                            <div className="flex items-center gap-2">
                                <Timer size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">Work Time</span>
                            </div>
                            <span className="text-lg font-medium text-white tabular-nums">
                                {status === 'not_clocked_in' ? '00:00:00' : shiftTimer}
                            </span>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-[10px] border border-white/5 flex flex-col gap-1 shadow-sm transition-all hover:bg-white/[0.06]"
                        >
                            <div className="flex items-center gap-2">
                                <Coffee size={14} className="text-amber-500" />
                                <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">Total Break</span>
                            </div>
                            <span className="text-lg font-medium text-white tabular-nums">
                                {status === 'on_break' ? (
                                    formatTime(parseTime(attendance?.total_break_time) + parseTime(breakTimer))
                                ) : (attendance?.total_break_time ? (attendance.total_break_time + (attendance.total_break_time.split(':').length === 2 ? ':00' : '')) : '00:00:00')}
                            </span>
                        </motion.div>
                    </div>

                    {/* Action Hub */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <AnimatePresence mode="wait">
                            {status === 'not_clocked_in' && (
                                <motion.button
                                    key="clockin"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    disabled={isActionLoading}
                                    onClick={handleClockIn}
                                    className="w-full bg-emerald-600 text-white h-11 rounded-full font-medium text-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                                >
                                    {isActionLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                                    Clock In Now
                                </motion.button>
                            )}

                            {status === 'clocked_in' && (
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <motion.button
                                        key="breakstart"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        disabled={isActionLoading}
                                        onClick={handleStartBreak}
                                        className="flex-1 bg-white/5 text-white h-11 rounded-full border border-white/10 font-medium text-md flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <Coffee size={18} />
                                        Break
                                    </motion.button>
                                    <motion.button
                                        key="clockout"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setIsConfirmModalOpen(true)}
                                        className="flex-1 bg-red-500/10 text-red-500 h-11 rounded-full border border-red-500/20 font-medium text-md flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95"
                                    >
                                        <LogOut size={18} />
                                        Clock Out
                                    </motion.button>
                                </div>
                            )}

                            {status === 'on_break' && (
                                <motion.button
                                    key="breakend"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    disabled={isActionLoading}
                                    onClick={handleEndBreak}
                                    className="w-full bg-emerald-600 text-white h-11 rounded-full font-medium text-md flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                                >
                                    {isActionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    Resume Work
                                </motion.button>
                            )}

                            {status === 'clocked_out' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-11 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-full flex items-center justify-center gap-3 text-emerald-500 font-medium text-md"
                                >
                                    <CheckCircle size={18} className="text-emerald-500" />
                                    Day Completed
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Premium Bottom Info Bar */}
            <div className="mt-auto bg-black/20 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Punch In</span>
                        <span className="text-xs font-bold text-gray-300">{attendance?.punch_in || '--:--'}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Punch Out</span>
                        <span className="text-xs font-bold text-gray-300">{attendance?.punch_out || '--:--'}</span>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 group cursor-pointer">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest transition-colors group-hover:text-primary">Live Sync</span>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1 h-1 rounded-full bg-emerald-500"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleClockOut}
                title="Clock Out Confirmation"
                message="Are you sure you want to clock out? This will end your current shift timer."
                confirmText="Yes, Clock Out"
                type="danger"
                loading={isActionLoading}
            />
        </motion.div>
    );
};

export default WebClockWidget;
