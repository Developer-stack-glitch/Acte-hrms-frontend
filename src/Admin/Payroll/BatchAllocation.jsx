import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Blocks,
    Calendar,
    Hash,
    Loader2,
    Info,
    CheckCircle2,
    X,
    Users,
    UserPlus,
    Check
} from 'lucide-react';
import DataTable from '../../Common/DataTable';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getBatchAllocationsApi,
    createBatchAllocationApi,
    updateBatchAllocationApi,
    deleteBatchAllocationApi,
    getUsersApi,
    getAssignedUsersApi,
    assignUsersApi,
    getAllAssignedUsersIdsApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';

const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
};

export default function BatchAllocation() {
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [structureToDelete, setStructureToDelete] = useState(null);

    // Allot Users state
    const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
    const [allotStructure, setAllotStructure] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [assignedUserIds, setAssignedUserIds] = useState([]);
    const [allotSearchTerm, setAllotSearchTerm] = useState('');
    const [allotLoading, setAllotLoading] = useState(false);
    const [allotSaving, setAllotSaving] = useState(false);
    const [allAssignedUserIds, setAllAssignedUserIds] = useState([]);
    // Track assigned user count per structure
    const [assignedCounts, setAssignedCounts] = useState({});

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        name: '',
        allocation_day: '',
        batch: ''
    });

    useEffect(() => {
        fetchStructures();
    }, []);

    const fetchStructures = async () => {
        setLoading(true);
        try {
            const response = await getBatchAllocationsApi({ company_id: companyId });
            setStructures(response.data);

            // Fetch assigned user counts for each structure
            const counts = {};
            await Promise.all(response.data.map(async (s) => {
                try {
                    const usersRes = await getAssignedUsersApi(s.id);
                    counts[s.id] = usersRes.data.length;
                } catch {
                    counts[s.id] = 0;
                }
            }));
            setAssignedCounts(counts);
        } catch (error) {
            toast.error('Failed to fetch batch allocations');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (structure = null) => {
        if (structure) {
            setSelectedStructure(structure);
            setFormData({
                name: structure.name,
                allocation_day: structure.allocation_day || '',
                batch: structure.batch || ''
            });
        } else {
            setSelectedStructure(null);
            setFormData({
                name: '',
                allocation_day: '',
                batch: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStructure(null);
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
        setSubmitLoading(true);
        try {
            const data = { ...formData, company_id: companyId };
            if (selectedStructure) {
                await updateBatchAllocationApi(selectedStructure.id, data);
                toast.success('Batch allocation updated successfully');
            } else {
                await createBatchAllocationApi(data);
                toast.success('Batch allocation created successfully');
            }
            fetchStructures();
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save batch allocation');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteClick = (structure) => {
        setStructureToDelete(structure);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteBatchAllocationApi(structureToDelete.id);
            toast.success('Batch allocation deleted successfully');
            fetchStructures();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete batch allocation');
        }
    };

    // ---- Allot Users Logic ----
    const handleAllotUsers = async (structure) => {
        setAllotStructure(structure);
        setAllotSearchTerm('');
        setIsAllotModalOpen(true);
        setAllotLoading(true);

        try {
            // Fetch all users, currently assigned users, and ALL assigned user IDs in the company
            const [usersRes, assignedRes, allAssignedRes] = await Promise.all([
                getUsersApi({ limit: 500 }),
                getAssignedUsersApi(structure.id),
                getAllAssignedUsersIdsApi({ company_id: companyId })
            ]);

            const users = usersRes.data.users || usersRes.data || [];
            setAllUsers(users);

            const currentBatchIds = (assignedRes.data || []).map(u => u.id);
            setAssignedUserIds(currentBatchIds);
            setAllAssignedUserIds((allAssignedRes.data || []).filter(id => !currentBatchIds.includes(id)));
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setAllotLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setAssignedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const selectAll = () => {
        const filteredIds = filteredAllotUsers
            .filter(u => !allAssignedUserIds.includes(u.id) || assignedUserIds.includes(u.id))
            .map(u => u.id);

        setAssignedUserIds(prev => {
            const allSelected = filteredIds.every(id => prev.includes(id));
            if (allSelected) {
                // Deselect only those that are selectable
                return prev.filter(id => !filteredIds.includes(id));
            } else {
                // Select all selectable
                return [...new Set([...prev, ...filteredIds])];
            }
        });
    };

    const handleSaveAssignments = async () => {
        setAllotSaving(true);
        try {
            await assignUsersApi(allotStructure.id, assignedUserIds);
            toast.success(`${assignedUserIds.length} employee(s) assigned to "${allotStructure.name}"`);
            setIsAllotModalOpen(false);
            fetchStructures();
        } catch (error) {
            toast.error('Failed to save assignments');
        } finally {
            setAllotSaving(false);
        }
    };

    const columns = [
        {
            header: 'Batch Name',
            key: 'name',
            render: (val, s) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Blocks size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-gray-900">{val}</span>
                        <span className="text-[11px] text-gray-400">ID: #{s.id}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Batch',
            key: 'batch',
            render: (val) => (
                <span className="text-[13px] font-medium text-gray-600 px-3 py-1 bg-gray-100 rounded-lg">
                    {val || 'N/A'}
                </span>
            )
        },
        {
            header: 'Allocation Day',
            key: 'allocation_day',
            align: 'center',
            render: (val) => (
                <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-primary rounded-lg">
                    <Calendar size={14} className="text-primary" />
                    {val ? `${val}${getOrdinalSuffix(val)}` : 'N/A'}
                </div>
            )
        },
        {
            header: 'Employees',
            align: 'center',
            render: (_, s) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${(assignedCounts[s.id] || 0) > 0
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>
                    <Users size={12} />
                    {assignedCounts[s.id] || 0} Assigned
                </span>
            )
        },
        {
            header: 'Status',
            key: 'is_active',
            align: 'center',
            render: (val) => (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${val ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                    <div className={`w-1 h-1 rounded-full ${val ? 'bg-emerald-600' : 'bg-gray-400'}`}></div>
                    {val ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ];

    const extraActions = (s) => (
        <button
            onClick={() => handleAllotUsers(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all border border-violet-100"
            title="Allot Users"
        >
            <UserPlus size={13} />
            Allot Users
        </button>
    );

    const filteredStructures = structures
        .filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.batch && s.batch.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => a.id - b.id);

    const filteredAllotUsers = allUsers.filter(u => {
        if (!allotSearchTerm) return true;
        const term = allotSearchTerm.toLowerCase();
        return (
            (u.employee_name || '').toLowerCase().includes(term) ||
            (u.emp_id || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.department_name || '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Batch Allocation</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">Define and manage batch allocations for your organization</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search batches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-1 focus:ring-primary/10 outline-none w-64 transition-all shadow-xs"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                    >
                        <Plus size={16} />
                        Add Batch
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden min-h-[400px]">
                <DataTable
                    columns={columns}
                    data={filteredStructures}
                    isLoading={loading}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteClick}
                    extraActions={extraActions}
                    emptyMessage="No batch allocations found"
                />
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {selectedStructure ? 'Edit Batch Allocation' : 'Create New Batch Allocation'}
                                        </h2>
                                        <p className="text-[12px] text-gray-500 font-medium">Fill in the basic information</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form id="salary-form" onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-6">
                                    <div className="mb-5">
                                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                            <Info size={16} className="text-primary" />
                                            Basic Information
                                        </h3>
                                    </div>
                                    <FormInput
                                        label="Structure Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Standard Salary"
                                        required
                                        icon={Blocks}
                                    />
                                    <FormInput
                                        label="Batch Name"
                                        name="batch"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        placeholder="e.g. Batch A 2026"
                                        icon={Hash}
                                    />
                                    <FormSelect
                                        label="Allocation Day (of month)"
                                        name="allocation_day"
                                        value={formData.allocation_day}
                                        onChange={handleChange}
                                        icon={Calendar}
                                        options={Array.from({ length: 31 }, (_, i) => ({
                                            value: i + 1,
                                            label: `${i + 1}${getOrdinalSuffix(i + 1)}`
                                        }))}
                                        placeholder="Select Day"
                                        required
                                    />
                                </div>
                            </form>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-around gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 rounded-full font-semibold text-[13px] text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="salary-form"
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-full font-semibold text-[13px] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {submitLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                    {selectedStructure ? 'Update Structure' : 'Create Structure'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Allot Users Modal */}
            <AnimatePresence>
                {isAllotModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                        <UserPlus size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Allot Employees</h2>
                                        <p className="text-[12px] text-gray-500 font-medium">
                                            {allotStructure?.name} — <span className="text-violet-600 font-semibold">{allotStructure?.batch || 'No batch'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAllotModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Search + Select All */}
                            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search employees by name, ID, department..."
                                        value={allotSearchTerm}
                                        onChange={(e) => setAllotSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-2 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-100 transition-all whitespace-nowrap"
                                >
                                    {filteredAllotUsers.length > 0 && filteredAllotUsers.every(u => assignedUserIds.includes(u.id))
                                        ? 'Deselect All'
                                        : 'Select All'
                                    }
                                </button>
                            </div>

                            {/* Selected count badge */}
                            <div className="px-5 py-2 bg-violet-50/50 border-b border-violet-100 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-violet-700">
                                    <span className="text-violet-900 text-[15px]">{assignedUserIds.length}</span> employee(s) selected
                                </p>
                                {assignedUserIds.length > 0 && (
                                    <button
                                        onClick={() => setAssignedUserIds([])}
                                        className="text-[11px] text-rose-500 font-semibold hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* User List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                                {allotLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 size={28} className="animate-spin text-violet-500" />
                                    </div>
                                ) : filteredAllotUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                        <Users size={40} className="opacity-20 mb-3" />
                                        <p className="font-semibold text-sm">No employees found</p>
                                        <p className="text-[12px]">Try adjusting your search</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {filteredAllotUsers.map((user) => {
                                            const isSelected = assignedUserIds.includes(user.id);
                                            const isAlreadyAssignedElsewhere = allAssignedUserIds.includes(user.id) && !isSelected;

                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => !isAlreadyAssignedElsewhere && toggleUserSelection(user.id)}
                                                    className={`flex items-center gap-4 px-5 py-3 transition-all ${isAlreadyAssignedElsewhere
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-50/30'
                                                        : 'cursor-pointer'
                                                        } ${isSelected
                                                            ? 'bg-violet-50/60 hover:bg-violet-50'
                                                            : !isAlreadyAssignedElsewhere ? 'hover:bg-gray-50' : ''
                                                        }`}
                                                >
                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSelected
                                                        ? 'bg-violet-600 border-violet-600'
                                                        : isAlreadyAssignedElsewhere
                                                            ? 'border-gray-200 bg-gray-100'
                                                            : 'border-gray-300 bg-white'
                                                        }`}>
                                                        {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                                                    </div>

                                                    {/* Avatar */}
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-semibold shrink-0 ${isSelected
                                                        ? 'bg-violet-200 text-violet-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {(user.employee_name || user.name || '?').charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-[13px] font-semibold truncate ${isSelected ? 'text-violet-900' : 'text-gray-800'}`}>
                                                                {user.employee_name || user.name}
                                                            </p>
                                                            {user.emp_id && (
                                                                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {user.emp_id}
                                                                </span>
                                                            )}
                                                            {isAlreadyAssignedElsewhere && (
                                                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                                                                    Already Allotted
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 truncate">
                                                            {[user.designation_name, user.department_name].filter(Boolean).join(' • ') || 'No details'}
                                                        </p>
                                                    </div>

                                                    {/* Salary */}
                                                    <div className="text-right shrink-0">
                                                        <p className={`text-[12px] font-semibold ${isSelected ? 'text-violet-700' : 'text-gray-600'}`}>
                                                            ₹{(parseFloat(user.year_gross_salary / 12) || parseFloat(user.cur_sal_gross) || 0).toLocaleString('en-IN')}
                                                        </p>
                                                        <p className="text-[9px] text-gray-400 uppercase font-semibold">Gross/Month</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAllotModalOpen(false)}
                                    className="px-6 py-2.5 rounded-full font-semibold text-[13px] text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAssignments}
                                    disabled={allotSaving}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 text-white rounded-full font-semibold text-[13px] shadow-lg shadow-violet-600/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {allotSaving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                    Save Assignments ({assignedUserIds.length})
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Batch Allocation"
                message={`Are you sure you want to delete "${structureToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
}