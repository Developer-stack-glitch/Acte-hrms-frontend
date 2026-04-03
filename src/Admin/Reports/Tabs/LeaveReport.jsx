import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    Clock,
    FileText,
    History,
    FileSpreadsheet,
    FileDown,
    ArrowRight,
    UserCircle,
    UserCheck,
    Loader2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { getOrgMetadataApi, generateLeaveReportApi } from '../../../Action/api';
import MultiSelectDropdown from '../../../Common/MultiSelectDropdown';
import toast from 'react-hot-toast';



const LeaveReport = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [selectedReport, setSelectedReport] = useState('leave-ledger');
    const [reportFormat, setReportFormat] = useState('excel');
    const [isGenerating, setIsGenerating] = useState(false);
    const [branchAndDeptOptions, setBranchAndDeptOptions] = useState([]);

    const leaveTypeItems = [
        { id: 'sick', label: 'Sick Leave' },
        { id: 'casual', label: 'Casual Leave' },
        { id: 'annual', label: 'Annual Leave' },
        { id: 'maternity', label: 'Maternity Leave' },
        { id: 'unpaid', label: 'Unpaid Leave' },
    ];

    const statusItems = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
    ];

    const [selectedDepts, setSelectedDepts] = useState([]);
    const [selectedLeaveTypes, setSelectedLeaveTypes] = useState(leaveTypeItems.map(i => i.id));
    const [selectedStatus, setSelectedStatus] = useState(statusItems.map(i => i.id));

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const { data } = await getOrgMetadataApi();
                const finalBranchAndDept = [];
                if (data.branches && data.branches.length > 0) {
                    finalBranchAndDept.push({ id: 'branches-header', label: 'Branches', type: 'header' });
                    data.branches.forEach(branch => {
                        finalBranchAndDept.push({ id: `branch-${branch.id}`, label: branch.name });
                    });
                }
                if (data.departments && data.departments.length > 0) {
                    finalBranchAndDept.push({ id: 'depts-header', label: 'Departments', type: 'header' });
                    data.departments.forEach(dept => {
                        finalBranchAndDept.push({ id: dept.id.toString(), label: dept.name });
                    });
                }
                setBranchAndDeptOptions(finalBranchAndDept);
                setSelectedDepts(finalBranchAndDept.filter(i => i.type !== 'header').map(i => i.id));
            } catch (error) {
                console.error('Error fetching filter metadata:', error);
            }
        };
        fetchFiltersData();
    }, []);

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true);
            const params = {
                fromDate: fromDate.toISOString().split('T')[0],
                toDate: toDate.toISOString().split('T')[0],
                departments: selectedDepts,
                leaveTypes: selectedLeaveTypes,
                status: selectedStatus,
                reportType: selectedReport,
                format: reportFormat
            };

            const response = await generateLeaveReportApi(params);

            // Check if it's a small blob that might contain an error message
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Report generation failed');
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Leave_Report_${selectedReport}_${new Date().getTime()}.${reportFormat === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report generated successfully!');
        } catch (error) {
            console.error('Error generating report:', error);

            let errorMessage = 'Failed to generate report';

            if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
                const text = await error.response.data.text();
                try {
                    const parsed = JSON.parse(text);
                    errorMessage = parsed.message || errorMessage;
                } catch (e) { }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const reportTypes = [
        { id: 'leave-ledger', title: 'Leave Ledger', desc: 'Detail employee records', icon: History, color: 'text-blue-600', bg: 'bg-blue-100' },
        { id: 'pending-requests', title: 'Action Required', desc: 'Pending approvals', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { id: 'rejected-requests', title: 'Rejections', desc: 'Denied applications', icon: UserCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
        { id: 'leave-trends', title: 'Leave Trends', desc: 'Monthly absenteeism', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { id: 'approved-summary', title: 'Approved Summary', desc: 'Confirmed leave list', icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    return (
        <div className="bg-white rounded-[15px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Leave Reports Standard</h2>
                    <p className="text-[14px] text-gray-500 font-medium">Standardized generation for all employee leave analytics and balance summaries.</p>
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
                        label="Leave Type"
                        items={leaveTypeItems}
                        selectedItems={selectedLeaveTypes}
                        onChange={setSelectedLeaveTypes}
                        placeholder="Search leave types..."
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
                        {isGenerating ? 'Generating...' : 'Generate Leave Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeaveReport;