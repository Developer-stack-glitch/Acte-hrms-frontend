import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { Menu, X, Settings, ChevronDown, User, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';
import ConfirmationModal from './ConfirmationModal';


const TopHeader = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        toast.success('Signed out successfully');
        navigate('/login');
    };

    return (
        <header className="md:h-20 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-2 sm:px-6 lg:px-10 sticky top-0 z-30 shadow-sm md:gap-4 gap-2">
            {/* Mobile Toggle Button & Welcome Message */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-12 min-w-0">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all active:scale-95 shrink-0"
                >
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="relative group min-w-0">
                    <h1 className="text-lg lg:text-xl font-semibold text-[#1e293b] tracking-tight group-hover:text-primary transition-colors cursor-default">
                        Welcome! {user?.name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-[10px] lg:text-[11px] text-gray-400 font-semibold uppercase tracking-wider truncate">
                            Have a productive day
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 shrink-0">
                {/* Utility Icons - Hidden on small mobile */}
                <div className="hidden md:flex items-center gap-1 lg:gap-2">
                    <NotificationBell />
                    {[Settings].map((Icon, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => navigate('/settings')}
                            className="p-2 lg:p-3 text-gray-500 hover:bg-gray-50 hover:text-primary rounded-[10px] transition-all relative group overflow-hidden"
                        >
                            <Icon size={18} className="group-hover:scale-110 transition-transform lg:w-5 lg:h-5" />
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>


                {/* Separator - Hidden on mobile */}
                <div className="h-8 w-px bg-gray-100 hidden md:block" />

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`flex items-center gap-2 lg:gap-4 p-1.5 lg:p-2 pl-1.5 lg:pl-2 pr-2 lg:pr-4 rounded-[22px] transition-all duration-300 cursor-pointer group ${isProfileOpen ? 'bg-gray-50 shadow-inner' : 'hover:bg-gray-50'}`}
                    >
                        <div className="relative shrink-0">
                            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full premium-gradient p-0.5 shadow-lg group-hover:rotate-6 transition-transform">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary font-bold text-[10px] lg:text-xs overflow-hidden ring-2 ring-white">
                                    <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=fff&color=1d4ed8&bold=true`} alt="avatar" />
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-green-500 border-2 border-white rounded-full" />
                        </div>

                        <div className="hidden sm:flex flex-col items-start translate-y-[-1px] min-w-0">
                            <span className="text-[13px] lg:text-[14px] font-extrabold text-gray-800 leading-none group-hover:text-primary transition-colors truncate max-w-[100px]">{user?.name}</span>
                            <span className="text-[9px] lg:text-[10px] text-primary font-bold mt-1 lg:mt-1.5 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10 uppercase tracking-wider">{user?.role || 'Employee'}</span>
                        </div>

                        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-500 ease-in-out lg:w-3.5 lg:h-3.5 ${isProfileOpen ? 'rotate-180 text-primary' : 'group-hover:text-gray-600'}`} />
                    </button>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                {/* Backdrop for click outside */}
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-[15px] shadow-2xl p-2.5 z-50 overflow-hidden"
                                >
                                    <div className="px-5 py-2 border-b border-gray-50 mb-2 bg-gray-50/50 rounded-t-[20px]">
                                        <p className="text-[11px] text-primary font-bold uppercase tracking-[0.1em] mb-1">User Settings</p>
                                        <p className="text-[13px] text-gray-800 font-bold truncate">{user?.email || 'admin@hrmportal.com'}</p>
                                    </div>

                                    {[
                                        { icon: User, label: 'My Account', sub: 'Profile & preferences', path: '/profile' },
                                        { icon: ShieldCheck, label: 'Security', sub: 'Passwords & auth', path: '#' },
                                    ].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (item.path !== '#') {
                                                    navigate(item.path);
                                                    setIsProfileOpen(false);
                                                }
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-2 hover:bg-primary/5 rounded-[18px] transition-all duration-200 text-gray-600 hover:text-primary group/item"
                                        >
                                            <div className="p-2 bg-gray-50 group-hover/item:bg-white rounded-xl shadow-sm/50 transition-colors">
                                                <item.icon size={18} className="text-gray-400 group-hover/item:text-primary" />
                                            </div>
                                            <div className="flex flex-col items-start translate-y-[-1px]">
                                                <span className="text-[13px] font-bold">{item.label}</span>
                                                <span className="text-[10px] text-gray-400 font-medium group-hover/item:text-primary/60">{item.sub}</span>
                                            </div>
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center mt-3 gap-4 px-4 py-2 rounded-lg transition-all text-red-500 hover:bg-red-50 group/logout cursor-pointer"
                                    >
                                        <div className="">
                                            <LogOut size={18} />
                                        </div>
                                        <span className="text-[13px] font-extrabold">Sign Out</span>
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

const MainLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleSessionExpired = () => {
            setShowExpiryModal(true);
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => {
            window.removeEventListener('session-expired', handleSessionExpired);
        };
    }, []);

    const handleSessionExpiryConfirm = () => {
        localStorage.removeItem('userInfo');
        setShowExpiryModal(false);
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                <TopHeader isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

                <main className="flex-1 overflow-y-auto transition-all duration-500 ease-in-out relative custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto min-h-full flex flex-col p-2 sm:p-6 lg:p-6">
                        <div className="flex-1">
                            <Outlet />
                        </div>

                        {/* Footer at bottom of scrollable area */}
                        <footer className="md:py-6 py-4 text-center text-[11px] text-gray-400 font-sm mt-auto">
                            © 2026 HRM Portal System • All rights reserved
                        </footer>
                    </div>
                </main>
            </div>

            <ConfirmationModal
                isOpen={showExpiryModal}
                onClose={() => { }} // Force user to click the button
                onConfirm={handleSessionExpiryConfirm}
                title="Session Expired"
                message="Your session has expired or is no longer valid. Please log in again to continue."
                confirmText="Go to Login"
                cancelText="" // Hide cancel button
                type="warning"
            />
        </div>
    );
};

export default MainLayout;
