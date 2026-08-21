import React, { useState, useEffect } from 'react';
import {
    Calendar,
    FileText,
    User,
    Plus,
    Save,
    X,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLeaveApi, getUsersApi } from '../../Action/api';
import toast from 'react-hot-toast';
import Compressor from 'compressorjs';
import { FormInput, FormSelect, FormDate, FormTextarea, FormTime, SearchableSelect } from '../../Common/Form';
import { AddLeaveSkeleton } from '../../Common/CommonSkeletonLoader/LeaveSkeleton';

const leaveTypes = [
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Casual Leave', label: 'Casual Leave' },
    { value: 'Earned Leave', label: 'Earned Leave' },
    { value: 'Loss of Pay(LOP)', label: 'Loss of Pay(LOP)' },
    { value: 'Permission', label: 'Permission (Short duration)' },
];

export default function AddLeave({ onSuccess, onCancel }) {
    const userInfo = React.useMemo(() => JSON.parse((localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')) || '{}'), []);
    const userRole = userInfo.role;
    const userId = userInfo._id || userInfo.id;

    const [formData, setFormData] = useState({
        employee_id: userRole === 'employee' ? userId : '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        status: 'Pending',
        is_half_day: false,
        half_day_period: 'Morning',
        contact_number: '',
        start_time: '',
        end_time: ''
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [calculatedDays, setCalculatedDays] = useState(0);
    const [documents, setDocuments] = useState([]);
    const [isCompressing, setIsCompressing] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await getUsersApi({ limit: 1000 }); // Fetch more for dropdown
                // Map workers/employees to options
                if (response.data && response.data.users && Array.isArray(response.data.users)) {
                    const allEmployees = response.data.users.map(emp => ({
                        value: emp.id,
                        label: `${emp.employee_name || emp.name} (${emp.emp_id || 'N/A'})`
                    }));

                    if (userRole === 'employee') {
                        // For employees, only show themselves in the dropdown (though it might be hidden)
                        setEmployees(allEmployees.filter(emp => emp.value === userId));
                    } else {
                        setEmployees(allEmployees);
                    }
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employees list');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchEmployees();
    }, [userRole, userId]);

    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);

            if (end >= start) {
                const diffTime = Math.abs(end - start);
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (formData.is_half_day) {
                    diffDays = 0.5;
                }

                setCalculatedDays(diffDays);
            } else {
                setCalculatedDays(0);
            }
        } else {
            setCalculatedDays(0);
        }
    }, [formData.start_date, formData.end_date, formData.is_half_day]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Validation
        if (!formData.employee_id) return toast.error('Please select an employee');
        if (!formData.leave_type) return toast.error('Please select a leave type');
        if (!formData.start_date) return toast.error('Please select a start date');

        if (formData.leave_type === 'Permission') {
            if (!formData.start_time || !formData.end_time) {
                return toast.error('Please select start and end time for permission');
            }
        } else if (!formData.is_half_day && !formData.end_date) {
            return toast.error('Please select an end date');
        }

        const finalData = {
            ...formData,
            applied_by: userId
        };

        // Auto-approve Permissions
        if (formData.leave_type === 'Permission') {
            finalData.status = 'Approved';
            finalData.end_date = formData.start_date; // Same day
        }

        if (formData.is_half_day) {
            finalData.end_date = formData.start_date; // Same day for half day
        } else {
            finalData.half_day_period = null;
        }

        if (formData.leave_type !== 'Permission') {
            finalData.start_time = null;
            finalData.end_time = null;
        }

        if (new Date(finalData.end_date) < new Date(finalData.start_date)) {
            return toast.error('End date cannot be before start date');
        }
        if (!formData.reason) return toast.error('Please provide a reason for leave');

        let submitData;
        if (documents.length > 0) {
            submitData = new FormData();
            Object.keys(finalData).forEach(key => {
                if (finalData[key] !== null && finalData[key] !== undefined) {
                    submitData.append(key, finalData[key]);
                }
            });
            documents.forEach(doc => submitData.append('documents', doc));
        } else {
            submitData = finalData;
        }

        setLoading(true);
        try {
            await createLeaveApi(submitData);
            toast.success(formData.leave_type === 'Permission' ? 'Permission applied and approved successfully!' : 'Leave request submitted successfully!');
            if (onSuccess) onSuccess();
            // Clear form
            setFormData({
                employee_id: userRole === 'employee' ? userId : '',
                leave_type: '',
                start_date: '',
                end_date: '',
                reason: '',
                status: 'Pending',
                is_half_day: false,
                half_day_period: 'Morning',
                contact_number: '',
                start_time: '',
                end_time: ''
            });
            setDocuments([]);
        } catch (error) {
            console.error('Error creating leave:', error);
            toast.error(error.response?.data?.message || 'Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <AddLeaveSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
        >
            {/* Form Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <Plus className="text-primary" size={24} />
                        Apply New Leave
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        Fill in the details below to request a leave of absence
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full font-medium text-[14px] shadow-lg shadow-primary/10 hover:bg-primary-hover transition-all disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]/50">
                <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-8">
                    {/* Section 1: Core Details */}
                    <div className="bg-white p-6 rounded-[15px] border border-gray-200 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-primary" size={18} />
                            <h3 className="text-[15px] font-semibold text-gray-800">Requestor & Type</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {userRole === 'employee' ? (
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-700">Employee</label>
                                    <div className="px-4 py-2.5 mt-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] font-medium text-gray-900 shadow-xs">
                                        {employees.find(e => e.value === userId)?.label || userInfo.name || 'Loading...'}
                                    </div>
                                    <input type="hidden" name="employee_id" value={userId} />
                                </div>
                            ) : (
                                <SearchableSelect
                                    label="Select Employee"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    options={employees}
                                    placeholder="Choose an employee..."
                                    required
                                    icon={User}
                                />
                            )}
                            <div className="space-y-1">
                                <FormSelect
                                    label="Leave Type"
                                    name="leave_type"
                                    value={formData.leave_type}
                                    onChange={handleChange}
                                    options={leaveTypes}
                                    placeholder="Select leave type..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Duration & Options */}
                    <div className="bg-white p-6 rounded-[15px] border border-gray-200 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="text-primary" size={18} />
                                <h3 className="text-[15px] font-semibold text-gray-800">Schedule & Duration</h3>
                            </div>

                            {/* Half Day Premium Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className={`text-[13px] font-semibold transition-colors ${formData.is_half_day ? 'text-primary' : 'text-gray-700'}`}>
                                    Half Day Request
                                </span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="is_half_day"
                                        checked={formData.is_half_day}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.is_half_day ? 'bg-primary' : 'bg-gray-200'}`}></div>
                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_half_day ? 'translate-x-5' : ''}`}></div>
                                </div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormDate
                                label={formData.is_half_day ? "Leave Date" : "Start Date"}
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />

                            {!formData.is_half_day && formData.leave_type !== 'Permission' ? (
                                <FormDate
                                    label="End Date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                />
                            ) : formData.is_half_day ? (
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-gray-700">Select Session</label>
                                    <div className="flex gap-2 mt-2">
                                        {['Morning', 'Afternoon'].map(period => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, half_day_period: period }))}
                                                className={`flex-1 py-2.5 rounded-full text-[14px] font-semibold border transition-all ${formData.half_day_period === period
                                                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {period} Session
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <FormTime
                                        label="Start Time"
                                        name="start_time"
                                        value={formData.start_time}
                                        onChange={handleChange}
                                        required
                                    />
                                    <FormTime
                                        label="End Time"
                                        name="end_time"
                                        value={formData.end_time}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Leave Summary Card */}
                        <AnimatePresence>
                            {calculatedDays > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-gray-800">Total Leave Duration</p>
                                            <p className="text-[12px] text-gray-500">
                                                {formData.is_half_day ? `Part-time (${formData.half_day_period})` : 'Full-time request'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-primary">{calculatedDays}</span>
                                        <span className="text-[12px] font-bold text-primary uppercase tracking-wider">{calculatedDays === 1 ? 'Day' : 'Days'}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Section 3: Additional Info */}
                    <div className="bg-white p-6 rounded-[15px] border border-gray-200 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="text-primary" size={18} />
                            <h3 className="text-[15px] font-semibold text-gray-800">Additional Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="Contact Number during Leave"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                placeholder="E.g. +1 234 567 890"
                            />
                            <div className="space-y-2">
                                <FormTextarea
                                    label="Reason for Leave"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    placeholder="Explain why you are requesting this leave..."
                                    required
                                    rows={3}
                                />
                            </div>

                            {formData.leave_type && formData.leave_type !== 'Permission' && (
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[13px] font-bold text-gray-700">Supporting Document(s) (Optional)</label>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                                        <input
                                            type="file"
                                            multiple
                                            disabled={isCompressing}
                                            onChange={async (e) => {
                                                setIsCompressing(true);
                                                try {
                                                    const files = Array.from(e.target.files);
                                                    const processedFiles = [];

                                                    for (const file of files) {
                                                        if (file.type === 'application/pdf') {
                                                            if (file.size > 500 * 1024) {
                                                                toast.error(`PDF "${file.name}" is over 500KB. Please compress it before uploading.`);
                                                                continue;
                                                            }
                                                            processedFiles.push(file);
                                                        } else if (file.type.startsWith('image/')) {
                                                            try {
                                                                let currentFile = file;
                                                                let quality = 0.8;
                                                                let maxWidth = undefined;
                                                                const targetSize = 150 * 1024; // 150KB target
                                                                
                                                                while (currentFile.size > targetSize && quality > 0.1) {
                                                                    currentFile = await new Promise((resolve, reject) => {
                                                                        new Compressor(currentFile, {
                                                                            quality: quality,
                                                                            maxWidth: maxWidth,
                                                                            mimeType: 'image/jpeg', // Force JPEG to enable lossy compression for PNGs
                                                                            success(result) {
                                                                                let finalName = file.name;
                                                                                if (result.type === 'image/jpeg' && !/\.(jpe?g)$/i.test(finalName)) {
                                                                                    finalName = finalName.replace(/\.[^/.]+$/, "") + ".jpg";
                                                                                }
                                                                                resolve(new File([result], finalName, {
                                                                                    type: result.type,
                                                                                    lastModified: Date.now(),
                                                                                }));
                                                                            },
                                                                            error(err) {
                                                                                reject(err);
                                                                            },
                                                                        });
                                                                    });
                                                                    
                                                                    quality -= 0.15;
                                                                    if (quality <= 0.5 && currentFile.size > targetSize) {
                                                                        maxWidth = 1280; 
                                                                    }
                                                                }
                                                                
                                                                processedFiles.push(currentFile);
                                                            } catch (error) {
                                                                console.error('Error compressing image:', error);
                                                                toast.error(`Failed to compress ${file.name}`);
                                                                processedFiles.push(file);
                                                            }
                                                        } else {
                                                            processedFiles.push(file);
                                                        }
                                                    }

                                                    setDocuments(prev => [...prev, ...processedFiles]);
                                                } finally {
                                                    setIsCompressing(false);
                                                    e.target.value = ''; // Reset input to avoid stale file name display
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-[14px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {isCompressing && (
                                            <div className="flex items-center gap-2 text-primary shrink-0 px-2">
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                <span className="text-[12px] font-semibold">Compressing...</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-gray-500">
                                        {formData.leave_type === 'Sick Leave' ? 'Please upload a medical certificate if applicable.' : 'Please upload any supporting documents. ( PDF, JPG, JPEG, PNG )'}
                                    </p>

                                    {/* File Previews */}
                                    {documents.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                                            {documents.map((file, index) => (
                                                <div key={index} className="relative group border border-gray-200 rounded-lg p-2 flex flex-col items-center justify-center bg-gray-50 h-24">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocuments(docs => docs.filter((_, i) => i !== index))}
                                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-200"
                                                    >
                                                        <X size={14} />
                                                    </button>

                                                    {file.type.startsWith('image/') ? (
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt="preview"
                                                            className="h-12 w-auto object-cover rounded mb-1"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center mb-1 text-primary">
                                                            <FileText size={24} />
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] text-gray-600 truncate w-full text-center px-1">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                    </div>

                    {/* Status Info */}
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[15px] text-amber-700">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-[13px] font-medium leading-relaxed">
                            {formData.leave_type === 'Permission'
                                ? "This permission request will be automatically approved and reflected in your attendance history."
                                : `Your request will be submitted as ${formData.status}. It will be routed to your team lead for review. Ensure all details are accurate before submitting.`
                            }
                        </p>
                    </div>
                </form>
            </div>

            {/* Bottom Footer */}
            <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="hidden md:flex items-center gap-2 text-[12px] text-gray-400 font-medium">
                        <CheckCircle2 size={14} className="text-green-500" />
                        Secure request submission
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    employee_id: userRole === 'employee' ? userId : '',
                                    leave_type: '',
                                    start_date: '',
                                    end_date: '',
                                    reason: '',
                                    status: 'Pending',
                                    is_half_day: false,
                                    half_day_period: 'Morning',
                                    contact_number: ''
                                });
                                setDocuments([]);
                            }}
                            className="flex-1 md:flex-none px-8 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 md:flex-none bg-primary text-white px-10 py-2.5 rounded-full font-medium text-[14px] shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
