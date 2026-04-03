import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Settings2,
    ShieldCheck,
    MoreVertical,
    Edit,
    Trash2,
    Calendar,
    Users as UsersIcon,
    AlertCircle,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttendancePolicyModal from './AttendancePolicyModal';
import { getAttendancePolicyRulesApi, deleteAttendancePolicyRuleApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';

export default function LeaveRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = userInfo.role === 'admin' || userInfo.role === 'superadmin';

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await getAttendancePolicyRulesApi();
            setRules(response.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
            toast.error('Failed to load attendance policies');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleDelete = (rule) => {
        setRuleToDelete(rule);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!ruleToDelete) return;
        setIsDeleting(true);
        try {
            await deleteAttendancePolicyRuleApi(ruleToDelete.id);
            toast.success('Policy rule deleted successfully');
            fetchRules();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting rule:', error);
            toast.error('Failed to delete policy rule');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRules = rules.filter(r =>
        r.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.trigger_condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] p-6 lg:p-2 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[15px] border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Attendance Rules</h1>
                    </div>
                    <p className="text-[14px] text-gray-500 font-medium max-w-md">
                        Configure automated rules for attendance triggers, penalties, and alerts across your organization.
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-3 relative">
                        <button
                            onClick={() => {
                                setEditingRule(null);
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 shadow-md shadow-primary/10 text-sm"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Add New Rule
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Search & Stats Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Filter rules by name or condition..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full outline-none text-sm font-medium transition-all shadow-gray-200/40 focus:primary focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full">
                        <UsersIcon size={18} className="text-primary" />
                        <span className="text-sm font-bold text-gray-700">{rules.length} Active Rules</span>
                    </div>
                </div>

                {/* Rules List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse space-y-4">
                                <div className="h-6 w-3/4 bg-gray-100 rounded-lg" />
                                <div className="h-20 w-full bg-gray-50 rounded-xl" />
                                <div className="h-10 w-full bg-gray-100 rounded-xl" />
                            </div>
                        ))
                    ) : filteredRules.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Rules Found</h3>
                            <p className="text-gray-400 max-w-xs font-medium">
                                Start by creating an attendance policy rule to automate your HR workflows.
                            </p>
                        </div>
                    ) : (
                        filteredRules.map((rule) => (
                            <motion.div
                                layout
                                key={rule.id}
                                className="group bg-white p-6 rounded-[15px] border border-gray-200 hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 relative"
                            >
                                {/* Priority Badge */}
                                <div className="absolute top-6 right-6 px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-400 rounded-full border border-gray-100 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10 transition-colors">
                                    P{rule.priority}
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors leading-tight pr-10">
                                            {rule.rule_name}
                                        </h3>
                                        {rule.description && (
                                            <p className="text-[12px] text-gray-500 font-medium mt-2 line-clamp-2 italic">
                                                "{rule.description}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Logic Card */}
                                    <div className="bg-gray-50/80 rounded-[15px] p-4 border border-gray-200 group-hover:bg-white group-hover:border-primary/5 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Trigger</p>
                                                <p className="text-[13px] font-bold text-gray-700">
                                                    {rule.no_of_times}x {rule.trigger_condition}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Settings2 size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Outcome</p>
                                                <p className="text-[13px] font-bold text-gray-700">{rule.action_type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[11px] font-semibold">
                                            <UsersIcon size={14} />
                                            {rule.assigned_users?.length || 0} Assigned
                                        </div>

                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(rule)}
                                                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule)}
                                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <AttendancePolicyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRules}
                initialData={editingRule}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => !isDeleting && setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Policy Rule"
                message={`Are you sure you want to delete "${ruleToDelete?.rule_name}"? This will stop applying its logic to assigned users.`}
                confirmText="Delete Rule"
                loading={isDeleting}
                type="danger"
            />
        </div>
    );
}
