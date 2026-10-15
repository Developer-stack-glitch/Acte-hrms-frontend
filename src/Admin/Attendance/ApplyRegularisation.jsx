import React, { useState } from 'react';
import { Clock, Send, AlertCircle, Calendar, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { createRegularisationApi } from '../../Action/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ApplyRegularisation = ({ onSuccess }) => {
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
            toast.success('Regularisation request submitted successfully');
            setFormData(prev => ({ ...prev, reason: '' }));
            onSuccess?.();
        } catch (error) {
            console.error('Error submitting regularisation:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-2 sm:p-6 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[15px] border border-gray-200 p-6 md:p-8 space-y-8 shadow-sm">
                {/* Header */}
                <div className="space-y-1.5 border-b border-gray-100 pb-5">
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Apply for Regularisation</h2>
                    <p className="text-sm font-medium text-gray-500">Submit an attendance correction request for missed or inaccurate punches</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                    {/* Choosable Correction Options */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                            <span>Correction Type</span>
                            <span className="text-xs font-semibold text-primary lowercase tracking-normal">
                                {correctionType === 'both' ? 'Both Clock In & Out' : correctionType === 'in' ? 'Clock In only' : 'Clock Out only'}
                            </span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Option 1: Both */}
                            <button
                                type="button"
                                onClick={() => setCorrectionType('both')}
                                className={`relative p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 group ${correctionType === 'both'
                                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${correctionType === 'both' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                                    }`}>
                                    <Clock size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm font-semibold truncate ${correctionType === 'both' ? 'text-primary' : 'text-gray-800'}`}>
                                            Both In & Out
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Regularise full day shift</p>
                                </div>
                                {correctionType === 'both' && (
                                    <CheckCircle2 size={16} className="text-primary shrink-0 self-center" />
                                )}
                            </button>

                            {/* Option 2: Punch In Only */}
                            <button
                                type="button"
                                onClick={() => setCorrectionType('in')}
                                className={`relative p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 group ${correctionType === 'in'
                                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${correctionType === 'in' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                                    }`}>
                                    <LogIn size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm font-semibold truncate ${correctionType === 'in' ? 'text-primary' : 'text-gray-800'}`}>
                                            Punch In Only
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Correct arrival time</p>
                                </div>
                                {correctionType === 'in' && (
                                    <CheckCircle2 size={16} className="text-primary shrink-0 self-center" />
                                )}
                            </button>

                            {/* Option 3: Punch Out Only */}
                            <button
                                type="button"
                                onClick={() => setCorrectionType('out')}
                                className={`relative p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 group ${correctionType === 'out'
                                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${correctionType === 'out' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                                    }`}>
                                    <LogOut size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm font-semibold truncate ${correctionType === 'out' ? 'text-primary' : 'text-gray-800'}`}>
                                            Punch Out Only
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Correct departure time</p>
                                </div>
                                {correctionType === 'out' && (
                                    <CheckCircle2 size={16} className="text-primary shrink-0 self-center" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Inputs Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Affected Date */}
                        <div className={`space-y-2 flex flex-col ${correctionType === 'both' ? 'md:col-span-2' : ''}`}>
                            <label className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
                                <Calendar size={16} className="text-primary" />
                                Target Correction Date
                            </label>
                            <div className="relative group/field mt-1">
                                <DatePicker
                                    selected={formData.date ? new Date(formData.date) : null}
                                    onChange={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4"
                                    dateFormat="dd-MM-yyyy"
                                    portalId="root"
                                    required
                                />
                            </div>
                        </div>

                        {/* Punch In Time */}
                        <AnimatePresence>
                            {(correctionType === 'both' || correctionType === 'in') && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="space-y-2"
                                >
                                    <label className="text-[14px] font-semibold text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <LogIn size={15} className="text-emerald-600" />
                                            Expected Clock In
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                            Punch In
                                        </span>
                                    </label>
                                    <div className="relative group/field mt-1">
                                        <input
                                            type="time"
                                            value={formData.check_in}
                                            onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                                            className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4"
                                            required={correctionType === 'both' || correctionType === 'in'}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Punch Out Time */}
                        <AnimatePresence>
                            {(correctionType === 'both' || correctionType === 'out') && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="space-y-2"
                                >
                                    <label className="text-[14px] font-semibold text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <LogOut size={15} className="text-orange-500" />
                                            Expected Clock Out
                                        </span>
                                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                            Punch Out
                                        </span>
                                    </label>
                                    <div className="relative group/field mt-1">
                                        <input
                                            type="time"
                                            value={formData.check_out}
                                            onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                                            className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4"
                                            required={correctionType === 'both' || correctionType === 'out'}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Helpful Context Note */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 text-blue-800 text-xs font-medium">
                        <AlertCircle size={16} className="text-blue-500 shrink-0" />
                        <span>
                            {correctionType === 'both' && 'Both Clock In and Clock Out will be updated upon approval.'}
                            {correctionType === 'in' && 'Only Clock In will be submitted. Any existing punch out recorded for this date will be kept unchanged.'}
                            {correctionType === 'out' && 'Only Clock Out will be submitted. Any existing punch in recorded for this date will be kept unchanged.'}
                        </span>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-gray-700">Reason for Request</label>
                        <div className="relative group/field mt-1">
                            <textarea
                                placeholder="Tell us why the attendance needs correction (e.g. system failure, missed biometric punch, client meeting...)"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4 resize-none"
                                required
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2.5 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>
                                        {correctionType === 'both' && 'Submit Regularisation Request'}
                                        {correctionType === 'in' && 'Submit Punch In Request'}
                                        {correctionType === 'out' && 'Submit Punch Out Request'}
                                    </span>
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyRegularisation;
