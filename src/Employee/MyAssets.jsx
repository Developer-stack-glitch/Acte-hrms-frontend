import React, { useState, useEffect } from 'react';
import { Monitor, Laptop, Mouse, Smartphone, Cpu, Box, Calendar, ScrollText, CheckCircle2, ShieldCheck, Tag, Plus, X, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyAssetsApi, getAssetCategoriesApi, createAssetRequestApi, getMyAssetRequestsApi } from '../Action/api';
import toast from 'react-hot-toast';
import MyAssetsSkeleton from '../Common/CommonSkeletonLoader/MyAssetsSkeleton';
import { FormInput, FormSelect, FormTextarea } from '../Common/Form';

import DataTable from '../Common/DataTable';

const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
        case 'laptop': return <Laptop size={24} />;
        case 'monitor': return <Monitor size={24} />;
        case 'accessory': return <Mouse size={24} />;
        case 'tablet': return <Smartphone size={24} />;
        case 'mobile': return <Smartphone size={24} />;
        default: return <Cpu size={24} />;
    }
};

const getStatusStyles = (status) => {
    switch (status) {
        case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'Approved': return <CheckCircle size={14} />;
        case 'Rejected': return <XCircle size={14} />;
        default: return <Clock size={14} />;
    }
};

export default function MyAssets() {
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        asset_name: '',
        asset_category_id: '',
        reason: ''
    });
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [viewingReason, setViewingReason] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsRes, requestsRes, categoriesRes] = await Promise.all([
                getMyAssetsApi(),
                getMyAssetRequestsApi(),
                getAssetCategoriesApi()
            ]);
            setAssets(assetsRes.data || []);
            setRequests(requestsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load asset information');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!formData.asset_name || !formData.reason) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await createAssetRequestApi(formData);
            toast.success('Asset request submitted successfully');
            setIsModalOpen(false);
            setFormData({ asset_name: '', asset_category_id: '', reason: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <MyAssetsSkeleton />;

    return (
        <div className="p-4 md:p-4 space-y-12 mb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Assets Management</h2>
                    <p className="text-gray-500 mt-2 text-md font-medium">Manage your assigned equipment and request new assets.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all shadow-xs shadow-primary/20 active:scale-95"
                >
                    <Plus size={20} />
                    Request New Asset
                </button>
            </div>

            {/* Assigned Assets Section */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 bg-primary/5 rounded-xl text-primary">
                        <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Assigned Assets</h3>
                </div>

                {assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assets.map((asset, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={asset.db_id}
                                className="bg-white rounded-[15px] border border-gray-200 overflow-hidden group transition-all duration-500"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-[10px] bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 ring-8 ring-primary/5">
                                            {getCategoryIcon(asset.category)}
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-semibold border border-emerald-100 flex items-center gap-1.5">
                                            <ShieldCheck size={14} /> Assigned
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-[10px] uppercase tracking-[0.2em] opacity-60">
                                            <Tag size={12} /> {asset.category}
                                        </div>
                                        <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-primary transition-colors">{asset.name}</h3>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 text-gray-500 text-sm font-semibold">
                                                <ScrollText size={18} className="text-gray-300" />
                                                Serial Number
                                            </div>
                                            <span className="text-gray-900 font-mono text-xs bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 font-bold">{asset.serial}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 text-gray-500 text-sm font-semibold">
                                                <Calendar size={18} className="text-gray-300" />
                                                Assigned On
                                            </div>
                                            <span className="text-gray-900 font-semibold text-sm">
                                                {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2.5 text-[12px] text-gray-600 font-semibold justify-center">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    Verified in your possession
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-[20px] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-5 text-gray-300">
                            <Box size={48} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No assets assigned yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Once equipment is assigned to you, it will appear here.</p>
                    </div>
                )}
            </section>

            {/* Recent Requests Section */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-amber-500/5 rounded-xl text-amber-500">
                        <Clock size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Recent Requests</h3>
                </div>

                <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
                    <DataTable
                        columns={[
                            {
                                header: 'Asset Name',
                                key: 'asset_name',
                                render: (val) => <div className="font-semibold text-gray-900">{val}</div>
                            },
                            {
                                header: 'Category',
                                key: 'category_name',
                                render: (val) => (
                                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                                        {val || 'General'}
                                    </span>
                                )
                            },
                            {
                                header: 'Request Date',
                                key: 'created_at',
                                render: (val) => (
                                    <div className="text-sm font-semibold text-gray-600">
                                        {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )
                            },
                            {
                                header: 'Status',
                                key: 'status',
                                render: (val, row) => (
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 w-fit ${getStatusStyles(val)}`}>
                                            {getStatusIcon(val)}
                                            {val}
                                        </span>
                                        {val === 'Rejected' && row.rejection_reason && (
                                            <div className="flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-lg w-fit">
                                                <div className="text-[10px] text-rose-500 font-semibold italic truncate max-w-[120px] leading-tight" title={row.rejection_reason}>
                                                    Note: {row.rejection_reason}
                                                </div>
                                                {row.rejection_reason.length > 20 && (
                                                    <button
                                                        onClick={() => {
                                                            setViewingReason(row.rejection_reason);
                                                            setIsReasonModalOpen(true);
                                                        }}
                                                        className="p-0.5 hover:bg-rose-100 rounded-full text-rose-500 transition-colors"
                                                        title="View full note"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                header: 'Reason',
                                key: 'reason',
                                render: (val) => (
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-gray-500 font-medium max-w-[200px] truncate" title={val}>
                                            {val}
                                        </div>
                                        {val && val.length > 25 && (
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
                            }
                        ]}
                        data={requests}
                        isLoading={loading}
                        emptyMessage="NO RECENT REQUESTS FOUND"
                    />
                </div>
            </section>

            {/* Request Modal */}
            {/* Request Asset Side Drawer */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] mb-0"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Request Asset</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Equipment Request</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRequestSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="space-y-3 mb-4">
                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Asset Name / Type <span className='text-rose-500'>*</span></label>
                                    <FormInput
                                        required
                                        type="text"
                                        value={formData.asset_name}
                                        onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                                        placeholder="e.g. MacBook Pro M3, Ergonomic Chair"
                                        className="h-12 text-sm font-semibold border-gray-100 bg-gray-50/30 focus:bg-white transition-all mt-1"
                                    />
                                </div>

                                <div className="space-y-3 mb-4">
                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Category <span className='text-rose-500'>*</span></label>
                                    <FormSelect
                                        required
                                        value={formData.asset_category_id}
                                        onChange={(e) => setFormData({ ...formData, asset_category_id: e.target.value })}
                                        className="h-12 text-sm font-semibold border-gray-100 bg-gray-50/30 focus:bg-white transition-all mt-1"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </FormSelect>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[14px] font-semibold text-gray-700 ml-1">Reason for Request <span className='text-rose-500'>*</span></label>
                                    <FormTextarea
                                        required
                                        rows={6}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Explain why you need this asset..."
                                        className="text-sm font-semibold border-gray-100 bg-gray-50/30 focus:bg-white transition-all resize-none mt-1"
                                    />
                                </div>
                            </form>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white text-gray-600 rounded-full font-medium text-[15px] border border-gray-200 hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestSubmit}
                                    type="button"
                                    disabled={isSubmitting}
                                    className="flex-[1.5] py-2.5 bg-primary text-white rounded-full font-medium text-[15px] border border-gray-200 hover:bg-primary-hover transition-all shadow-xs shadow-primary/10 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle size={14} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Footer Policy Card */}
            <div className="p-4 bg-primary/5 rounded-[15px] border border-primary/10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h4 className="text-gray-900 font-semibold text-xl mb-1">Company Asset Policy</h4>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">
                        Assets are company property and should be used for business purposes only. All requests are subject to approval by the department head and IT administration. In case of loss or damage, please report it immediately.
                    </p>
                </div>
            </div>
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
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                                        <Eye size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Detail View</h3>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Extended Information</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsReasonModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="text-[15px] font-medium text-gray-600 leading-relaxed italic min-h-[120px] flex items-center justify-center text-center">
                                    "{viewingReason}"
                                </div>
                            </div>

                            <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30">
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
