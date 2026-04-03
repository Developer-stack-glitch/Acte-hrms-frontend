import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    Receipt,
    Clock,
    ChevronDown,
    FileText,
    Banknote,
    History,
    FilePieChart,
    FileSpreadsheet,
    FileDown,
    ArrowRight,
    Search,
    Check,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getOrgMetadataApi, getReimbursementsApi, getReimbursementCategoriesApi } from '../../../Action/api';
import MultiSelectDropdown from '../../../Common/MultiSelectDropdown';
import toast from 'react-hot-toast';
import { generateReimbursementExcel, generateReimbursementPDF } from '../../../utils/reimbursementReportGenerator';


const ReimbursementsReport = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [selectedReport, setSelectedReport] = useState('claim-summary');
    const [reportFormat, setReportFormat] = useState('excel');
    const [isGenerating, setIsGenerating] = useState(false);
    const [branchAndDeptOptions, setBranchAndDeptOptions] = useState([]);

    const [categoryItems, setCategoryItems] = useState([
        { id: 'Travel', label: 'Travel' },
        { id: 'Meals', label: 'Meals' },
        { id: 'Accommodation', label: 'Accommodation' },
        { id: 'Office Supplies', label: 'Office Supplies' },
        { id: 'Medical', label: 'Medical' },
        { id: 'Telecommunication', label: 'Telecommunication' },
        { id: 'Others', label: 'Others' }
    ]);
    const [selectedCategories, setSelectedCategories] = useState(categoryItems.map(i => i.id));
    const statusItems = [
        { id: 'Pending', label: 'Pending' },
        { id: 'Approved', label: 'Approved' },
        { id: 'Paid', label: 'Paid' },
        { id: 'Rejected', label: 'Rejected' },
    ];

    const [selectedDepts, setSelectedDepts] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(statusItems.map(i => i.id));

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                // Fetch dynamic categories
                const catRes = await getReimbursementCategoriesApi();
                const dbCats = catRes.data || [];
                const defaultCats = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Medical', 'Telecommunication', 'Others'];
                const mergedCats = Array.from(new Set([...defaultCats, ...dbCats]));
                const formattedCats = mergedCats.map(c => ({ id: c, label: c }));
                setCategoryItems(formattedCats);
                setSelectedCategories(formattedCats.map(i => i.id));

                const { data } = await getOrgMetadataApi();
                const finalBranchAndDept = [];

                if (data.branches && data.branches.length > 0) {
                    finalBranchAndDept.push({ id: 'branches-header', label: 'Branches', type: 'header' });
                    finalBranchAndDept.push({ id: 'branch-none', label: 'Unassigned Branch' });
                    data.branches.forEach(branch => {
                        finalBranchAndDept.push({ id: `branch-${branch.id}`, label: branch.name });
                    });
                }

                if (data.departments && data.departments.length > 0) {
                    finalBranchAndDept.push({ id: 'depts-header', label: 'Departments', type: 'header' });
                    finalBranchAndDept.push({ id: 'none', label: 'Unassigned Department' });
                    data.departments.forEach(dept => {
                        finalBranchAndDept.push({ id: dept.id.toString(), label: dept.name });
                    });
                }

                setBranchAndDeptOptions(finalBranchAndDept);
                setSelectedDepts(finalBranchAndDept.filter(item => item.type !== 'header').map(item => item.id));
            } catch (error) {
                console.error('Error fetching filter metadata:', error);
            }
        };
        fetchFiltersData();
    }, []);

    const handleGenerateReport = async () => {
        if (selectedDepts.length === 0) return toast.error('Please select at least one department');
        if (selectedCategories.length === 0) return toast.error('Please select at least one category');
        if (selectedStatus.length === 0) return toast.error('Please select at least one status');

        try {
            setIsGenerating(true);
            const params = {
                fromDate: new Date(fromDate.getTime() - fromDate.getTimezoneOffset() * 60000).toISOString().split('T')[0],
                toDate: new Date(toDate.getTime() - toDate.getTimezoneOffset() * 60000).toISOString().split('T')[0],
                departments: selectedDepts.join(','),
                categories: selectedCategories.join(','),
                statuses: selectedStatus.join(','),
            };

            let finalStatus = selectedStatus;
            if (selectedReport === 'pending-claims') finalStatus = ['Pending'];
            if (selectedReport === 'approved-claims') finalStatus = ['Approved'];
            if (selectedReport === 'paid-claims') finalStatus = ['Paid'];
            if (selectedReport === 'rejected-claims') finalStatus = ['Rejected'];

            if (selectedReport !== 'claim-summary') {
                params.statuses = finalStatus.join(',');
            }

            const { data } = await getReimbursementsApi(params);

            if (!data || data.length === 0) {
                toast.error('No records found for the selected filters');
                return;
            }

            const reportFilters = {
                fromDate: fromDate.toLocaleDateString(),
                toDate: toDate.toLocaleDateString()
            };

            if (reportFormat === 'excel') {
                await generateReimbursementExcel(data, selectedReport, reportFilters);
            } else {
                generateReimbursementPDF(data, selectedReport, reportFilters);
            }

            toast.success('Report generated successfully!');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setIsGenerating(false);
        }
    };

    const reportTypes = [
        { id: 'claim-summary', title: 'Claim Summary', desc: 'Overall cost overview', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-100' },
        { id: 'pending-claims', title: 'Pending Claims', desc: 'Review required', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { id: 'approved-claims', title: 'Approved Claims', desc: 'Final processing', icon: Check, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { id: 'paid-claims', title: 'Paid Claims', desc: 'Settlement history', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { id: 'rejected-claims', title: 'Rejected Claims', desc: 'Financial compliance', icon: History, color: 'text-rose-600', bg: 'bg-rose-100' },
    ];

    return (
        <div className="bg-white rounded-[15px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Reimbursement Reports Standard</h2>
                    <p className="text-[14px] text-gray-500 font-medium">Standardized generation for all financial summaries and expense claim histories.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 px-1">From Date</label>
                        <div className="relative group mt-1">
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 px-1">To Date</label>
                        <div className="relative group mt-1">
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <MultiSelectDropdown
                        label="Branch & Dept"
                        items={branchAndDeptOptions}
                        selectedItems={selectedDepts}
                        onChange={setSelectedDepts}
                        placeholder="Search departments..."
                    />

                    <MultiSelectDropdown
                        label="Category"
                        items={categoryItems}
                        selectedItems={selectedCategories}
                        onChange={setSelectedCategories}
                        placeholder="Search categories..."
                    />

                    <MultiSelectDropdown
                        label="Status"
                        items={statusItems}
                        selectedItems={selectedStatus}
                        onChange={setSelectedStatus}
                        placeholder="Search status..."
                    />
                </div>

                <div className="h-px bg-gray-100 mb-7" />

                <div className="mb-10">
                    <label className="text-[16px] font-semibold text-gray-700 px-1 mb-4 block">Select Report Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {reportTypes.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report.id)}
                                className={`flex flex-col items-center gap-3 px-4 py-6 rounded-xl border transition-all text-center group ${selectedReport === report.id
                                    ? 'border-1 border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl transition-all ${selectedReport === report.id ? 'bg-primary text-white scale-110' : `${report.bg} ${report.color}`
                                    }`}>
                                    <report.icon size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`text-[16px] font-semibold truncate ${selectedReport === report.id ? 'text-primary' : 'text-gray-900'}`}>{report.title}</h4>
                                    <p className="text-[12px] text-gray-600 font-medium truncate">{report.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-gray-100 mb-7" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Format:</span>
                            <div className="flex bg-gray-100 p-1 rounded-full gap-1">
                                <button
                                    onClick={() => setReportFormat('excel')}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${reportFormat === 'excel' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}
                                >
                                    <FileSpreadsheet size={16} /> Excel
                                </button>
                                <button
                                    onClick={() => setReportFormat('pdf')}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${reportFormat === 'pdf' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}
                                >
                                    <FileDown size={16} /> PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className={`w-full sm:w-auto px-8 py-2.5 bg-primary text-white rounded-full text-[15px] font-medium hover:bg-primary-hover transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50`}
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        {isGenerating ? 'Generating...' : 'Generate Reimbursement Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReimbursementsReport;
