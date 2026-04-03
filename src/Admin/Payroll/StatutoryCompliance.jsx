import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    FileText,
    Receipt,
    Wallet,
    Download,
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    Building2,
    Info,
    Plus,
    X,
    Loader2,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getStatutoryPFDataApi,
    getStatutoryESIDataApi,
    getStatutoryPTDataApi,
    getStatutoryTDSDataApi,
    getStatutorySummaryApi,
    createPFDataApi,
    createESIDataApi,
    createPTDataApi,
    createTDSDataApi,
    deletePFDataApi,
    deleteESIDataApi,
    deletePTDataApi,
    deleteTDSDataApi
} from '../../Action/api';

import { FormInput, FormSelect } from '../../Common/Form';
import DataTable from '../../Common/DataTable';
import Tooltip from '../../Common/Tooltip';

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white rounded-[15px] p-4 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] transition-all group overflow-hidden relative"
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color.bg} opacity-10 group-hover:scale-125 transition-transform duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
                <h3 className="text-[18px] md:text-[22px] font-semibold text-gray-900">
                    {value}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-widest leading-tight">
                    {title} {subValue && <span className="text-gray-400 font-medium">({subValue})</span>}
                </p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform shrink-0`}>
                <Icon size={20} />
            </div>
        </div>
    </motion.div>
);

const ComplianceTab = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all relative overflow-hidden whitespace-nowrap w-[130px] ${isActive
            ? 'bg-primary text-white shadow-xs shadow-primary/10 scale-105 z-10'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
            }`}
    >
        {label}
    </button>
);




export default function StatutoryCompliance() {
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            switch (activeTab) {
                case 'PF': await deletePFDataApi(id); break;
                case 'ESI': await deleteESIDataApi(id); break;
                case 'PT': await deletePTDataApi(id); break;
                case 'TDS': await deleteTDSDataApi(id); break;
                default: break;
            }
            toast.success('Record deleted successfully');
            fetchTabData();
            fetchSummary();
        } catch (error) {
            console.error('Error deleting record:', error);
            toast.error('Failed to delete record');
        }
    };

    const [activeTab, setActiveTab] = useState('PF');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [summaryStats, setSummaryStats] = useState({
        pf_contribution: 0,
        esi_contribution: 0,
        pt_paid: 0,
        tds_payable: 0
    });

    const [pfData, setPfData] = useState([]);
    const [esiData, setEsiData] = useState([]);
    const [ptData, setPtData] = useState([]);
    const [tdsData, setTdsData] = useState([]);

    const [formData, setFormData] = useState({
        month: '',
        employees_count: 0,
        wages: 0,
        er_share: 0,
        ee_share: 0,
        total_epf: 0,
        total_esi: 0,
        status: 'Pending',
        trrn_no: '',
        challan_id: '',
        state: '',
        taxable_employees: 0,
        amount: 0,
        filing_date: '',
        period: '',
        section: '',
        payout: 0,
        tds_deducted: 0,
        fine: 0,
        bsr_code: '',
        challan_no: ''
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const company_id = userInfo.company;

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchTabData();
    }, [activeTab]);

    const fetchSummary = async () => {
        try {
            const res = await getStatutorySummaryApi({ company_id });
            setSummaryStats(res.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const fetchTabData = async () => {
        setLoading(true);
        try {
            let res;
            switch (activeTab) {
                case 'PF':
                    res = await getStatutoryPFDataApi({ company_id });
                    setPfData(res.data);
                    break;
                case 'ESI':
                    res = await getStatutoryESIDataApi({ company_id });
                    setEsiData(res.data);
                    break;
                case 'PT':
                    res = await getStatutoryPTDataApi({ company_id });
                    setPtData(res.data);
                    break;
                case 'TDS':
                    res = await getStatutoryTDSDataApi({ company_id });
                    setTdsData(res.data);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load compliance records');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`;
        return `₹ ${val.toLocaleString()}`;
    };

    const complianceStats = [
        { title: 'PF Contribution', value: formatCurrency(summaryStats.pf_contribution), subValue: 'Paid', icon: ShieldCheck, color: { bg: 'bg-blue-50', text: 'text-blue-600' }, delay: 0.1 },
        { title: 'ESI Contribution', value: formatCurrency(summaryStats.esi_contribution), subValue: 'Paid', icon: HeartPulse, color: { bg: 'bg-emerald-50', text: 'text-emerald-600' }, delay: 0.2 },
        { title: 'TDS Payable', value: formatCurrency(summaryStats.tds_payable), subValue: 'Pending', icon: Receipt, color: { bg: 'bg-amber-50', text: 'text-amber-600' }, delay: 0.3 },
        { title: 'Prof. Tax', value: formatCurrency(summaryStats.pt_paid), subValue: 'Filed', icon: Wallet, color: { bg: 'bg-indigo-50', text: 'text-indigo-600' }, delay: 0.4 },
    ];

    const pfColumns = [
        { header: 'Month', key: 'month', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
        { header: 'Employees', key: 'employees_count', align: 'center' },
        { header: 'Wages', key: 'wages', align: 'right', render: (val) => <span className="font-mono text-[13px]">₹ {Number(val).toLocaleString()}</span> },
        { header: 'ER Share (12%)', key: 'er_share', align: 'right', render: (val) => <span className="font-semibold text-gray-600 italic">₹ {Number(val).toLocaleString()}</span> },
        { header: 'EE Share (12%)', key: 'ee_share', align: 'right', render: (val) => <span className="font-semibold text-gray-600 italic">₹ {Number(val).toLocaleString()}</span> },
        { header: 'Total EPF', key: 'total_epf', align: 'right', render: (val) => <span className="font-semibold text-primary">₹ {Number(val).toLocaleString()}</span> },
        {
            header: 'Status', key: 'status', align: 'center', render: (val) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${val === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {val}
                </span>
            )
        },
        { header: 'TRRN No', key: 'trrn_no' },
    ];

    const esiColumns = [
        { header: 'Month', key: 'month', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
        { header: 'Insured Persons', key: 'insured_persons', align: 'center' },
        { header: 'ESI Wages', key: 'wages', align: 'right', render: (val) => <span className="font-mono text-[13px]">₹ {Number(val).toLocaleString()}</span> },
        { header: 'ER Share (3.25%)', key: 'er_share', align: 'right', render: (val) => <span className="font-semibold text-gray-600 italic">₹ {Number(val).toLocaleString()}</span> },
        { header: 'EE Share (0.75%)', key: 'ee_share', align: 'right', render: (val) => <span className="font-semibold text-gray-600 italic">₹ {Number(val).toLocaleString()}</span> },
        { header: 'Total ESI', key: 'total_esi', align: 'right', render: (val) => <span className="font-bold text-emerald-600">₹ {Number(val).toLocaleString()}</span> },
        { header: 'Challan ID', key: 'challan_id' },
    ];

    const ptColumns = [
        { header: 'Month', key: 'month', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
        { header: 'State', key: 'state' },
        { header: 'Taxable Employees', key: 'taxable_employees', align: 'center' },
        { header: 'PT Amount', key: 'amount', align: 'right', render: (val) => <span className="font-bold text-indigo-600">₹ {Number(val).toLocaleString()}</span> },
        { header: 'Filing Date', key: 'filing_date', align: 'center' },
        {
            header: 'Status', key: 'status', align: 'center', render: (val) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${val === 'Filed' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                    {val}
                </span>
            )
        },
    ];

    const tdsColumns = [
        { header: 'Period', key: 'period', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
        { header: 'Section', key: 'section', align: 'center' },
        { header: 'Total Payout', key: 'payout', align: 'right', render: (val) => <span className="font-mono text-[13px]">₹ {Number(val).toLocaleString()}</span> },
        { header: 'TDS Deducted', key: 'tds_deducted', align: 'right', render: (val) => <span className="font-bold text-amber-600">₹ {Number(val).toLocaleString()}</span> },
        { header: 'Interest/Late Fee', key: 'fine', align: 'right', render: (val) => <span className="text-red-500 font-bold">₹ {Number(val).toLocaleString()}</span> },
        { header: 'BSR Code', key: 'bsr_code' },
        { header: 'Challan No', key: 'challan_no' },
    ];

    const extraActions = (item) => (
        <Tooltip text="Download Challan">
            <button
                onClick={() => handleDownload(item)}
                className="h-8 w-8 hover:bg-primary/5 rounded-lg text-primary flex items-center justify-center"
            >
                <Download size={16} />
            </button>
        </Tooltip>
    );

    const handleDownload = (item) => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Generating challan...',
                success: 'Challan downloaded successfully!',
                error: 'Failed to generate challan',
            }
        );
    };

    const handleOpenModal = () => {
        setFormData({
            month: '',
            employees_count: 0,
            wages: 0,
            er_share: 0,
            ee_share: 0,
            total_epf: 0,
            total_esi: 0,
            status: activeTab === 'PT' ? 'Pending' : 'Pending',
            trrn_no: '',
            challan_id: '',
            state: '',
            taxable_employees: 0,
            amount: 0,
            filing_date: '',
            period: '',
            section: '',
            payout: 0,
            tds_deducted: 0,
            fine: 0,
            bsr_code: '',
            challan_no: ''
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = { ...formData, company_id };
            switch (activeTab) {
                case 'PF':
                    await createPFDataApi(data);
                    break;
                case 'ESI':
                    await createESIDataApi(data);
                    break;
                case 'PT':
                    await createPTDataApi(data);
                    break;
                case 'TDS':
                    await createTDSDataApi(data);
                    break;
                default:
                    break;
            }
            toast.success(`${activeTab} record added successfully`);
            setIsModalOpen(false);
            fetchTabData();
            fetchSummary();
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error('Failed to save record');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredData = () => {
        let data = [];
        switch (activeTab) {
            case 'PF': data = pfData; break;
            case 'ESI': data = esiData; break;
            case 'PT': data = ptData; break;
            case 'TDS': data = tdsData; break;
            default: data = [];
        }
        if (!searchQuery) return data;
        return data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    };

    return (
        <div className="md:p-3 p-2 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                        Statutory Compliance
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-black uppercase rounded-full tracking-widest border border-primary/20">
                            FY {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(-2)}
                        </span>
                    </h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                        Worldwide Compliance: PF, ESI, Professional Tax, TDS & Benefits
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-xl font-semibold text-[13px] shadow-sm hover:bg-gray-50 transition-all">
                        <FileText size={16} className="text-gray-400" />
                        Compliance Report
                    </button>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-[13px] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Add Record
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {complianceStats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                {/* Tabs & Search Header */}
                <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex flex-col xl:flex-row items-center justify-between">
                        <div className="flex items-center gap-3 pb-1">
                            <ComplianceTab
                                icon={ShieldCheck}
                                label="PF (EPF/ECR)"
                                isActive={activeTab === 'PF'}
                                onClick={() => setActiveTab('PF')}
                            />
                            <ComplianceTab
                                icon={HeartPulse}
                                label="ESI"
                                isActive={activeTab === 'ESI'}
                                onClick={() => setActiveTab('ESI')}
                            />
                            <ComplianceTab
                                icon={Wallet}
                                label="Prof. Tax"
                                isActive={activeTab === 'PT'}
                                onClick={() => setActiveTab('PT')}
                            />
                            <ComplianceTab
                                icon={Receipt}
                                label="TDS on Salary"
                                isActive={activeTab === 'TDS'}
                                onClick={() => setActiveTab('TDS')}
                            />
                            <ComplianceTab
                                icon={ArrowUpRight}
                                label="Bonus/Gratuity"
                                isActive={activeTab === 'Bonus'}
                                onClick={() => setActiveTab('Bonus')}
                            />
                            <ComplianceTab
                                icon={FileText}
                                label="Documents"
                                isActive={activeTab === 'Docs'}
                                onClick={() => setActiveTab('Docs')}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-54">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search records..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <button className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'PF' && (
                                <DataTable
                                    columns={pfColumns}
                                    data={filteredData()}
                                    isLoading={loading}
                                    extraActions={extraActions}
                                    onDelete={(item) => handleDelete(item.id)}
                                    emptyMessage="No PF compliance records found"
                                />
                            )}
                            {activeTab === 'ESI' && (
                                <DataTable
                                    columns={esiColumns}
                                    data={filteredData()}
                                    isLoading={loading}
                                    extraActions={extraActions}
                                    onDelete={(item) => handleDelete(item.id)}
                                    emptyMessage="No ESI compliance records found"
                                />
                            )}
                            {activeTab === 'PT' && (
                                <DataTable
                                    columns={ptColumns}
                                    data={filteredData()}
                                    isLoading={loading}
                                    extraActions={extraActions}
                                    onDelete={(item) => handleDelete(item.id)}
                                    emptyMessage="No Professional Tax records found"
                                />
                            )}
                            {activeTab === 'TDS' && (
                                <DataTable
                                    columns={tdsColumns}
                                    data={filteredData()}
                                    isLoading={loading}
                                    extraActions={extraActions}
                                    onDelete={(item) => handleDelete(item.id)}
                                    emptyMessage="No TDS records found"
                                />
                            )}
                            {(activeTab === 'Bonus' || activeTab === 'Docs') && (
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {activeTab === 'Docs' ? (
                                        ['Form 16 (Part A)', 'Form 16 (Part B)', 'Quarterly Return 24Q', 'PF ECR Challan', 'ESI Monthly Challan', 'Professional Tax Receipt'].map((doc, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-gray-800">{doc}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">PDF • 2.4 MB</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDownload({})} className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all opacity-0 group-hover:opacity-100">
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                                            <Building2 size={48} className="mb-4 opacity-10" />
                                            <p className="font-semibold">No Bonus or Gratuity eligibility found for current period</p>
                                            <p className="text-xs uppercase tracking-widest mt-2">Calculated annually or on resignation</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Info */}
                <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex items-center gap-2">
                    <Info size={14} className="text-primary" />
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Compliance data is updated automatically after each successful payroll run.
                    </p>
                </div>
            </div>

            {/* Compliance Calendar Hint */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-blue-950 rounded-[15px] p-6 text-white relative overflow-hidden group shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Calendar size={20} className="text-blue-200" />
                            </div>
                            <h3 className="text-lg font-semibold">Upcoming Compliance Deadlines</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { name: 'PF ECR Filing', date: 'Feb 15, 2024', status: 'Urgent' },
                                { name: 'ESI Payment', date: 'Feb 15, 2024', status: 'Urgent' },
                                { name: 'Prof. Tax State 1', date: 'Feb 10, 2024', status: 'Upcoming' },
                                { name: 'TDS Deposit', date: 'Feb 07, 2024', status: 'Upcoming' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-semibold">{item.name}</p>
                                        <p className="text-[11px] text-white/50">{item.date}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${item.status === 'Urgent' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[15px] border border-gray-100 p-6 flex flex-col justify-between shadow-sm group">
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShieldCheck size={24} className="text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900">Compliance Audit</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Run a quick audit to check for missing filings or mismatches in payroll data.</p>
                        </div>
                    </div>
                    <button className="mt-6 w-full py-3 rounded-xl border-2 border-gray-100 text-gray-700 font-bold text-[13px] hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2">
                        Start Health Check
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            {/* Add Record Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[600px] max-h-[90vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-50">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800">Add {activeTab} Record</h2>
                                    <p className="text-gray-500 font-medium text-sm">Enter the compliance details below.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {(activeTab === 'PF' || activeTab === 'ESI' || activeTab === 'PT') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Month/Year</label>
                                            <FormInput
                                                type="text"
                                                value={formData.month}
                                                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                                placeholder="e.g. Jan 2024"
                                                required
                                            />
                                        </div>
                                        {activeTab === 'PT' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-gray-700 ml-1">State</label>
                                                <FormInput
                                                    type="text"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    placeholder="e.g. Maharashtra"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'TDS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Period</label>
                                            <FormInput
                                                type="text"
                                                value={formData.period}
                                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                                placeholder="e.g. Jan 2024"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Section</label>
                                            <FormInput
                                                type="text"
                                                value={formData.section}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                                placeholder="e.g. 192B"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'PF' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Employee Count</label>
                                            <FormInput
                                                type="number"
                                                value={formData.employees_count}
                                                onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Total Wages</label>
                                            <FormInput
                                                type="number"
                                                value={formData.wages}
                                                onChange={(e) => setFormData({ ...formData, wages: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">ER Share (12%)</label>
                                            <FormInput
                                                type="number"
                                                value={formData.er_share}
                                                onChange={(e) => setFormData({ ...formData, er_share: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">EE Share (12%)</label>
                                            <FormInput
                                                type="number"
                                                value={formData.ee_share}
                                                onChange={(e) => setFormData({ ...formData, ee_share: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Total EPF</label>
                                            <FormInput
                                                type="number"
                                                value={formData.total_epf}
                                                onChange={(e) => setFormData({ ...formData, total_epf: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">TRRN No</label>
                                            <FormInput
                                                type="text"
                                                value={formData.trrn_no}
                                                onChange={(e) => setFormData({ ...formData, trrn_no: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ESI' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Insured Persons</label>
                                            <FormInput
                                                type="number"
                                                value={formData.insured_persons}
                                                onChange={(e) => setFormData({ ...formData, insured_persons: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Total Wages</label>
                                            <FormInput
                                                type="number"
                                                value={formData.wages}
                                                onChange={(e) => setFormData({ ...formData, wages: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">ER Share (3.25%)</label>
                                            <FormInput
                                                type="number"
                                                value={formData.er_share}
                                                onChange={(e) => setFormData({ ...formData, er_share: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">EE Share (0.75%)</label>
                                            <FormInput
                                                type="number"
                                                value={formData.ee_share}
                                                onChange={(e) => setFormData({ ...formData, ee_share: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Total ESI</label>
                                            <FormInput
                                                type="number"
                                                value={formData.total_esi}
                                                onChange={(e) => setFormData({ ...formData, total_esi: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Challan ID</label>
                                            <FormInput
                                                type="text"
                                                value={formData.challan_id}
                                                onChange={(e) => setFormData({ ...formData, challan_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'PT' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Taxable Employees</label>
                                            <FormInput
                                                type="number"
                                                value={formData.taxable_employees}
                                                onChange={(e) => setFormData({ ...formData, taxable_employees: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">PT Amount</label>
                                            <FormInput
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Filing Date</label>
                                            <FormInput
                                                type="date"
                                                value={formData.filing_date}
                                                onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Status</label>
                                            <FormSelect
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                options={[
                                                    { value: 'Pending', label: 'Pending' },
                                                    { value: 'Filed', label: 'Filed' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'TDS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Total Payout</label>
                                            <FormInput
                                                type="number"
                                                value={formData.payout}
                                                onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">TDS Deducted</label>
                                            <FormInput
                                                type="number"
                                                value={formData.tds_deducted}
                                                onChange={(e) => setFormData({ ...formData, tds_deducted: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Interest/Late Fee</label>
                                            <FormInput
                                                type="number"
                                                value={formData.fine}
                                                onChange={(e) => setFormData({ ...formData, fine: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">BSR Code</label>
                                            <FormInput
                                                type="text"
                                                value={formData.bsr_code}
                                                onChange={(e) => setFormData({ ...formData, bsr_code: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Challan No</label>
                                            <FormInput
                                                type="text"
                                                value={formData.challan_no}
                                                onChange={(e) => setFormData({ ...formData, challan_no: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Status</label>
                                            <FormSelect
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                options={[
                                                    { value: 'Pending', label: 'Pending' },
                                                    { value: 'Paid', label: 'Paid' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                    <Info size={16} className="text-primary" />
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                        Manual entries should only be used if the payroll processing didn't capture the compliance details automatically.
                                    </p>
                                </div>
                            </form>

                            <div className="p-8 pt-4 border-t border-gray-50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-medium hover:bg-gray-50 rounded-full transition-all">Cancel</button>
                                <button
                                    onClick={handleFormSubmit}
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {submitting ? 'Saving...' : 'Add Record'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

const HeartPulse = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
    >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
);
