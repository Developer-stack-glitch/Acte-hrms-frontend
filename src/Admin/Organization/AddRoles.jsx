import { useState, useEffect } from 'react';
import { Shield, Plus, Loader2, Trash2, ShieldCheck } from 'lucide-react';
import { getAllRolePermissionsApi, updateRolePermissionsApi, deleteRoleApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput } from '../../Common/Form';
import FormSkeleton from '../../Common/CommonSkeletonLoader/FormSkeleton';
import DataTable from '../../Common/DataTable';
import { Link } from 'react-router-dom';

export default function AddRoles() {
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [roleName, setRoleName] = useState('');

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setListLoading(true);
            const res = await getAllRolePermissionsApi();
            setRoles(res.data || []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            toast.error('Failed to load roles');
        } finally {
            setDataLoading(false);
            setListLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            toast.error('Please enter a role name');
            return;
        }

        const normalizedRoleName = roleName.trim().toLowerCase();
        if (roles.some(r => r.role.toLowerCase() === normalizedRoleName)) {
            toast.error('Role already exists');
            return;
        }

        setLoading(true);
        try {
            // Adding a role with empty permissions initially
            await updateRolePermissionsApi({
                role: normalizedRoleName,
                permissions: []
            });
            toast.success('Role added successfully!');
            setRoleName('');
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add role');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (role) => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const currentUserRole = userInfo.role;
        const normalizedRole = role.toLowerCase();
        const isSystemRole = ['superadmin', 'admin', 'employee'].includes(normalizedRole);

        if (isSystemRole) {
            if (currentUserRole !== 'superadmin') {
                toast.error('Only superadmin can delete core system roles');
                return;
            }
            if (normalizedRole === 'superadmin') {
                toast.error('The superadmin role cannot be deleted');
                return;
            }
        }

        if (!window.confirm(`Are you sure you want to delete the role "${role}"?`)) {
            return;
        }

        try {
            await deleteRoleApi(role);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const columns = [
        {
            header: 'Role Name',
            key: 'role',
            render: (val) => <span className="capitalize font-medium">{val}</span>
        },
        {
            header: 'Permissions Status',
            key: 'permissions',
            render: (val) => (
                <span className={`text-xs px-2 py-1 rounded-full ${val && val.length > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {val && val.length > 0 ? `${val.length} Permissions Set` : 'No Permissions'}
                </span>
            )
        },
        {
            header: 'Type',
            key: 'role',
            render: (val) => (
                <span className={`text-xs font-semibold ${['superadmin', 'admin', 'employee'].includes(val.toLowerCase()) ? 'text-primary' : 'text-gray-500'}`}>
                    {['superadmin', 'admin', 'employee'].includes(val.toLowerCase()) ? 'System Role' : 'Custom Role'}
                </span>
            )
        },
        {
            header: 'Actions',
            key: 'role',
            render: (val) => {
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                const currentUserRole = userInfo.role;
                const isSystemRole = ['superadmin', 'admin', 'employee'].includes(val.toLowerCase());
                const isSelfSuperAdmin = val.toLowerCase() === 'superadmin';

                // Display delete button if: 
                // 1. It's not a system role OR 
                // 2. The current user is a superadmin AND it's not the superadmin role itself
                const canDelete = !isSystemRole || (currentUserRole === 'superadmin' && !isSelfSuperAdmin);

                return (
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/users/permissions?role=${val}`}
                            className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Manage Permissions"
                        >
                            <ShieldCheck size={16} />
                        </Link>
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(val)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Role"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    if (dataLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Manage Roles</h2>
                    <p className="text-gray-500 text-[16px] mt-1">Define system-wide roles for access control.</p>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                    <div className="mt-0.5">
                        <Shield size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900">Dynamic RBAC</h4>
                        <p className="text-[13px] text-blue-700 mt-0.5 leading-relaxed">
                            Newly added roles will immediately become available in the <span className="font-bold underline cursor-pointer">Permissions</span> manager and <span className="font-bold underline cursor-pointer">User Management</span>.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="New Role Name"
                            name="roleName"
                            required
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="e.g. Manager, HR Executive"
                            icon={Shield}
                            className="md:col-span-2"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Plus size={18} />
                            )}
                            {loading ? 'Adding...' : 'Add New Role'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Roles List</h2>
                    <p className="text-gray-500 text-sm mt-1">System and custom roles.</p>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={roles}
                        isLoading={listLoading}
                        pagination={{
                            current: 1,
                            pageSize: 10,
                            total: roles.length,
                            onChange: () => { }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}