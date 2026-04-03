import React, { useState, useEffect } from 'react';
import {
    Shield,
    LayoutDashboard,
    Users,
    Building2,
    Wallet,
    Receipt,
    CalendarCheck,
    FileText,
    BookOpen,
    Box,
    Briefcase,
    Save,
    RotateCcw,
    ChevronDown,
    CheckCircle2,
    Circle,
    AlertCircle,
    BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRolePermissionsApi, updateRolePermissionsApi, getAllRolePermissionsApi } from '../../Action/api';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const ROLE_COLORS = {
    superadmin: 'red',
    admin: 'blue',
    employee: 'indigo',
    default: 'gray'
};

const MODULE_CATEGORIES = [
    {
        id: 'profile',
        label: 'PROFILE',
        icon: Users,
        modules: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            {
                id: 'employees',
                label: 'Employees',
                icon: Users,
                subPermissions: [
                    { id: 'employees_list', label: 'Employees List' },
                    { id: 'employees_add', label: 'Add Employee' },
                    { id: 'employees_id_card', label: 'Employee ID Card' },
                    { id: 'employees_permissions', label: 'Permissions' },
                    { id: 'employees_credentials', label: 'Employee Credentials' },
                ]
            },
            {
                id: 'organization',
                label: 'Organization',
                icon: Building2,
                subPermissions: [
                    { id: 'organization_branches', label: 'Manage Branches' },
                    { id: 'organization_departments', label: 'Manage Departments' },
                    { id: 'organization_designations', label: 'Manage Designations' },
                    { id: 'organization_shifts', label: 'Manage Shifts' },
                    { id: 'organization_roles', label: 'Manage Roles' },
                ]
            },
        ]
    },
    {
        id: 'payroll',
        label: 'PAYROLL',
        icon: Wallet,
        modules: [
            {
                id: 'payroll',
                label: 'Payroll',
                icon: Wallet,
                subPermissions: [
                    { id: 'payroll_dashboard', label: 'Payroll Dashboard' },
                    { id: 'payroll_structure', label: 'Salary Structure' },
                    { id: 'payroll_components', label: 'Salary Components' },
                    { id: 'payroll_formulas', label: 'Formulas' },
                    { id: 'payroll_templates', label: 'Payslip Templates' },
                    { id: 'payroll_payslips', label: 'My Payslips' },
                    { id: 'payroll_advance_salary', label: 'Advance Salary' },
                ]
            },
            { id: 'reimbursements', label: 'Reimbursements', icon: Receipt },
        ]
    },
    {
        id: 'resources',
        label: 'RESOURCES',
        icon: Box,
        modules: [
            {
                id: 'attendance',
                label: 'Attendance',
                icon: CalendarCheck,
                subPermissions: [
                    { id: 'attendance_shift', label: 'Attendance & Shift' },
                    { id: 'attendance_biometric', label: 'Biometric Attendance' },
                    { id: 'attendance_weekoff', label: 'Week Off' },
                    { id: 'attendance_calendar', label: 'Calendar' },
                    { id: 'attendance_rules', label: 'Attendance Rules' },
                    { id: 'attendance_policy', label: 'Company Policy' },
                    { id: 'attendance_devices', label: 'Biometric Devices' },
                ]
            },
            {
                id: 'leaves',
                label: 'Leaves',
                icon: FileText,
                subPermissions: [
                    { id: 'leaves_manage', label: 'Manage Leaves' },
                    { id: 'leaves_list', label: 'Leave List' },
                    { id: 'leaves_apply', label: 'Apply Leave' },
                    { id: 'leaves_holiday', label: 'Manage Holiday' },
                ]
            },
            { id: 'company_policies', label: 'Company Policies', icon: BookOpen },
            { id: 'asset_management', label: 'Asset Management', icon: Box },
            { id: 'jobs_recruitment', label: 'Jobs & Recruitment', icon: Briefcase, subPermissions: [{ id: 'jobs_recruitment_overview', label: 'Recruitment Overview' }, { id: 'jobs_recruitment_board', label: 'Job Board' }, { id: 'jobs_recruitment_applicants', label: 'Applicants List' }] },
        ]
    },
    {
        id: 'analytics',
        label: 'ANALYTICS',
        icon: BarChart3,
        modules: [
            {
                id: 'reports',
                label: 'Analytics Reports',
                icon: BarChart3,
                subPermissions: [
                    { id: 'reports_attendance', label: 'Attendance Report' },
                    { id: 'reports_reimbursements', label: 'Reimbursements Report' },
                    { id: 'reports_leave', label: 'Leave Report' },
                    { id: 'reports_asset', label: 'Asset Report' },
                    { id: 'reports_payroll', label: 'Payroll Report' },
                ]
            }
        ]
    }
];



export default function Permissions() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryRole = searchParams.get('role');

    const [selectedRole, setSelectedRole] = useState(queryRole || 'admin');
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [permissions, setPermissions] = useState([]);
    const [savedPermissions, setSavedPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});

    const isDirty = React.useMemo(() => {
        if (permissions.length !== savedPermissions.length) return true;
        return [...permissions].sort().join(',') !== [...savedPermissions].sort().join(',');
    }, [permissions, savedPermissions]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setRolesLoading(true);
            const response = await getAllRolePermissionsApi();
            const data = response.data || [];
            const mappedRoles = data.map(r => ({
                id: r.role,
                label: r.role.charAt(0).toUpperCase() + r.role.slice(1),
                color: ROLE_COLORS[r.role.toLowerCase()] || ROLE_COLORS.default
            }));
            setRoles(mappedRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to load roles list');
        } finally {
            setRolesLoading(false);
        }
    };

    useEffect(() => {
        if (selectedRole) {
            fetchPermissions();
            // Sync URL with selected role
            if (searchParams.get('role') !== selectedRole) {
                setSearchParams({ role: selectedRole }, { replace: true });
            }
        }
    }, [selectedRole]);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await getRolePermissionsApi(selectedRole);
            const data = response.data;
            const perms = Array.isArray(data) ? data : [];
            setPermissions(perms);
            setSavedPermissions(perms);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (moduleId, parentModuleId = null) => {
        setPermissions(prev => {
            const currentPermissions = Array.isArray(prev) ? prev : [];
            let newPermissions = [...currentPermissions];

            // Find module definition in MODULE_CATEGORIES
            let moduleObj = null;
            for (const cat of MODULE_CATEGORIES) {
                const found = cat.modules.find(m => m.id === moduleId);
                if (found) {
                    moduleObj = found;
                    break;
                }
            }

            if (currentPermissions.includes(moduleId)) {
                // Toggle off behavior
                newPermissions = newPermissions.filter(id => id !== moduleId);

                // If it's a main module, also remove its sub-permissions
                if (moduleObj?.subPermissions) {
                    const subIds = moduleObj.subPermissions.map(s => s.id);
                    newPermissions = newPermissions.filter(id => !subIds.includes(id));
                }
            } else {
                // Toggle on behavior
                newPermissions.push(moduleId);

                // If it's a main module, also add all its sub-permissions
                if (moduleObj?.subPermissions) {
                    const subIds = moduleObj.subPermissions.map(s => s.id);
                    subIds.forEach(id => {
                        if (!newPermissions.includes(id)) {
                            newPermissions.push(id);
                        }
                    });
                }

                // If it's a sub-permission, also add its parent module
                if (parentModuleId && !newPermissions.includes(parentModuleId)) {
                    newPermissions.push(parentModuleId);
                }
            }
            return newPermissions;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateRolePermissionsApi({
                role: selectedRole,
                permissions: permissions
            });

            setSavedPermissions(permissions);

            // Update local storage if the current user's role was updated
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (userInfo.role === selectedRole) {
                userInfo.permissions = permissions;
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                window.dispatchEvent(new Event('storage'));
            }

            toast.success('Permissions updated successfully');
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const toggleExpand = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const visibleCategories = React.useMemo(() => {
        if (selectedRole !== 'employee') return MODULE_CATEGORIES;

        const employeeAllowedModules = [
            'dashboard', 'payroll', 'reimbursements',
            'attendance', 'leaves', 'company_policies',
            'asset_management', 'jobs_recruitment'
        ];

        const employeeAllowedSubPermissions = [
            'payroll_payslips', 'payroll_advance_salary',
            'attendance_shift', 'attendance_calendar', 'attendance_weekoff',
            'leaves_list', 'leaves_apply'
        ];

        return MODULE_CATEGORIES.map(cat => ({
            ...cat,
            modules: cat.modules
                .filter(m => employeeAllowedModules.includes(m.id))
                .map(m => ({
                    ...m,
                    subPermissions: m.subPermissions
                        ? m.subPermissions.filter(s => employeeAllowedSubPermissions.includes(s.id))
                        : undefined
                }))
        })).filter(cat => cat.modules.length > 0);
    }, [selectedRole]);

    return (
        <div className="p-6 bg-gray-50/50 min-h-full">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Shield className="text-primary" size={24} />
                            </div>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Role Permissions</h1>
                        </div>
                        <p className="text-gray-500 text-sm">Configure granular module and tab access for roles.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchPermissions()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-all duration-200"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full shadow-md shadow-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-70"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Role Selector */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {rolesLoading ? (
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-24 h-10 bg-gray-100 animate-pulse rounded-full" />)}
                            </div>
                        ) : (
                            roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border border-gray-200 capitalize ${selectedRole === role.id
                                        ? `bg-primary/5 border-primary text-primary shadow-sm`
                                        : 'bg-transparent border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {role.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Dirty State Alert */}
                <AnimatePresence>
                    {isDirty && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-amber-900 font-semibold text-sm">Unsaved Changes</p>
                                    <p className="text-amber-700 text-[13px]">Please click the <span className="font-bold">Save Changes</span> button to apply the new permissions.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-full transition-colors shadow-sm"
                            >
                                Save Now
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modules Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-48" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {visibleCategories.map((category) => (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <category.icon size={18} className="text-gray-500" />
                                    </div>
                                    <h2 className="text-sm font-semibold text-gray-700 tracking-widest uppercase">{category.label}</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {category.modules.map((module) => (
                                        <div
                                            key={module.id}
                                            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                                        >
                                            <div
                                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${permissions.includes(module.id) ? 'bg-primary/5' : 'hover:bg-gray-50'
                                                    }`}
                                                onClick={() => togglePermission(module.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${permissions.includes(module.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        <module.icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{module.label}</h3>
                                                        {module.subPermissions && (
                                                            <p className="text-[12px] text-gray-500">
                                                                {module.subPermissions.filter(s => permissions.includes(s.id)).length} of {module.subPermissions.length} tabs enabled
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {module.subPermissions && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(module.id);
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-transform duration-200"
                                                            style={{ transform: expandedModules[module.id] ? 'rotate(180deg)' : 'rotate(0)' }}
                                                        >
                                                            <ChevronDown size={20} />
                                                        </button>
                                                    )}
                                                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${permissions.includes(module.id) ? 'bg-primary' : 'bg-gray-200'
                                                        }`}>
                                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${permissions.includes(module.id) ? 'translate-x-5' : 'translate-x-0'
                                                            }`} />
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {module.subPermissions && expandedModules[module.id] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-gray-50 bg-gray-50/30"
                                                    >
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {module.subPermissions.map((sub) => (
                                                                <div
                                                                    key={sub.id}
                                                                    onClick={() => togglePermission(sub.id, module.id)}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${permissions.includes(sub.id)
                                                                        ? 'bg-white border-primary/50 text-primary'
                                                                        : 'bg-white/50 border-gray-200 text-gray-500 hover:border-gray-200 hover:bg-white'
                                                                        }`}
                                                                >
                                                                    {permissions.includes(sub.id) ? (
                                                                        <CheckCircle2 size={16} className="text-primary" />
                                                                    ) : (
                                                                        <Circle size={16} className="text-gray-300" />
                                                                    )}
                                                                    <span className="text-sm font-medium">{sub.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}