import { useState, useEffect, useMemo } from 'react';
import {
    Wallet, Receipt, Clock, CheckCircle, Search, Filter,
    Plus, Loader2, X, Eye, Calendar,
    Upload, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import DataTable from '../../Common/DataTable';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { FormInput, FormSelect, FormTextarea, FormDate } from '../../Common/Form';
import {
    getReimbursementsApi,
    getReimbursementCategoriesApi,
    createReimbursementApi,
    updateReimbursementStatusApi,
    deleteReimbursementApi
} from '../../Action/api';
import PageWithStatsSkeleton from '../../Common/CommonSkeletonLoader/PageWithStatsSkeleton';

const DEFAULT_CATEGORIES = [
    'Travel',
    'Meals',
    'Accommodation',
    'Office Supplies',
    'Medical',
    'Telecommunication',
    'Others'
];

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Paid'];

export default function ReimbursementClaims() {
    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;

    // State
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Status Update State (Admin)
    const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });

    useEffect(() => {
        fetchClaims();
        fetchCategories();
    }, [filterStatus]);

    const fetchCategories = async () => {
        try {
            const res = await getReimbursementCategoriesApi();
            const dbCategories = res.data || [];
            // Merge defaults with DB categories and remove duplicates
            const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories]));
            setCategories(allCategories);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus !== 'All') params.status = filterStatus;

            const res = await getReimbursementsApi(params);
            setClaims(res.data || []);
        } catch (error) {
            console.error('Failed to fetch claims', error);
            toast.error('Failed to load reimbursement claims');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const categoryToSubmit = isAddingNewCategory ? newCategory : formData.category;
        if (!categoryToSubmit || !formData.amount || !formData.title) {
            return toast.error('Please fill all required fields');
        }

        const submitData = { ...formData };
        if (isAddingNewCategory && newCategory) {
            submitData.category = newCategory;
        }

        const data = new FormData();
        Object.keys(submitData).forEach(key => data.append(key, submitData[key]));
        if (receiptFile) data.append('receipt', receiptFile);

        setSubmitting(true);
        try {
            await createReimbursementApi(data);
            toast.success('Claim submitted successfully');
            setIsAddModalOpen(false);
            resetForm();
            fetchClaims();
            fetchCategories();
        } catch (error) {
            console.error('Failed to submit claim', error);
            toast.error(error.response?.data?.message || 'Failed to submit claim');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdate.status) return toast.error('Please select a status');

        try {
            await updateReimbursementStatusApi(selectedClaim.id, statusUpdate);
            toast.success(`Claim ${statusUpdate.status.toLowerCase()} successfully`);
            setIsViewModalOpen(false);
            fetchClaims();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteReimbursementApi(deleteId);
            toast.success('Claim deleted successfully');
            setIsDeleteModalOpen(false);
            fetchClaims();
        } catch (error) {
            toast.error('Failed to delete claim');
        }
    };

    const resetForm = () => {
        setFormData({
            category: '',
            title: '',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0]
        });
        setReceiptFile(null);
        setIsAddingNewCategory(false);
        setNewCategory('');
    };

    const filteredClaims = claims.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.employee_name && c.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const stats = useMemo(() => {
        const total = claims.length;
        const pending = claims.filter(c => c.status === 'Pending').length;
        const approved = claims.filter(c => c.status === 'Approved').length;
        const totalAmount = claims.filter(c => c.status !== 'Rejected')
            .reduce((sum, c) => sum + parseFloat(c.amount), 0);

        return { total, pending, approved, totalAmount };
    }, [claims]);

    const columns = [
        {
            header: 'Claim Info',
            key: 'title',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                        <Receipt size={18} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 text-[14px]">{row.title}</div>
                        <div className="text-[11px] text-gray-600 font-medium uppercase tracking-wider">{row.category}</div>
                    </div>
                </div>
            )
        },
        ...(userRole !== 'employee' ? [{
            header: 'Employee',
            key: 'employee_name',
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-[14px]">{row.employee_name}</span>
                    <span className="text-[11px] text-gray-600 font-medium uppercase tracking-widest">{row.emp_id}</span>
                </div>
            )
        }] : []),
        {
            header: 'Date & Amount',
            key: 'amount',
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-primary text-[14px]">₹{parseFloat(row.amount).toLocaleString('en-IN')}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{new Date(row.date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val, row) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border ${getStatusStyle(row.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {row.status}
                </span>
            )
        }
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Paid': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (loading && claims.length === 0) {
        return <PageWithStatsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] md:p-2 p-4 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                        Reimbursements & Claims
                    </h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Submit and manage your business expense claims.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-medium text-[14px] shadow-md shadow-primary/10 hover:shadow-primary/20 hover:bg-primary-hover transition-all"
                    >
                        <Plus size={18} />
                        New Claim Request
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { title: 'Total Claims', val: stats.total, icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
                    { title: 'Pending Approval', val: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { title: 'Approved Claims', val: stats.approved, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { title: 'Total Amount', val: `₹${stats.totalAmount.toLocaleString('en-IN')}`, icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-[15px] border border-gray-200 hover:shadow-xs transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[15px] font-semibold text-gray-600 mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-semibold text-gray-900">{stat.val}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar */}
                <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search claims by title, category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className=" pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-8 pr-6 py-2 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-600 outline-none focus:border-primary/30 cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredClaims}
                        isLoading={loading}
                        onView={(row) => {
                            setSelectedClaim(row);
                            setStatusUpdate({ status: row.status, comment: row.comment || '' });
                            setIsViewModalOpen(true);
                        }}
                        onDelete={(userRole === 'admin' || userRole === 'superadmin') ? (row) => {
                            setDeleteId(row.id);
                            setIsDeleteModalOpen(true);
                        } : null}
                    />
                </div>
            </div>

            {/* New Claim Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[15px] w-full max-w-xl overflow-hidden shadow-2xl"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">New Reimbursement Request</h3>
                                <p className="text-sm text-gray-500 font-medium">Please provide accurate details of your expense.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 bg-white text-gray-400 rounded-full hover:text-rose-500 hover:bg-rose-50 border border-gray-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <FormInput
                                        label="Claim Title"
                                        placeholder="Briefly describe the claim (e.g. Client visit travel)"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <FormSelect
                                        label="Expense Category"
                                        options={[
                                            ...categories.map(c => ({ value: c, label: c })),
                                            { value: 'ADD_NEW', label: '+ Add New Category' }
                                        ]}
                                        value={isAddingNewCategory ? 'ADD_NEW' : formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW') {
                                                setIsAddingNewCategory(true);
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setIsAddingNewCategory(false);
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                        required
                                    />
                                    {isAddingNewCategory && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2"
                                        >
                                            <FormInput
                                                placeholder="Enter new category name"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsAddingNewCategory(false);
                                                    setNewCategory('');
                                                }}
                                                className="text-[11px] text-primary font-bold mt-1 hover:underline ml-1"
                                            >
                                                Cancel
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                                <FormDate
                                    label="Expense Date"
                                    name="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Claim Amount (₹)"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-[13px] font-bold text-gray-700 ml-1">Upload Receipt</label>
                                    <label className="relative flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Upload size={16} />
                                            <span className="text-[12px] font-bold truncate max-w-[150px]">
                                                {receiptFile ? receiptFile.name : 'Choose file...'}
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setReceiptFile(e.target.files[0])}
                                            accept="image/*,application/pdf"
                                        />
                                    </label>
                                </div>
                            </div>
                            <FormTextarea
                                label="Additional Notes (Optional)"
                                placeholder="Any extra information for the accounts team..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-primary text-white rounded-full font-medium flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-70 mt-4 active:scale-95"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {submitting ? 'Submitting Claim...' : 'Submit Claim Request'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* View/Edit Status Modal */}
            {isViewModalOpen && selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[15px] w-full max-w-2xl overflow-hidden shadow-2xl"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Claim Details</h3>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Reference ID: #{selectedClaim.id}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 bg-gray-50 text-gray-400 rounded-full hover:text-rose-500 border border-gray-50 shadow-inner">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-semibold text-gray-600">Title</span>
                                        <h4 className="font-semibold text-gray-800 text-[15px]">{selectedClaim.title}</h4>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-semibold text-gray-600">Category</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[14px] font-semibold text-gray-600">{selectedClaim.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-semibold text-gray-600">Status Tracking</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[14px] font-semibold border max-w-fit mt-1 ${getStatusStyle(selectedClaim.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {selectedClaim.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-semibold text-gray-600">Claim Amount</span>
                                        <h4 className="font-semibold text-primary text-[22px]">₹{parseFloat(selectedClaim.amount).toLocaleString('en-IN')}</h4>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-semibold text-gray-600">Expense Date</span>
                                        <div className="flex items-center gap-2 text-gray-600 font-semibold text-[14px] mt-1">
                                            <Calendar size={16} className="text-gray-400" />
                                            {new Date(selectedClaim.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </div>
                                    </div>
                                    {selectedClaim.receipt_url && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[14px] font-semibold text-gray-600">Documentation</span>
                                            <a
                                                href={`${import.meta.env.VITE_API_URL}${selectedClaim.receipt_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary border border-primary/10 rounded-xl font-semibold text-[12px] hover:bg-primary/10 transition-all w-fit mt-1"
                                            >
                                                <Eye size={14} /> View Receipt
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[14px] font-semibold text-gray-600">Description / Notes</span>
                                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                                        {selectedClaim.description || 'No additional description provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Admin Actions */}
                            {(userRole === 'admin' || userRole === 'superadmin') && (
                                <div className="pt-4 border-t border-gray-100 space-y-5">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Info size={18} />
                                        <h5 className="font-semibold text-[15px]">Admin Control Panel</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <FormSelect
                                            label="Update Status"
                                            options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                                            value={statusUpdate.status}
                                            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                                        />
                                        <FormInput
                                            label="Admin Comment"
                                            placeholder="Reason for approval/rejection..."
                                            value={statusUpdate.comment}
                                            onChange={(e) => setStatusUpdate({ ...statusUpdate, comment: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={handleStatusUpdate}
                                        className="w-full py-3 bg-primary text-white rounded-full font-medium shadow-md shadow-primary/10 hover:shadow-primary/10 hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Update Claim Status
                                    </button>
                                </div>
                            )}

                            {selectedClaim.comment && !(userRole === 'admin' || userRole === 'superadmin') && (
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-amber-600 mb-3">
                                        <Info size={16} />
                                        <h5 className="font-semibold text-[13px]">Admin Feedback</h5>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-[13px] text-amber-800 font-medium italic">"{selectedClaim.comment}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Claim Request"
                message="Are you sure you want to remove this claim? This action cannot be undone."
                confirmText="Delete Claim"
                type="danger"
            />
        </div>
    );
}