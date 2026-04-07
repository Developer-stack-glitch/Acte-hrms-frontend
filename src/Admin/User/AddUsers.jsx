import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Wallet,
    Contact,
    MapPin,
    Heart,
    CreditCard,
    Save,
    Plus,
    Upload,
    CheckCircle2,
    X,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    createUserApi, 
    updateUserApi, 
    getBranchesApi, 
    getDesignationsApi, 
    getShiftsApi, 
    getDepartmentsApi, 
    getBatchAllocationsApi, 
    getAllRolePermissionsApi,
    getEmploymentTypesApi,
    getWorkLocationsApi 
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect, FormDate, FormTextarea } from '../../Common/Form';
import FormSkeleton from '../../Common/CommonSkeletonLoader/FormSkeleton';
import BulkUploadModal from './BulkUploadModal';

const sections = [
    {
        id: 'professional',
        label: 'Professional Details',
        icon: Briefcase,
        fields: [
            { name: 'employee_name', label: 'Employee Name *', type: 'text', required: true },
            { name: 'emp_id', label: 'Employee ID *', type: 'text', required: true },
            { name: 'biometric_id', label: 'Biometric ID', type: 'text' },
            { name: 'role', label: 'User Role *', type: 'select', options: [], required: true },
            { name: 'department', label: 'Department *', type: 'select', options: [], required: true },
            { name: 'designation', label: 'Designation *', type: 'select', options: [], required: true },
            { name: 'branch', label: 'Branch *', type: 'select', options: [], required: true },
            { name: 'shift', label: 'Shift *', type: 'select', options: [], required: true },
            { name: 'employment_type', label: 'Employment Type', type: 'select', options: [], required: true },
            { name: 'work_location', label: 'Work Location', type: 'select', options: [], required: true },
            { name: 'doj', label: 'DOJ (Date of Joining)', type: 'date' },
            { name: 'dor', label: 'DOR (Date of Relieving)', type: 'date' },
            { name: 'duration', label: 'Duration', type: 'text' },
            { name: 'is_experienced', label: 'Has Work Experience?', type: 'checkbox' },
            { name: 'web_clock_in_allowed', label: 'Allow Web Clock-In', type: 'checkbox' },
            { name: 'team_lead', label: 'Team Lead', type: 'checkbox' },
        ]
    },
    {
        id: 'salary',
        label: 'Salary Details',
        icon: Wallet,
        fields: [
            { name: 'year_gross_salary', label: 'Year Gross Salary *', type: 'number', isNumber: true, required: true },
            { name: 'salary_structure_id', label: 'Salary Structure *', type: 'select', options: [], required: true },
            { name: 'last_increment', label: 'Last Increment Amount', type: 'number', isNumber: true },
            { name: 'increment_type', label: 'Increment Type', type: 'select', options: ['Fixed Amount', 'Percentage'] },
            { name: 'upcoming_increment', label: 'Upcoming Increment Date', type: 'date' },
        ]
    },
    {
        id: 'contact',
        label: 'Contact & Personal',
        icon: Contact,
        fields: [
            { name: 'off_contact_no', label: 'Office Contact No', type: 'text' },
            { name: 'off_mail_id', label: 'Office Mail ID *', type: 'email', required: true },
            { name: 'per_contact_no', label: 'Personal Contact No', type: 'text' },
            { name: 'per_mail_id', label: 'Personal Mail ID', type: 'email' },
            { name: 'dob', label: 'DOB', type: 'date' },
            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
            { name: 'blood_group', label: 'Blood Group', type: 'text' },
            { name: 'mother_tongue', label: 'Mother Tongue', type: 'text' },
        ]
    },
    {
        id: 'statutory',
        label: 'Statutory & Bank',
        icon: CreditCard,
        fields: [
            { name: 'esi', label: 'ESI No', type: 'text' },
            { name: 'pf', label: 'PF No', type: 'text' },
            { name: 'aadhar', label: 'Aadhar No', type: 'text' },
            { name: 'pan', label: 'PAN No', type: 'text' },
            { name: 'bank_ac_no', label: 'Bank A/C No', type: 'text' },
            { name: 'ifsc', label: 'IFSC Code', type: 'text' },
            { name: 'uan', label: 'UAN', type: 'text' },
        ]
    },
    {
        id: 'family',
        label: 'Family Details',
        icon: Heart,
        fields: [
            { name: 'father_spouse_name', label: 'Father/Spouse Name', type: 'text' },
            { name: 'father_spouse_contact', label: 'Contact Number (F/S)', type: 'text' },
            { name: 'mother_name', label: 'Mother Name', type: 'text' },
            { name: 'mother_contact', label: 'Contact Number (M)', type: 'text' },
        ]
    },
    {
        id: 'address',
        label: 'Address Details',
        icon: MapPin,
        fields: [
            { name: 'temp_address', label: 'Temporary Address', type: 'textarea' },
            { name: 'perm_address', label: 'Permanent Address', type: 'textarea' },
        ]
    },
    {
        id: 'documents',
        label: 'File Uploads',
        icon: Upload,
        fields: [
            { name: 'emp_details_form', label: 'Employee Details Form', type: 'file' },
            { name: 'resume', label: 'Resume', type: 'file' },
            { name: 'test_paper', label: 'Test Paper', type: 'file' },
            { name: '10th', label: '10th Certificate', type: 'file' },
            { name: '12th', label: '12th Certificate', type: 'file' },
            { name: 'ug', label: 'UG Certificate', type: 'file' },
            { name: 'pg', label: 'PG Certificate', type: 'file' },
            { name: 'aadhar_file', label: 'Aadhar Card', type: 'file' },
            { name: 'pan_file', label: 'PAN Card', type: 'file' },
            { name: 'passbook', label: 'Passbook/Cheque', type: 'file' },
            { name: 'photo', label: 'Photo', type: 'file' },
            // Experienced only fields
            { name: 'relieving_letter', label: 'Relieving Letter', type: 'file', condition: 'is_experienced' },
            { name: 'exp_letter', label: 'Experience Letter', type: 'file', condition: 'is_experienced' },
            { name: 'payslips', label: 'Last 3 months Payslip', type: 'file', condition: 'is_experienced' },
        ]
    }
];

export default function AddUsers({ initialData, mode = 'add', onCancel, onSuccess }) {
    const isEdit = mode === 'edit';
    const isView = mode === 'view';
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        is_experienced: false
    });
    const [activeSection, setActiveSection] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [options, setOptions] = useState({
        department: [],
        designation: [],
        branch: [],
        shift: [],
        salary_structure_id: [],
        role: [],
        employment_type: [],
        work_location: []
    });

    const calculateDuration = (doj) => {
        if (!doj) return '';
        const start = new Date(doj);
        const end = new Date();
        if (isNaN(start.getTime())) return '';

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();
        let hours = end.getHours() - start.getHours();
        let mins = end.getMinutes() - start.getMinutes();

        if (mins < 0) {
            hours--;
            mins += 60;
        }
        if (hours < 0) {
            days--;
            hours += 24;
        }
        if (days < 0) {
            months--;
            const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        if (years < 0) return 'Joining date is in future';

        let result = [];
        if (years > 0) result.push(`${years}y`);
        if (months > 0) result.push(`${months}m`);
        if (days > 0) result.push(`${days}d`);
        if (hours > 0) result.push(`${hours}h`);
        if (mins >= 0) result.push(`${mins}min`);

        return result.join(' ') || '0min';
    };

    // Auto-update duration
    useEffect(() => {
        if (formData.doj) {
            const updateDuration = () => {
                setFormData(prev => {
                    const newDuration = calculateDuration(prev.doj);
                    if (newDuration !== prev.duration) {
                        return { ...prev, duration: newDuration };
                    }
                    return prev;
                });
            };

            updateDuration();
            const interval = setInterval(updateDuration, 60000);
            return () => clearInterval(interval);
        }
    }, [formData.doj]);

    // Fetch options from DB
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [departments, designations, branches, shifts, structures, roles, empTypes, workModes] = await Promise.all([
                    getDepartmentsApi(),
                    getDesignationsApi(),
                    getBranchesApi(),
                    getShiftsApi(),
                    getBatchAllocationsApi(),
                    getAllRolePermissionsApi(),
                    getEmploymentTypesApi(),
                    getWorkLocationsApi()
                ]);

                setOptions({
                    department: departments.data,
                    designation: designations.data,
                    branch: branches.data,
                    shift: shifts.data.map(item => ({ id: item.id, name: `${item.name} (${item.start_time} - ${item.end_time})` })),
                    salary_structure_id: (structures.data || []).map(s => ({ id: s.id, name: s.name })),
                    role: (roles.data || []).map(r => ({ id: r.id, name: r.role.charAt(0).toUpperCase() + r.role.slice(1) })),
                    employment_type: (empTypes.data || []).map(t => ({ id: t.id, name: t.name })),
                    work_location: (workModes.data || []).map(w => ({ id: w.id, name: w.name }))
                });
            } catch (error) {
                console.error('Error fetching options:', error);
                toast.error('Failed to load organization data');
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, []);

    // Get filtered designations based on selected department
    const getFilteredDesignations = () => {
        if (!formData.department) return options.designation;
        const deptValue = formData.department.toString().trim();
        return options.designation.filter(d => {
            // Check if matches by ID or by legacy Name
            const dDeptId = (d.department_id || '').toString().trim();
            const dDeptName = (d.department_name || '').toString().trim();
            return dDeptId === deptValue || dDeptName === deptValue;
        });
    };

    const renderAddOption = (name, label) => {
        if (isView) return null;
        if (!['branch', 'department', 'designation', 'shift', 'role', 'salary_structure_id'].includes(name)) return null;

        const path = {
            branch: '/organization/branch',
            department: '/organization/department',
            designation: '/organization/designation',
            shift: '/organization/shift',
            role: '/organization/roles',
            salary_structure_id: '/payroll/salary-structure'
        }[name];

        const hasData = options[name]?.length > 0;
        const cleanLabel = label.replace(' *', '');

        return (
            <button
                type="button"
                onClick={() => navigate(path)}
                className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 transition-all active:scale-95 hover:bg-primary/20"
            >
                <Plus size={10} />
                {hasData ? `Add New ${cleanLabel}` : `Add ${cleanLabel}`}
            </button>
        );
    };

    // Initial data mapping
    useEffect(() => {
        if (initialData) {
            const mappedData = { ...initialData };

            // Map document_ fields to form field names
            Object.keys(initialData).forEach(key => {
                if (key.startsWith('document_')) {
                    const fieldName = key.replace('document_', '');
                    let value = initialData[key];

                    // Handle JSON string for multiple files (payslips)
                    if (fieldName === 'payslips' && typeof value === 'string' && value.startsWith('[')) {
                        try { value = JSON.parse(value); } catch (e) { }
                    }

                    // Map back to special names if needed
                    if (fieldName === 'aadhar') mappedData['aadhar_file'] = value;
                    else if (fieldName === 'pan') mappedData['pan_file'] = value;
                    else mappedData[fieldName] = value;
                }
            });

            // Ensure booleans are correct (MySQL TINYINT 0/1 to bool or "yes"/"no")
            if (mappedData.is_experienced !== undefined) {
                mappedData.is_experienced = !!mappedData.is_experienced;
            }
            if (mappedData.team_lead !== undefined) {
                mappedData.team_lead = mappedData.team_lead === 'yes';
            }
            if (mappedData.web_clock_in_allowed !== undefined) {
                mappedData.web_clock_in_allowed = !!mappedData.web_clock_in_allowed;
            }

            // Sync role name to ID if needed (for dropdown match)
            if (mappedData.role && isNaN(mappedData.role) && options.role?.length > 0) {
                const matched = options.role.find(r => r.name.toLowerCase() === mappedData.role.toLowerCase());
                if (matched) mappedData.role = matched.id;
            }

            setFormData(mappedData);
        }
    }, [initialData, options.role]);

    const handleChange = (e) => {
        if (isView) return;
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            if (name === 'payslips') {
                const newFiles = Array.from(files);
                setFormData(prev => ({
                    ...prev,
                    [name]: [...(Array.isArray(prev[name]) ? prev[name] : []), ...newFiles].slice(0, 5)
                }));
            } else {
                setFormData(prev => ({ ...prev, [name]: files[0] }));
            }
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: value };

                return newData;
            });
        }
    };

    const removeFile = (name, index) => {
        if (isView) return;
        setFormData(prev => {
            const newData = { ...prev };
            if (Array.isArray(newData[name])) {
                newData[name] = newData[name].filter((_, i) => i !== index);
                if (newData[name].length === 0) delete newData[name];
            } else {
                delete newData[name];
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isView) return;

        // Validate all required fields
        for (const section of sections) {
            for (const field of section.fields) {
                if (field.condition && !formData[field.condition]) continue;
                if (field.required && !formData[field.name]) {
                    setActiveSection(section.id);
                    toast.error(`${field.label} is mandatory`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                // Never send password during edit/update in this form
                if (isEdit && key === 'password') return;

                const value = formData[key];
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // Handle multiple files (like payslips)
                        value.forEach(item => {
                            if (item instanceof File) {
                                data.append(key, item);
                            } else if (typeof item === 'string') {
                                // Send back existing file paths
                                data.append(`${key}_existing[]`, item);
                            }
                        });
                    } else if (value instanceof File) {
                        data.append(key, value);
                    } else if (typeof value === 'boolean') {
                        data.append(key, value);
                    } else if (typeof value === 'string') {
                        if (key.endsWith('_file') || [
                            'resume', 'test_paper', '10th', '12th', 'ug', 'pg',
                            'passbook', 'photo', 'relieving_letter', 'exp_letter', 'emp_details_form'
                        ].includes(key)) {
                            data.append(`${key}_existing`, value);
                        } else {
                            data.append(key, value);
                        }
                    } else {
                        data.append(key, value);
                    }
                }
            });

            // Ensure name and email are present if needed by backend
            if (!formData.name && formData.employee_name) data.append('name', formData.employee_name);
            if (!formData.email && formData.off_mail_id) data.append('email', formData.off_mail_id);

            if (isEdit) {
                await updateUserApi(formData.id, data);
                toast.success('Employee updated successfully!');
            } else {
                if (!formData.role) data.append('role', 'employee');
                data.append('password', 'password123');
                await createUserApi(data);
                toast.success('Employee onboarding completed successfully!');
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving user:', error);
            const errorMsg = error.response?.data?.error ? `${error.response.data.message}` : (error.response?.data?.message || 'Failed to save employee');
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };


    if (loadingOptions) {
        return <FormSkeleton />;
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header */}
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-semibold text-[#1e293b] flex items-center gap-2">
                            {isView ? (
                                <Briefcase className="text-primary" size={24} />
                            ) : (
                                <Plus className="text-primary" size={24} />
                            )}
                            {isView ? 'View Employee Details' : isEdit ? 'Edit Employee' : 'Add New Employee'}
                        </h1>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">
                            {isView ? 'Full profile details of the team member' : 'Fill in the details to onboard a new team member'}
                        </p>
                    </div>
                </div>
                {!isView && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-full font-medium text-[14px] hover:bg-gray-50 transition-all"
                        >
                            <Upload size={18} className="text-primary" />
                            Bulk Import
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full font-medium text-[14px] shadow-xs shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Save Employee'}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white border-r border-gray-100 p-4 space-y-1 overflow-y-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center mb-3 gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === section.id
                                ? 'bg-primary/5 text-primary'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            <section.icon size={18} className={activeSection === section.id ? 'text-primary' : ''} />
                            <span className="text-[14px] font-medium">{section.label}</span>
                            {activeSection === section.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sections.find(s => s.id === activeSection).fields.map((field) => {
                                        // Conditional rendering
                                        if (field.condition && !formData[field.condition]) return null;

                                        return (
                                            <div key={field.name} className={field.type === 'textarea' || field.type === 'checkbox' ? 'md:col-span-1' : ''}>
                                                {field.type === 'textarea' ? (
                                                    <FormTextarea
                                                        label={field.label}
                                                        name={field.name}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        disabled={isView}
                                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                        required={field.required}
                                                    />
                                                ) : field.type === 'select' ? (
                                                    <FormSelect
                                                        label={field.label}
                                                        name={field.name}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        disabled={isView}
                                                        required={field.required}
                                                        extra={renderAddOption(field.name, field.label)}
                                                        options={(field.name === 'designation'
                                                            ? getFilteredDesignations().map(d => ({ value: d.id, label: d.name }))
                                                            : (field.name === 'salary_structure_id'
                                                                ? (options.salary_structure_id || []).map(s => ({ value: s.id, label: s.name }))
                                                                : (field.options && field.options.length > 0
                                                                    ? field.options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
                                                                    : (options[field.name] || []).map(o => ({ value: o.id, label: o.name })))))}
                                                        placeholder={`Select ${field.label.replace(' *', '')}`}
                                                    />
                                                ) : field.type === 'checkbox' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <label className={`flex mt-6 items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg transition-colors group ${isView ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100'}`}>
                                                            <input
                                                                type="checkbox"
                                                                name={field.name}
                                                                checked={formData[field.name] || false}
                                                                onChange={handleChange}
                                                                disabled={isView}
                                                                className="w-5 h-5 rounded-lg border-2 border-gray-300 text-primary focus:ring-primary/20 transition-all checked:bg-primary disabled:opacity-70"
                                                            />
                                                            <span className={`text-[14px] font-semibold transition-colors ${isView ? 'text-gray-500' : 'text-gray-700 group-hover:text-primary'}`}>{field.label}</span>
                                                        </label>
                                                        {field.name === 'team_lead' && formData.team_lead && (
                                                            <p className="text-[11px] text-primary/70 font-medium px-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200">
                                                                <span className="w-1 h-1 rounded-full bg-primary/50" />
                                                                If marked as Team Lead, their team members' leave requests will be sent to them for approval.
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : field.type === 'file' ? (
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            id={field.name}
                                                            name={field.name}
                                                            onChange={handleChange}
                                                            disabled={isView}
                                                            className="hidden"
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            multiple={field.name === 'payslips'}
                                                        />
                                                        {!formData[field.name] || (Array.isArray(formData[field.name]) && formData[field.name].length === 0) ? (
                                                            <label
                                                                htmlFor={isView ? null : field.name}
                                                                className={`flex items-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-gray-200 rounded-xl transition-all ${isView ? 'cursor-default opacity-60' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 group/label'}`}
                                                            >
                                                                <div className={`p-2 bg-gray-50 rounded-lg ${!isView && 'group-hover/label:bg-primary/10 group-hover/label:text-primary transition-colors'}`}>
                                                                    <Upload size={18} className="text-gray-400" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[13.5px] font-bold ${!isView ? 'text-gray-600 group-hover/label:text-primary' : 'text-gray-400'}`}>
                                                                        {isView ? `No ${field.label} uploaded` : `Click to upload ${field.label} ${field.name === 'payslips' ? '(Multiple)' : ''}`}
                                                                    </span>
                                                                    {!isView && <span className="text-[11px] text-gray-400 font-medium">Max size: 5MB (PDF, PNG, JPG)</span>}
                                                                </div>
                                                            </label>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {(Array.isArray(formData[field.name]) ? formData[field.name] : [formData[field.name]]).map((file, idx) => {
                                                                    const isUrl = typeof file === 'string';
                                                                    const fileName = isUrl ? file.split(/[\\/]/).pop() : (file?.name || 'File');
                                                                    const fileSize = isUrl ? 'Uploaded' : (file?.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'New File');

                                                                    return (
                                                                        <div key={idx} className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                <div className="p-2 bg-white rounded-lg text-green-600 shadow-sm shrink-0">
                                                                                    {isUrl ? <Download size={18} /> : <CheckCircle2 size={18} />}
                                                                                </div>
                                                                                <div className="flex flex-col min-w-0">
                                                                                    {isUrl ? (
                                                                                        <a
                                                                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/${file}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-[13.5px] font-bold text-green-700 truncate hover:underline"
                                                                                        >
                                                                                            {fileName}
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="text-[13.5px] font-bold text-green-700 truncate">{fileName}</span>
                                                                                    )}
                                                                                    <span className="text-[11px] text-green-600/70 font-medium">{fileSize}</span>
                                                                                </div>
                                                                            </div>
                                                                            {!isView && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeFile(field.name, Array.isArray(formData[field.name]) ? idx : undefined)}
                                                                                    className="p-1.5 hover:bg-white rounded-lg text-green-600 transition-colors shrink-0"
                                                                                >
                                                                                    <X size={16} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                                {!isView && field.name === 'payslips' && formData[field.name].length < 5 && (
                                                                    <label htmlFor={field.name} className="flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-xl text-gray-500 text-[12px] font-medium cursor-pointer hover:bg-gray-50 transition-all">
                                                                        + Add More Payslips
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                ) : field.type === 'date' ? (
                                                    <FormDate
                                                        label={field.label}
                                                        name={field.name}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        disabled={isView || field.name === 'duration'}
                                                        required={field.required}
                                                    />
                                                ) : (
                                                    <FormInput
                                                        type={field.type}
                                                        label={field.label}
                                                        name={field.name}
                                                        value={formData[field.name] || ''}
                                                        onChange={handleChange}
                                                        onWheel={(e) => e.target.blur()}
                                                        disabled={isView || field.name === 'duration'}
                                                        placeholder={field.name === 'duration' ? 'Calculated automatically' : `Enter ${field.label.toLowerCase()}...`}
                                                        readOnly={field.name === 'duration'}
                                                        required={field.required}
                                                        isNumber={field.isNumber}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Navigation Buttons inside form */}
                                <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                                    <button
                                        type="button"
                                        disabled={sections.findIndex(s => s.id === activeSection) === 0}
                                        onClick={() => {
                                            const idx = sections.findIndex(s => s.id === activeSection);
                                            setActiveSection(sections[idx - 1].id);
                                        }}
                                        className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-white disabled:opacity-0 transition-all"
                                    >
                                        Previous
                                    </button>

                                    {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const idx = sections.findIndex(s => s.id === activeSection);
                                                const currentSection = sections[idx];

                                                // Validate current section
                                                for (const field of currentSection.fields) {
                                                    if (field.condition && !formData[field.condition]) continue;
                                                    if (field.required && !formData[field.name]) {
                                                        toast.error(`${field.label} is mandatory`);
                                                        return;
                                                    }
                                                }

                                                setActiveSection(sections[idx + 1].id);
                                            }}
                                            className="px-6 py-2 rounded-full bg-gray-900 text-white font-medium text-[14px] hover:bg-black transition-all"
                                        >
                                            Next Section
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-2 rounded-full bg-primary text-white font-semibold text-[14px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
                                        >
                                            {loading ? 'Processing...' : 'Complete & Save'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </div>
            </div>

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSuccess={onSuccess}
            />
        </div>
    );
}