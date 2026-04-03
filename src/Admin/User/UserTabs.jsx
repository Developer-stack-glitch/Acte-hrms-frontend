import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    UserCog,
    ShieldCheck,
    KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserList from './UserList';
import AddUsers from './AddUsers';
import EmployeeCredentials from './EmployeeCredentials';
import Permissions from './Permissions';


const tabs = [
    { 
        id: 'database', 
        label: 'Employees List', 
        icon: Users,
        permissionId: 'employees_list'
    },
    { 
        id: 'add', 
        label: 'Add Employee', 
        icon: UserPlus,
        permissionId: 'employees_add'
    },
    { 
        id: 'config', 
        label: 'Employee ID Card', 
        icon: UserCog,
        permissionId: 'employees_id_card'
    },
    { 
        id: 'permissions', 
        label: 'Permissions', 
        icon: ShieldCheck,
        permissionId: 'employees_permissions'
    },
    { 
        id: 'credentials', 
        label: 'Employee Credentials', 
        icon: KeyRound,
        permissionId: 'employees_credentials'
    },
];

import EmployeeIdCard from './EmployeeIdCard';

import { useNavigate, useParams } from 'react-router-dom';

export default function UserTabs() {
    const { tabId } = useParams();
    const navigate = useNavigate();
    
    const userInfo = React.useMemo(() => JSON.parse(localStorage.getItem('userInfo') || '{}'), []);
    const userRole = userInfo.role;
    const userPermissions = userInfo.permissions || [];

    const allowedTabs = React.useMemo(() => {
        if (userRole === 'superadmin') return tabs;
        return tabs.filter(tab => userPermissions.includes(tab.permissionId));
    }, [userRole, userPermissions]);

    const activeTab = tabId || (allowedTabs.length > 0 ? allowedTabs[0].id : 'database');
    const [selectedUserForIdCard, setSelectedUserForIdCard] = useState(null);

    const setActiveTab = (id) => {
        navigate(`/users/${id}`);
    };

    React.useEffect(() => {
        if (userRole === 'employee') {
            navigate('/dashboard', { replace: true });
        }
    }, [userRole, navigate]);

    if (userRole === 'employee') return null;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Horizontal Tabs Navigation */}
            <div className="bg-white rounded-lg border-b border-gray-100 md:px-3 px-3 pt-3 pb-0 sticky top-0 z-20">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {allowedTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-4 py-3 border-b-2 transition-all duration-300 relative whitespace-nowrap group ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-50 group-hover:bg-gray-100 text-gray-400'
                                }`}>
                                <tab.icon size={16} />
                            </div>
                            <span className={`text-[13.5px] font-semibold tracking-tight ${activeTab === tab.id ? 'text-primary' : 'text-gray-600'
                                }`}>
                                {tab.label}
                            </span>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-nav-indicator"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    initial={false}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-0 py-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="max-w-[1600px] mx-auto h-full"
                    >
                        {activeTab === 'database' ? (
                            <div className="bg-white rounded-[8px] overflow-hidden min-h-[600px]">
                                <UserList
                                    onAddClick={() => setActiveTab('add')}
                                    onIdCardClick={(user) => {
                                        setSelectedUserForIdCard(user);
                                        setActiveTab('config');
                                    }}
                                />
                            </div>
                        ) : activeTab === 'add' ? (
                            <div className="bg-[#f8fafc] rounded-[8px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                                <AddUsers
                                    onSuccess={() => setActiveTab('database')}
                                    onCancel={() => setActiveTab('database')}
                                />
                            </div>
                        ) : activeTab === 'credentials' ? (
                            <div className="bg-[#f8fafc] rounded-[8px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                                <EmployeeCredentials />
                            </div>
                        ) : activeTab === 'config' ? (
                            <div className="bg-[#f8fafc] rounded-[8px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                                <EmployeeIdCard
                                    initialUser={selectedUserForIdCard}
                                    onBack={() => setActiveTab('database')}
                                />
                            </div>
                        ) : activeTab === 'permissions' ? (
                            <div className="bg-[#f8fafc] rounded-[8px] overflow-hidden min-h-[600px]">
                                <Permissions />
                            </div>
                        ) : (
                            <div className="bg-white rounded-[8px] shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[600px] text-gray-400 p-8">
                                <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                                    Module Not Found
                                </h3>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}