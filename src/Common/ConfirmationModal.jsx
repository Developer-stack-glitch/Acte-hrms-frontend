import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "primary", // 'danger', 'warning', or 'primary'
    loading = false
}) => {
    if (!isOpen) return null;

    const themes = {
        primary: {
            iconBg: 'bg-blue-50',
            iconText: 'text-blue-600',
            confirmBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
            cancelBg: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
            border: 'border-blue-100'
        },
        danger: {
            iconBg: 'bg-rose-50',
            iconText: 'text-rose-600',
            confirmBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
            cancelBg: 'bg-rose-50/50 hover:bg-rose-50 text-rose-700',
            border: 'border-rose-100'
        },
        warning: {
            iconBg: 'bg-amber-50',
            iconText: 'text-amber-600',
            confirmBg: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
            cancelBg: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
            border: 'border-amber-100'
        }
    };

    const theme = themes[type] || themes.primary;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-0">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full max-w-md bg-white rounded-[15px] shadow-2xl overflow-hidden border ${theme.border}`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-4">
                        <div className="flex flex-col items-center text-center">
                            {/* Icon Wrapper */}
                            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-5 ${theme.iconBg} ${theme.iconText}`}>
                                <AlertCircle size={32} />
                            </div>

                            <h3 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">{title}</h3>
                            <p className="text-gray-500 text-[15px] leading-relaxed font-medium px-4">
                                {message}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-6">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className={`flex-1 px-4 py-3 font-semibold rounded-full transition-all disabled:opacity-50 text-[14px] ${theme.cancelBg}`}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex-1 px-4 py-3 text-white font-medium rounded-full transition-all shadow-xs flex items-center justify-center gap-2 text-[14px] ${theme.confirmBg} disabled:opacity-50`}
                            >
                                {loading && (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
