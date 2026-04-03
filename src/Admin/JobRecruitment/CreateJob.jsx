import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    Minus,
    ChevronDown,
    Calendar,
    Bold,
    Italic,
    List,
    ListOrdered,
    MapPin,
    Info
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJobApi, updateJobApi, getJobByIdApi, getBranchesApi, getDepartmentsApi, getUsersApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FormInput, FormSelect, FormDate } from '../../Common/Form';
import { FormSkeleton } from '../../Common/CommonSkeletonLoader/JobRecruitmentSkeleton';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ],
};

const RichTextArea = ({ label, name, value, onChange, placeholder, required = false }) => (
    <div className="space-y-2 group">
        <label className="text-[13px] font-bold text-gray-700 block transition-colors group-focus-within:text-primary">
            {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <div className="rich-text-container border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/30 transition-all bg-white shadow-sm shadow-gray-100">
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder || `Provide detailed ${label.toLowerCase()}...`}
                className="h-auto"
                modules={quillModules}
            />
        </div>
        <style>{`
            .rich-text-container .ql-toolbar.ql-snow {
                border: none;
                border-bottom: 1px solid #f8fafc;
                background: #fbfcfe;
                padding: 10px 16px;
            }
            .rich-text-container .ql-container.ql-snow {
                border: none;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                color: #334155;
            }
            .rich-text-container .ql-editor {
                min-height: 180px;
                max-height: 450px;
                padding: 20px 24px;
                line-height: 1.6;
            }
            .rich-text-container .ql-editor.ql-blank::before {
                color: #94a3b8;
                font-style: normal;
                font-weight: 400;
                left: 24px;
                font-size: 14px;
            }
            .rich-text-container .ql-snow .ql-stroke {
                stroke: #64748b;
            }
            .rich-text-container .ql-snow .ql-fill {
                fill: #64748b;
            }
            .rich-text-container .ql-snow.ql-toolbar button:hover .ql-stroke {
                stroke: #4f46e5;
            }
            .rich-text-container .ql-snow.ql-toolbar button:hover .ql-fill {
                fill: #4f46e5;
            }
        `}</style>
    </div>
);

const CreateJob = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [skillInput, setSkillInput] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        contact_email: 'hr@company.com',
        contact_phone: '',
        experience_years: '',
        min_salary: '',
        max_salary: '',
        skills: [],
        branch: '',
        department: '',
        job_type: 'Full-time',
        num_positions: 1,
        preferred_gender: 'Any',
        close_date: '',
        hiring_manager: '',
        recruiters: '',
        city: '',
        state: '',
        zip_code: '',
        description: '',
        requirements: '',
        status: 'Open'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchRes, deptRes, userRes] = await Promise.all([
                    getBranchesApi(),
                    getDepartmentsApi(),
                    getUsersApi()
                ]);
                setBranches(branchRes.data);
                setDepartments(deptRes.data);
                setUsers(userRes.data.users || []);

                if (isEditing) {
                    const jobRes = await getJobByIdApi(id);
                    const job = jobRes.data;
                    let parsedSkills = [];
                    try {
                        parsedSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : (job.skills || []);
                    } catch (e) {
                        parsedSkills = job.skills ? job.skills.split(',').map(s => s.trim()) : [];
                    }
                    setFormData({
                        ...job,
                        skills: parsedSkills,
                        close_date: job.close_date ? job.close_date.split('T')[0] : ''
                    });
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                toast.error('Failed to load data');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-populate address when branch changes
            if (name === 'branch') {
                const selectedBranch = branches.find(b => b.name === value);
                if (selectedBranch) {
                    newData.city = selectedBranch.city || prev.city;
                    newData.state = selectedBranch.state || prev.state;
                    newData.zip_code = selectedBranch.zip_code || prev.zip_code;
                }
            }
            return newData;
        });
    };

    const handleQuillChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            if (!formData.skills.includes(skillInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, skillInput.trim()]
                }));
            }
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleNumPositionsChange = (val) => {
        setFormData(prev => ({
            ...prev,
            num_positions: Math.max(1, prev.num_positions + val)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (parseFloat(formData.max_salary) < parseFloat(formData.min_salary)) {
            toast.error('Maximum salary cannot be less than minimum salary');
            return;
        }

        if (formData.skills.length === 0) {
            toast.error('Please add at least one required skill');
            return;
        }

        setLoading(true);
        try {
            const finalData = {
                ...formData,
                skills: JSON.stringify(formData.skills)
            };
            if (isEditing) {
                await updateJobApi(id, finalData);
                toast.success('Job updated successfully');
            } else {
                await createJobApi(finalData);
                toast.success('Job created successfully');
            }
            navigate('/job-recruitment/jobs');
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error(error.response?.data?.message || 'Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <FormSkeleton />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 mx-auto bg-white min-h-full"
        >
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-50 bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
                    </h1>
                    <p className="text-gray-500 text-[13px] font-medium mt-0.5">
                        Define the role, requirements, and recruitment details for the new opening
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12 pb-10">
                {/* Job Opening Information */}
                <section className="space-y-4 mb-8">
                    <h3 className="text-[16px] font-semibold text-black mb-6">Job Opening Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                        <FormInput label="Job Title" name="title" value={formData.title} onChange={handleChange} required placeholder="Enter job title" />
                        <FormInput label="Contact Email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} required placeholder="hr@company.com" />
                        <FormInput label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required placeholder="9876543210" />
                        <FormInput label="Work Experience (Years)" name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} required placeholder="Enter years" />

                        <FormInput label="Minimum Salary (LPA)" name="min_salary" isNumber={true} value={formData.min_salary} onChange={handleChange} required placeholder="e.g., 3.0" />
                        <FormInput label="Maximum Salary (LPA)" name="max_salary" isNumber={true} value={formData.max_salary} onChange={handleChange} required placeholder="e.g., 5.0" />
                        <FormSelect
                            label="Job Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'Open', label: 'Open' },
                                { value: 'Closed', label: 'Closed' },
                                { value: 'On Hold', label: 'On Hold' }
                            ]}
                        />
                    </div>
                </section>

                {/* Skills */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-semibold text-gray-900">Required Skills</h3>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">
                            {formData.skills.length} Skills Added
                        </span>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4">
                        <AnimatePresence>
                            <div className="flex flex-wrap gap-2.5">
                                {formData.skills.map((skill, index) => (
                                    <motion.div
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 bg-primary text-white border border-gray-200 px-3 py-1 rounded-full text-[13px] font-medium shadow-sm hover:border-primary/30 transition-all group"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-all text-white"
                                        >
                                            <Plus size={14} className="rotate-45" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Add specialized skills (e.g., React, Node.js, Project Management)"
                                    className="w-full h-[46px] px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover transition-all"
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            </div>
                        </div>
                        <p className="text-[12px] font-medium text-gray-400 flex items-center gap-2 italic">
                            <Info size={14} className="text-primary/50" />
                            Press Enter or click Add to include skills in the job profile
                        </p>
                    </div>
                </section>

                {/* Recruitment Information */}
                <section className="space-y-6">
                    <h3 className="text-[16px] font-semibold text-black mb-6">Recruitment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                        <FormSelect
                            label="Branch"
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            required
                            options={branches.map(b => ({ value: b.name, label: b.name }))}
                        />
                        <FormSelect
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            options={departments.map(d => ({ value: d.name, label: d.name }))}
                        />
                        <FormSelect
                            label="Work Type"
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'Full-time', label: 'Full-time' },
                                { value: 'Part-time', label: 'Part-time' },
                                { value: 'Contract', label: 'Contract' },
                                { value: 'Internship', label: 'Internship' },
                                { value: 'Remote', label: 'Remote' }
                            ]}
                        />

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-gray-700 block text-sm">No of Positions <span className="text-red-500">*</span></label>
                            <div className="flex items-center bg-gray-50/50 border border-gray-100 rounded-xl h-[42px] overflow-hidden">
                                <button type="button" onClick={() => handleNumPositionsChange(-1)} className="px-3 hover:bg-white text-gray-400 transition-colors"><Minus size={16} /></button>
                                <div className="flex-1 text-center font-bold text-sm text-gray-700">{formData.num_positions}</div>
                                <button type="button" onClick={() => handleNumPositionsChange(1)} className="px-3 hover:bg-white text-gray-400 transition-colors"><Plus size={16} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 mt-8">
                        <FormSelect
                            label="Preferred Gender Type"
                            name="preferred_gender"
                            value={formData.preferred_gender}
                            onChange={handleChange}
                            options={[
                                { value: 'Any', label: 'Any' },
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' }
                            ]}
                        />
                        <FormDate
                            label="Close Date"
                            name="close_date"
                            value={formData.close_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mt-8">
                        <FormSelect
                            label="Hiring Manager"
                            name="hiring_manager"
                            value={formData.hiring_manager}
                            onChange={handleChange}
                            placeholder="Select hiring manager"
                            options={users.map(u => ({ value: u.name, label: u.name }))}
                        />
                        <FormSelect
                            label="Assigned Recruiters"
                            name="recruiters"
                            value={formData.recruiters}
                            onChange={handleChange}
                            placeholder="Select recruiters"
                            options={users.map(u => ({ value: u.name, label: u.name }))}
                        />
                    </div>
                </section>

                {/* Address Information */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[16px] font-semibold text-black">Address Information</h3>
                        <div className="flex items-center gap-1.5 bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <Info size={10} />
                            Auto-populated from branch
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                        <FormInput label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" />
                        <FormInput label="State/Province" name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" />
                        <FormInput label="Postal Code" name="zip_code" value={formData.zip_code} onChange={handleChange} placeholder="Enter postal code" />
                    </div>
                </section>

                {/* Descriptions */}
                <section className="space-y-8">
                    <RichTextArea
                        label="Job Description"
                        name="description"
                        value={formData.description}
                        onChange={(val) => handleQuillChange('description', val)}
                        required
                    />
                    <RichTextArea
                        label="Requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={(val) => handleQuillChange('requirements', val)}
                    />
                </section>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-end gap-3 z-30 lg:left-[240px]">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-8 py-2 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-md"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-md"
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Job' : 'Post Job')}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CreateJob;
