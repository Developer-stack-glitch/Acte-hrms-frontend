import React, { useState, useEffect, useMemo } from 'react';
import {
    Trash2,
    Loader2,
    X,
    Info,
    AlertCircle,
    Eye,
    Edit,
    CheckCheckIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    getSalaryFormulasApi,
    createSalaryFormulaApi,
    updateSalaryFormulaApi,
    deleteSalaryFormulaApi,
    validateSalaryFormulaApi,
    getSalaryComponentsApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormTextarea } from '../../Common/Form';
import ConfirmationModal from '../../Common/ConfirmationModal';
import Tooltip from '../../Common/Tooltip';
import DataTable from '../../Common/DataTable';

const ValidationModal = ({ isOpen, onClose, formula, formulaId, companyId, onSuccess }) => {
    const [testCTC, setTestCTC] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setResult(null);
        }
    }, [isOpen, formula]);

    const handleTest = async () => {
        if (!testCTC) return toast.error('Enter a sample CTC');
        setLoading(true);
        try {
            const response = await validateSalaryFormulaApi({
                formula,
                test_ctc: Number(testCTC),
                company_id: companyId
            });
            setResult(response.data);
        } catch (error) {
            toast.error('Validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkValidated = async () => {
        if (!formulaId) return;
        setValidating(true);
        try {
            await updateSalaryFormulaApi(formulaId, { status: 'VALIDATED' });
            toast.success('Formula status updated to VALIDATED');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[15px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Validate New Formula</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <p className="text-[14px] text-gray-500 font-medium italic">
                            Formula: <span className="text-primary font-bold">{formula}</span>
                        </p>
                        <FormInput
                            label="Enter a sample Annual CTC to test with:"
                            name="test_ctc"
                            value={testCTC}
                            onChange={(e) => setTestCTC(e.target.value)}
                            placeholder="e.g., 600000"
                            type="number"
                        />
                        <button
                            onClick={handleTest}
                            disabled={loading || !testCTC}
                            className="w-full py-3 bg-sky-500 text-white rounded-full font-medium hover:bg-sky-600 transition-all shadow-md disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Test Formula'}
                        </button>
                    </div>

                    <div className="mt-4 p-5 bg-gray-50 rounded-[15px] min-h-[100px] border border-gray-100 flex flex-col justify-center">
                        {result ? (
                            result.success ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-emerald-600 font-black text-[15px]">Validation Successful!</h3>
                                        <div className="text-emerald-800 font-black text-[14px]">
                                            Result: {Number(result.result).toFixed(0)}
                                        </div>
                                        <p className="text-[13px] text-emerald-700/80 font-bold">Calculation Process:</p>
                                    </div>
                                    <ul className="space-y-1.5 list-none">
                                        {result.processSteps?.map((step, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[12.5px] text-emerald-700/90 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <span dangerouslySetInnerHTML={{ __html: step.replace(/`([^`]+)`/g, '<code class="bg-emerald-100/50 px-1 rounded text-emerald-900">$1</code>') }} />
                                            </li>
                                        ))}
                                    </ul>
                                    {formulaId && (
                                        <button
                                            onClick={handleMarkValidated}
                                            disabled={validating}
                                            className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            {validating ? <Loader2 className="animate-spin" /> : <CheckCheckIcon size={18} />}
                                            Mark as Validated
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2 text-rose-600 font-semibold text-sm">
                                        <AlertCircle size={16} className="mt-0.5" />
                                        <span>Validation Failed</span>
                                    </div>
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[13px] font-medium">
                                        {result.error}
                                    </div>
                                    {result.processSteps && (
                                        <ul className="space-y-1.5 list-none">
                                            {result.processSteps.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[12px] text-gray-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )
                        ) : (
                            <p className="text-[13px] text-gray-400 text-center font-medium">
                                Enter a CTC and click "Test Formula" to see the result here.
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ViewFormulaModal = ({ isOpen, onClose, formula }) => {
    if (!isOpen || !formula) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[15px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">View Formula</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="text-[17px] font-medium text-gray-900">
                            <span className="font-semibold">Formula Name:</span> {formula.name}
                        </div>

                        <div className="h-px bg-gray-100 w-full" />

                        <div className="space-y-3">
                            <div className="text-[17px] font-semibold text-gray-900">Formula String:</div>
                            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100/50">
                                <code className="text-[15px] text-gray-700 font-mono tracking-wide break-all">
                                    {formula.formula}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default function SalaryFormulas() {
    const [formulas, setFormulas] = useState([]);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formulaToDelete, setFormulaToDelete] = useState(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [validationFormula, setValidationFormula] = useState('');
    const [validationFormulaId, setValidationFormulaId] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingFormula, setViewingFormula] = useState(null);
    const [editingFormula, setEditingFormula] = useState(null);

    const userInfo = useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const companyId = userInfo.company;

    const [formData, setFormData] = useState({
        name: '',
        formula: '',
        status: 'PENDING'
    });

    useEffect(() => {
        fetchFormulas();
        fetchComponents();
    }, []);

    const fetchFormulas = async () => {
        setLoading(true);
        try {
            const response = await getSalaryFormulasApi({ company_id: companyId });
            setFormulas(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to fetch formulas');
        } finally {
            setLoading(false);
        }
    };

    const fetchComponents = async () => {
        try {
            const response = await getSalaryComponentsApi({ company_id: companyId });
            setComponents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch components', error);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.name || !formData.formula) return toast.error('Check required fields');

        setSubmitLoading(true);
        try {
            const data = { ...formData, company_id: companyId };
            if (editingFormula) {
                await updateSalaryFormulaApi(editingFormula.id, data);
                toast.success('Formula updated');
            } else {
                await createSalaryFormulaApi(data);
                toast.success('Formula saved');
            }
            setFormData({ name: '', formula: '', status: 'PENDING' });
            setEditingFormula(null);
            fetchFormulas();
        } catch (error) {
            toast.error('Failed to save formula');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (f) => {
        setEditingFormula(f);
        setFormData({
            name: f.name,
            formula: f.formula,
            status: f.status
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (f) => {
        setFormulaToDelete(f);
        setIsDeleteModalOpen(true);
    };

    const columns = [
        {
            header: 'S.No.',
            render: (_, __, index) => <span className="text-[14px] font-medium text-gray-600">{index + 1}</span>
        },
        {
            header: 'Name',
            key: 'name',
            render: (val, f) => (
                <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-gray-800">{val}</span>
                    <code className="text-[11px] text-primary/100 font-mono mt-0.5">{f.formula}</code>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${val === 'VALIDATED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {val}
                </span>
            )
        }
    ];

    const extraActions = (f) => (
        <Tooltip text="Check Formula">
            <button
                onClick={() => {
                    setValidationFormula(f.formula);
                    setValidationFormulaId(f.id);
                    setIsValidationModalOpen(true);
                }}
                className="h-8 w-8 hover:bg-green-50 rounded-lg text-green-600 flex items-center justify-center"
            >
                <CheckCheckIcon size={16} />
            </button>
        </Tooltip>
    );

    const handleDeleteConfirm = async () => {
        try {
            await deleteSalaryFormulaApi(formulaToDelete.id);
            toast.success('Formula deleted');
            fetchFormulas();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete formula');
        }
    };

    return (
        <div className="p-3 space-y-8 mx-auto">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-[15px] border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <FormInput
                        label="Enter formula name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Santhosh kathirvel"
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-gray-700 ml-1">Write Formula <span className="text-red-500">*</span></label>
                        <FormTextarea
                            className='mt-2'
                            name="formula"
                            value={formData.formula}
                            onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                            placeholder="{Basic}*0.9"
                            required
                        />
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-medium px-1 mt-1 leading-relaxed">
                            <Info size={12} className="shrink-0" />
                            Available tokens:
                            <span className="text-primary font-bold">{` {CTC},`}</span>
                            {components.map((c, i) => (
                                <span key={i} className="text-primary font-bold">
                                    {` {${c.name}}${i < components.length - 1 ? ',' : ''}`}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => {
                            setValidationFormula(formData.formula);
                            setValidationFormulaId(editingFormula?.id || null);
                            setIsValidationModalOpen(true);
                        }}
                        disabled={!formData.formula}
                        className="px-8 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        Validate
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={submitLoading || !formData.name || !formData.formula}
                        className="px-8 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitLoading && <Loader2 size={16} className="animate-spin" />}
                        {editingFormula ? 'Update Formula' : 'Save Formula'}
                    </button>
                    {editingFormula && (
                        <button
                            onClick={() => {
                                setEditingFormula(null);
                                setFormData({ name: '', formula: '', status: 'PENDING' });
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Manage Formulas</h2>
                <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={formulas}
                        isLoading={loading}
                        onView={(f) => {
                            setViewingFormula(f);
                            setIsViewModalOpen(true);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        extraActions={extraActions}
                        emptyMessage="No formulas found. Create your first salary calculation formula."
                    />
                </div>
            </div>

            <ValidationModal
                isOpen={isValidationModalOpen}
                onClose={() => setIsValidationModalOpen(false)}
                formula={validationFormula}
                formulaId={validationFormulaId}
                companyId={companyId}
                onSuccess={fetchFormulas}
            />

            <ViewFormulaModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingFormula(null);
                }}
                formula={viewingFormula}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Formula"
                message={`Are you sure you want to delete "${formulaToDelete?.name}"?`}
                type="danger"
            />
        </div>
    );
}
