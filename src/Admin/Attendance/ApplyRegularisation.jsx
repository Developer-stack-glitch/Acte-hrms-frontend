import React, { useState } from 'react';
import { Clock, Send, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { createRegularisationApi } from '../../Action/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ApplyRegularisation = ({ onSuccess }) => {
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
        } catch (error) {
            console.error('Error submitting regularisation:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-2 sm:p-6 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[15px] border border-gray-200 p-6 md:p-6 space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Apply for Regularisation</h2>
                    <p className="text-sm font-medium text-gray-500">Submit a correction request for attendance discrepancy</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Affected Date */}
                        <div className="space-y-2 flex flex-col">
                            <label className="text-[14px] font-semibold text-gray-600">Target Correction Date</label>
                            <div className="relative group/field mt-2">
                                <DatePicker
                                    selected={formData.date ? new Date(formData.date) : null}
                                    onChange={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/2 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4"
                                    dateFormat="dd-MM-yyyy"
                                    portalId="root"
                                    required
                                />
                            </div>
                        </div>

                        {/* Punch In Time */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-semibold text-gray-600">Expected Clock In</label>
                            <div className="relative group/field">
                                <input
                                    type="time"
                                    value={formData.check_in}
                                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                                    className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/2 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4 mt-2"
                                    required
                                />
                            </div>
                        </div>

                        {/* Punch Out Time */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-semibold text-gray-600">Expected Clock Out</label>
                            <div className="relative group/field">
                                <input
                                    type="time"
                                    value={formData.check_out}
                                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                                    className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/2 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4 mt-2"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-gray-600">Reason for Request</label>
                        <div className="relative group/field">
                            <textarea
                                placeholder="Tell us why the attendance needs correction (e.g. system failure, missed punch...)"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="w-full py-3 border border-gray-200 rounded-[10px] focus:ring-[6px] focus:ring-primary/2 focus:border-primary outline-none transition-all font-medium text-gray-800 px-4 mt-2"
                                required
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-all shadow-md shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Submit Regularisation Request
                                    <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
