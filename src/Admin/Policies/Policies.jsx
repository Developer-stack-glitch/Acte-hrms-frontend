import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Plus,
    Download,
    Trash2,
    Edit,
    X,
    Upload,
    FilePlus,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPoliciesApi, createPolicyApi, updatePolicyApi, deletePolicyApi, API_URL } from '../../Action/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { FormInput, FormSelect } from '../../Common/Form';
import DualPanelSkeleton from '../../Common/CommonSkeletonLoader/DualPanelSkeleton';

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'header': [1, 2, 3, false] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const CATEGORIES = ['HR', 'Security', 'Finance', 'Operations', 'General'];

const Policies = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'HR',
        file: null
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = userInfo.role === 'admin' || userInfo.role === 'superadmin';

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async (activeId = null) => {
        // Only show main loader if there's no data yet
        if (policies.length === 0) setLoading(true);

        try {
            const response = await getPoliciesApi();
            const data = response.data;
            setPolicies(data);

            if (activeId) {
                const active = data.find(p => p.id === activeId);
                if (active) setSelectedPolicy(active);
            } else if (data.length > 0 && !selectedPolicy) {
                setSelectedPolicy(data[0]);
            } else if (selectedPolicy) {
                const updated = data.find(p => p.id === selectedPolicy.id);
                if (updated) setSelectedPolicy(updated);
            }
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleOpenModal = (policy = null) => {
        if (policy) {
            setIsEditMode(true);
            setFormData({
                id: policy.id,
                title: policy.title,
                description: policy.description || '',
                category: policy.category || 'HR',
                file: null
            });
        } else {
            setIsEditMode(false);
            setFormData({ title: '', description: '', category: 'HR', file: null });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title) {
            toast.error('Please provide a title');
            return;
        }

        setSubmitting(true);
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        if (formData.file) data.append('file', formData.file);

        try {
            let res;
            if (isEditMode) {
                res = await updatePolicyApi(formData.id, data);
                toast.success('Policy updated successfully');
            } else {
                res = await createPolicyApi(data);
                toast.success('Policy added successfully');
            }
            setIsModalOpen(false);

            // Immediately update list and select the new/updated policy
            const targetId = isEditMode ? formData.id : res.data.policyId;
            fetchPolicies(targetId);
        } catch (error) {
            console.error('Error saving policy:', error);
            toast.error('Failed to save policy');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this policy?')) return;

        try {
            await deletePolicyApi(id);
            toast.success('Policy deleted successfully');
            if (selectedPolicy?.id === id) setSelectedPolicy(null);
            fetchPolicies();
        } catch (error) {
            console.error('Error deleting policy:', error);
            toast.error('Failed to delete policy');
        }
    };

    if (loading && policies.length === 0) {
        return <DualPanelSkeleton />;
    }

    const cleanHtml = (html) => {
        if (!html) return '';

        return html
            .replace(/&nbsp;/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/\n/g, '')
            .trim();
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Top Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Policies</h1>
                    <p className="text-sm text-gray-400 font-medium">View, create and edit all policies</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <div className="p-1 bg-green-50 text-green-600 rounded">
                            <FilePlus size={16} />
                        </div>
                        Create Policies
                    </button>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="flex-shrink-0 w-[280px] lg:w-[320px] border-r border-gray-100 flex flex-col bg-white">
                    <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {policies.map((policy) => (
                            <button
                                key={policy.id}
                                onClick={() => setSelectedPolicy(policy)}
                                className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 group ${selectedPolicy?.id === policy.id
                                    ? 'bg-gray-50 text-primary'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                    }`}
                            >
                                <div className={`w-1 h-6 rounded-full transition-all ${selectedPolicy?.id === policy.id ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-200'
                                    }`} />
                                <span className="text-sm font-semibold truncate">{policy.title}</span>
                            </button>
                        ))}
                        {policies.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm italic">
                                No policies added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar bg-white">
                    {selectedPolicy ? (
                        <div className="max-w-[1000px] mx-auto p-6 pb-10">
                            <div className="flex justify-between items-start mb-0 pb-4 border-b border-gray-50">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedPolicy.title}</h2>
                                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded">{selectedPolicy.category || 'General'}</span>
                                        <span>Updated: {new Date(selectedPolicy.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAdmin && (
                                        <>
                                            <button
                                                onClick={() => handleOpenModal(selectedPolicy)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Policy"
                                            >
                                                <Edit size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(selectedPolicy.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Policy"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                    {selectedPolicy.file_url && (
                                        <a
                                            href={`${API_URL}${selectedPolicy.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                {selectedPolicy.description ? (
                                    <div
                                        className="policy-content text-gray-700 leading-relaxed space-y-4"
                                        dangerouslySetInnerHTML={{
                                            __html: cleanHtml(selectedPolicy.description)
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                        No detailed description provided for this policy.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                            <ShieldCheck size={64} strokeWidth={1} />
                            <p className="font-medium">Select a policy from the sidebar to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal - Large with Rich Text Editor */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[800px] max-h-[90vh] bg-white rounded-[15px] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800">{isEditMode ? 'Edit Policy' : 'Create New Policy'}</h2>
                                    <p className="text-gray-500 font-medium text-sm">Add detailed documentation and files.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1 mb-3">Policy Title</label>
                                        <FormInput
                                            className='mt-2'
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Leave Policy"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Category</label>
                                        <FormSelect
                                            className='mt-2'
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Detailed Content</label>
                                    <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden min-h-[300px] mt-3">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.description}
                                            onChange={(val) => setFormData({ ...formData, description: val })}
                                            modules={quillModules}
                                            className="h-[250px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Upload PDF Document (Optional)</label>
                                    <div className="relative mt-2">
                                        <input type="file" onChange={handleFileChange} className="hidden" id="policy-file" />
                                        <label
                                            htmlFor="policy-file"
                                            className="w-full p-4 flex items-center justify-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 hover:border-primary/30 transition-all"
                                        >
                                            <Upload size={20} className="text-primary" />
                                            <span className="text-sm font-semibold text-gray-600">
                                                {formData.file ? formData.file.name : 'Click to upload PDF or Document'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-medium hover:bg-gray-50 rounded-full transition-all">Cancel</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {submitting ? 'Saving...' : (isEditMode ? 'Update Policy' : 'Publish Policy')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .policy-content { word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
                .policy-content h1 { font-size: 2.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827; }
                .policy-content h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1rem; margin-bottom: 1rem; color: #1f2937; }
                .policy-content h3 { font-size: 1.5rem; font-weight: 400; margin-top: 1rem; margin-bottom: 0.75rem; color: #374151; }
                .policy-content p { margin-bottom: 1rem; word-break: break-word; }
                .policy-content ul, .policy-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
                .policy-content ul { list-style-type: disc; }
                .policy-content ol { list-style-type: decimal; }
                .policy-content li { margin-bottom: 0.5rem; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
                .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f1f5f9 !important; background: #f8fafc !important; border-radius: 16px 16px 0 0 !important; padding: 12px !important; }
                .ql-container.ql-snow { border: none !important; font-family: inherit !important; font-size: 14px !important; }
                .ql-editor { min-height: 200px; padding: 20px !important; }
            `}</style>
        </div>
    );
};

export default Policies;