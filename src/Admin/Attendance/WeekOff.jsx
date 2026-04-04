import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, Trash2, Plus, Loader2, RefreshCcw, Building2, Check, X, Search, Info, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeekOffsApi, createWeekOffApi, deleteWeekOffApi, getUsersApi, getCompanyWeekOffsApi, saveCompanyWeekOffsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormSelect } from '../../Common/Form';
import PageWithStatsSkeleton from '../../Common/CommonSkeletonLoader/PageWithStatsSkeleton';
import TableSkeleton from '../../Common/CommonSkeletonLoader/TableSkeleton';
import ListSkeleton from '../../Common/CommonSkeletonLoader/ListSkeleton';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

export default function WeekOff() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [savingCompany, setSavingCompany] = useState(false);
    const [weekOffs, setWeekOffs] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companyDays, setCompanyDays] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        userid: '',
        weekoffdate: new Date().toISOString().split('T')[0],
        alternative_date: ''
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setFetching(true);
            const [woRes, usersRes, companyWoRes] = await Promise.all([
                getWeekOffsApi(),
                userRole !== 'employee' ? getUsersApi({ limit: 1000 }) : Promise.resolve({ data: { users: [] } }),
                companyId ? getCompanyWeekOffsApi({ company_id: companyId }) : Promise.resolve({ data: [] })
            ]);

            // Filter week offs for employees to only show their own
            if (userRole === 'employee') {
                const myWeekOffs = woRes.data.filter(wo => String(wo.userid) === String(userInfo.id));
                setWeekOffs(myWeekOffs);
            } else {
                setWeekOffs(woRes.data);
            }

            setEmployees(usersRes.data.users || []);
            setCompanyDays(companyWoRes.data.map(d => d.day_name));
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setFetching(false);
        }
    };

    const handleCompanyDayToggle = (day) => {
        setCompanyDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSaveCompanyWeekOff = async () => {
        if (!companyId || companyId === 'null' || companyId === 'undefined') {
            return toast.error('Valid Company ID not found. Please log out and log in again.');
        }
        setSavingCompany(true);
        try {
            await saveCompanyWeekOffsApi({
                company_id: companyId,
                days: companyDays
            });
            toast.success('Company week offs updated successfully');
        } catch (error) {
            toast.error('Failed to update company week offs');
        } finally {
            setSavingCompany(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.userid) return toast.error('Please select an employee');

        setLoading(true);
        try {
            await createWeekOffApi({
                ...formData
            });
            toast.success('Week off assigned successfully');
            fetchData();
            setFormData({
                userid: '',
                weekoffdate: new Date().toISOString().split('T')[0],
                alternative_date: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign week off');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await deleteWeekOffApi(deletingId);
            toast.success('Deleted successfully');
            fetchData();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    };
    
    const isDatePast = (dateStr) => {
        if (!dateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = dateStr.split('-').map(Number);
        const compareDate = new Date(year, month - 1, day);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate < today;
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div className="min-h-screen bg-transparent md:p-4 p-3 max-w-7xl mx-auto pb-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between md:gap-4 gap-2 md:mb-8 mb-4">
                <div className="flex items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Calendar size={24} />
                            </div>
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
                                {userRole === 'employee' ? 'My Week Off Schedule' : 'Week Off Management'}
                            </h2>
                        </div>
                        <p className="text-gray-500 text-sm md:text-[14px] font-medium ml-1">
                            {userRole === 'employee'
                                ? 'View your company-wide and personalized week-off allottments.'
                                : 'Define common week-offs and specific exceptions.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="self-end md:self-auto p-2.5 text-gray-400 hover:text-primary transition-all bg-white rounded-xl border border-gray-200 active:scale-95"
                >
                    <RefreshCcw size={20} className={fetching ? 'animate-spin' : ''} />
                </button>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-6"
            >
                {/* Company Week Off Section */}
                <div className="bg-white md:p-6 p-4 md:rounded-[15px] rounded-xl border border-gray-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Building2 size={120} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/5">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">Company Policy</h3>
                                <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Global organization settings</p>
                            </div>
                        </div>
                        {(userRole === 'admin' || userRole === 'superadmin') && (
                            <button
                                onClick={handleSaveCompanyWeekOff}
                                disabled={savingCompany || fetching}
                                className="flex items-center justify-center gap-2 md:px-4 px-4 md:py-2 py-2.5 bg-primary text-white rounded-full font-medium transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:bg-primary-hover active:scale-95 disabled:opacity-50"
                            >
                                {savingCompany ? <Loader2 size={18} className="animate-spin" /> : <Check size={20} className="stroke-[3]" />}
                                Save Policy Changes
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 relative z-10">
                        {days.map(day => {
                            const isActive = companyDays.includes(day);
                            return (
                                <button
                                    key={day}
                                    onClick={() => (userRole !== 'employee') && handleCompanyDayToggle(day)}
                                    className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-[13px] border-1 transition-all group/btn ${isActive
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-200'
                                        } ${userRole === 'employee' ? 'cursor-default' : ''}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary text-white scale-110' : 'bg-gray-100'
                                        }`}>
                                        <Check size={14} className={`stroke-[4] ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                    <span className="text-[13px] font-black uppercase tracking-tight">{day.substring(0, 3)}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex items-start gap-3 md:p-5 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/100">
                        <div className="text-amber-600 mt-0.5 bg-amber-100 p-1.5 rounded-lg"><Info size={18} /></div>
                        <p className="text-[11px] md:text-sm text-amber-900/80 font-medium leading-relaxed">
                            <span className="font-semibold text-amber-900 text-[15px] block mb-0">
                                {userRole === 'employee' ? 'Understanding your schedule' : 'Policy Overview'}
                            </span>
                            {userRole === 'employee'
                                ? "The highlighted days are standard company-wide week-offs. If your schedule differs, specific exceptions will be listed in the table below."
                                : "Selected days will automatically apply to all employees as global defaults unless an exception rule is defined below for individuals."}
                        </p>
                    </div>
                </div>

                {fetching ? (
                    <PageWithStatsSkeleton statsCount={5} rows={6} columns={4} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Section - Hidden for employees */}
                        {userRole !== 'employee' && (
                            <div className="lg:col-span-1">
                                <div className="bg-white md:p-6 p-4 md:rounded-[15px] rounded-xl border border-gray-200 sticky top-4">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Add Exception</h3>
                                            <p className="text-xs text-gray-400 font-medium">Individual user settings</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <FormSelect
                                            label="Select Employee"
                                            name="userid"
                                            value={formData.userid}
                                            onChange={handleChange}
                                            icon={User}
                                            options={employees.map(e => ({ value: e.id, label: `${e.employee_name} (${e.emp_id})` }))}
                                            placeholder="Choose an employee..."
                                        />

                                        <div className="space-y-2">
                                            <label className="text-[14px] font-semibold text-gray-600 ml-1">
                                                Exception Date
                                            </label>
                                            <div className="relative group mt-2">
                                                <DatePicker
                                                    selected={formData.weekoffdate ? new Date(formData.weekoffdate) : null}
                                                    onChange={(date) => setFormData(prev => ({ ...prev, weekoffdate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                    showYearDropdown
                                                    showMonthDropdown
                                                    dropdownMode="select"
                                                    dateFormat="dd-MM-yyyy"
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-semibold text-gray-700 md:text-sm text-xs cursor-pointer"
                                                    portalId="root"
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[14px] font-semibold text-gray-600 ml-1 flex items-center gap-2">
                                                Alternative Date <span className="text-[9px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded">Optional</span>
                                            </label>
                                            <div className="relative group mt-2">
                                                <DatePicker
                                                    selected={formData.alternative_date ? new Date(formData.alternative_date) : null}
                                                    onChange={(date) => setFormData(prev => ({ ...prev, alternative_date: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                                    showYearDropdown
                                                    showMonthDropdown
                                                    dropdownMode="select"
                                                    dateFormat="dd-MM-yyyy"
                                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-semibold text-gray-700 md:text-sm text-xs cursor-pointer"
                                                    portalId="root"
                                                    placeholderText="dd-mm-yyyy"
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 px-1 font-medium italic">
                                                * The specific day assigned as a compensatory off.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-3 md:py-2 py-3 bg-emerald-600 text-white rounded-full font-medium transition-all shadow-lg shadow-emerald-500/5 hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} className="stroke-[3]" />}
                                            Create Rule
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* List Section */}
                        <div className={userRole === 'employee' ? "lg:col-span-3" : "lg:col-span-2"}>
                            <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
                                <div className="md:px-6 px-4 md:py-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-xl tracking-tight">
                                            {userRole === 'employee' ? 'My Exceptions & Compensatory Offs' : 'Active Exceptions'}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                                            {userRole === 'employee' ? 'Special week-off rules assigned to you' : 'Individual employee rules'}
                                        </p>
                                    </div>
                                    <span className="bg-white border border-gray-200 text-primary text-[11px] px-3 py-1 rounded-full font-black">{weekOffs.length}</span>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#fcfdff] border-b border-gray-50">
                                            <tr>
                                                <th className="px-8 py-4 text-[12px] font-semibold text-gray-800 uppercase tracking-widest">
                                                    {userRole === 'employee' ? 'Allocated Rule' : 'Employee'}
                                                </th>
                                                <th className="px-8 py-4 text-[12px] font-semibold text-gray-800 uppercase tracking-widest text-center">Dates</th>
                                                {userRole !== 'employee' && (
                                                    <th className="px-8 py-4 text-[12px] font-semibold text-gray-800 uppercase tracking-widest text-right">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50/50">
                                            {fetching ? (
                                                <TableSkeleton rows={5} columns={2} />
                                            ) : weekOffs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={userRole === 'employee' ? "2" : "3"}>
                                                        <EmptyState
                                                            icon={Calendar}
                                                            title={userRole === 'employee' ? "No custom exceptions" : "No custom rules"}
                                                            description={userRole === 'employee' ? "Your schedule follows the standard company policy above." : "Create an exception using the form on the left."}
                                                        />
                                                    </td>
                                                </tr>
                                            ) : (
                                                weekOffs.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/30 transition-all group">
                                                        <td className="px-8 py-5">
                                                            <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                                                {userRole === 'employee' ? 'Individual Exception' : item.employee_name}
                                                            </div>
                                                            {item.emp_id && (
                                                                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">ID: {item.emp_id}</div>
                                                            )}
                                                        </td>

                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center justify-center gap-6">
                                                                <div className="text-center">
                                                                    <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Off Date</div>
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-100 px-3 py-1.5 rounded-lg">
                                                                        <Calendar size={14} className="text-primary" />
                                                                        {item.weekoffdate}
                                                                    </div>
                                                                </div>
                                                                <div className="h-4 w-[1px] bg-gray-200 mt-4"></div>
                                                                <div className="text-center">
                                                                    <div className="text-[9px] font-black text-gray-600 uppercase mb-1">Alternative</div>
                                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 px-3 py-1.5 rounded-lg min-w-[120px] justify-center">
                                                                        {item.alternative_date ? (
                                                                            <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg w-full">
                                                                                <Check size={14} className="stroke-[3]" />
                                                                                {item.alternative_date}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-300 font-medium italic">Not set</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {userRole !== 'employee' && (
                                                            <td className="px-8 py-5 text-right">
                                                                <button
                                                                    onClick={() => !isDatePast(item.weekoffdate) && handleDeleteClick(item.id)}
                                                                    disabled={isDatePast(item.weekoffdate)}
                                                                    className={`p-2.5 rounded-xl transition-all ${isDatePast(item.weekoffdate) 
                                                                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                                                                        : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90'
                                                                    }`}
                                                                    title={isDatePast(item.weekoffdate) ? "Past exceptions cannot be deleted" : "Delete Exception"}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card List */}
                                <div className="md:hidden divide-y divide-gray-50">
                                    {fetching ? (
                                        <ListSkeleton count={5} />
                                    ) : weekOffs.length === 0 ? (
                                        <EmptyState
                                            icon={Calendar}
                                            title={userRole === 'employee' ? "No custom exceptions" : "No custom rules"}
                                            description={userRole === 'employee' ? "Your schedule follows the standard company policy above." : "Create an exception using the form on the left."}
                                        />
                                    ) : (
                                        weekOffs.map((item) => (
                                            <div key={item.id} className="p-5 active:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">
                                                            {userRole === 'employee' ? 'Allocated Exception' : item.employee_name}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 font-semibold uppercase mt-1">ID: {item.emp_id}</p>
                                                    </div>
                                                    {userRole !== 'employee' && (
                                                        <button
                                                            onClick={() => !isDatePast(item.weekoffdate) && handleDeleteClick(item.id)}
                                                            disabled={isDatePast(item.weekoffdate)}
                                                            className={`p-2.5 rounded-xl transition-all ${isDatePast(item.weekoffdate)
                                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                                : 'bg-rose-50 text-rose-500 active:scale-90'
                                                            }`}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Off Date</div>
                                                            <div className="text-sm font-bold text-gray-800">{item.weekoffdate}</div>
                                                        </div>
                                                        <Calendar size={18} className="text-primary opacity-20" />
                                                    </div>
                                                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${item.alternative_date ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-gray-50/30 border-gray-100 text-gray-300'
                                                        }`}>
                                                        <div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Alternative Comp Off</div>
                                                            <div className="text-sm font-bold">{item.alternative_date || 'None Assigned'}</div>
                                                        </div>
                                                        {item.alternative_date && <Check size={18} className="opacity-40 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Remove Exception"
                message="This custom week-off rule will be permanently deleted. Are you sure you want to proceed?"
                confirmText="Yes, Remove Rule"
                cancelText="Keep Rule"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
}

// Subcomponent for cleaner code
function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="px-6 py-32 text-center flex flex-col items-center justify-center w-full">
            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 mx-auto mb-6 ring-8 ring-gray-50/50">
                <Icon size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-xs mx-auto font-medium text-sm">{description}</p>
        </div>
    );
}
