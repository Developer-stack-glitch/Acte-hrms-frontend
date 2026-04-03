import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, PiggyBank, Receipt, Wallet } from 'lucide-react';
import { getMyPayslipsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export default function MyPayslips() {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            const response = await getMyPayslipsApi();
            setPayslips(response.data);
        } catch (error) {
            console.error('Error fetching payslips:', error);
            toast.error('Failed to load payslips');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id, employeeName, periodStart) => {
        try {
            const url = `${API_URL}/api/payroll-run/payslip/${id}/download`;
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = userInfo.token;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const monthName = format(parseISO(periodStart), 'MMMM_yyyy');
            link.setAttribute('download', `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthName}.pdf`);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download payslip');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-400 font-medium animate-pulse">Loading your payslips...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-3 px-3">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">My Payslips</h1>
                    <p className="text-sm text-gray-500 mt-1">View and download your salary statements</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-2xl">
                    <Receipt className="text-primary" size={28} />
                </div>
            </div>

            {payslips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payslips.map((payslip, index) => (
                        <motion.div
                            key={payslip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-[15px] border border-gray-200 hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <button
                                        onClick={() => handleDownload(payslip.id, payslip.employee_name, payslip.period_start)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        title="Download PDF"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 leading-none">
                                            {format(parseISO(payslip.period_start), 'MMMM yyyy')}
                                        </h3>
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-2">
                                            {payslip.batch_name}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-tighter">Gross Salary</p>
                                            <p className="text-sm font-semibold text-gray-700">₹{Number(payslip.gross_salary).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-tighter text-right">Net Payable</p>
                                            <p className="text-sm font-extrabold text-primary text-right">₹{Number(payslip.net_salary).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${(payslip.net_salary / payslip.gross_salary) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {((payslip.net_salary / payslip.gross_salary) * 100).toFixed(0)}% In-hand
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => handleDownload(payslip.id, payslip.employee_name, payslip.period_start)}
                                className="bg-gray-50 p-3 flex items-center justify-center gap-2 cursor-pointer group-hover:bg-primary group-hover:text-white transition-all text-gray-600 font-semibold text-[16px]"
                            >
                                <Download size={16} />
                                Download Payslip
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="p-6 bg-gray-50 rounded-full mb-6">
                        <PiggyBank size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payslips Yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        Once the admin finalizes the payroll for your batch, your payslips will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
