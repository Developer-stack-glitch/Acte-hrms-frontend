import React, { useState, useEffect, useMemo } from 'react';
import {
    Monitor, Laptop, Mouse, Smartphone, Cpu, Search, Filter,
    Plus, Trash2, CheckCircle2, AlertTriangle, Tag, UserPlus, Loader2, ArrowUpRight,
    X, Eye,
    XCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../Common/ConfirmationModal';
import DataTable from '../../Common/DataTable';
import { FormInput, FormSelect, FormDate, FormTextarea } from '../../Common/Form';
import {
    getUsersApi,
    getAssetsApi,
    createAssetApi,
    updateAssetApi,
    deleteAssetApi,
    getAssetCategoriesApi,
    addAssetCategoryApi,
    deleteAssetCategoryApi,
    getBranchesApi,
    getAssetRequestsApi,
    updateAssetRequestStatusApi,
    API_URL
} from '../../Action/api';
import FullPageLoader from '../../Common/FullPageLoader';

const STATUSES = ['Available', 'Assigned', 'Maintenance', 'Broken'];

export default function AssetManagement() {
    const navigate = useNavigate();

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;

    useEffect(() => {
        if (userRole === 'employee') {
            navigate('/dashboard', { replace: true });
        }
    }, [userRole, navigate]);

    if (userRole === 'employee') return null;

    // State
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [fetchingState, setFetchingState] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory');

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [viewingReason, setViewingReason] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [branches, setBranches] = useState([]);

    // Action Targets
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteCategoryId, setDeleteCategoryId] = useState(null);
    const [rejectRequestId, setRejectRequestId] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        serial: '',
        purchaseDate: '',
        cost: '',
        status: 'Available',
        branch: '',
        asset_ref: '', // Product Code
        specification: '',
        rentalType: '',
        vendor: '',
        warrantyInMonth: '',
        remarks: '',
        assigned_to: '', // Assigned User
        asset_image: null,
        invoice: null,
        existing_asset_image: null,
        existing_invoice: null
    });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [assignData, setAssignData] = useState({ userId: '' });
    const [assignLoading, setAssignLoading] = useState(false);
    const [categoryLoading, setCategoryLoading] = useState(false);

    // Pagination
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const [totalRecords, setTotalRecords] = useState(0);
    const [stats, setStats] = useState({ total: 0, available: 0, assigned: 0, issues: 0 });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(localSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch]);

    useEffect(() => {
        if (activeTab === 'inventory') {
            fetchAssetsData();
        } else {
            fetchRequestsData();
        }
    }, [pagination.current, pagination.pageSize, searchTerm, filterCategory, filterStatus, activeTab]);

    const fetchInitialData = async () => {
        try {
            const [usersRes, categoriesRes, branchesRes, requestsRes] = await Promise.all([
                getUsersApi({ limit: 1000 }),
                getAssetCategoriesApi(),
                getBranchesApi(),
                getAssetRequestsApi()
            ]);
            setEmployees(usersRes.data.users || []);
            setCategories(categoriesRes.data || []);
            setBranches(branchesRes.data || []);
            setRequests(requestsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch initial data', error);
        }
    };

    const fetchAssetsData = async () => {
        try {
            setFetchingState(true);
            const res = await getAssetsApi({
                page: pagination.current,
                limit: pagination.pageSize,
                search: searchTerm,
                category: filterCategory,
                status: filterStatus
            });
            setAssets(res.data.assets || []);
            setTotalRecords(res.data.total || 0);
            if (res.data.stats) setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to fetch assets', error);
            toast.error('Failed to load asset data');
        } finally {
            setFetchingState(false);
        }
    };

    const fetchRequestsData = async () => {
        try {
            setFetchingState(true);
            const res = await getAssetRequestsApi({
                status: filterStatus === 'All' ? 'All' : filterStatus,
                search: searchTerm
            });
            setRequests(res.data || []);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to load asset requests');
        } finally {
            setFetchingState(false);
        }
    };

    const columns = [
        {
            header: 'Asset Ref',
            key: 'id',
            render: (val, row) => (
                <>
                    <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{row.id}</div>
                    <div className="text-[11px] text-gray-400 font-mono tracking-widest mt-0.5">SN/ {row.serial}</div>
                </>
            )
        },
        {
            header: 'Name & Categorization',
            key: 'name',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        {getCategoryIcon(row.category)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-[13px]">{row.name}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">{row.category}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Assignment / Location',
            key: 'assignedTo',
            render: (val, row) => (
                <div>
                    {row.assignedTo ? (
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                                {row.assignedTo.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-800">{row.assignedTo.name}</div>
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{row.assignedTo.emp_id}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                            <UserPlus size={14} />
                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Unassigned</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-medium">
                        <ArrowUpRight size={10} /> {row.branch || 'Main HQ'}
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val) => (
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${getStatusStyles(val)}`}>
                    {val}
                </span>
            )
        }
    ];

    const requestColumns = [
        {
            header: 'Employee',
            key: 'user_name',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {row.user_name?.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-sm">{row.user_name}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">{row.emp_id}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Requested Asset',
            key: 'asset_name',
            render: (val, row) => (
                <div>
                    <div className="font-semibold text-gray-900">{row.asset_name}</div>
                    <div className="text-[10px] text-primary font-semibold uppercase tracking-widest mt-0.5">{row.category_name || 'General'}</div>
                </div>
            )
        },
        {
            header: 'Reason',
            key: 'reason',
            render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 max-w-[180px] truncate" title={val}>
                        {val}
                    </div>
                    {val && val.length > 20 && (
                        <button
                            onClick={() => {
                                setViewingReason(val);
                                setIsReasonModalOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full text-primary transition-colors"
                            title="View full reason"
                        >
                            <Eye size={14} />
                        </button>
                    )}
                </div>
            )
        },
        {
            header: 'Date',
            key: 'created_at',
            render: (val, row) => (
                <div className="text-xs font-semibold text-gray-600">
                    {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val, row) => (
                <div>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${val === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : val === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {val}
                    </span>
                    {val === 'Rejected' && row.rejection_reason && (
                        <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg w-fit">
                            <div className="text-[10px] text-rose-500 font-medium italic truncate max-w-[120px]" title={row.rejection_reason}>
                                Reason: {row.rejection_reason}
                            </div>
                            {row.rejection_reason.length > 20 && (
                                <button
                                    onClick={() => {
                                        setViewingReason(row.rejection_reason);
                                        setIsReasonModalOpen(true);
                                    }}
                                    className="p-0.5 hover:bg-rose-100 rounded-full text-rose-500 transition-colors"
                                    title="View full rejection reason"
                                >
                                    <Eye size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )
        }
    ];

    const handleAssignClick = (asset) => {
        setSelectedAsset(asset);
        setAssignData({ userId: asset.assignedTo?.id || '' });
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            setAssignLoading(true);
            await updateAssetApi(selectedAsset.db_id, {
                assigned_to: assignData.userId,
                status: assignData.userId ? 'Assigned' : 'Available'
            });
            toast.success(`Asset successfully ${assignData.userId ? 'assigned' : 'unassigned'}`);
            setIsAssignModalOpen(false);
            fetchAssetsData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign asset');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleEditClick = (asset) => {
        setSelectedAsset(asset);

        // Helper to safely format date for input field (YYYY-MM-DD)
        const formatDateForInput = (dateVal) => {
            if (!dateVal) return '';
            try {
                const date = new Date(dateVal);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        setFormData({
            name: asset.name || '',
            category_id: asset.category_id || '',
            serial: asset.serial || '',
            purchaseDate: formatDateForInput(asset.purchaseDate),
            cost: asset.cost || '',
            status: asset.status || 'Available',
            branch: asset.branch || '',
            asset_ref: asset.id || '',
            specification: asset.specification || '',
            rentalType: asset.rentalType || '',
            vendor: asset.vendor || '',
            warrantyInMonth: asset.warrantyInMonth || '',
            remarks: asset.remarks || '',
            assigned_to: asset.assignedTo?.id || '',
            existing_asset_image: asset.assetImage,
            existing_invoice: asset.invoice,
            asset_image: null,
            invoice: null
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteAssetApi(deleteId);
            toast.success('Asset deleted successfully');
            fetchAssetsData();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete asset');
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            if (selectedAsset) {
                await updateAssetApi(selectedAsset.db_id, data);
                toast.success('Asset updated successfully');
            } else {
                await createAssetApi(data);
                toast.success('Asset registered successfully');
            }
            setIsAddModalOpen(false);
            fetchAssetsData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            setCategoryLoading(true);
            await addAssetCategoryApi({ name: newCategoryName });
            toast.success('Category added');
            setNewCategoryName('');
            const res = await getAssetCategoriesApi();
            setCategories(res.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add category');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleDeleteCategoryClick = (id) => {
        setDeleteCategoryId(id);
        setIsCategoryDeleteModalOpen(true);
    };

    const confirmDeleteCategory = async () => {
        try {
            await deleteAssetCategoryApi(deleteCategoryId);
            toast.success('Category removed');
            const res = await getAssetCategoriesApi();
            setCategories(res.data || []);
            setIsCategoryDeleteModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleApproveRequest = async (id) => {
        try {
            await updateAssetRequestStatusApi(id, { status: 'Approved' });
            toast.success('Request approved');
            fetchRequestsData();
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    const handleRejectRequestClick = (id) => {
        setRejectRequestId(id);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateAssetRequestStatusApi(rejectRequestId, {
                status: 'Rejected',
                rejection_reason: rejectionReason
            });
            toast.success('Request rejected');
            setIsRejectModalOpen(false);
            fetchRequestsData();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const resetFormData = () => {
        setSelectedAsset(null);
        setFormData({
            name: '',
            category_id: '',
            serial: '',
            purchaseDate: '',
            cost: '',
            status: 'Available',
            branch: '',
            asset_ref: '',
            specification: '',
            rentalType: '',
            vendor: '',
            warrantyInMonth: '',
            remarks: '',
            assigned_to: '',
            asset_image: null,
            invoice: null,
            existing_asset_image: null,
            existing_invoice: null
        });
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'laptop': return <Laptop size={18} />;
            case 'monitor': return <Monitor size={18} />;
            case 'accessory': return <Mouse size={18} />;
            case 'tablet': return <Smartphone size={18} />;
            case 'mobile': return <Smartphone size={18} />;
            default: return <Cpu size={18} />;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/20';
            case 'Assigned': return 'bg-primary/5 text-primary border-primary/10 ring-primary/20';
            case 'Maintenance': return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/20';
            case 'Broken': return 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/20';
            default: return 'bg-gray-50 text-gray-600 border-gray-100 ring-gray-500/20';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-screen bg-transparent md:p-4 p-3 pb-6 font-sans">
            <FullPageLoader isLoading={fetchingState && (assets.length > 0 || requests.length > 0)} message="Syncing Asset Registry..." />
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between md:gap-4 gap-3 md:mb-8 mb-5">
                <div className="flex items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Organization Assets</h2>
                        </div>
                        <p className="text-gray-500 text-sm md:text-[14px] font-medium ml-1">
                            Track, assign, and manage company devices efficiently.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 self-end md:self-auto">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="py-2 px-4 text-gray-700 bg-white rounded-full border border-gray-200 hover:text-primary hover:border-primary/20 transition-all active:scale-95 flex items-center gap-2 text-md"
                    >
                        <Tag size={18} /> <span className="text-sm font-semibold hidden md:inline">Categories</span>
                    </button>
                    <button
                        onClick={() => {
                            resetFormData();
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center justify-center text-[15px] gap-1 px-4 py-2 bg-primary text-white rounded-full font-medium transition-all shadow-md shadow-primary/20 hover:shadow-primary/10 hover:bg-primary-hover"
                    >
                        <Plus size={18} className="stroke-[3]" />
                        <span>Register Asset</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center border border-gray-200 gap-1 bg-gray-100/50 p-1 rounded-full w-fit mb-8">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'inventory' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary hover:bg-white'}`}
                >
                    Inventory
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-8 py-2.5 rounded-full font-semibold text-sm transition-all ${activeTab === 'requests' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary hover:bg-white'}`}
                >
                    Requests
                    {requests.filter(r => r.status === 'Requested').length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                            {requests.filter(r => r.status === 'Requested').length}
                        </span>
                    )}
                </button>
            </div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: 'Total Inventory', val: stats.total, icon: Cpu, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/5' },
                        { title: 'Currently Available', val: stats.available, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-50/50' },
                        { title: 'Actively Assigned', val: stats.assigned, icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-50/50' },
                        { title: 'Requires Attention', val: stats.issues, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-50/50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-[15px] border border-gray-200 relative overflow-hidden group hover:border-gray-200 transition-colors">
                            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full opacity-50 scale-150 transition-transform duration-500`} />

                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-[15px] font-semibold text-gray-600 mb-1">{stat.title}</p>
                                    <h3 className="text-3xl font-medium text-gray-900 tracking-tight">{stat.val}</h3>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center ring-2 ${stat.ring}`}>
                                    <stat.icon size={22} className="stroke-[2.5]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Main Content */}
                <div className="bg-white rounded-[15px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">

                    {/* Toolbar */}
                    <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/30">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, ID, or serial number..."
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium text-gray-700 md:text-sm text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    className="outline-none text-[13px] font-semibold text-gray-600 bg-transparent cursor-pointer"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200">
                                <Tag size={16} className="text-gray-400" />
                                <select
                                    className="outline-none text-[13px] font-semibold text-gray-600 bg-transparent cursor-pointer"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Data Display Area */}
                    <div className="flex-1">
                        {activeTab === 'inventory' ? (
                            <DataTable
                                columns={columns}
                                data={assets}
                                isLoading={fetchingState}
                                onView={handleEditClick}
                                onEdit={handleEditClick}
                                onDelete={(row) => handleDeleteClick(row.db_id)}
                                extraActions={(row) => (row.status === 'Available' || row.status === 'Assigned') && (
                                    <button
                                        onClick={() => handleAssignClick(row)}
                                        className={`h-8 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${row.assignedTo ? 'text-blue-600 hover:bg-blue-50' : 'text-primary hover:bg-primary/10 font-bold'}`}
                                    >
                                        <UserPlus size={14} />
                                        <span className="text-[12px] font-semibold">{row.assignedTo ? 'Re-assign' : 'Assign'}</span>
                                    </button>
                                )}
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: totalRecords,
                                    onChange: (p) => setPagination(curr => ({ ...curr, current: p })),
                                    onPageSizeChange: (s) => setPagination({ current: 1, pageSize: s })
                                }}
                                emptyMessage="No assets found match your criteria"
                            />
                        ) : (
                            <DataTable
                                columns={requestColumns}
                                data={requests}
                                isLoading={fetchingState}
                                extraActions={(row) => (
                                    <div className="flex items-center gap-2">
                                        {row.status === 'Requested' && (
                                            <>
                                                <button
                                                    onClick={() => handleApproveRequest(row.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-medium text-[12px] rounded-lg hover:bg-emerald-600 transition-all shadow-xs shadow-emerald-500/20 active:scale-95"
                                                >
                                                    Approve <CheckCircle2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequestClick(row.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white font-medium text-[12px] rounded-lg hover:bg-rose-600 transition-all shadow-xs shadow-rose-500/20 active:scale-95"
                                                >
                                                    <X size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                emptyMessage="No asset requests found"
                            />
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Modals / Forms */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[70] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                        {selectedAsset ? <Loader2 size={22} /> : <Plus size={22} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{selectedAsset ? 'Update Asset Info' : 'Register New Asset'}</h3>
                                        <p className="text-xs text-gray-500 font-medium">Capture device details for organization tracking</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="p-6 flex-1">
                                <div className="space-y-6">
                                    <div className="space-y-5">
                                        <FormInput label="Asset Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. MacBook Pro M3" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormSelect label="Category" required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select Category" />
                                            <FormInput label="Serial Number" required value={formData.serial} onChange={(e) => setFormData({ ...formData, serial: e.target.value })} placeholder="S/N: 123-ABC" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormDate label="Purchase Date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                            <FormInput label="Cost (₹)" isNumber={true} value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0.00" />
                                        </div>

                                        <FormSelect
                                            label="Initial Status"
                                            required
                                            value={formData.status}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    status: newStatus,
                                                    assigned_to: newStatus === 'Assigned' ? formData.assigned_to : ''
                                                });
                                            }}
                                            options={STATUSES.map(s => ({ value: s, label: s }))}
                                        />

                                        {formData.status === 'Assigned' && (
                                            <FormSelect
                                                label="Assign to User"
                                                required
                                                value={formData.assigned_to}
                                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                                options={employees.map(user => ({
                                                    value: user.id,
                                                    label: `${user.name || user.employee_name} (${user.emp_id})`
                                                }))}
                                                placeholder="Select User"
                                            />
                                        )}

                                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Asset Image</label>
                                                    <input type="file" className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer mt-1" onChange={(e) => setFormData({ ...formData, asset_image: e.target.files[0] })} />
                                                    {formData.existing_asset_image && <div className="text-[11px] text-primary flex items-center gap-1 font-semibold bg-primary/5 p-1 px-2 rounded-md w-fit mt-1"><CheckCircle2 size={10} /> Image exists</div>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Invoice / Bill</label>
                                                    <input type="file" className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition-all cursor-pointer mt-1" onChange={(e) => setFormData({ ...formData, invoice: e.target.files[0] })} />
                                                    {formData.existing_invoice && <div className="text-[11px] text-gray-500 flex items-center gap-1 font-semibold bg-gray-100 p-1 px-2 rounded-md w-fit mt-1"><CheckCircle2 size={10} /> Invoice exists</div>}
                                                </div>
                                            </div>
                                        </div>

                                        <FormInput placeholder="RAM, Processor, Screen Size etc." label="Technical Specifications" value={formData.specification} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormInput placeholder="Vendor / Supplier" label="Vendor / Supplier" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
                                            <FormInput placeholder="Warranty (Mo)" label="Warranty (Mo)" type="number" value={formData.warrantyInMonth} onChange={(e) => setFormData({ ...formData, warrantyInMonth: e.target.value })} />
                                        </div>

                                        <FormTextarea placeholder="Remarks" label="Remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-6 py-3 text-gray-500 font-semibold hover:text-gray-700 transition-all border border-gray-200 rounded-full hover:bg-gray-50 text-sm">Cancel</button>
                                    <button type="submit" className="flex-2 px-10 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium shadow-xs shadow-primary/20 transition-all active:scale-95 text-sm">
                                        {selectedAsset ? 'Update' : 'Register'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>            {/* Category Sidebar */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
                                        <p className="text-xs text-gray-500 font-medium">Add or remove asset categories</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-8">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="New category name..."
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-gray-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={categoryLoading}
                                        className="px-6 py-2 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                                    >
                                        {categoryLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        <span>Add</span>
                                    </button>
                                </form>

                                <div className="space-y-3">
                                    <h4 className="text-[15px] font-semibold text-gray-600 mb-4 ml-1">Existing Categories</h4>
                                    <div className="space-y-2">
                                        {categories.map(cat => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={cat.id}
                                                className="flex items-center justify-between p-4 bg-gray-50/50 rounded-[15px] border border-gray-200 group hover:border-primary/20 hover:bg-white transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-gray-400 bg-white p-2 rounded-[10px] border border-gray-200 group-hover:text-primary group-hover:border-primary/10 transition-colors">
                                                        {getCategoryIcon(cat.name)}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-sm">{cat.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategoryClick(cat.id)}
                                                    className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                        {categories.length === 0 && (
                                            <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No categories found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Assign Asset Sidebar */}
            <AnimatePresence>
                {isAssignModalOpen && selectedAsset && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAssignModalOpen(false)}
                            className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shadow-primary/20">
                                        <UserPlus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Assign Asset</h3>
                                        <p className="text-xs text-gray-500 font-medium">{selectedAsset.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1">
                                <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-primary mb-3 shadow-sm border border-gray-100 ring-4 ring-white">
                                        {getCategoryIcon(selectedAsset.category)}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-md">{selectedAsset.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1 tracking-widest uppercase">{selectedAsset.id} • {selectedAsset.serial}</p>
                                </div>

                                <form onSubmit={handleAssignSubmit} className="space-y-8">
                                    <FormSelect
                                        label="Select Employee"
                                        value={assignData.userId}
                                        onChange={(e) => setAssignData({ userId: e.target.value })}
                                        options={[
                                            ...employees.map(e => ({ value: e.id, label: `${e.employee_name} (${e.emp_id})` })),
                                            ...(employees.length === 0 ? [{ value: '999', label: 'Mock User - Alex Johnson' }] : [])
                                        ]}
                                        placeholder="Search & Select Employee..."
                                        required
                                    />

                                    <div className="pt-6 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={assignLoading}
                                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium text-sm transition-all shadow-md shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            {assignLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                            Confirm Assignment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAssignModalOpen(false)}
                                            className="w-full mt-3 rounded-full bg-gray-100 py-3.5 text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors"
                                        >
                                            Nevermind, Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Asset permanently"
                message="Are you sure you want to completely remove this asset from the organization database? This action cannot be undone."
                confirmText="Delete permanently"
                cancelText="Keep Asset"
                type="danger"
            />

            <ConfirmationModal
                isOpen={isCategoryDeleteModalOpen}
                onClose={() => setIsCategoryDeleteModalOpen(false)}
                onConfirm={confirmDeleteCategory}
                title="Delete Category"
                message="Are you sure you want to completely remove this category? This action cannot be undone."
                confirmText="Delete Category"
                cancelText="Cancel"
                type="danger"
            />


            {/* Reject Request Side Drawer */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRejectModalOpen(false)}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                                        <XCircle size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Reject Request</h3>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none mt-1">Action Required</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRejectRequestSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Rejection Reason <span className="text-rose-500">*</span></label>
                                    <FormTextarea
                                        required
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g. Budget constraints, Not required for your current role, Asset currently out of stock..."
                                        className="mt-2"
                                    />
                                    <p className="text-[11px] text-gray-400 font-medium italic mt-2 px-2">
                                        This reason will be visible to the employee on their 'My Assets' dashboard.
                                    </p>
                                </div>
                            </form>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white text-gray-600 rounded-full font-medium text-[15px] border border-gray-200 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectRequestSubmit}
                                    type="button"
                                    className="flex-[1.5] py-2.5 bg-rose-500 text-white rounded-full font-medium text-[15px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={17} />
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Full Reason View Modal */}
            <AnimatePresence>
                {isReasonModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReasonModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[15px] w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                                        <Eye size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 tracking-tight text-xl">Full Reason</h3>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Detailed View</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsReasonModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="rounded-[15px] text-[15px] font-medium text-gray-600 leading-relaxed italic min-h-[120px] flex items-center justify-center text-center">
                                    "{viewingReason}"
                                </div>
                            </div>

                            <div className="py-4 px-8 border-t border-gray-100 bg-gray-50/30">
                                <button
                                    onClick={() => setIsReasonModalOpen(false)}
                                    className="w-full py-2.5 bg-primary text-white rounded-full font-medium text-[15px] shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all"
                                >
                                    Dismiss View
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
