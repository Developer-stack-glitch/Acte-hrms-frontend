import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BriefcaseBusiness,
    Clock,
    ChevronLeft,
    ChevronRight,
    Banknote,
    CalendarDays,
    ToolCase,
    Wallet,
    UserPlus,
    ShieldCheck,
    BarChart3,
    ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, to, isCollapsed, onClick }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
        flex items-center gap-2 px-4 py-2.5 mb-1.5 rounded-full transition-all duration-300 group relative z-10
        ${isActive
                    ? 'active-nav-item text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'}
      `}
        >
            <Icon size={18} className="shrink-0" />

            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap overflow-hidden text-[14px]"
                >
                    {label}
                </motion.span>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-full ml-5 px-2 py-1 bg-gray-900 text-white text-[12px] font-medium rounded-lg opacity-0 group-hover:opacity-100 group-hover:ml-4 pointer-events-none transition-all duration-300 whitespace-nowrap z-[100] shadow-xl border border-white/10">
                    {label}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 rounded-sm" />
                </div>
            )}
        </NavLink>
    );
};

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    React.useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
    const { width } = useWindowSize();
    const isMobile = width < 1024;

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role || 'employee';

    const sidebarItems = [
        {
            title: 'Profile',
            items: [
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
                { id: 'employees', icon: Users, label: 'Employees', to: '/users' },
                { id: 'organization', icon: BriefcaseBusiness, label: 'Organization', to: '/organization' },
                { id: 'reports', icon: BarChart3, label: 'Analytics Reports', to: '/reports' },
            ]
        },
        {
            title: 'Payroll',
            items: [
                { id: 'payroll', icon: Banknote, label: userRole === 'admin' || userRole === 'superadmin' ? 'Payroll' : 'My Payroll', to: '/payroll' },
                { id: 'reimbursements', icon: Wallet, label: 'Reimbursements', to: '/reimbursements' },
            ]
        },
        {
            title: 'Resources',
            items: [
                { id: 'attendance', icon: Clock, label: userRole === 'admin' || userRole === 'superadmin' ? 'Attendance' : 'My Attendance', to: '/attendance' },
                { id: 'leaves', icon: CalendarDays, label: userRole === 'admin' || userRole === 'superadmin' ? 'Leaves' : 'My Leaves', to: '/leaves' },
                { id: 'regularisations', icon: ClipboardCheck, label: userRole === 'admin' || userRole === 'superadmin' ? 'Regularisations' : 'My Regularisations', to: '/regularisations' },
                { id: 'company_policies', icon: ShieldCheck, label: 'Company Policies', to: '/policies' },
                { id: 'asset_management', icon: ToolCase, label: userRole === 'admin' || userRole === 'superadmin' ? 'Asset Management' : 'My Assets', to: userRole === 'admin' || userRole === 'superadmin' ? '/asset-management' : '/my-assets' },
                { id: 'jobs_recruitment', icon: UserPlus, label: userRole === 'admin' || userRole === 'superadmin' ? 'Jobs & Recruitment' : 'Career Portal', to: userRole === 'admin' || userRole === 'superadmin' ? '/job-recruitment' : '/career' },
            ]
        }
    ];

    const permissions = userInfo.permissions || [];

    const menuSections = sidebarItems.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (userRole === 'superadmin') return true;
            if (item.id === 'regularisations') return true;
            return permissions.includes(item.id);
        })
    })).filter(section => section.items.length > 0);

    const sidebarVariants = {
        expanded: {
            width: '240px',
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        },
        collapsed: {
            width: '75px',
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    };

    const mobileVariants = {
        open: {
            x: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 350, damping: 35 }
        },
        closed: {
            x: '-100%',
            opacity: 0,
            transition: { type: 'spring', stiffness: 350, damping: 35 }
        }
    };

    const handleItemClick = () => {
        if (isMobile) {
            setIsMobileOpen(false);
        }
    };

    React.useEffect(() => {
        const handleStorageChange = () => {
            // This forces a re-render by triggering any state that Sidebar depends on
            window.location.reload(); // Quickest way for a sidebar to sync permissions
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <>
            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[50]"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={isMobile ? (isMobileOpen ? 'open' : 'closed') : (isCollapsed ? 'collapsed' : 'expanded')}
                variants={isMobile ? mobileVariants : sidebarVariants}
                className={`
          fixed lg:sticky top-0 left-0 h-screen sidebar-abstract-bg text-white flex flex-col z-[55]
          ${isMobile ? 'w-[250px] shadow-2xl' : ''}
        `}
            >
                <div className="relative z-10 flex flex-col h-full">
                    {/* Grain Texture Overlay */}
                    <div className="grain-overlay" />

                    {/* Header Section */}
                    <div className="h-24 flex items-center px-6 relative shrink-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                                H
                            </div>
                            {(!isCollapsed || isMobile) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col min-w-0"
                                >
                                    <span className="font-medium text-[16px] leading-tight truncate">HRM Portal</span>
                                    <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Management</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Floating Toggle Button - Hidden on Mobile */}
                        {!isMobile && (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="absolute top-8 -right-4 z-[100] w-7 h-7 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] rounded-full flex items-center justify-center cursor-pointer border border-gray-100 text-primary hover:bg-primary hover:text-white transition-all duration-300 scale-110 active:scale-95"
                            >
                                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                        )}
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 px-3 space-y-4 overflow-y-auto sidebar-scrollbar mt-2">
                        {menuSections.map((section, index) => (
                            <div key={section.title} className="relative">
                                {(!isCollapsed || isMobile) ? (
                                    <div className="px-4 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest opacity-70">
                                        {section.title}
                                    </div>
                                ) : (
                                    index !== 0 && <div className="h-px bg-white/10 mx-2 my-4" />
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <SidebarItem
                                            key={item.to}
                                            {...item}
                                            isCollapsed={isCollapsed && !isMobile}
                                            onClick={handleItemClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Info at bottom for mobile only */}
                    {isMobile && userInfo.name && (
                        <div className="mt-auto p-4 border-t border-white/10 bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/20">
                                    <span className="text-sm font-bold">{userInfo.name.charAt(0)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold truncate">{userInfo.name}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{userInfo.role || 'Employee'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    );
}
