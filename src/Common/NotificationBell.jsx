import React, { useState } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../utils/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
    const navigate = useNavigate();


    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const getIcon = (type) => {
        switch (type) {
            case 'attendance': return <Clock className="text-blue-500" size={16} />;
            case 'leave':
            case 'request': return <AlertTriangle className="text-orange-500" size={16} />;
            case 'reimbursement': return <Info className="text-emerald-500" size={16} />;
            case 'info': return <Info className="text-gray-500" size={16} />;
            default: return <Bell className="text-gray-500" size={16} />;
        }
    };


    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 lg:p-3 rounded-[10px] transition-all relative group overflow-hidden ${isOpen ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-primary/10 hover:text-primary'}`}
            >
                <Bell
                    size={18}
                    className={`transition-transform lg:w-5 lg:h-5 ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {unreadCount > 0 && (
                    <span className={`absolute top-2.5 right-3 lg:top-2.1 lg:right-2.8 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ${isOpen ? 'animate-none' : 'animate-pulse'}`} />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-[380px] bg-white rounded-xl shadow-xs border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[600px]"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                    <p className="text-xs text-gray-400 font-medium">You have {unreadCount} unread messages</p>
                                </div>
                                <div className="flex gap-1 p-1 bg-gray-50 rounded-full border border-gray-200">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${filter === 'all' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilter('unread')}
                                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${filter === 'unread' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Unread
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2">
                                {filteredNotifications.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Bell size={24} className="text-gray-300" />
                                        </div>
                                        <h4 className="text-md font-semibold text-gray-800 mb-1">No notifications yet</h4>
                                        <p className="text-xs text-gray-400">Everything is up to date. Check back later for updates.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {filteredNotifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => {
                                                    if (!notification.is_read) markAsRead(notification.id);
                                                    setIsOpen(false);

                                                    // Redirection logic
                                                    const data = notification.data || {};
                                                    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                                                    const userRole = userInfo.role;

                                                    if (userRole === 'admin' || userRole === 'superadmin') {
                                                        if (data.type === 'leave_request' || notification.type === 'leave') {
                                                            navigate('/leaves/manage-leaves');
                                                        } else if (data.type === 'reimbursement_request' || notification.type === 'reimbursement') {
                                                            navigate('/reimbursements');
                                                        } else if (data.type === 'asset_request') {
                                                            navigate('/asset-management');
                                                        } else if (notification.type === 'attendance') {
                                                            navigate('/attendance');
                                                        }
                                                    } else {
                                                        // Employee redirection
                                                        if (data.leave_id || notification.type === 'leave') {
                                                            navigate('/leaves/leave-list');
                                                        } else if (data.claim_id || notification.type === 'reimbursement') {
                                                            navigate('/reimbursements');
                                                        } else if (data.request_id) {
                                                            navigate('/my-assets');
                                                        } else if (notification.type === 'attendance') {
                                                            navigate('/attendance');
                                                        }
                                                    }
                                                }}
                                                className={`group flex gap-4 p-4 rounded-2xl transition-all cursor-pointer border border-transparent ${!notification.is_read ? 'bg-primary/[0.02] hover:bg-primary/[0.04] border-primary/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-gray-200 ${!notification.is_read ? 'bg-white ring-1 ring-primary/10' : 'bg-gray-50'}`}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    {!notification.is_read && (
                                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className={`text-[13px] font-semibold truncate ${!notification.is_read ? 'text-gray-900 font-extrabold' : 'text-gray-700'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[12px] leading-relaxed line-clamp-2 ${!notification.is_read ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                                                        {notification.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-center">
                                    <button
                                        onClick={markAllRead}
                                        className="text-[14px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2"
                                    >
                                        <Check size={14} />
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
