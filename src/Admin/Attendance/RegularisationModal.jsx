import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, Send, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { createRegularisationApi } from '../../Action/api';

const RegularisationModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [correctionType, setCorrectionType] = useState('both'); // 'both' | 'in' | 'out'
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        check_in: '09:00',
        check_out: '18:00',
        reason: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.date) {
            return toast.error('Please select a target date');
        }

        if (!formData.reason.trim()) {
            return toast.error('Please provide a reason for regularisation');
        }

        if ((correctionType === 'both' || correctionType === 'in') && !formData.check_in) {
            return toast.error('Please provide Expected Clock In time');
        }

        if ((correctionType === 'both' || correctionType === 'out') && !formData.check_out) {
            return toast.error('Please provide Expected Clock Out time');
        }

        const payload = {
            date: formData.date,
            check_in: (correctionType === 'both' || correctionType === 'in') ? formData.check_in : null,
            check_out: (correctionType === 'both' || correctionType === 'out') ? formData.check_out : null,
            reason: formData.reason.trim()
        };

        try {
            setLoading(true);
            await createRegularisationApi(payload);
            toast.success('Regularisation request submitted');
            setFormData(prev => ({ ...prev, reason: '' }));
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
                        className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent shrink-0">
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
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            {/* Choosable Correction Options */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">
                                    Correction Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCorrectionType('both')}
                                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                            correctionType === 'both'
                                                ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20 text-primary font-bold'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Clock size={16} />
                                        <span className="text-[12px]">Both</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCorrectionType('in')}
                                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                            correctionType === 'in'
                                                ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20 text-primary font-bold'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <LogIn size={16} />
                                        <span className="text-[12px]">In Only</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCorrectionType('out')}
                                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                                            correctionType === 'out'
                                                ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20 text-primary font-bold'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <LogOut size={16} />
                                        <span className="text-[12px]">Out Only</span>
                                    </button>
                                </div>
                            </div>

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
                                <div className={`grid gap-4 ${correctionType === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {(correctionType === 'both' || correctionType === 'in') && (
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Expected Check In</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="time"
                                                    value={formData.check_in}
                                                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                                    required={correctionType === 'both' || correctionType === 'in'}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(correctionType === 'both' || correctionType === 'out') && (
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide ml-1">Expected Check Out</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                                <input
                                                    type="time"
                                                    value={formData.check_out}
                                                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700"
                                                    required={correctionType === 'both' || correctionType === 'out'}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Context Notice */}
                                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-700 text-xs">
                                    {correctionType === 'both' && 'Regularising both Punch In and Punch Out.'}
                                    {correctionType === 'in' && 'Regularising Punch In only. Existing Punch Out will be preserved.'}
                                    {correctionType === 'out' && 'Regularising Punch Out only. Existing Punch In will be preserved.'}
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
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-700 min-h-[90px] resize-none"
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
