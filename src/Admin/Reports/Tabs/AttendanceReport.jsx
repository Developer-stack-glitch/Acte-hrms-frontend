import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar,
    UserX,
    UserCheck,
    Clock,
    ChevronDown,
    FileText,
    Timer,
    Footprints,
    CircleEllipsis,
    FileSpreadsheet,
    FileDown,
    ArrowRight,
    Search,
    Check,
    X,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getOrgMetadataApi, generateAttendanceReportApi } from '../../../Action/api';
import toast from 'react-hot-toast';

import MultiSelectDropdown from '../../../Common/MultiSelectDropdown';

const AttendanceReport = () => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [selectedReport, setSelectedReport] = useState('muster-roll');
    const [reportFormat, setReportFormat] = useState('excel');
    const [isGenerating, setIsGenerating] = useState(false);

    const [selectedBranches, setSelectedBranches] = useState([]);
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [selectedEmpTypes, setSelectedEmpTypes] = useState(['intern', 'provision', 'permanent']);
    const [selectedWorkModes, setSelectedWorkModes] = useState(['remote', 'inoffice', 'hybrid', 'onfield']);

    const [branchAndDeptOptions, setBranchAndDeptOptions] = useState([]);
    const [shiftOptions, setShiftOptions] = useState([]);
    const [empTypeOptions, setEmpTypeOptions] = useState([
        { id: 'intern', label: 'Intern' },
        { id: 'provision', label: 'Provision' },
        { id: 'permanent', label: 'Permanent' },
    ]);
    const [workModeOptions, setWorkModeOptions] = useState([
        { id: 'remote', label: 'Remote' },
        { id: 'inoffice', label: 'Inoffice' },
        { id: 'hybrid', label: 'Hybrid' },
        { id: 'onfield', label: 'On Field' },
    ]);

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const { data } = await getOrgMetadataApi();
                console.log('Metadata fetched:', data);

                // Process Branches into headers and Departments into items
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

                setBranchAndDeptOptions(finalBranchAndDept.length > 0 ? finalBranchAndDept : []);
                if (finalBranchAndDept.length > 0) {
                    setSelectedBranches(finalBranchAndDept.filter(item => item.type !== 'header').map(item => item.id));
                }

                // Process Shifts
                const shifts = (data.shifts || []).map(shift => ({
                    id: shift.id.toString(),
                    label: `${shift.name} (${shift.start_time} - ${shift.end_time})`
                }));
                setShiftOptions(shifts);
                if (shifts.length > 0) {
                    setSelectedShifts(shifts.map(s => s.id));
                }

                // Update Employment Types (merge with defaults or use from DB)
                if (data.employmentTypes && data.employmentTypes.length > 0) {
                    setEmpTypeOptions(data.employmentTypes);
                    setSelectedEmpTypes(data.employmentTypes.map(i => i.id));
                }

                // Update Work Modes (merge with defaults or use from DB)
                if (data.workModes && data.workModes.length > 0) {
                    setWorkModeOptions(data.workModes);
                    setSelectedWorkModes(data.workModes.map(i => i.id));
                }

            } catch (error) {
                console.error('Error fetching filter metadata:', error);
                // Fallback to defaults or keep current ones if they were set
            }
        };

        fetchFiltersData();
    }, []);

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true);
            const params = {
                startDate: fromDate.toISOString().split('T')[0],
                endDate: toDate.toISOString().split('T')[0],
                reportType: selectedReport,
                branches: JSON.stringify(selectedBranches),
                shifts: JSON.stringify(selectedShifts),
                empTypes: JSON.stringify(selectedEmpTypes),
                workModes: JSON.stringify(selectedWorkModes),
                format: reportFormat
            };

            const response = await generateAttendanceReportApi(params);

            // Check if it's a small blob that might contain an error JSON
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Report generation failed');
            }

            // Handle file download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `${selectedReport}_${params.startDate}_to_${params.endDate}.${reportFormat === 'excel' ? 'xlsx' : 'pdf'}`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`${selectedReport.replace('-', ' ')} generated successfully!`);
        } catch (error) {
            console.error('Error generating report:', error);

            let errorMessage = 'Failed to generate report';

            // Handle blob error decoding
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
        { id: 'muster-roll', title: 'Muster Roll', desc: 'Monthly calendar view', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
        { id: 'absent-report', title: 'Absent Report', desc: 'List of absentees', icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
        { id: 'present-report', title: 'Present Report', desc: 'List of attendees', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { id: 'late-report', title: 'Late Report', desc: 'Late comers list', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { id: 'early-leaving', title: 'Early Leaving', desc: 'Early exits list', icon: Footprints, color: 'text-cyan-600', bg: 'bg-cyan-100' },
        { id: 'half-day', title: 'Half Day', desc: 'Half-day records', icon: CircleEllipsis, color: 'text-zinc-600', bg: 'bg-zinc-100' },
        { id: 'overtime', title: 'Overtime', desc: 'OT hours tracked', icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-200' },
        { id: 'leave-report', title: 'Leave Report', desc: 'Approved leaves', icon: FileText, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100' },
    ];

    return (
        <div className="bg-white rounded-[15px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Attendance Reports Standard</h2>
                    <p className="text-[14px] text-gray-500 font-medium">Standardized generation for all attendance, muster roll, and leave tracking.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 px-1">From Date</label>
                        <div className="relative group mt-1">
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
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
                                showYearDropdown
                                showMonthDropdown
                                dropdownMode="select"
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <MultiSelectDropdown
                        label="Branch & Dept"
                        items={branchAndDeptOptions}
                        selectedItems={selectedBranches}
                        onChange={setSelectedBranches}
                        placeholder="Search departments..."
                    />

                    <MultiSelectDropdown
                        label="Shift"
                        items={shiftOptions}
                        selectedItems={selectedShifts}
                        onChange={setSelectedShifts}
                        placeholder="Search shifts..."
                    />

                    <MultiSelectDropdown
                        label="Employment Type"
                        items={empTypeOptions}
                        selectedItems={selectedEmpTypes}
                        onChange={setSelectedEmpTypes}
                        placeholder="Search types..."
                    />

                    <MultiSelectDropdown
                        label="Work Mode"
                        items={workModeOptions}
                        selectedItems={selectedWorkModes}
                        onChange={setSelectedWorkModes}
                        placeholder="Search modes..."
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
                                    <report.icon size={22} />
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
                        {isGenerating ? 'Generating...' : 'Generate Attendance Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;
