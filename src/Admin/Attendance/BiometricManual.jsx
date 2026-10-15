import React, { useState, useEffect, useMemo } from 'react';
import { Clock, User, Calendar, Save, Loader2, List, RefreshCw, Send, Edit2, Trash2, ArrowLeft, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { getUsersApi, saveAttendanceApi, getAttendanceApi, getBiometricLogsApi, syncBiometricApi, updateAttendanceApi, deleteAttendanceApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect, FormDate, FormTime, SearchableSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Pagination from '../../Common/Pagination';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TableSkeleton from '../../Common/CommonSkeletonLoader/TableSkeleton';
import ListSkeleton from '../../Common/CommonSkeletonLoader/ListSkeleton';

export default function BiometricManual() {
    const { tabId, subId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [biometricLogs, setBiometricLogs] = useState([]);

    const view = ['form', 'biometric', 'list'].includes(subId)
        ? subId
        : (['form', 'biometric', 'list'].includes(tabId) ? tabId : 'form');

    const setView = (v) => {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/attendance/manual')) {
            navigate(`/attendance/manual/${v}`);
        } else {
            navigate(`/biometric-manual/${v}`);
        }
    };

    const [syncDate, setSyncDate] = useState(() => localStorage.getItem('biometric_syncDate') || new Date().toISOString().split('T')[0]);
    const [syncing, setSyncing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [historyStartDate, setHistoryStartDate] = useState(() => localStorage.getItem('biometric_historyStartDate') || localStorage.getItem('biometric_historyDate') || new Date().toISOString().split('T')[0]);
    const [historyEndDate, setHistoryEndDate] = useState(() => localStorage.getItem('biometric_historyEndDate') || localStorage.getItem('biometric_historyDate') || new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalRecords, setTotalRecords] = useState(0);
    const [serverEditedCount, setServerEditedCount] = useState(0);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, historyStartDate, historyEndDate]);

    const [formData, setFormData] = useState({
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        punch_in: '',
        punch_out: '',
        status: 'Present',
        actual_punch_in: '',
        actual_punch_out: ''
    });

    const location = useLocation();

    // Helper functions for proper data display
    const formatTimeAMPM = (timeStr) => {
        if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00' || timeStr === '--:--' || timeStr === 'undefined') {
            return '--:--';
        }
        const cleanStr = String(timeStr).trim();
        if (cleanStr.toLowerCase().includes('am') || cleanStr.toLowerCase().includes('pm')) {
            return cleanStr;
        }
        const parts = cleanStr.split(':');
        if (parts.length < 2) return cleanStr;
        let h = parseInt(parts[0], 10);
        const m = parts[1].padStart(2, '0');
        if (isNaN(h)) return cleanStr;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
    };

    const isTimeNonZero = (timeStr) => {
        if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00' || timeStr === '--:--' || timeStr === 'undefined') return false;
        const parts = String(timeStr).split(':').map(Number);
        return parts.some(n => !isNaN(n) && n > 0);
    };

    const calculateDuration = (inTime, outTime) => {
        if (!inTime || !outTime) return null;
        const [hIn, mIn] = inTime.split(':').map(Number);
        const [hOut, mOut] = outTime.split(':').map(Number);
        if (isNaN(hIn) || isNaN(mIn) || isNaN(hOut) || isNaN(mOut)) return null;
        let diffMins = (hOut * 60 + mOut) - (hIn * 60 + mIn);
        if (diffMins < 0) diffMins += 24 * 60; // Overnight
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    const formatHoursDisplay = (record) => {
        if (record.punch_in && record.punch_out && isTimeNonZero(record.total_hours)) {
            return record.total_hours.slice(0, 5);
        }
        if (record.punch_in && (!record.punch_out || record.punch_out === '--:--')) {
            const todayStr = new Date().toISOString().split('T')[0];
            const recordDateStr = format(new Date(record.date), 'yyyy-MM-dd');
            if (recordDateStr === todayStr) {
                return '--:--';
            }
        }
        return isTimeNonZero(record.total_hours) ? record.total_hours.slice(0, 5) : '00:00';
    };

    const getHoursSubtitle = (record) => {
        if (record.punch_in && (!record.punch_out || record.punch_out === '--:--')) {
            const todayStr = new Date().toISOString().split('T')[0];
            const recordDateStr = format(new Date(record.date), 'yyyy-MM-dd');
            return recordDateStr === todayStr ? 'In Progress' : 'Missing Out';
        }
        return 'Hours';
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'Absent':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'Incomplete':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'On Leave':
                return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            case 'Week Off':
                return 'bg-purple-50 text-purple-700 border border-purple-200';
            case 'Holiday':
                return 'bg-teal-50 text-teal-700 border border-teal-200';
            case 'Permission':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    useEffect(() => {
        localStorage.setItem('biometric_syncDate', syncDate);
    }, [syncDate]);

    useEffect(() => {
        localStorage.setItem('biometric_historyStartDate', historyStartDate);
    }, [historyStartDate]);

    useEffect(() => {
        localStorage.setItem('biometric_historyEndDate', historyEndDate);
    }, [historyEndDate]);

    useEffect(() => {
        fetchEmployees();

        // Check for pre-fill state from navigation
        if (location.state?.editRecord) {
            const { editRecord } = location.state;
            setEditingRecord(editRecord);
            setFormData({
                user_id: editRecord.user_id,
                date: editRecord.date,
                punch_in: editRecord.punch_in || '',
                punch_out: editRecord.punch_out || '',
                status: editRecord.status || 'Present',
                actual_punch_in: editRecord.actual_punch_in || editRecord.punch_in || '',
                actual_punch_out: editRecord.actual_punch_out || editRecord.punch_out || ''
            });
        }
    }, [location.state]);

    const isRecordEdited = (record) => {
        return Number(record?.is_edited) === 1 || record?.is_edited === true;
    };

    const editedCount = serverEditedCount;
    const filteredAttendance = attendanceList;

    const fetchEmployees = async () => {
        try {
            const res = await getUsersApi({ limit: 1000 });
            setEmployees(res.data.users);
        } catch (error) {
            toast.error('Failed to fetch employees');
        }
    };

    const fetchAttendance = async () => {
        try {
            setFetching(true);
            const res = await getAttendanceApi({
                startDate: historyStartDate,
                endDate: historyEndDate,
                page: currentPage,
                limit: pageSize,
                search: searchQuery,
                status: statusFilter
            });

            if (res.data && Array.isArray(res.data.data)) {
                setAttendanceList(res.data.data);
                setTotalRecords(res.data.pagination?.total ?? res.data.data.length);
                if (typeof res.data.editedCount === 'number') {
                    setServerEditedCount(res.data.editedCount);
                }
            } else if (Array.isArray(res.data)) {
                setAttendanceList(res.data);
                setTotalRecords(res.data.length);
                setServerEditedCount(res.data.filter(isRecordEdited).length);
            }
        } catch (error) {
            toast.error('Failed to fetch attendance records');
        } finally {
            setFetching(false);
        }
    };

    // Refetch attendance when dates, pagination, or filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAttendance();
        }, 250);
        return () => clearTimeout(timer);
    }, [historyStartDate, historyEndDate, currentPage, pageSize, statusFilter, searchQuery]);

    const fetchBiometric = async () => {
        try {
            setSyncing(true);
            const res = await getBiometricLogsApi({ fromDate: syncDate, toDate: syncDate });
            setBiometricLogs(res.data);
            if (res.data.length === 0) {
                toast.error('No logs found for this date');
            } else {
                toast.success(`Found ${res.data.length} employee logs`);
            }
        } catch (error) {
            toast.error('Failed to fetch biometric logs');
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncSave = async (log) => {
        try {
            setLoading(true);
            await saveAttendanceApi({
                user_id: log.user_id,
                date: log.date,
                punch_in: log.punch_in,
                punch_out: log.punch_out
            });
            toast.success(`Saved attendance for ${log.employee_name}`);
            setBiometricLogs(prev => prev.filter(item => !(item.user_id === log.user_id && item.date === log.date)));
            fetchAttendance();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (biometricLogs.length === 0) return;
        setLoading(true);
        try {
            const res = await syncBiometricApi({
                fromDate: syncDate,
                toDate: syncDate
            });
            toast.success(res.data.message);
            setBiometricLogs([]);
            fetchAttendance();
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error(error.response?.data?.message || 'Failed to sync all records');
        } finally {
            setLoading(false);
        }
    };

    const handleSetShiftTimes = () => {
        const user = employees.find(e => String(e.id) === String(formData.user_id));
        if (!user || !user.shift_name) return;

        const match = user.shift_name.match(/\((\d{2}:\d{2}(?::\d{2})?)\s*-\s*(\d{2}:\d{2}(?::\d{2})?)\)/);
        if (match) {
            setFormData(prev => ({
                ...prev,
                punch_in: match[1],
                punch_out: match[2]
            }));
            toast.success('Shift times applied');
        } else {
            toast.error('Could not extract times from shift name');
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            user_id: record.user_id,
            date: format(new Date(record.date), 'yyyy-MM-dd'),
            punch_in: record.punch_in || '',
            punch_out: record.punch_out || '',
            status: record.status || 'Present',
            actual_punch_in: record.actual_punch_in || record.punch_in || '',
            actual_punch_out: record.actual_punch_out || record.punch_out || ''
        });
        setEditingId(record.id);
        setView('form');
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        try {
            setLoading(true);
            await deleteAttendanceApi(deletingId);
            toast.success('Attendance deleted successfully');
            fetchAttendance();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        } finally {
            setLoading(false);
            setDeletingId(null);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.user_id) return toast.error('Please select an employee');
        if (!formData.date) return toast.error('Please select a date');

        if (!editingId) {
            const selectedDate = formData.date;
            const exists = attendanceList.find(record => {
                const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
                return String(record.user_id) === String(formData.user_id) && recordDate === selectedDate;
            });

            if (exists) {
                return toast.error(`Attendance already exists for this employee on ${format(new Date(selectedDate), 'dd/MM/yyyy')}`);
            }
        }

        setLoading(true);
        try {
            if (editingId && !String(editingId).startsWith('bio_') && !String(editingId).startsWith('gen_')) {
                await updateAttendanceApi(editingId, formData);
                toast.success('Attendance updated successfully!');
            } else {
                await saveAttendanceApi(formData);
                toast.success(editingId ? 'Attendance timings updated successfully!' : 'Attendance recorded successfully!');
            }

            fetchAttendance();
            setEditingId(null);
            setEditingRecord(null);
            setView('list');

            setFormData({
                user_id: '',
                date: new Date().toISOString().split('T')[0],
                punch_in: '',
                punch_out: '',
                status: 'Present',
                actual_punch_in: '',
                actual_punch_out: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    const tabs = [
        { id: 'form', icon: Save, label: editingId ? 'Edit Entry' : 'Manual Entry' },
        { id: 'biometric', icon: RefreshCw, label: 'Biometric Sync' },
        { id: 'list', icon: List, label: 'Attendance History' }
    ];

    return (
        <div className="min-h-screen bg-transparent md:p-4 p-3 max-w-9xl pb-6 md:pb-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:mb-8 mb-4">
                <div className="flex items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Clock size={24} />
                            </div>
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Biometric Entry</h2>
                        </div>
                        <p className="text-gray-500 text-sm md:text-[14px] font-medium ml-1">
                            Manage and sync employee attendance records.
                        </p>
                    </div>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex p-1.5 rounded-full border border-gray-200 gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'form') {
                                    setEditingId(null);
                                    setFormData({
                                        user_id: '',
                                        date: new Date().toISOString().split('T')[0],
                                        punch_in: '',
                                        punch_out: '',
                                        status: 'Present'
                                    });
                                }
                                setView(tab.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 relative ${view === tab.id ? 'bg-primary text-white ring-1 ring-gray-200/50 translate-y-[-1px]' : 'text-gray-500 bg-gray-100/80 hover:text-gray-700 hover:bg-gray-200'}`}
                        >
                            <tab.icon size={18} className={view === tab.id ? 'text-white' : 'text-gray-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* View Content with Animation */}
            <AnimatePresence mode="wait">
                {view === 'form' && (
                    <motion.div
                        key="form"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="max-w-7xl"
                    >
                        <div className="bg-white border border-gray-200 rounded-[15px] relative shadow-xl shadow-gray-200/50">
                            <div className="md:p-6 p-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Edit2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:font-semibold font-semibold text-gray-900">
                                            {editingId ? 'Edit Attendance Record' : 'Record Manual Entry'}
                                        </h3>
                                        {editingId && editingRecord && (
                                            <p className="text-xs text-gray-500 font-medium">
                                                Editing timings for <span className="font-bold text-gray-800">{editingRecord.employee_name}</span> ({editingRecord.emp_id})
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {editingId && (
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setEditingRecord(null);
                                            setView('list');
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSubmit} className="md:p-8 p-4 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <SearchableSelect
                                        label="Select Employee"
                                        name="user_id"
                                        required
                                        value={formData.user_id}
                                        onChange={handleChange}
                                        options={employees.map(emp => ({
                                            value: emp.id,
                                            label: `${emp.employee_name} (${emp.emp_id})`
                                        }))}
                                        placeholder="Type to search employee..."
                                        icon={User}
                                    />

                                    <FormDate
                                        label="Date"
                                        name="date"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                        icon={Calendar}
                                    />

                                    {formData.user_id && (
                                        <div className="md:col-span-2 p-5 bg-primary/[0.03] rounded-2xl border border-primary/10 flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-primary/5">
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-primary/60 uppercase tracking-[0.1em]">Current Shift</div>
                                                    <div className="text-[15px] font-bold text-gray-800">
                                                        {employees.find(e => String(e.id) === String(formData.user_id))?.shift_name || 'No shift assigned'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSetShiftTimes}
                                                className="px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary hover:text-white transition-all active:scale-95"
                                            >
                                                Set This Time
                                            </button>
                                        </div>
                                    )}

                                    {/* Recorded Actual Punch Info if editing */}
                                    {editingId && (
                                        <div className="md:col-span-2 p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                                                        Original Recorded Actual Punch
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-950 font-mono">
                                                        {formatTimeAMPM(formData.actual_punch_in || editingRecord?.actual_punch_in || editingRecord?.punch_in)} (In) → {formatTimeAMPM(formData.actual_punch_out || editingRecord?.actual_punch_out || editingRecord?.punch_out)} (Out)
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                Original Punch
                                            </span>
                                        </div>
                                    )}

                                    <FormTime
                                        label="Punch In Time (From)"
                                        name="punch_in"
                                        value={formData.punch_in}
                                        onChange={handleChange}
                                        icon={Clock}
                                    />

                                    <FormTime
                                        label="Punch Out Time (To)"
                                        name="punch_out"
                                        value={formData.punch_out}
                                        onChange={handleChange}
                                        icon={Clock}
                                    />

                                    {/* Dynamic Edited Timings Preview */}
                                    {(formData.punch_in || formData.punch_out) && (
                                        <div className="md:col-span-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                                                        {editingId ? 'Edited Timings Dynamic Preview' : 'Entry Timings Preview'}
                                                    </span>
                                                    <div className="text-sm font-semibold text-gray-900 mt-0.5 space-y-0.5">
                                                        <div>
                                                            From <span className="text-amber-700 font-extrabold">{formatTimeAMPM(formData.punch_in)}</span> to <span className="text-amber-700 font-extrabold">{formatTimeAMPM(formData.punch_out)}</span>
                                                            {calculateDuration(formData.punch_in, formData.punch_out) && (
                                                                <span className="ml-2.5 px-2.5 py-0.5 text-xs rounded-full bg-white text-gray-800 font-bold border border-amber-200 shadow-xs">
                                                                    Duration: {calculateDuration(formData.punch_in, formData.punch_out)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {editingId && (formData.actual_punch_in || editingRecord?.actual_punch_in) && (
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                Actual Punch was: <span className="font-semibold text-gray-700">{formatTimeAMPM(formData.actual_punch_in || editingRecord?.actual_punch_in)}</span> to <span className="font-semibold text-gray-700">{formatTimeAMPM(formData.actual_punch_out || editingRecord?.actual_punch_out)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 self-start sm:self-auto">
                                                {editingId ? 'Manual Override' : 'New Entry'}
                                            </span>
                                        </div>
                                    )}

                                    <FormSelect
                                        label="Attendance Status"
                                        name="status"
                                        required
                                        value={formData.status}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'Present', label: 'Present' },
                                            { value: 'Absent', label: 'Absent' },
                                            { value: 'Week Off', label: 'Week Off' },
                                            { value: 'Holiday', label: 'Holiday' }
                                        ]}
                                        icon={CheckCircle2}
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row justify-end gap-3 md:pt-6 pt-2 border-t border-gray-50">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(null);
                                                setView('list');
                                            }}
                                            className="w-full md:w-auto px-8 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-2 rounded-full font-medium transition-all bg-primary text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:bg-primary-hover active:translate-y-0 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {loading ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update Record' : 'Save Attendance')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {view === 'biometric' && (
                    <motion.div
                        key="biometric"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                    >
                        <div className="bg-white border border-gray-200 rounded-[15px] md:p-6 p-3 flex flex-col md:flex-row items-center justify-between md:gap-6 gap-3">
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="w-full md:w-64">
                                    <FormDate
                                        label="Sync Date"
                                        name="syncDate"
                                        value={syncDate}
                                        onChange={(e) => setSyncDate(e.target.value)}
                                        icon={Calendar}
                                    />
                                </div>
                                <button
                                    onClick={fetchBiometric}
                                    disabled={syncing}
                                    className="w-full md:w-auto mt-0 md:mt-6 flex items-center justify-center gap-2 px-6 py-2 rounded-full font-medium bg-primary text-white shadow-lg shadow-primary/10 transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
                                >
                                    {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                    {syncing ? 'Fetching...' : 'Fetch Device Logs'}
                                </button>
                            </div>
                            {biometricLogs.length > 0 && (
                                <button
                                    onClick={handleSaveAll}
                                    disabled={loading}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 mt-5 px-6 py-2 rounded-full font-medium bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                    Sync All {biometricLogs.length} Records
                                </button>
                            )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden">
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest">Employee Info</th>
                                            <th className="px-6 py-5 text-[12px] font-semibold text-gray-600 uppercase tracking-widest text-center">In/Out Times</th>
                                            <th className="px-6 py-5 text-[12px] font-semibold text-gray-600 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-5 text-[12px] font-semibold text-gray-600 uppercase tracking-widest text-center">Week Off</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {syncing ? (
                                            <TableSkeleton rows={8} columns={5} />
                                        ) : biometricLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState icon={Search} title="No logs found" description="Try selecting a different date to fetch biometric data." />
                                                </td>
                                            </tr>
                                        ) : (
                                            biometricLogs.map((log, index) => (
                                                <tr key={`${log.user_id}_${index}`} className="hover:bg-gray-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{log.employee_name}</div>
                                                        <div className="text-[11px] mt-0.5 text-gray-400 flex items-center gap-2">
                                                            <span className="font-bold">ID: {log.emp_id}</span>
                                                            {log.biometric_id && <span className="text-primary font-black">•</span>}
                                                            {log.biometric_id && <span>BIO: {log.biometric_id}</span>}
                                                            {!log.user_id && <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 font-semibold text-[10px] ring-1 ring-rose-100">Not Linked</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">In</div>
                                                                <div className="text-sm font-semibold text-gray-700">{log.punch_in || '--:--'}</div>
                                                            </div>
                                                            <div className="h-4 w-[1px] bg-gray-200"></div>
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Out</div>
                                                                <div className="text-sm font-semibold text-gray-700">{log.punch_out || '--:--'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${log.status === 'Absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            log.status === 'Incomplete' ? 'bg-orange-50 text-orange-500 border border-orange-200' :
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            }`}>
                                                            {log.status || 'Present'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-500">
                                                        {log.weekoff_date || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleSyncSave(log)}
                                                            disabled={!log.user_id || loading}
                                                            className={`p-2.5 rounded-xl transition-all shadow-sm ${!log.user_id ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-90'}`}
                                                            title={!log.user_id ? "Link this ID to an employee first" : "Save this record"}
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden divide-y divide-gray-50">
                                {syncing ? (
                                    <ListSkeleton count={5} />
                                ) : biometricLogs.length === 0 ? (
                                    <EmptyState icon={Search} title="No logs found" description="Fetch logs for a specific date" />
                                ) : (
                                    biometricLogs.map((log, index) => (
                                        <div key={index} className="md:p-5 p-2 active:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{log.employee_name}</h4>
                                                    <p className="text-[11px] text-gray-500 font-medium">ID: {log.emp_id} {log.biometric_id && `• BIO: ${log.biometric_id}`}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ${log.status === 'Absent' ? 'bg-rose-50 text-rose-600 ring-rose-100' :
                                                    log.status === 'Incomplete' ? 'bg-orange-50 text-orange-500 ring-orange-200' :
                                                        'bg-emerald-50 text-emerald-600 ring-emerald-100'
                                                    }`}>
                                                    {log.status || 'Present'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-5">
                                                <div className="bg-gray-50/50 md:p-3 p-2 md:rounded-2xl rounded-lg border border-gray-100">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Punch In</div>
                                                    <div className="text-sm font-semibold text-gray-800">{log.punch_in || '--:--'}</div>
                                                </div>
                                                <div className="bg-gray-50/50 md:p-3 p-2 md:rounded-2xl rounded-lg border border-gray-100">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Punch Out</div>
                                                    <div className="text-sm font-semibold text-gray-800">{log.punch_out || '--:--'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                <div className="text-[10px] font-medium text-gray-400">
                                                    Shift: <span className="font-bold text-gray-600">{log.shift || 'Default'}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleSyncSave(log)}
                                                    disabled={!log.user_id || loading}
                                                    className={`md:h-11 h-9 px-6 rounded-xl font-medium flex items-center gap-2 transition-all ${!log.user_id ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                                                >
                                                    <Send size={16} /> Save
                                                </button>
                                            </div>
                                            {!log.user_id && <p className="mt-3 text-[10px] text-rose-500 font-semibold bg-rose-50/50 p-2 rounded-lg text-center">Biometric ID not linked to any employee</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'list' && (
                    <motion.div
                        key="list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-sm">
                            {/* Header Section: Title & Date Range Controls */}
                            <div className="p-4 sm:px-6 bg-white border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                                        <List size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">Attendance History</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                                {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
                                            </span>
                                            {statusFilter === 'Edited' && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    Edited Only
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                                            Daily biometric punches and manual attendance tracking
                                        </p>
                                    </div>
                                </div>

                                {/* Date Range and Actions */}
                                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                                    <div className="w-36 sm:w-40">
                                        <FormDate
                                            name="historyStartDate"
                                            value={historyStartDate}
                                            onChange={(e) => setHistoryStartDate(e.target.value)}
                                            placeholderText="From Date"
                                            className="!space-y-0"
                                        />
                                    </div>

                                    <div className="w-36 sm:w-40">
                                        <FormDate
                                            name="historyEndDate"
                                            value={historyEndDate}
                                            onChange={(e) => setHistoryEndDate(e.target.value)}
                                            placeholderText="To Date"
                                            className="!space-y-0"
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setHistoryStartDate(today);
                                            setHistoryEndDate(today);
                                        }}
                                        className={`h-9 px-4 text-xs font-medium rounded-lg border transition-all ${historyStartDate === new Date().toISOString().split('T')[0] && historyEndDate === new Date().toISOString().split('T')[0]
                                            ? 'bg-primary text-white border-primary shadow-xs'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Today
                                    </button>

                                    <button
                                        onClick={fetchAttendance}
                                        className="h-11 w-11 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-primary hover:border-primary transition-all active:scale-95 shadow-xs"
                                        title="Refresh Attendance"
                                    >
                                        <RefreshCw size={18} className={fetching ? 'animate-spin text-primary' : ''} />
                                    </button>
                                </div>
                            </div>

                            {/* Sub-toolbar: Search & Filters */}
                            <div className="px-4 sm:px-6 py-3 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                                    {/* Common Search Field */}
                                    <div className="w-full sm:w-72">
                                        <FormInput
                                            placeholder="Search employee, ID, shift..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            icon={Search}
                                            className="!space-y-0"
                                        />
                                    </div>

                                    {/* Common Select Field */}
                                    <div className="w-full sm:w-44">
                                        <FormSelect
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            options={[
                                                { value: 'All', label: 'All Statuses' },
                                                { value: 'Present', label: 'Present' },
                                                { value: 'Absent', label: 'Absent' },
                                                { value: 'On Leave', label: 'On Leave' },
                                                { value: 'Week Off', label: 'Week Off' },
                                                { value: 'Holiday', label: 'Holiday' },
                                                { value: 'Incomplete', label: 'Incomplete' },
                                                { value: 'Edited', label: `Edited (${editedCount})` }
                                            ]}
                                            placeholder=""
                                            className="!space-y-0"
                                        />
                                    </div>
                                </div>

                                {/* Filter Pills */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('All')}
                                        className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all ${statusFilter === 'All'
                                            ? 'bg-white text-gray-900 border-gray-300'
                                            : 'bg-transparent text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100/80'
                                            }`}
                                    >
                                        All Statuses
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter(prev => prev === 'Edited' ? 'All' : 'Edited')}
                                        className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${statusFilter === 'Edited'
                                            ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-200 shadow-amber-200/50'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50/70 hover:text-amber-700 hover:border-amber-300'
                                            }`}
                                        title={statusFilter === 'Edited' ? "Clear Edited filter (show all)" : "Click to view only edited employees"}
                                    >
                                        <Edit2 size={13} className={statusFilter === 'Edited' ? 'text-white' : 'text-amber-500'} />
                                        <span>Edited</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'Edited'
                                            ? 'bg-white/25 text-white'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {editedCount}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest">Employee</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-5 text-[12px] font-semibold text-gray-600 uppercase tracking-widest text-center">Punch Time (From - To)</th>
                                            <th className="px-6 py-5 text-[12px] font-semibold text-gray-600 uppercase tracking-widest text-center">Status & Performance</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-right">Hours</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50/80">
                                        {fetching ? (
                                            <TableSkeleton rows={10} columns={6} />
                                        ) : filteredAttendance.length === 0 ? (
                                            <tr>
                                                <td colSpan="6">
                                                    <EmptyState
                                                        icon={Search}
                                                        title={statusFilter === 'Edited' ? "No edited records found" : "No matching records found"}
                                                        description={
                                                            statusFilter === 'Edited'
                                                                ? "No attendance records have been manually edited in this date range."
                                                                : searchQuery
                                                                    ? `No attendance records match "${searchQuery}".`
                                                                    : "Try selecting a different date range."
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAttendance.map((record) => (
                                                <tr key={record.id} className={`hover:bg-gray-50/40 transition-colors group ${isRecordEdited(record) ? 'bg-amber-50/20' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{record.employee_name}</div>
                                                        <div className="text-[11px] mt-0.5 text-gray-400 flex flex-wrap items-center gap-1.5 font-medium uppercase tracking-tight">
                                                            <span>{record.emp_id}</span>
                                                            {record.is_biometric && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold text-[9px] ring-1 ring-blue-100">BIOMETRIC</span>
                                                            )}
                                                            {isRecordEdited(record) && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[9px] ring-1 ring-amber-200 tracking-wider">EDITED</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                            {format(new Date(record.date), 'dd MMM, yyyy')}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 font-medium">
                                                            {format(new Date(record.date), 'EEEE')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isRecordEdited(record) ? (
                                                            <div className="flex flex-col items-stretch min-w-[215px] max-w-[240px] mx-auto bg-white rounded-xl border border-amber-200/90 shadow-2xs overflow-hidden">
                                                                {/* Edited Timings Row */}
                                                                <div className="px-2.5 py-1.5 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/90 flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800">
                                                                            Edited
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 font-mono tracking-tight">
                                                                        <span className="text-amber-950 font-black">{formatTimeAMPM(record.punch_in)}</span>
                                                                        <span className="text-amber-400 font-normal text-[10px]">→</span>
                                                                        <span className="text-amber-950 font-black">{formatTimeAMPM(record.punch_out)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Actual Biometric / Initial Punch Row */}
                                                                <div className="px-2.5 py-1.5 bg-gray-50/80 border-t border-amber-100/80 flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                                            Actual
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 font-mono">
                                                                        <span className={record.actual_punch_in && record.actual_punch_in !== record.punch_in ? 'text-gray-700 font-bold underline decoration-rose-300 decoration-1 underline-offset-2' : ''}>
                                                                            {formatTimeAMPM(record.actual_punch_in || record.punch_in)}
                                                                        </span>
                                                                        <span className="text-gray-300 text-[10px]">→</span>
                                                                        <span className={record.actual_punch_out && record.actual_punch_out !== record.punch_out ? 'text-gray-700 font-bold underline decoration-rose-300 decoration-1 underline-offset-2' : ''}>
                                                                            {formatTimeAMPM(record.actual_punch_out || record.punch_out)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <div className="text-center min-w-[55px]">
                                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">From (In)</div>
                                                                        <div className={`text-sm font-semibold ${record.punch_in ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                            {formatTimeAMPM(record.punch_in)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-5 w-[1px] bg-gray-200"></div>
                                                                    <div className="text-center min-w-[55px]">
                                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">To (Out)</div>
                                                                        <div className={`text-sm font-semibold ${record.punch_out ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                            {formatTimeAMPM(record.punch_out)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(record.status)}`}>
                                                                {record.status || (record.punch_in ? 'Present' : 'Absent')}
                                                            </span>

                                                            <div className="flex flex-wrap justify-center items-center gap-1 mt-0.5">
                                                                {record.permissions && record.permissions.length > 0 && record.permissions.map((p, pIdx) => (
                                                                    <span key={pIdx} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 ring-1 ring-blue-100 whitespace-nowrap">
                                                                        PERMISSION: {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                                                                    </span>
                                                                ))}

                                                                {isTimeNonZero(record.late_punch_in) && (
                                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-200 whitespace-nowrap">
                                                                        LATE IN: {record.late_punch_in.slice(0, 5)}
                                                                    </span>
                                                                )}

                                                                {isTimeNonZero(record.early_punch_out) && (
                                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-orange-50 text-orange-600 ring-1 ring-orange-200 whitespace-nowrap">
                                                                        EARLY OUT: {record.early_punch_out.slice(0, 5)}
                                                                    </span>
                                                                )}

                                                                {record.punch_in && !isTimeNonZero(record.late_punch_in) && (record.status === 'Present' || !record.status) && (
                                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 whitespace-nowrap text-center">
                                                                        ON TIME
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-semibold text-gray-900 tabular-nums">
                                                            {formatHoursDisplay(record)}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-tighter">
                                                            {getHoursSubtitle(record)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(record)}
                                                                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                                title="Edit attendance timings"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            {!String(record.id).startsWith('bio_') && !String(record.id).startsWith('gen_') && (
                                                                <button
                                                                    onClick={() => handleDeleteClick(record.id)}
                                                                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                                    title="Delete record"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-gray-50">
                                {fetching ? (
                                    <ListSkeleton count={5} />
                                ) : filteredAttendance.length === 0 ? (
                                    <EmptyState
                                        icon={Search}
                                        title={statusFilter === 'Edited' ? "No edited records found" : "No matching records found"}
                                        description={
                                            statusFilter === 'Edited'
                                                ? "No attendance records have been manually edited in this date range."
                                                : searchQuery
                                                    ? `No attendance records match "${searchQuery}".`
                                                    : "Try selecting a different date range."
                                        }
                                    />
                                ) : (
                                    filteredAttendance.map((record) => (
                                        <div key={record.id} className="p-4 active:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{record.employee_name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{record.emp_id}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-[10px] text-gray-500 font-semibold">{format(new Date(record.date), 'dd MMM yyyy')}</span>
                                                        {isRecordEdited(record) && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[8px] ring-1 ring-amber-200">EDITED</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(record.status)}`}>
                                                    {record.status || (record.punch_in ? 'Present' : 'Absent')}
                                                </span>
                                            </div>

                                            {isRecordEdited(record) ? (
                                                <div className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/30 p-2.5 space-y-2">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                            Punch Timings Comparison
                                                        </span>
                                                        <span className="text-[9px] bg-amber-100/90 text-amber-800 px-2 py-0.5 rounded-md font-bold">MANUAL OVERRIDE</span>
                                                    </div>

                                                    {/* Edited */}
                                                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200/90 shadow-2xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white tracking-wider">EDITED</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 font-mono">
                                                            <span className="text-amber-950 font-extrabold">{formatTimeAMPM(record.punch_in)}</span>
                                                            <span className="text-amber-400">→</span>
                                                            <span className="text-amber-950 font-extrabold">{formatTimeAMPM(record.punch_out)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Actual */}
                                                    <div className="flex items-center justify-between bg-gray-50/90 p-2 rounded-lg border border-gray-200/80">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 tracking-wider">ACTUAL</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 font-mono">
                                                            <span className={record.actual_punch_in && record.actual_punch_in !== record.punch_in ? 'text-gray-700 font-bold underline decoration-rose-300 decoration-1' : ''}>
                                                                {formatTimeAMPM(record.actual_punch_in || record.punch_in)}
                                                            </span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className={record.actual_punch_out && record.actual_punch_out !== record.punch_out ? 'text-gray-700 font-bold underline decoration-rose-300 decoration-1' : ''}>
                                                                {formatTimeAMPM(record.actual_punch_out || record.punch_out)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">From (Punch In)</div>
                                                        <div className="text-sm font-semibold text-gray-800">{formatTimeAMPM(record.punch_in)}</div>
                                                    </div>
                                                    <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">To (Punch Out)</div>
                                                        <div className="text-sm font-semibold text-gray-800">{formatTimeAMPM(record.punch_out)}</div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50">
                                                <div className="flex flex-wrap gap-1">
                                                    {isTimeNonZero(record.late_punch_in) && (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                                                            LATE: {record.late_punch_in.slice(0, 5)}
                                                        </span>
                                                    )}
                                                    {record.punch_in && !isTimeNonZero(record.late_punch_in) && (record.status === 'Present' || !record.status) && (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                                            ON TIME
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="text-right mr-2">
                                                        <span className="text-sm font-semibold text-gray-900">{formatHoursDisplay(record)}</span>
                                                        <span className="text-[9px] text-gray-400 block uppercase font-bold">{getHoursSubtitle(record)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination via API */}
                            {!fetching && totalRecords > 0 && (
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={totalRecords}
                                    onChange={(p) => setCurrentPage(p)}
                                    onPageSizeChange={(s) => {
                                        setPageSize(s);
                                        setCurrentPage(1);
                                    }}
                                    pageSizeOptions={[20, 40, 60, 80, 100]}
                                    showingCount={filteredAttendance.length}
                                    entityName="records"
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex items-center justify-between z-50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.id === 'form') {
                                setEditingId(null);
                                setFormData({
                                    user_id: '',
                                    date: new Date().toISOString().split('T')[0],
                                    punch_in: '',
                                    punch_out: ''
                                });
                            }
                            setView(tab.id);
                        }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === tab.id ? 'text-primary scale-110' : 'text-gray-400'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${view === tab.id ? 'bg-primary/10' : 'bg-transparent'}`}>
                            <tab.icon size={22} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{tab.id === 'form' ? 'Entry' : tab.id === 'biometric' ? 'Sync' : 'History'}</span>
                    </button>
                ))}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Record"
                message="This attendance record will be permanently removed. Would you like to proceed?"
                confirmText="Yes, Delete Record"
                cancelText="Keep Record"
                type="danger"
                loading={loading}
            />
        </div>
    );
}

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="px-6 py-24 text-center flex flex-col items-center justify-center w-full">
            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 mx-auto mb-6 ring-8 ring-gray-50/50">
                <Icon size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-xs mx-auto font-medium text-sm">{description}</p>
        </div>
    );
}
