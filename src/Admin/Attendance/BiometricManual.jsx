import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar, Save, Loader2, List, RefreshCw, Send, Edit2, Trash2, ArrowLeft, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { getUsersApi, saveAttendanceApi, getAttendanceApi, getBiometricLogsApi, syncBiometricApi, updateAttendanceApi, deleteAttendanceApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormSelect, FormDate, FormTime, SearchableSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [historyDate, setHistoryDate] = useState(() => localStorage.getItem('biometric_historyDate') || new Date().toISOString().split('T')[0]);

    const [formData, setFormData] = useState({
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        punch_in: '',
        punch_out: '',
        status: 'Present'
    });

    const location = useLocation();

    useEffect(() => {
        localStorage.setItem('biometric_syncDate', syncDate);
    }, [syncDate]);

    useEffect(() => {
        localStorage.setItem('biometric_historyDate', historyDate);
    }, [historyDate]);

    useEffect(() => {
        fetchEmployees();
        fetchAttendance();

        // Check for pre-fill state from navigation
        if (location.state?.editRecord) {
            const { editRecord } = location.state;
            setFormData({
                user_id: editRecord.user_id,
                date: editRecord.date,
                punch_in: editRecord.punch_in || '',
                punch_out: editRecord.punch_out || '',
                status: editRecord.status || 'Present'
            });

            // If we have an ID, we might want to set it as editing
            // But usually, manual edit is for creating OR updating.
            // Let's check if a record already exists in attendanceList
        }
    }, [location.state, historyDate]);

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
            const res = await getAttendanceApi({ startDate: historyDate, endDate: historyDate });
            setAttendanceList(res.data);
        } catch (error) {
            toast.error('Failed to fetch attendance records');
        } finally {
            setFetching(false);
        }
    };

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
        setFormData({
            user_id: record.user_id,
            date: format(new Date(record.date), 'yyyy-MM-dd'),
            punch_in: record.punch_in || '',
            punch_out: record.punch_out || '',
            status: record.status || 'Present'
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
                return toast.error(`Attendance already exists for this employee on ${format(new Date(selectedDate), 'dd/MM/yy')}`);
            }
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateAttendanceApi(editingId, formData);
                toast.success('Attendance updated successfully!');
            } else {
                await saveAttendanceApi(formData);
                toast.success('Attendance recorded successfully!');
            }

            fetchAttendance();
            setEditingId(null);
            setView('list');

            setFormData({
                user_id: '',
                date: new Date().toISOString().split('T')[0],
                punch_in: '',
                punch_out: '',
                status: 'Present'
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
        <div className="min-h-screen bg-transparent md:p-4 p-3 max-w-7xl pb-6 md:pb-6">
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
                                    <h3 className="text-lg md:font-semibold font-semibold text-gray-900">{editingId ? 'Edit Attendance Record' : 'Record Manual Entry'}</h3>
                                </div>
                                {editingId && (
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
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

                                    <FormTime
                                        label="Punch In Time"
                                        name="punch_in"
                                        value={formData.punch_in}
                                        onChange={handleChange}
                                        icon={Clock}
                                    />

                                    <FormTime
                                        label="Punch Out Time"
                                        name="punch_out"
                                        value={formData.punch_out}
                                        onChange={handleChange}
                                        icon={Clock}
                                    />

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
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-center">In/Out Times</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-5 text-[12px] font-bold text-gray-600 uppercase tracking-widest text-center">Week Off</th>
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
                                                    <div className="text-sm font-bold text-gray-800">{log.punch_in || '--:--'}</div>
                                                </div>
                                                <div className="bg-gray-50/50 md:p-3 p-2 md:rounded-2xl rounded-lg border border-gray-100">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Punch Out</div>
                                                    <div className="text-sm font-bold text-gray-800">{log.punch_out || '--:--'}</div>
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
                            <div className="py-4 px-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <List size={20} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
                                </div>
                                <div className="w-full md:w-72 flex items-center gap-2">
                                    <FormDate
                                        label="Select Date"
                                        name="historyDate"
                                        value={historyDate}
                                        onChange={(e) => setHistoryDate(e.target.value)}
                                        icon={Calendar}
                                    />
                                    <button
                                        onClick={fetchAttendance}
                                        className="mt-6 p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
                                        title="Refresh"
                                    >
                                        <RefreshCw size={18} className={fetching ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest">Employee</th>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest text-center">Punch Time</th>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest text-center">Performance</th>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest text-right">Hours</th>
                                            <th className="px-6 py-5 text-[13px] font-semibold text-gray-600 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50/80">
                                        {fetching ? (
                                            <TableSkeleton rows={10} columns={6} />
                                        ) : attendanceList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6">
                                                    <EmptyState icon={User} title="History is empty" description="Attendance records will appear here once saved." />
                                                </td>
                                            </tr>
                                        ) : (
                                            attendanceList.map((record) => (
                                                <tr key={record.id} className={`hover:bg-gray-50/30 transition-colors group ${record.is_edited === 1 ? 'bg-amber-50/20' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{record.employee_name}</div>
                                                        <div className="text-[11px] mt-0.5 text-gray-400 flex items-center gap-2 font-medium uppercase tracking-tighter">
                                                            {record.emp_id}
                                                            {record.is_biometric && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 font-semibold text-[9px] ring-1 ring-blue-100">BIOMETRIC</span>
                                                            )}
                                                            {record.is_edited === 1 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-semibold text-[9px] ring-1 ring-amber-100 tracking-wider">EDITED</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                            {format(new Date(record.date), 'dd MMM, yyyy')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">In</div>
                                                                <div className="text-sm font-semibold text-gray-800">{record.punch_in || '--:--'}</div>
                                                            </div>
                                                            <div className="h-4 w-[1px] bg-gray-200"></div>
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Out</div>
                                                                <div className="text-sm font-semibold text-gray-800">{record.punch_out || '--:--'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap justify-center gap-1.5">
                                                            {record.permissions && record.permissions.length > 0 && record.permissions.map((p, pIdx) => (
                                                                <span key={pIdx} className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-50 text-blue-600 ring-1 ring-blue-100 whitespace-nowrap">
                                                                    PERMISSION: {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                                                                </span>
                                                            ))}
                                                            {(record.late_punch_in && record.late_punch_in !== '00:00' && record.late_punch_in !== 'undefined') ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-100 whitespace-nowrap">
                                                                    LATE IN: {record.late_punch_in}
                                                                </span>
                                                            ) : record.punch_in ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 whitespace-nowrap text-center">
                                                                    ON TIME
                                                                </span>
                                                            ) : record.status === 'Permission' ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-blue-50 text-blue-600 ring-1 ring-blue-100 whitespace-nowrap text-center">
                                                                    PERMISSION ONLY
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 whitespace-nowrap text-center">
                                                                    ON TIME
                                                                </span>
                                                            )}
                                                            {(record.early_punch_out && record.early_punch_out !== '00:00' && record.early_punch_out !== 'undefined') && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-orange-50 text-orange-600 ring-1 ring-orange-100 whitespace-nowrap">
                                                                    EARLY OUT
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-semibold text-gray-900 tabular-nums">
                                                            {record.total_hours}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-tighter">Hours</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {!record.is_biometric && (
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(record)}
                                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(record.id)}
                                                                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden divide-y divide-gray-50">
                                {fetching ? (
                                    <ListSkeleton count={5} />
                                ) : attendanceList.length === 0 ? (
                                    <EmptyState icon={User} title="History is empty" description="Attendance records will appear here once saved." />
                                ) : (
                                    attendanceList.map((record) => (
                                        <div key={record.id} className="p-5 active:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 leading-none">{record.employee_name}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                                                        {record.is_edited === 1 && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-black text-[8px] ring-1 ring-amber-100">EDITED</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-primary leading-none">{record.total_hours}</div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Hrs</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase mb-1">In</div>
                                                    <div className="text-sm font-bold text-gray-800">{record.punch_in || '--:--'}</div>
                                                </div>
                                                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                                    <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Out</div>
                                                    <div className="text-sm font-bold text-gray-800">{record.punch_out || '--:--'}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {record.permissions && record.permissions.length > 0 && record.permissions.map((p, pIdx) => (
                                                    <span key={pIdx} className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                                        PERMISSION: {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                                                    </span>
                                                ))}
                                                {(record.late_punch_in && record.late_punch_in !== '00:00') ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-rose-50 text-rose-600 ring-1 ring-rose-100">LATE: {record.late_punch_in}</span>
                                                ) : record.punch_in ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 uppercase tracking-tighter">On Time In</span>
                                                ) : record.status === 'Permission' ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 ring-1 ring-blue-100 uppercase tracking-tighter">Permission Only</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 uppercase tracking-tighter">On Time In</span>
                                                )}
                                                {(record.early_punch_out && record.early_punch_out !== '00:00') && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-orange-50 text-orange-600 ring-1 ring-orange-100">EARLY OUT</span>
                                                )}
                                            </div>
                                            {!record.is_biometric && (
                                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all"
                                                    >
                                                        <Edit2 size={16} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(record.id)}
                                                        className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold flex items-center justify-center hover:bg-rose-100 active:scale-95 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
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
