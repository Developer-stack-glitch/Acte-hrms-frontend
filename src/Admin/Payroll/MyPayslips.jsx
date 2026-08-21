import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, PiggyBank, Receipt, Wallet, FileCheck } from 'lucide-react';
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

    const handleDownload = async (id, employeeName, periodEnd) => {
        try {
            const url = `${API_URL}/api/payroll-run/payslip/${id}/download`;
            const userInfo = JSON.parse((localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')) || '{}');
            const token = userInfo.token;

            const toastId = toast.loading('Generating payslip...');

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                toast.dismiss(toastId);
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const monthName = format(parseISO(periodEnd), 'MMMM_yyyy');
            link.setAttribute('download', `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthName}.pdf`);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast.dismiss(toastId);
            toast.success('Payslip downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download payslip');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading your salary statements...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pt-4 pb-12 px-4 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-6 border border-primary/10 shadow-xs">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-2xl font-semibold text-gray-900 tracking-tight">Salary Statements</h1>
                        <p className="text-gray-600 mt-2 text-base md:text-md max-w-xl">
                            Access and download your comprehensive monthly payslips and compensation details.
                        </p>
                    </div>
                    <div className="p-3 bg-white/60 backdrop-blur-md rounded-xl shadow-xs border border-white/50 w-fit">
                        <Receipt className="text-primary" size={20} />
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            </div>

            {payslips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {payslips.map((payslip, index) => (
                        <motion.div
                            key={payslip.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                            className="relative bg-white rounded-3xl border border-gray-200 hover:border-primary/30 shadow-xs hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="p-7 flex-grow">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary/10 text-gray-500 group-hover:text-primary transition-colors duration-300 shadow-xs border border-gray-200 group-hover:border-primary/20">
                                            <Wallet size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                                                {format(parseISO(payslip.period_end), 'MMMM yyyy')}
                                            </h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <FileCheck size={12} className="text-primary/70" />
                                                <p className="text-xs font-semibold text-primary/80 uppercase tracking-widest">
                                                    {payslip.batch_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(payslip.id, payslip.employee_name, payslip.period_end)}
                                        className="p-2.5 text-gray-400 hover:text-white bg-transparent hover:bg-primary rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                                        title="Download PDF"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-5 border-y border-gray-100 mb-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gross Salary</p>
                                        <p className="text-lg font-semibold text-gray-800">
                                            ₹{Number(payslip.gross_salary).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Net Payable</p>
                                        <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                                            ₹{Number(payslip.net_salary).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <span>Take-home Percentage</span>
                                        <span className="text-primary font-bold">
                                            {((payslip.net_salary / payslip.gross_salary) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(payslip.net_salary / payslip.gross_salary) * 100}%` }}
                                            transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(payslip.id, payslip.employee_name, payslip.period_end)}
                                className="w-full py-4.5 bg-gray-50/80 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all duration-300 text-sm font-semibold text-gray-600 border-t border-gray-100"
                                style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
                            >
                                <Download size={18} />
                                Download Statement
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-dashed border-gray-300 p-16 md:p-24 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="p-6 bg-gray-50 rounded-full mb-6 ring-4 ring-white shadow-inner">
                        <PiggyBank size={56} className="text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Payslips Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto text-lg">
                        Once the administration finalizes the payroll for your batch, your salary statements will securely appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
