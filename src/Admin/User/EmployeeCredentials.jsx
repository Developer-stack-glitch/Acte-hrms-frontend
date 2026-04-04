import React, { useState, useEffect } from 'react';
import {
    Search,
    ShieldCheck,
    Key,
    UserCog,
    RefreshCcw,
    Lock,
    Eye,
    EyeOff,
    Info,
    ArrowRight,
    Loader2,
    Sparkles,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsersApi, updateUserApi, getAllRolePermissionsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput } from '../../Common/Form';
import CardGridSkeleton from '../../Common/CommonSkeletonLoader/CardGridSkeleton';

export default function EmployeeCredentials() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
        role: ''
    });

    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    const [totalUsers, setTotalUsers] = useState(0);
    const [page, setPage] = useState(1);
    const LIMIT = 12;

    const fetchUsers = async (pageNum = 1, append = false) => {
        if (pageNum === 1 && !append) {
            setLoading(true);
        }
        try {
            const response = await getUsersApi({
                search: searchTerm,
                page: pageNum,
                limit: LIMIT
            });
            const newUsers = response.data.users || [];
            const total = response.data.total || 0;

            if (append) {
                setUsers(prev => [...prev, ...newUsers]);
            } else {
                setUsers(newUsers);
            }
            setTotalUsers(total);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchUsers(page + 1, true);
    };

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchRoles = async () => {
        try {
            setRolesLoading(true);
            const response = await getAllRolePermissionsApi();
            setRoles(response.data || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setRolesLoading(false);
        }
    };

    const handleManageCredentials = (user) => {
        if (roles.length === 0) fetchRoles();
        setSelectedUser(user);
        setFormData({
            password: '',
            confirmPassword: '',
            role: user.role || 'employee'
        });
        setIsModalOpen(true);
    };

    const handleUpdateCredentials = async () => {
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                role: formData.role
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            await updateUserApi(selectedUser.id, updateData);
            toast.success('Credentials updated successfully');
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating credentials:', error);
            toast.error('Failed to update credentials');
        } finally {
            setSaving(false);
        }
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, password, confirmPassword: password });
        setShowPassword(true);
        toast.success('Secure password generated');
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Control</h1>
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Manage system access, roles, and security credentials for all employees</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group min-w-[320px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email or ID..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => fetchUsers(1, false)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-slate-200 bg-white"
                        >
                            <RefreshCcw size={20} className={(loading && users.length === 0) ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1400px] mx-auto">
                    {loading && users.length === 0 ? (
                        <CardGridSkeleton count={12} />
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {users.length === 0 ? (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                            <ShieldCheck size={40} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-semibold text-slate-800">No employee found</h3>
                                            <p className="text-slate-500 text-[15px] font-medium max-w-xs mx-auto">
                                                We couldn't find any employees matching your search or filters.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {users.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="group bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col"
                                            >
                                                <div className="p-4 flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                                                <span className="text-lg font-bold text-slate-600 group-hover:text-primary">
                                                                    {(user.employee_name || 'U').charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-slate-800 line-clamp-1">{user.employee_name}</h3>
                                                                <p className="text-[12px] text-slate-400 font-medium">#{user.emp_id || 'EMP-000'}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-1.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'superadmin'
                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm shadow-rose-100/50'
                                                            : user.role === 'admin'
                                                                ? 'bg-amber-50 text-amber-600 border border-amber-100 shadow-sm shadow-amber-100/50'
                                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100/50'
                                                            }`}>
                                                            {user.role || 'employee'}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                                            <Info size={14} className="text-slate-400" />
                                                            <span className="truncate">{user.email || 'No email provided'}</span>
                                                        </div>
                                                        {user.department_name && (
                                                            <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                                                <UserCog size={14} className="text-slate-400" />
                                                                <span>{user.department_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active Account
                                                    </div>
                                                    <button
                                                        onClick={() => handleManageCredentials(user)}
                                                        className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-hover transition-colors"
                                                    >
                                                        Manage
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* Load More Button */}
                            {users.length > 0 && users.length < totalUsers && (
                                <div className="flex justify-center pb-8">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-full hover:bg-slate-50 hover:border-primary/20 hover:text-primary transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-primary" />
                                                <span>Loading More...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Load More Employees</span>
                                                <RefreshCcw size={16} className="text-slate-400 group-hover:text-primary transition-all" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Manage Credentials Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[15px] shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900">Credentials</h2>
                                            <p className="text-[13px] text-slate-500 font-medium">Updating {selectedUser?.employee_name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Role Selection */}
                                    <div>
                                        <label className="block text-[14px] font-semibold text-slate-700 mb-2">Role <span className="text-red-500">*</span></label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium disabled:bg-gray-50 disabled:text-gray-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat capitalize"
                                        >
                                            {roles.length > 0 ? (
                                                roles.map((r) => (
                                                    <option key={r.role} value={r.role}>
                                                        {r.role === 'admin' ? 'Administrator' : r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="employee">Employee</option>
                                                    <option value="admin">Administrator</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[14px] font-semibold text-slate-700">New Password</label>
                                            <div className="flex gap-2">
                                                {formData.password && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(formData.password);
                                                            toast.success('Password copied to clipboard');
                                                        }}
                                                        className="text-[11px] font-bold text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                )}
                                                <button
                                                    onClick={generatePassword}
                                                    className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Key size={10} />
                                                    Generate
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <FormInput
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {formData.password && (
                                            <div className="mt-2 flex gap-1">
                                                {[1, 2, 3, 4].map((i) => {
                                                    const strength = formData.password.length > i * 3 ? 'bg-emerald-400' : 'bg-slate-200';
                                                    return <div key={i} className={`h-1 flex-1 rounded-full ${strength} transition-all duration-500`} />
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-[14px] font-semibold text-slate-700 mb-2">Confirm Password</label>
                                        <FormInput
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Repeat new password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-7 flex flex-col gap-3">
                                    <button
                                        onClick={handleUpdateCredentials}
                                        disabled={saving}
                                        className="w-full py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full py-3 bg-slate-100 text-slate-600 rounded-full font-medium hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}