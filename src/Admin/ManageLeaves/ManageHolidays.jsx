import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Calendar,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Palmtree,
    Loader2,
    X,
    CheckCircle2
} from 'lucide-react';
import { HolidaySkeleton } from '../../Common/CommonSkeletonLoader/LeaveSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isFuture, isToday, parseISO } from 'date-fns';
import { getHolidaysApi, createHolidayApi, updateHolidayApi, deleteHolidayApi, getCompaniesApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect, FormDate, FormTextarea } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';

const HolidayCard = ({ holiday, onEdit, onDelete, userRole }) => {
    const holidayDate = parseISO(holiday.date);
    const isUpcoming = isFuture(holidayDate) || isToday(holidayDate);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-xs ${isUpcoming ? 'border-primary/10 hover:border-primary/30' : 'border-gray-100 opacity-75'
                }`}
        >
            <div className="p-5 flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isUpcoming ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{format(holidayDate, 'MMM')}</span>
                    <span className="text-xl font-bold leading-none">{format(holidayDate, 'dd')}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{holiday.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${holiday.type === 'National' ? 'bg-indigo-50 text-indigo-500' :
                            holiday.type === 'Restricted' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                            }`}>
                            {holiday.type}
                        </span>
                    </div>
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                        {holiday.description || 'No description provided.'}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {format(holidayDate, 'EEEE')}
                        </span>
                        {holiday.company_name && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-primary/70">{holiday.company_name}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {userRole !== 'employee' && (
                        <>
                            <button
                                onClick={() => onEdit(holiday)}
                                className="p-2 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-xl transition-all"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(holiday.id)}
                                className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default function ManageHolidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [userInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'National',
        description: '',
        company_id: userInfo.database === 'hrm_database' ? '' : userInfo.company_id
    });

    useEffect(() => {
        fetchHolidays();
        if (userInfo.database === 'hrm_database') {
            fetchCompanies();
        }
    }, [selectedYear]);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const params = { year: selectedYear };
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

    const fetchCompanies = async () => {
        try {
            const res = await getCompaniesApi();
            setCompanies(res.data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (userInfo.database !== 'hrm_database') {
                data.company_id = userInfo.company_id;
            }
            if (editingHoliday) {
                await updateHolidayApi(editingHoliday.id, data);
                toast.success('Holiday updated successfully');
            } else {
                await createHolidayApi(data);
                toast.success('Holiday added successfully');
            }
            setShowModal(false);
            setEditingHoliday(null);
            setFormData({
                name: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'National',
                description: '',
                company_id: userInfo.database === 'hrm_database' ? '' : userInfo.company_id
            });
            fetchHolidays();
        } catch (error) {
            console.error('Error saving holiday:', error);
            toast.error(error.response?.data?.message || 'Failed to save holiday');
        }
    };

    const handleDeleteClick = (id) => {
        setHolidayToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!holidayToDelete) return;

        try {
            setIsDeleting(true);
            const params = {};
            if (userInfo.database !== 'hrm_database') {
                params.company_id = userInfo.company_id;
            }
            await deleteHolidayApi(holidayToDelete, params);
            toast.success('Holiday deleted successfully');
            fetchHolidays();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting holiday:', error);
            toast.error('Failed to delete holiday');
        } finally {
            setIsDeleting(false);
            setHolidayToDelete(null);
        }
    };

    const filteredHolidays = useMemo(() => {
        return holidays.filter(h =>
            h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [holidays, searchTerm]);

    const stats = useMemo(() => {
        const upcoming = holidays.filter(h => isFuture(parseISO(h.date)) || isToday(parseISO(h.date))).length;
        const past = holidays.length - upcoming;
        return { total: holidays.length, upcoming, past };
    }, [holidays]);

    if (loading && holidays.length === 0) return <HolidaySkeleton />;

    return (
        <div className="p-4 bg-gray-50/50 min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Manage Holidays</h2>
                    <p className="text-gray-500 font-medium text-[14px]">Set and manage your organizational holidays for {selectedYear}</p>
                </div>
                {userInfo.role !== 'employee' && (
                    <button
                        onClick={() => {
                            setEditingHoliday(null);
                            setFormData({
                                name: '',
                                date: format(new Date(), 'yyyy-MM-dd'),
                                type: 'National',
                                description: '',
                                company_id: userInfo.database === 'hrm_database' ? '' : userInfo.company_id
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                    >
                        <Plus size={20} />
                        <span>Add Holiday</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Holidays', value: stats.total, icon: Palmtree, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Past Holidays', value: stats.past, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-[15px] border border-gray-200 flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-gray-800 leading-tight mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-medium text-gray-900">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" size={18} />
                    <input
                        type="text"
                        placeholder="Search holidays by name or type..."
                        className="w-full px-9 py-2.5 rounded-full border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-[#fff]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setSelectedYear(y => y - 1)}
                        className="p-1.5 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg transition-all text-gray-400"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex flex-col items-center px-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Year</span>
                        <div className="text-[15px] font-bold text-gray-800 tracking-wider">
                            {selectedYear}
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedYear(y => y + 1)}
                        className="p-1.5 hover:bg-white hover:text-primary hover:shadow-sm rounded-lg transition-all text-gray-400"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            {filteredHolidays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredHolidays.map((holiday) => (
                            <HolidayCard
                                key={holiday.id}
                                holiday={holiday}
                                userRole={userInfo.role}
                                onEdit={(h) => {
                                    setEditingHoliday(h);
                                    setFormData({
                                        name: h.name,
                                        date: format(parseISO(h.date), 'yyyy-MM-dd'),
                                        type: h.type,
                                        description: h.description || '',
                                        company_id: h.company_id || ''
                                    });
                                    setShowModal(true);
                                }}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white rounded-[20px] border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-18 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                        <Palmtree size={40} />
                    </div>
                    <h4 className="text-2xl font-semibold text-gray-900 mb-2">No Holidays Found</h4>
                    <p className="text-gray-500 max-w-xs text-[14px]">There are no holidays scheduled for this period. Click 'Add Holiday' to get started.</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[12px] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h3>
                                    <p className="text-[13px] text-gray-500 font-medium">Define holiday details for all staff</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-4 space-y-6">
                                {userInfo.database === 'hrm_database' && (
                                    <FormSelect
                                        label="Assign to Company"
                                        value={formData.company_id}
                                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                        options={companies.map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Global Holiday (All Companies)"
                                    />
                                )}

                                <FormInput
                                    label="Holiday Name"
                                    required
                                    placeholder="e.g. Independence Day"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormDate
                                        label="Date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                    <FormSelect
                                        label="Type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        options={[
                                            { value: 'National', label: 'National' },
                                            { value: 'Restricted', label: 'Restricted' },
                                            { value: 'Company Specific', label: 'Company Specific' }
                                        ]}
                                        placeholder={null}
                                    />
                                </div>

                                <FormTextarea
                                    label="Description (Optional)"
                                    placeholder="Brief details about the holiday..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 h-12 rounded-full text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 h-12 bg-primary text-white rounded-full font-[400] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {editingHoliday ? 'Update' : 'Save'} Holiday
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Holiday"
                message="Are you sure you want to delete this holiday? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
}