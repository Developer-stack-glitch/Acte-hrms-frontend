import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { createRegularisationApi } from '../../Action/api';

const RegularisationModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        check_in: '09:00',
        check_out: '18:00',
        reason: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.reason.trim()) {
            return toast.error('Please provide a reason for regularisation');
        }

        try {
            setLoading(true);
            await createRegularisationApi(formData);
            toast.success('Regularisation request submitted');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error submitting regularisation:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Attendance Regularisation</h3>
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Submit a correction request</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-4">
                                {/* Date Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Affected Date</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Punch Times */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Check In</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="time"
                                                value={formData.check_in}
                                                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Check Out</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="time"
                                                value={formData.check_out}
                                                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Reason for correction</label>
                                    <div className="relative group">
                                        <AlertCircle className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <textarea
                                            placeholder="Ex: My biometric was not working, Manual punch missed..."
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700 min-h-[100px] resize-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Submit Request
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RegularisationModal;
