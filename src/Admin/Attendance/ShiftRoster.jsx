import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    Users,
    Clock,
    Search,
    Check,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getShiftRosterApi,
    assignShiftApi,
    bulkAssignShiftsApi,
    getOrgMetadataApi,
    getUsersApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday } from 'date-fns';
import { FormDate, SearchableSelect } from '../../Common/Form';
import MultiSelectDropdown from '../../Common/MultiSelectDropdown';
import Pagination from '../../Common/Pagination';

const ShiftRoster = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rosterData, setRosterData] = useState([]);
    const [users, setUsers] = useState([]);
    const [metadata, setMetadata] = useState({ departments: [], shifts: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        department: '',
        search: ''
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filters.department]);

    // Modals
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(null); // { user, date }

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [filters.department, page, pageSize, debouncedSearch]);

    useEffect(() => {
        fetchRoster();
    }, [currentDate, filters.department]);

    const fetchMetadata = async () => {
        try {
            const res = await getOrgMetadataApi();
            setMetadata(res.data);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await getUsersApi({
                department: filters.department,
                search: debouncedSearch,
                page: page,
                limit: pageSize
            });
            setUsers(res.data.users || []);
            setTotal(res.data.total || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchRoster = async () => {
        setIsLoading(true);
        try {
            const start = format(weekDays[0], 'yyyy-MM-dd');
            const end = format(weekDays[6], 'yyyy-MM-dd');
            const res = await getShiftRosterApi({
                start_date: start,
                end_date: end,
                department: filters.department
            });
            setRosterData(res.data);
        } catch (error) {
            toast.error('Failed to load roster');
        } finally {
            setIsLoading(false);
        }
    };

    const getAssignment = (userId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return rosterData.find(r => r.user_id === userId && r.roster_date === dateStr);
    };

    const handleAssignShift = async (userId, shiftId, date) => {
        setIsSaving(true);
        try {
            await assignShiftApi({
                user_id: userId,
                shift_id: shiftId,
                roster_date: format(date, 'yyyy-MM-dd')
            });
            fetchRoster();
            setShowAssignModal(null);
            toast.success('Shift assigned');
        } catch (error) {
            toast.error('Failed to assign shift');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-2 min-h-full bg-[#f8fafc]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <CalendarDays className="text-primary w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Shift Roster</h1>
                            <p className="text-sm font-medium text-gray-500">Dynamic Workforce Scheduling</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium shadow-sm shadow-primary/20 hover:bg-primary-hover transition-all"
                    >
                        <Plus size={20} />
                        Bulk Assignment
                    </button>
                </div>
            </div>

            {/* Controls & Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
                {/* Date Navigator */}
                <div className="flex-1 min-w-[300px] md:flex-none md:w-[320px] rounded-[20px] flex items-center justify-between">
                    <button
                        onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                        className="p-2 bg-white rounded-xl transition-all text-primary active:scale-95 border border-gray-100"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-1">
                            {format(weekDays[0], 'MMM dd')} - {format(weekDays[6], 'MMM dd')}
                        </span>
                        <span className="text-[16px] font-semibold text-gray-900 tracking-tight block leading-none">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                    </div>
                    <button
                        onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                        className="p-2 bg-white rounded-xl transition-all text-primary active:scale-95 border border-gray-100"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Department Selector */}
                <div className="flex-1 min-w-[200px] md:flex-none md:w-[250px]">
                    <SearchableSelect
                        placeholder="All Departments"
                        value={filters.department}
                        onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                        options={metadata.departments.map(d => ({ label: d.name, value: d.id }))}
                        className="w-full !space-y-0"
                    />
                </div>

                {/* Search Bar */}
                <div className="flex-1 min-w-[280px] relative group h-[46px]">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <Search size={18} strokeWidth={2} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full h-full pl-13 pr-6 bg-white border border-gray-200 rounded-full text-[15px] font-medium text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
            </div>

            {/* Roster Grid */}
            <div className="bg-white rounded-[15px] border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden relative min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="sticky left-0 z-20 bg-gray-50/50 border-r border-gray-100 p-4 text-left min-w-[280px]">
                                    <span className="text-[16px] font-semibold text-gray-800">Employee Insights</span>
                                </th>
                                {weekDays.map((day, idx) => (
                                    <th key={idx} className="p-4 text-center border-r border-gray-100 last:border-0 min-w-[140px]">
                                        <span className={`text-[14px] font-semibold block mb-2 ${isToday(day) ? 'text-primary' : 'text-gray-400'}`}>
                                            {format(day, 'EEEE')}
                                        </span>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-[14px] ${isToday(day) ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Roster...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-semibold text-lg">No staff matching criteria</p>
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50/50 border-r border-gray-100 p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0 border border-primary/5">
                                            {user.employee_name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{user.employee_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user.emp_id}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="text-[10px] font-semibold text-primary truncate max-w-[100px]">{user.department_name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {weekDays.map((day, idx) => {
                                        const assignment = getAssignment(user.id, day);
                                        return (
                                            <td key={idx} className="p-3 border-r border-gray-100 last:border-0 align-middle">
                                                <div
                                                    onClick={() => setShowAssignModal({ user, day })}
                                                    className={`
                                                        group/cell relative cursor-pointer min-h-[64px] rounded-2xl flex flex-col items-center justify-center transition-all duration-300
                                                        ${assignment
                                                            ? 'bg-primary/5 border border-primary/10 hover:bg-primary/10'
                                                            : 'bg-white border-2 border-dashed border-gray-100 hover:border-primary/20 hover:bg-gray-50/50'}
                                                    `}
                                                >
                                                    {assignment ? (
                                                        <>
                                                            <span className="text-[13px] font-semibold text-primary/80 truncate w-full text-center px-2">
                                                                {assignment.shift_name}
                                                            </span>
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-gray-600">
                                                                <Clock size={10} />
                                                                <span>{assignment.start_time?.slice(0, 5)} - {assignment.end_time?.slice(0, 5)}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Plus className="w-6 h-6 text-gray-200 group-hover/cell:text-primary transition-colors" />
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={(p) => setPage(p)}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                    showingCount={users.length}
                />
            </div>

            {/* Individual Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAssignModal(null)}
                            className="absolute inset-0"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[15px] w-full max-w-md relative z-10 shadow-2xl border border-white/20 p-6"
                        >
                            <div className="relative mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Assign Shift</h3>
                                <p className="text-gray-500 font-medium text-sm mt-1">
                                    {showAssignModal.user.employee_name} • {format(showAssignModal.day, 'EEEE, MMM dd')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {metadata.shifts.map((shift) => (
                                    <button
                                        key={shift.id}
                                        onClick={() => handleAssignShift(showAssignModal.user.id, shift.id, showAssignModal.day)}
                                        className="w-full p-3 rounded-xl border border-gray-200 hover:border-primary/20 hover:bg-gray-50 transition-all text-left flex items-center justify-between group"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-800">{shift.name}</p>
                                            <p className="text-xs font-semibold text-gray-400 mt-1">{shift.start_time} - {shift.end_time}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                            <Check size={20} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => setShowAssignModal(null)}
                                    className="w-full py-4 text-[15px] font-semibold text-gray-600 hover:text-gray-600 transition-colors"
                                >
                                    Dismiss Selection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Assign Modal */}
            <BulkAssignModal
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                users={users}
                metadata={metadata}
                onSuccess={() => {
                    fetchRoster();
                    setShowBulkModal(false);
                }}
            />
        </div>
    );
};

const BulkAssignModal = ({ isOpen, onClose, users, metadata, onSuccess }) => {
    const [formData, setFormData] = useState({
        user_ids: [],
        shift_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd')
    });
    const [allUsers, setAllUsers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAllUsers();
        }
    }, [isOpen]);

    const fetchAllUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await getUsersApi({ limit: 500 }); // Fetch all or a large number
            setAllUsers(res.data.users || []);
        } catch (error) {
            console.error('Error fetching personnel:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.user_ids.length || !formData.shift_id) {
            return toast.error('Please select employees and a shift');
        }

        setIsSaving(true);
        try {
            await bulkAssignShiftsApi(formData);
            toast.success('Bulk schedule updated successfully');
            onSuccess();
        } catch (error) {
            toast.error('Bulk assignment failed');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-gray-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-[15px] w-full max-w-2xl relative z-10 shadow-2xl border border-white/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Mass Assignment</h3>
                                <p className="text-gray-600 font-semibold text-[13px] mt-1">Configure multi-user schedule</p>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                <FormDate
                                    label="Effective Range (From)"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))}
                                    placeholderText="Select start date"
                                />
                                <FormDate
                                    label="Effective Range (To)"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData(f => ({ ...f, end_date: e.target.value }))}
                                    placeholderText="Select end date"
                                />
                            </div>

                            <div className="mb-4">
                                <SearchableSelect
                                    label="Designated Shift"
                                    value={formData.shift_id}
                                    onChange={(e) => setFormData(f => ({ ...f, shift_id: e.target.value }))}
                                    options={metadata.shifts.map(s => ({
                                        label: `${s.name} (${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)})`,
                                        value: s.id
                                    }))}
                                    placeholder="Select a shift..."
                                />
                            </div>

                            <div>
                                <MultiSelectDropdown
                                    label="Personnel"
                                    items={allUsers.map(u => ({ label: `${u.employee_name} (${u.emp_id})`, id: u.id }))}
                                    selectedItems={formData.user_ids}
                                    onChange={(selectedIds) => setFormData(f => ({ ...f, user_ids: selectedIds }))}
                                    placeholder={isLoadingUsers ? "Loading staff..." : "Type to search personnel..."}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-2.5 bg-primary text-white rounded-full font-medium text-lg shadow-sm shadow-primary/25 hover:bg-primary-hover transition-all disabled:opacity-75 flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <CalendarIcon size={22} />}
                                Apply Mass Schedule
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShiftRoster;
