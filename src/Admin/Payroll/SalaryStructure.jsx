import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    X,
    Users,
    UserPlus,
    Check,
    Settings,
    Copy,
} from 'lucide-react';
import SalaryStructureSkeleton from '../../Common/CommonSkeletonLoader/SalaryStructureSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getBatchAllocationsApi,
    createBatchAllocationApi,
    updateBatchAllocationApi,
    deleteBatchAllocationApi,
    getUsersApi,
    getAssignedUsersApi,
    assignUsersApi,
    getAllAssignedUsersIdsApi,
    getSalaryComponentsApi,
    assignStructureComponentsApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Tooltip from '../../Common/Tooltip';
import NoData from '../../Common/NoData';

const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
};

export default function SalaryStructure() {
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
    const [assignedCounts, setAssignedCounts] = useState({});

    // Components state
    const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
    const [allComponents, setAllComponents] = useState([]);
    const [selectedComponentIds, setSelectedComponentIds] = useState([]);
    const [compLoading, setCompLoading] = useState(false);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        name: '',
        allocation_day: '',
        batch: ''
    });

    useEffect(() => {
        fetchStructures();
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const compRes = await getSalaryComponentsApi({ company_id: companyId });
            setAllComponents(compRes.data);
        } catch (error) {
            console.error('Failed to load components', error);
        }
    };

    const fetchStructures = async () => {
        setLoading(true);
        try {
            const response = await getBatchAllocationsApi({ company_id: companyId });
            setStructures(response.data);

            const counts = {};
            response.data.forEach(s => {
                counts[s.id] = s.assigned_users_count || 0;
            });
            setAssignedCounts(counts);
        } catch (error) {
            toast.error('Failed to fetch structures');
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
            setSelectedComponentIds((structure.components || []).map(c => c.id));
        } else {
            setSelectedStructure(null);
            setFormData({ name: '', allocation_day: '', batch: '' });
            setSelectedComponentIds([]);
        }
        setIsModalOpen(true);
    };

    const handleCloneStructure = (structure) => {
        setFormData({
            name: `${structure.name} (Copy)`,
            allocation_day: structure.allocation_day || '',
            batch: structure.batch ? `${structure.batch}_COPY` : ''
        });
        setSelectedComponentIds((structure.components || []).map(c => c.id));
        setSelectedStructure(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStructure(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const data = { ...formData, company_id: companyId };
            let response;
            if (selectedStructure) {
                response = await updateBatchAllocationApi(selectedStructure.id, data);
            } else {
                response = await createBatchAllocationApi(data);
            }

            const structureId = selectedStructure?.id || response.data?.id;
            if (structureId) {
                await assignStructureComponentsApi(structureId, selectedComponentIds);
            }

            toast.success(selectedStructure ? 'Structure updated successfully' : 'Structure created successfully');
            fetchStructures();
            handleCloseModal();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save structure');
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
            toast.success('Structure deleted successfully');
            fetchStructures();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete structure');
        }
    };

    // ---- Component Management ----
    const handleManageComponents = async (structure) => {
        setSelectedStructure(structure);
        setIsComponentModalOpen(true);
        setCompLoading(true);
        try {
            const compRes = await getSalaryComponentsApi({ company_id: companyId });
            setAllComponents(compRes.data);
            setSelectedComponentIds((structure.components || []).map(c => c.id));
        } catch (error) {
            toast.error('Failed to load components');
        } finally {
            setCompLoading(false);
        }
    };

    const toggleComponent = (id) => {
        setSelectedComponentIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const saveComponentAssignments = async () => {
        setSubmitLoading(true);
        try {
            await assignStructureComponentsApi(selectedStructure.id, selectedComponentIds);
            toast.success('Components updated successfully');
            setIsComponentModalOpen(false);
            fetchStructures();
        } catch (error) {
            toast.error('Failed to update components');
        } finally {
            setSubmitLoading(false);
        }
    };

    // ---- Allot Users ----
    const handleAllotUsers = async (structure) => {
        setAllotStructure(structure);
        setIsAllotModalOpen(true);
        setAllotLoading(true);
        setAllotSearchTerm('');
        try {
            const [usersRes, assignedRes, allAssignedRes] = await Promise.all([
                getUsersApi({ limit: 500 }),
                getAssignedUsersApi(structure.id),
                getAllAssignedUsersIdsApi({ company_id: companyId })
            ]);
            setAllUsers(usersRes.data.users || usersRes.data || []);
            setAssignedUserIds((assignedRes.data || []).map(u => u.id));
            setAllAssignedUserIds(allAssignedRes.data || []);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setAllotLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setAssignedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const selectAll = () => {
        const filteredIds = filteredAllotUsers
            .filter(u => !allAssignedUserIds.includes(u.id) || assignedUserIds.includes(u.id))
            .map(u => u.id);

        setAssignedUserIds(prev => {
            const allSelected = filteredIds.every(id => prev.includes(id));
            if (allSelected) {
                return prev.filter(id => !filteredIds.includes(id));
            } else {
                return [...new Set([...prev, ...filteredIds])];
            }
        });
    };

    const handleSaveAssignments = async () => {
        setAllotSaving(true);
        try {
            await assignUsersApi(allotStructure.id, assignedUserIds);
            toast.success(`Employees assigned to "${allotStructure.name}"`);
            setIsAllotModalOpen(false);
            fetchStructures();
        } catch (error) {
            toast.error('Failed to save assignments');
        } finally {
            setAllotSaving(false);
        }
    };

    const filteredStructures = structures.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Salary Structure</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">Define structures and assign components</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium shadow-lg text-[14px] hover:bg-primary-hover transition-all"
                >
                    <Plus size={18} />
                    Add new structure
                </button>
            </div>

            {/* Structure Grid */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <SalaryStructureSkeleton count={3} />
                ) : filteredStructures.length === 0 ? (
                    <NoData
                        title="No Salary Structures Found"
                        description="You haven't defined any salary structures yet. Create one to start managing payroll batching."
                        onAction={() => handleOpenModal()}
                        actionText="Create Structure"
                    />
                ) : filteredStructures.map(s => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[15px] p-6 border border-gray-200 transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                                    <span className={`w-3 h-3 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tooltip text="Clone Structure">
                                            <button onClick={() => handleCloneStructure(s)} className="p-2 hover:bg-violet-50 rounded-lg text-violet-600">
                                                <Copy size={16} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text="Edit Structure">
                                            <button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-gray-50 rounded-lg text-blue-600">
                                                <Edit2 size={16} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text="Delete Structure">
                                            <button onClick={() => handleDeleteClick(s)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Earnings</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(s.components || []).filter(c => c.type === 'Earning').map(c => (
                                                <span key={c.id} className="px-3 py-0.5 bg-blue-600 text-white text-[12px] font-medium rounded-full">
                                                    {c.name}
                                                </span>
                                            ))}
                                            {(s.components || []).filter(c => c.type === 'Earning').length === 0 && (
                                                <span className="text-[12px] text-gray-400 italic font-medium">No earnings added</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Deductions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(s.components || []).filter(c => c.type === 'Deduction').map(c => (
                                                <span key={c.id} className="px-3 py-0.5 bg-emerald-600 text-white text-[12px] font-medium rounded-full">
                                                    {c.name}
                                                </span>
                                            ))}
                                            {(s.components || []).filter(c => c.type === 'Deduction').length === 0 && (
                                                <span className="text-[12px] text-gray-400 italic font-medium">No deductions added</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-6 shrink-0">
                                <button
                                    onClick={() => handleManageComponents(s)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-100 transition-all border border-gray-100"
                                >
                                    <Settings size={15} />
                                    Manage Components
                                </button>
                                <button
                                    onClick={() => handleAllotUsers(s)}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-xl text-[13px] font-semibold hover:bg-violet-100 transition-all border border-violet-100"
                                >
                                    <UserPlus size={15} />
                                    Allot Employees ({assignedCounts[s.id] || 0})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Component Management Modal */}
            <AnimatePresence>
                {isComponentModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div className="bg-white rounded-[15px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Manage Components — {selectedStructure?.name}</h2>
                                <button onClick={() => setIsComponentModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700 mb-3 text-blue-600">Available Earnings</h3>
                                    <div className="space-y-2">
                                        {allComponents.filter(c => c.type === 'Earning').map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => toggleComponent(c.id)}
                                                className={`p-3 rounded-[10px] border border-gray-200 cursor-pointer transition-all hover:bg-gray-50 flex items-center justify-between ${selectedComponentIds.includes(c.id) ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-sm font-semibold">{c.name}</span>
                                                {selectedComponentIds.includes(c.id) && <Check size={16} className="text-primary" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700 mb-3 text-emerald-600">Available Deductions</h3>
                                    <div className="space-y-2">
                                        {allComponents.filter(c => c.type === 'Deduction').map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => toggleComponent(c.id)}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedComponentIds.includes(c.id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-sm font-semibold">{c.name}</span>
                                                {selectedComponentIds.includes(c.id) && <Check size={16} className="text-emerald-500" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                                <button onClick={() => setIsComponentModalOpen(false)} className="px-6 py-2 rounded-full font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all">Cancel</button>
                                <button onClick={saveComponentAssignments} disabled={submitLoading} className="px-8 py-2 bg-primary text-white rounded-full font-medium shadow-lg hover:bg-primary-hover transition-all">
                                    {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create/Edit Structure Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-700">{selectedStructure ? 'Edit Salary Structure' : 'Create New Salary Structure'}</h2>
                                    <p className="text-[12px] text-gray-500 font-medium">Define structure details and assign salary components</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={22} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        {/* Left Side: Basic Info */}
                                        <div className="lg:col-span-4 space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider mb-3">Basic Information</h3>
                                                <div className="bg-gray-50/50 p-4 rounded-[15px] border border-gray-100 space-y-5">
                                                    <FormInput
                                                        label="Structure Name"
                                                        placeholder="e.g. Standard Monthly Structure"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <FormInput
                                                        label="Batch Code"
                                                        placeholder="e.g. BATCH-001"
                                                        name="batch"
                                                        value={formData.batch}
                                                        onChange={handleChange}
                                                    />
                                                    <FormSelect
                                                        label="Allocation Day"
                                                        name="allocation_day"
                                                        value={formData.allocation_day}
                                                        onChange={handleChange}
                                                        options={Array.from({ length: 31 }, (_, i) => ({
                                                            value: i + 1,
                                                            label: `${i + 1}${getOrdinalSuffix(i + 1)}`
                                                        }))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Components */}
                                        <div className="lg:col-span-8 space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider mb-3">Salary Components</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Earnings */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between px-1">
                                                            <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                                                                Available Earnings
                                                            </h4>
                                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                                                                {allComponents.filter(c => c.type === 'Earning' && selectedComponentIds.includes(c.id)).length} Selected
                                                            </span>
                                                        </div>
                                                        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-3 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                                                            {allComponents.filter(c => c.type === 'Earning').length === 0 ? (
                                                                <p className="text-center py-8 text-gray-400 text-xs italic font-medium">No earnings available</p>
                                                            ) : allComponents.filter(c => c.type === 'Earning').map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={() => toggleComponent(c.id)}
                                                                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedComponentIds.includes(c.id)
                                                                        ? 'border-blue-600 bg-blue-50/30'
                                                                        : 'border-white bg-white hover:border-blue-100'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-sm font-semibold ${selectedComponentIds.includes(c.id) ? 'text-blue-700' : 'text-gray-700'}`}>{c.name}</span>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedComponentIds.includes(c.id)
                                                                        ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200'
                                                                        : 'border-gray-200 group-hover:border-blue-300'
                                                                        }`}>
                                                                        {selectedComponentIds.includes(c.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Deductions */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between px-1">
                                                            <h4 className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                                                Available Deductions
                                                            </h4>
                                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">
                                                                {allComponents.filter(c => c.type === 'Deduction' && selectedComponentIds.includes(c.id)).length} Selected
                                                            </span>
                                                        </div>
                                                        <div className="bg-gray-50/50 rounded-[15px] border border-gray-100 p-3 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                                                            {allComponents.filter(c => c.type === 'Deduction').length === 0 ? (
                                                                <p className="text-center py-8 text-gray-400 text-xs italic font-medium">No deductions available</p>
                                                            ) : allComponents.filter(c => c.type === 'Deduction').map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={() => toggleComponent(c.id)}
                                                                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between group ${selectedComponentIds.includes(c.id)
                                                                        ? 'border-emerald-600 bg-emerald-50/30'
                                                                        : 'border-white bg-white hover:border-emerald-100'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-sm font-semibold ${selectedComponentIds.includes(c.id) ? 'text-emerald-700' : 'text-gray-700'}`}>{c.name}</span>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedComponentIds.includes(c.id)
                                                                        ? 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-200'
                                                                        : 'border-gray-200 group-hover:border-emerald-300'
                                                                        }`}>
                                                                        {selectedComponentIds.includes(c.id) && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3 sticky bottom-0">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 rounded-full text-gray-600 font-medium text-sm hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="px-10 py-2.5 bg-primary text-white rounded-full font-medium text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {submitLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            selectedStructure ? 'Update Structure' : 'Create Structure'
                                        )}
                                    </button>
                                </div>
                            </form>
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

                            {/* Search */}
                            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search employees by name, ID, department..."
                                        value={allotSearchTerm}
                                        onChange={(e) => setAllotSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-1 focus:ring-violet-200 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-2 text-[11px] font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full border border-violet-100 transition-all whitespace-nowrap"
                                >
                                    {filteredAllotUsers.length > 0 && filteredAllotUsers.every(u => assignedUserIds.includes(u.id))
                                        ? 'Deselect All'
                                        : 'Select All'
                                    }
                                </button>
                            </div>

                            <div className="px-5 py-2 bg-violet-50/50 border-b border-violet-100 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-violet-700">
                                    <span className="text-violet-900 text-[15px]">{assignedUserIds.length}</span> employee(s) selected
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                                {allotLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 size={28} className="animate-spin text-violet-500" />
                                    </div>
                                ) : filteredAllotUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                        <Users size={40} className="opacity-20 mb-3" />
                                        <p className="font-semibold text-sm">No employees found</p>
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
                                                    className={`flex items-center gap-4 px-5 py-3 transition-all ${isAlreadyAssignedElsewhere ? 'opacity-50 cursor-not-allowed bg-gray-50/30' : 'cursor-pointer'} ${isSelected ? 'bg-violet-50/60' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white'}`}>
                                                        {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{user.employee_name || user.name}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{user.emp_id} • {user.department_name}</p>
                                                    </div>

                                                    {isAlreadyAssignedElsewhere && (
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase">Other Batch</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                                <button onClick={() => setIsAllotModalOpen(false)} className="px-6 py-2.5 rounded-full font-medium text-[14px] text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
                                <button onClick={handleSaveAssignments} disabled={allotSaving} className="px-8 py-2.5 bg-violet-600 text-white rounded-full font-medium text-[14px] shadow-xs shadow-violet-600/20 active:scale-95 disabled:opacity-70 hover:bg-violet-700">
                                    {allotSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Assignments'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Structure"
                message={`Delete "${structureToDelete?.name}"?`}
                type="danger"
            />
        </div>
    );
}
