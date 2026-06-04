import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Trash2,
    Search,
    Calendar,
    User,
    CircleDollarSign,
    Loader2,
    FileText
} from 'lucide-react';
import {
    getPayrollIncentivesApi,
    createPayrollIncentiveApi,
    deletePayrollIncentiveApi,
    getUsersApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import SearchableSelect from '../../Common/Form/SearchableSelect';
import ConfirmationModal from '../../Common/ConfirmationModal';
import DataTable from '../../Common/DataTable';
import Tooltip from '../../Common/Tooltip';

export default function Addons() {
    const [incentives, setIncentives] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        user_id: '',
        payroll_date: new Date(),
        amount: '',
        description: '',
        type: 'addition'
    });

    // Debounce search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchIncentives();
    }, [pagination.current, pagination.pageSize, debouncedSearchTerm]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchIncentives = async () => {
        setLoading(true);
        try {
            const res = await getPayrollIncentivesApi({
                company_id: companyId,
                page: pagination.current,
                limit: pagination.pageSize,
                search: debouncedSearchTerm
            });
            if (res.data && typeof res.data.total !== 'undefined') {
                setIncentives(res.data.data);
                setPagination(prev => ({ ...prev, total: res.data.total }));
            } else {
                setIncentives(res.data);
                setPagination(prev => ({ ...prev, total: res.data.length }));
            }
        } catch (error) {
            toast.error('Failed to fetch incentives');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await getUsersApi({ company_id: companyId, limit: 1000 });
            setUsers(res.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.user_id || !formData.amount || !formData.payroll_date) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await createPayrollIncentiveApi({
                ...formData,
                payroll_date: format(formData.payroll_date, 'yyyy-MM-dd')
            });
            toast.success('Incentive added successfully');
            setIsModalOpen(false);
            setFormData({
                user_id: '',
                payroll_date: new Date(),
                amount: '',
                description: '',
                type: 'addition'
            });
            fetchIncentives();
        } catch (error) {
            toast.error('Failed to add incentive');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            await deletePayrollIncentiveApi(itemToDelete);
            toast.success('Incentive deleted successfully');
            fetchIncentives();
        } catch (error) {
            toast.error('Failed to delete incentive');
        } finally {
            setDeleting(false);
            setIsConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const columns = [
        {
            header: 'Employee',
            key: 'employee',
            render: (_, row) => (
                <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-gray-900">{row.employee_name}</span>
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{row.emp_id}</span>
                </div>
            )
        },
        {
            header: 'Payroll Month',
            key: 'payroll_date',
            render: (_, row) => (
                <span className="text-[13px] font-medium text-gray-600 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {format(new Date(row.payroll_date), 'MMM, yyyy')}
                </span>
            )
        },
        {
            header: 'Amount',
            key: 'amount',
            align: 'right',
            render: (_, row) => (
                <span className={`text-[14px] font-semibold ${row.type === 'deduction' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {row.type === 'deduction' ? '-' : ''}₹{parseFloat(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'Description',
            key: 'description',
            render: (_, row) => (
                <span className="text-[13px] text-gray-500 italic max-w-xs truncate block">
                    {row.description || 'No description'}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full md:w-80"
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium text-[13px] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    Add New Incentive
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <DataTable
                    columns={columns}
                    data={incentives}
                    isLoading={loading}
                    extraActions={(row) => (
                        <Tooltip position="left" text={row.is_payroll_run ? "Payroll already run for this month" : "Delete"}>
                            <button
                                onClick={() => !row.is_payroll_run && handleDeleteClick(row.id)}
                                disabled={row.is_payroll_run}
                                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${row.is_payroll_run
                                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                        : 'text-rose-500 hover:bg-rose-50'
                                    }`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </Tooltip>
                    )}
                    emptyMessage="No incentives found"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        onChange: (page) => setPagination(prev => ({ ...prev, current: page })),
                        onPageSizeChange: (size) => setPagination(prev => ({ ...prev, pageSize: size, current: 1 }))
                    }}
                />
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Incentive</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <SearchableSelect
                                    label="Select Employee"
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    options={users.map(u => ({
                                        value: u.id,
                                        label: `${u.employee_name} (${u.emp_id})`
                                    }))}
                                    placeholder="Choose an employee"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payroll Month</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={formData.payroll_date}
                                        onChange={(date) => setFormData({ ...formData, payroll_date: date })}
                                        dateFormat="MMMM, yyyy"
                                        showMonthYearPicker
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full"
                                    />
                                    <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    <option value="addition">Addition (Incentive)</option>
                                    <option value="deduction">Deduction</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    placeholder="Add description..."
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full font-semibold text-[13px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-8 py-2.5 bg-primary text-white rounded-full font-medium text-[13px] shadow-sm shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Add Incentive
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Incentive"
                message="Are you sure you want to delete this incentive? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                loading={deleting}
            />
        </div>
    );
}
