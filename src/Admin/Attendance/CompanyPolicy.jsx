import React, { useState, useEffect } from 'react';
import {
    Save,
    Settings,
    ShieldCheck,
    Info,
    AlertCircle,
    CheckCircle2,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getCompanyPolicyApi, saveCompanyPolicyApi } from '../../Action/api';
import toast from 'react-hot-toast';

export default function CompanyPolicy() {
    const [policy, setPolicy] = useState({
        cl_limit: 0,
        permission_limit: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const userInfoData = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = userInfoData.role === 'admin' || userInfoData.role === 'superadmin';

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            const cid = parsedUser.company || parsedUser.company_id || localStorage.getItem('companyId');
            setCompanyId(cid);
            if (cid) {
                fetchPolicy(cid);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchPolicy = async (cid) => {
        setLoading(true);
        try {
            const response = await getCompanyPolicyApi(cid);
            setPolicy({
                cl_limit: response.data.cl_limit || 0,
                permission_limit: response.data.permission_limit || 0
            });
        } catch (error) {
            console.error('Error fetching company policy:', error);
            // toast.error('Failed to load company policies');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!companyId) {
            toast.error("Company information not found");
            return;
        }
        setSaving(true);
        try {
            await saveCompanyPolicyApi({
                company_id: companyId,
                cl_limit: parseFloat(policy.cl_limit),
                permission_limit: parseFloat(policy.permission_limit)
            });
            toast.success('Company policies updated successfully');
        } catch (error) {
            console.error('Error saving company policy:', error);
            toast.error('Failed to save company policies');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPolicy(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] p-6 lg:p-4 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-[15px] border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                            <Settings size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Company Policies</h1>
                    </div>
                    <p className="text-[15px] text-gray-500 font-medium max-w-xl">
                        Configure organization-wide settings for payroll allowances, leave limitations, and other global configurations.
                    </p>
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-semibold">
                        <ShieldCheck size={16} />
                        Verified Enterprise Mode
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Configuration Card */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[15px] border border-gray-200 overflow-hidden"
                    >
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Briefcase className="text-primary" size={20} />
                                Payroll Allowance Settings
                            </h2>
                            <Info size={18} className="text-gray-300" />
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* CL Allowance */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Max Casual Leave (CL) per Month
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="cl_limit"
                                            value={policy.cl_limit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[12px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold text-gray-700 text-lg shadow-inner"
                                            placeholder="e.g. 1.0"
                                            readOnly={!isAdmin}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Days</div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        The maximum number of absent days that can be covered by Casual Leave allowance during payroll calculation.
                                    </p>
                                </div>

                                {/* Permission Allowance */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Max Permission Hours (in Days)
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="permission_limit"
                                            value={policy.permission_limit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[12px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold text-gray-700 text-lg shadow-inner"
                                            placeholder="e.g. 0.2"
                                            readOnly={!isAdmin}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Days</div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Additional allowance for permissions (usually 2 hours = 0.2 days). Applied only if CL limit is reached.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                                    <AlertCircle size={18} />
                                    <span className="text-xs font-semibold uppercase tracking-tight">Changes affect future payroll runs</span>
                                </div>

                                {isAdmin && (
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`flex items-center gap-3 px-6 py-2 bg-primary text-white rounded-full font-medium hover:shadow-2xl hover:shadow-primary/10 transition-all active:scale-95 hover:bg-primary-hover text-md ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {saving ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={20} strokeWidth={2.5} />
                                        )}
                                        {saving ? 'Saving...' : 'Save Policy Changes'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#1e293b] text-white p-6 rounded-[15px] shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10">
                            <CheckCircle2 size={20} className="text-primary" />
                            How it works
                        </h3>
                        <div className="space-y-4 text-sm text-gray-300 relative z-10 font-medium leading-relaxed">
                            <p>
                                During payroll generation, the system automatically calculates "Loss of Pay" (LOP) for absent days.
                            </p>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                                    <p>First, up to <span className="text-white font-semibold">{policy.cl_limit} days</span> of absence are covered under Casual Leave allowance.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                                    <p>If they are still absent, up to <span className="text-white font-semibold">{policy.permission_limit} days</span> are covered under Permission allowance.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                                    <p>Any remaining absent days results in proportional salary deduction (LOP).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[15px] border border-gray-200">
                        <h4 className="font-semibold text-gray-600 text-[16px] mb-4">Current Active Policy</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-semibold text-gray-600">Total Allowance</span>
                                <span className="text-lg font-semibold text-primary">{(parseFloat(policy.cl_limit) + parseFloat(policy.permission_limit)).toFixed(2)} Days</span>
                            </div>
                            <p className="text-[11px] text-gray-400 text-center font-medium italic">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}