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
import TableSkeleton from '../../Common/CommonSkeletonLoader/TableSkeleton';
import SearchableSelect from '../../Common/Form/SearchableSelect';
import ConfirmationModal from '../../Common/ConfirmationModal';

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

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        user_id: '',
        payroll_date: new Date(),
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchIncentives();
        fetchUsers();
    }, []);

    const fetchIncentives = async () => {
        setLoading(true);
        try {
            const res = await getPayrollIncentivesApi({ company_id: companyId });
            setIncentives(res.data);
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
                description: ''
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

    const filteredIncentives = incentives.filter(inc =>
        (inc.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inc.emp_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Payroll Month</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <TableSkeleton rows={5} columns={5} />
                            ) : filteredIncentives.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center text-gray-400">
                                            <CircleDollarSign size={48} className="mb-4 opacity-20" />
                                            <p className="font-semibold text-gray-500">No incentives found</p>
                                            <p className="text-[12px]">Add incentives to see them here</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredIncentives.map((inc) => (
                                    <tr key={inc.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-semibold text-gray-900">{inc.employee_name}</span>
                                                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{inc.emp_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-medium text-gray-600 flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {format(new Date(inc.payroll_date), 'MMM, yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[14px] font-semibold text-emerald-600">
                                                ₹{parseFloat(inc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] text-gray-500 italic max-w-xs truncate block">
                                                {inc.description || 'No description'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteClick(inc.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
