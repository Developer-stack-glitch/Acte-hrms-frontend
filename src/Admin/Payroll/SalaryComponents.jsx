import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Blocks,
    Loader2,
    X,
    TrendingUp,
    TrendingDown,
    Save,
    Calculator,
    GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    getSalaryComponentsApi,
    createSalaryComponentApi,
    updateSalaryComponentApi,
    deleteSalaryComponentApi,
    getSalaryFormulasApi,
    bulkUpdateSalaryComponentOrderApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Tooltip from '../../Common/Tooltip';
import NoData from '../../Common/NoData';
// import DataTable from '../../Common/DataTable'; // Not needed if we use Reorder.Group

export default function SalaryComponents() {
    const navigate = useNavigate();
    const [components, setComponents] = useState([]);
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [componentToDelete, setComponentToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('Earnings'); // 'Earnings' or 'Deductions'

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        name: '',
        type: 'Earning',
        calculation_type: 'Variable',
        calculation_value: '',
        is_active: 1,
        sort_order: 0
    });

    useEffect(() => {
        fetchComponents();
        fetchFormulas();
    }, []);

    const fetchFormulas = async () => {
        try {
            const response = await getSalaryFormulasApi({ company_id: companyId });
            setFormulas(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch formulas', error);
        }
    };

    const fetchComponents = async () => {
        setLoading(true);
        try {
            const response = await getSalaryComponentsApi({ company_id: companyId });
            setComponents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to fetch salary components');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (component = null) => {
        fetchFormulas();
        if (component) {
            setSelectedComponent(component);
            setFormData({
                name: component.name,
                type: component.type,
                calculation_type: component.calculation_type,
                calculation_value: component.calculation_value || '',
                is_active: component.is_active,
                sort_order: component.sort_order || 0
            });
        } else {
            setSelectedComponent(null);
            const maxOrder = Math.max(0, ...components.filter(c => c.type === (activeTab === 'Earnings' ? 'Earning' : 'Deduction')).map(c => c.sort_order || 0));
            setFormData({
                name: '',
                type: activeTab === 'Earnings' ? 'Earning' : 'Deduction',
                calculation_type: 'Variable',
                calculation_value: '',
                is_active: 1,
                sort_order: maxOrder + 1
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedComponent(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleStatus = async (component) => {
        try {
            const newStatus = component.is_active === 1 ? 0 : 1;
            await updateSalaryComponentApi(component.id, { is_active: newStatus });
            toast.success(`Component ${newStatus === 1 ? 'activated' : 'deactivated'}`);
            fetchComponents();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const data = { ...formData, company_id: companyId };
            if (selectedComponent) {
                await updateSalaryComponentApi(selectedComponent.id, data);
                toast.success('Component updated successfully');
            } else {
                await createSalaryComponentApi(data);
                toast.success('Component created successfully');
            }
            fetchComponents();
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save component');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleReorder = async (newOrder) => {
        const reorderedWithNewSort = newOrder.map((c, index) => ({
            ...c,
            sort_order: index + 1
        }));

        // Update local state first for instant feedback
        const otherTypeComponents = components.filter(c => c.type !== (activeTab === 'Earnings' ? 'Earning' : 'Deduction'));
        const updatedComponents = [...otherTypeComponents, ...reorderedWithNewSort];
        setComponents(updatedComponents);

        try {
            const orderData = reorderedWithNewSort.map((c) => ({
                id: c.id,
                sort_order: c.sort_order
            }));
            await bulkUpdateSalaryComponentOrderApi({ orderData });
        } catch (error) {
            console.error('Failed to sync order:', error);
            toast.error('Failed to sync order with server');
            fetchComponents();
        }
    };

    const handleDeleteClick = (component) => {
        setComponentToDelete(component);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSalaryComponentApi(componentToDelete.id);
            toast.success('Component deleted successfully');
            fetchComponents();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete component');
        }
    };

    const filteredComponents = useMemo(() => {
        return components
            .filter(c =>
                c.type === (activeTab === 'Earnings' ? 'Earning' : 'Deduction') &&
                c.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }, [components, activeTab, searchTerm]);

    return (
        <div className="p-4 space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Salary Components</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">Manage earnings and deductions patterns</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search components..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className=" pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px]"
                        />


                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all shadow-lg text-[14px]"
                    >
                        <Plus size={16} />
                        Add Components
                    </button>
                    <button
                        onClick={() => navigate('/payroll/salary-formulas')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all text-[14px]"
                    >
                        Create Formula
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100">
                {['Earnings', 'Deductions'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-[14px] font-semibold transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="active-component-tab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden min-h-[400px]">
                {/* Table Header */}
                <div className="bg-primary/4 px-6 py-4 border-b border-gray-100 flex items-center text-[11px] font-bold text-primary uppercase tracking-wider">
                    <div className="w-10"></div> {/* Drag handle space */}
                    <div className="w-16">S.NO</div>
                    <div className="flex-1">Component Name</div>
                    <div className="w-48">Calculation Type</div>
                    <div className="w-48">Value</div>
                    <div className="w-32">Status</div>
                    <div className="w-24 text-right">Action</div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="animate-spin text-primary opacity-20" />
                        <p className="text-gray-400 font-medium">Loading components...</p>
                    </div>
                ) : filteredComponents.length === 0 ? (
                    <NoData
                        title={`No ${activeTab} Found`}
                        description={`It looks like you haven't added any ${activeTab.toLowerCase()} patterns yet.`}
                        onAction={() => handleOpenModal()}
                        actionText={`Add ${activeTab.slice(0, -1)}`}
                    />
                ) : (
                    <Reorder.Group axis="y" values={filteredComponents} onReorder={handleReorder} className="divide-y divide-gray-50">
                        {filteredComponents.map((c, index) => (
                            <Reorder.Item
                                key={c.id}
                                value={c}
                                whileDrag={{
                                    scale: 1.01,
                                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                                    backgroundColor: "white",
                                    zIndex: 50
                                }}
                                className="px-6 py-4 flex items-center bg-white hover:bg-gray-50/50 transition-colors group cursor-grab active:cursor-grabbing select-none"
                            >
                                <div className="w-10 text-gray-300 group-hover:text-primary transition-colors flex items-center">
                                    <GripVertical size={18} />
                                </div>

                                <div className="w-16">
                                    <span className="text-[13px] text-gray-600 font-semibold">#{index + 1}</span>
                                </div>

                                <div className="flex-1 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.type === 'Earning' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {c.type === 'Earning' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    </div>
                                    <span className="text-[14px] font-semibold text-gray-900">{c.name}</span>
                                </div>

                                <div className="w-48 text-[13px] text-gray-600 font-medium">
                                    {c.calculation_type}
                                </div>

                                <div className="w-48 text-[13px] text-primary font-semibold">
                                    {c.calculation_type?.toLowerCase() === 'formula' ? (
                                        <Tooltip text={c.calculation_value}>
                                            <span className="hover:underline cursor-pointer">
                                                {formulas.find(f => f.formula === c.calculation_value)?.name || c.calculation_value}
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        c.calculation_value || 'Variable'
                                    )}
                                </div>

                                <div className="w-32 flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(c); }}
                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${c.is_active === 1 ? 'bg-green-500' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${c.is_active === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-[12px] font-medium ${c.is_active === 1 ? 'text-green-500' : 'text-gray-400'}`}>
                                        {c.is_active === 1 ? 'On' : 'Off'}
                                    </span>
                                </div>

                                <div className="w-24 flex items-center justify-end gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(c); }} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {selectedComponent ? 'Edit Component' : 'Add New Component'}
                                </h2>
                                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <FormInput
                                    label="Component Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Basic, HRA, Medical"
                                    required
                                />
                                <FormSelect
                                    label="Type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Earning', label: 'Earning' },
                                        { value: 'Deduction', label: 'Deduction' }
                                    ]}
                                    required
                                />
                                <FormSelect
                                    label="Calculation Type"
                                    name="calculation_type"
                                    value={formData.calculation_type}
                                    onChange={handleChange}
                                    options={[
                                        { value: 'Fixed', label: 'Fixed Amount' },
                                        { value: 'formula', label: 'formula' },
                                        { value: 'Variable', label: 'Variable (Manual)' }
                                    ]}
                                    required
                                />
                                {formData.calculation_type === 'Fixed' && (
                                    <FormInput
                                        isNumber={true}
                                        label="Amount"
                                        name="calculation_value"
                                        value={formData.calculation_value}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        icon={Calculator}
                                        required
                                    />
                                )}
                                {formData.calculation_type === 'formula' && (
                                    <FormSelect
                                        label="Choose Formula"
                                        name="calculation_value"
                                        value={formData.calculation_value}
                                        onChange={(e) => {
                                            if (e.target.value === 'create_new') {
                                                navigate('/payroll/salary-formulas');
                                            } else {
                                                handleChange(e);
                                            }
                                        }}
                                        options={[
                                            { value: '', label: 'choose Formula' },
                                            ...formulas.map(f => ({ value: f.formula, label: f.name })),
                                            { value: 'create_new', label: 'Create new' }
                                        ]}
                                        required
                                    />
                                )}

                                <FormInput
                                    label="Sort Order"
                                    name="sort_order"
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={handleChange}
                                    placeholder="0"
                                    required
                                />

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[10px]">
                                    <div className="space-y-0.5">
                                        <label className="text-[14px] font-semibold text-gray-900">Include in Payroll</label>
                                        <p className="text-[12px] text-gray-500">When turned on, this component will be added to calculations</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: prev.is_active === 1 ? 0 : 1 }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_active === 1 ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active === 1 ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2 rounded-full font-semibold text-[13px] text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-medium text-[13px] shadow-lg disabled:opacity-70 hover:bg-primary-hover transition-all"
                                    >
                                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {selectedComponent ? 'Update' : 'Save Component'}
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
                onConfirm={handleDeleteConfirm}
                title="Delete Component"
                message={`Are you sure you want to delete "${componentToDelete?.name}"?`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
}
