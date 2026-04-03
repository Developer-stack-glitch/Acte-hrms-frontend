import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Minus, Info, Check } from 'lucide-react';
import { getUsersApi, createAttendancePolicyRuleApi, updateAttendancePolicyRuleApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FormSelect from '../../Common/Form/FormSelect';
import FormInput from '../../Common/Form/FormInput';
import FormTextarea from '../../Common/Form/FormTextarea';

export default function AttendancePolicyModal({ isOpen, onClose, onSuccess, initialData }) {
    const [formData, setFormData] = useState({
        rule_name: '',
        priority: 2,
        description: '',
        trigger_condition: 'Absent',
        no_of_times: 3,
        within_period: 'Week(s)',
        how_many_period: 1,
        action_type: '',
        apply_to: 'All Occurrences',
        assigned_users: []
    });

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                assigned_users: initialData.assigned_users || []
            });
        } else {
            setFormData({
                rule_name: '',
                priority: 2,
                description: '',
                trigger_condition: 'Absent',
                no_of_times: 3,
                within_period: 'Week(s)',
                how_many_period: 1,
                action_type: '',
                apply_to: 'All Occurrences',
                assigned_users: []
            });
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await getUsersApi({ limit: 1000 });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUserToggle = (userId) => {
        setFormData(prev => {
            const current = [...prev.assigned_users];
            const index = current.indexOf(userId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(userId);
            }
            return { ...prev, assigned_users: current };
        });
    };

    const handleSelectAll = () => {
        if (formData.assigned_users.length === users.length) {
            setFormData(prev => ({ ...prev, assigned_users: [] }));
        } else {
            setFormData(prev => ({ ...prev, assigned_users: users.map(u => u.id) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.rule_name) return toast.error('Rule name is required');
        if (!formData.action_type) return toast.error('Please select an action');

        setSubmitting(true);
        try {
            if (initialData?.id) {
                await updateAttendancePolicyRuleApi(initialData.id, formData);
                toast.success('Policy rule updated successfully');
            } else {
                await createAttendancePolicyRuleApi(formData);
                toast.success('Policy rule created successfully');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving policy rule:', error);
            toast.error(error.response?.data?.message || 'Failed to save policy rule');
        } finally {
            setSubmitting(false);
        }
    };

    const triggerConditions = [
        'Late', 'Absent', 'Early Leave', 'Short Attendance',
        'Sandwich WO (Absent on Both Sides)', 'Sandwich WO (Absent on Either Side)',
        'Sandwich WO (N-Day Absent Streak)', 'No Presence in Entire Period',
        'Work on Week-Off/Holiday'
    ];

    const actionTypes = [
        'Mark as Half Day', 'Mark as Absent', 'Deduct Leave', 'Send Warning',
        'Send Notification', 'Apply Penalty', 'Convert Week-Offs to NPWO (Sandwich)',
        'Convert All WO/NH in Period to NPWO (Complete Absence)', 'Grant Leave (Comp Off)'
    ];

    const filteredUsers = users.filter(u =>
        u.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Plus size={20} />
                            </div>
                            {initialData ? 'Edit Attendance Policy Rule' : 'Create Attendance Policy Rule'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Create and configure attendance policy rule and assign users</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <FormInput
                                    label="Rule Name"
                                    placeholder="Enter rule name"
                                    value={formData.rule_name}
                                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: Math.max(1, formData.priority - 1) })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        className="w-full text-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={formData.priority}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: formData.priority + 1 })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Lower number = Higher priority</p>
                            </div>
                        </div>
                        <div>
                            <FormTextarea
                                label="Description"
                                placeholder="Enter description"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Condition - when to trigger */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Condition - when to trigger this rule?</h3>
                        <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl flex gap-3 text-orange-700 text-sm">
                            <Info size={18} className="shrink-0 mt-0.5" />
                            <p><strong>Example:</strong> If user is late 3 times within a week.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <FormSelect
                                    label="If user is"
                                    value={formData.trigger_condition}
                                    onChange={(e) => setFormData({ ...formData, trigger_condition: e.target.value })}
                                    options={triggerConditions.map(c => ({ value: c, label: c }))}
                                    placeholder=""
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">No of times</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, no_of_times: Math.max(1, formData.no_of_times - 1) })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        className="w-full text-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={formData.no_of_times}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, no_of_times: formData.no_of_times + 1 })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <FormSelect
                                    label="Within"
                                    value={formData.within_period}
                                    onChange={(e) => setFormData({ ...formData, within_period: e.target.value })}
                                    options={[
                                        { value: 'Week(s)', label: 'Week(s)' },
                                        { value: 'Month(s)', label: 'Month(s)' },
                                    ]}
                                    placeholder=""
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">How many</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, how_many_period: Math.max(1, formData.how_many_period - 1) })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        className="w-full text-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={formData.how_many_period}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, how_many_period: formData.how_many_period + 1 })}
                                        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Condition - what should happen */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Condition - What should happen?</h3>
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex gap-3 text-blue-700 text-sm">
                            <Info size={18} className="shrink-0 mt-0.5" />
                            <p><strong>Example:</strong> If user is late 3 times within a week, <strong>Deduct Leave</strong>.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <FormSelect
                                    label="Then"
                                    value={formData.action_type}
                                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                                    options={actionTypes.map(a => ({ value: a, label: a }))}
                                    placeholder="Select condition"
                                />
                            </div>
                            <div>
                                <FormSelect
                                    label="Apply to"
                                    value={formData.apply_to}
                                    onChange={(e) => setFormData({ ...formData, apply_to: e.target.value })}
                                    options={[
                                        { value: 'All Occurrences', label: 'All Occurrences' },
                                        { value: 'First Occurrence', label: 'First Occurrence' },
                                        { value: 'Last Occurrence', label: 'Last Occurrence' },
                                    ]}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Selection */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Select users to assign</h3>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                {formData.assigned_users.length === users.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, role, or employee code ..."
                                className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                            {loadingUsers ? (
                                <div className="p-8 text-center text-gray-500 italic">Loading employees...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No employees found matching your search.</div>
                            ) : (
                                filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserToggle(user.id)}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs border border-primary/10">
                                                {user.employee_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-semibold text-gray-800">{user.employee_name}</h4>
                                                <p className="text-[12px] font-sm text-gray-500 uppercase tracking-tight">
                                                    {user.department_name || 'No Dept'} • {user.emp_id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.assigned_users.includes(user.id)
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-200 group-hover:border-primary/30'
                                            }`}>
                                            {formData.assigned_users.includes(user.id) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-200 rounded-full font-medium text-gray-600 hover:bg-gray-100 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
                    >
                        {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {initialData ? 'Update Rule' : 'Submit'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
