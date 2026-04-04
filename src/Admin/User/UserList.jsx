import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Plus,
    RefreshCcw,
    Contact as IdCardIcon
} from 'lucide-react';
import DataTable from '../../Common/DataTable';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { getUsersApi, deleteUserApi, getUserByIdApi } from '../../Action/api';
import AddUsers from './AddUsers';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import UserFilter from './UserFilter';


export default function UserList({ onAddClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('userList_search') || '');
    const [page, setPage] = useState(() => parseInt(localStorage.getItem('userList_page')) || 1);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(() => parseInt(localStorage.getItem('userList_pageSize')) || 10);

    // Mode state for View/Edit
    const [activeUser, setActiveUser] = useState(null);
    const [mode, setMode] = useState('list'); // 'list', 'view', 'edit'

    // Delete confirmation state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState(() => {
        const saved = localStorage.getItem('userList_filters');
        return saved ? JSON.parse(saved) : {};
    });

    const isFirstRun = React.useRef(true);

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('userList_search', searchTerm);
        localStorage.setItem('userList_page', page.toString());
        localStorage.setItem('userList_pageSize', pageSize.toString());
        localStorage.setItem('userList_filters', JSON.stringify(filters));
    }, [searchTerm, page, pageSize, filters]);


    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
                search: debouncedSearch,
                ...filters
            };
            const response = await getUsersApi(params);
            setUsers(response.data.users);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize, debouncedSearch, filters]);

    useEffect(() => {
        if (location.state?.editUserId) {
            const userId = location.state.editUserId;
            const fetchAndEdit = async () => {
                setLoading(true);
                try {
                    const { data } = await getUserByIdApi(userId);
                    setActiveUser(data);
                    setMode('edit');
                } catch (error) {
                    console.error('Error loading user for edit:', error);
                    toast.error('Failed to load user data');
                } finally {
                    setLoading(false);
                }
            };
            fetchAndEdit();
            // Clear state so it doesn't re-open on refresh or navigation back
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        setPage(1);
    }, [debouncedSearch, filters]);


    const handleView = (user) => {
        setActiveUser(user);
        setMode('view');
    };

    const handleEdit = (user) => {
        setActiveUser(user);
        setMode('edit');
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await deleteUserApi(userToDelete.id);
            toast.success('Employee deleted successfully');
            setDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error(error.response?.data?.message || 'Failed to delete employee');
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            header: 'S. No.',
            key: 'sno',
            render: (val, row, idx) => (
                <span className="text-[13px] font-medium text-gray-600">
                    {((page - 1) * pageSize) + idx + 1}
                </span>
            )
        },
        {
            header: 'User Name',
            key: 'employee_name',
            render: (val, row) => (
                <div
                    className="flex items-center gap-2 cursor-pointer group/name"
                    onClick={() => navigate(`/profile/${row.id}`)}
                >
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-[12px] border border-primary/10 group-hover/name:bg-primary group-hover/name:text-white transition-all">
                        {(val || row.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800 group-hover/name:text-primary transition-colors">{val || row.name}</span>
                </div>
            )
        },
        {
            header: 'Email',
            key: 'email',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Gender',
            key: 'gender',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium capitalize">{val || 'Other'}</span>
            )
        },
        {
            header: 'Department',
            key: 'department_name',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Designation',
            key: 'designation_name',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Branch',
            key: 'branch_name',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Shift',
            key: 'shift',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Mode of Work',
            key: 'work_location',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        },
        {
            header: 'Employment type',
            key: 'employment_type',
            render: (val) => (
                <span className="text-[13px] text-gray-600 font-medium">{val || 'N/A'}</span>
            )
        }
    ];

    if (mode === 'view' || mode === 'edit') {
        return (
            <div className="h-full bg-white">
                <AddUsers
                    initialData={activeUser}
                    mode={mode}
                    onCancel={() => {
                        setMode('list');
                        setActiveUser(null);
                    }}
                    onSuccess={() => {
                        setMode('list');
                        setActiveUser(null);
                        fetchUsers();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1e293b]">User Database</h1>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">Manage all system users and their access levels</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchUsers}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                            <RefreshCcw size={20} />
                        </button>
                        <button
                            onClick={onAddClick}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                        >
                            <Plus size={18} />
                            Add New User
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-full font-semibold text-[13px] transition-colors ${Object.keys(filters).some(key => filters[key]?.length > 0)
                            ? 'bg-primary/5 border-primary/20 text-primary'
                            : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={16} />
                        Filters
                        {Object.keys(filters).some(key => filters[key]?.length > 0) && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* User Filter Drawer */}
            <UserFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
            />


            {/* Reusable Data Table */}
            <DataTable
                columns={columns}
                data={users}
                isLoading={loading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    onChange: (p) => setPage(p),
                    onPageSizeChange: (s) => {
                        setPageSize(s);
                        setPage(1);
                    }
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setDeleteModalOpen(false);
                        setUserToDelete(null);
                    }
                }}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.employee_name || userToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={isDeleting}
                type="danger"
            />
        </div>
    );
}
