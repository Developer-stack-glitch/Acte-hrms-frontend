import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Mail, Calendar, ArrowLeft, MoreVertical, FileText,
    Phone, Download, Eye, Star, PlusCircle, Upload,
    CheckCircle2, Clock, Filter, X, Users,
    MailIcon
} from 'lucide-react';
import { getApplicantsApi, getApplicantsByJobApi, getJobByIdApi, updateApplicantStatusApi, createApplicantApi, getJobsApi, scheduleInterviewApi, sendOfferLetterApi, requestDocumentsApi, API_URL } from '../../Action/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DataTable from '../../Common/DataTable';
import { Plus } from 'lucide-react';
import { FormInput, FormSelect, FormDate, FormTime, FormTextarea } from '../../Common/Form';
import { ApplicantsSkeleton } from '../../Common/CommonSkeletonLoader/JobRecruitmentSkeleton';

const ScheduleInterviewModal = ({ isOpen, onClose, onSuccess, applicant }) => {
    const [formData, setFormData] = useState({
        round_name: '',
        date: null,
        time: null,
        mode: '',
        meeting_link: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await scheduleInterviewApi(applicant.id, formData);
            toast.success('Interview scheduled successfully and email sent');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[15px] w-full max-w-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Schedule Interview</h2>
                    <X size={20} onClick={onClose} className="cursor-pointer text-gray-500 hover:text-gray-700 transition-all" />
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Round Name <span className="text-red-500">*</span></label>
                        <FormInput required type="text" placeholder="e.g., Technical Round, HR Round" value={formData.round_name} onChange={(e) => setFormData({ ...formData, round_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Interview Date <span className="text-red-500">*</span></label>
                            <FormDate
                                required
                                name="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                placeholderText="dd-mm-yyyy"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Interview Time <span className="text-red-500">*</span></label>
                            <FormTime
                                required
                                name="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                placeholderText="--:--"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Mode of Interview <span className="text-red-500">*</span></label>
                        <FormSelect
                            required
                            name="mode"
                            value={formData.mode}
                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            placeholder="Select mode"
                        >
                            <option value="Online">Online</option>
                            <option value="In-person">In-person</option>
                        </FormSelect>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Meeting Link <span className="text-red-500">*</span></label>
                        <FormInput required type="text" placeholder="Enter meeting link" value={formData.meeting_link} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Notes/Remarks</label>
                        <FormTextarea placeholder="Type notes regarding the interview" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    <div className="pt-4 flex justify-center gap-3">
                        <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-medium text-[15px] hover:bg-primary-hover transition-all shadow-xs shadow-blue-200">
                            {submitting ? 'Scheduling...' : 'Schedule Interview'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const MoveStatusModal = ({ isOpen, onClose, onConfirm, currentStatus, nextStatus }) => {
    const STATUS_LABELS = {
        'Applied': 'Resume Screening',
        'Interviewing': 'Interview Process',
        'Offered': 'Offer Letter',
        'Hired': 'Pre-onboarding',
        'Completed': 'Finalized (Hired)',
        'Rejected': 'Rejected'
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[15px] w-full max-w-lg overflow-hidden shadow-2xl p-8 space-y-6">
                <div className="text-center space-y-2 relative">
                    <h2 className="text-[20px] font-semibold text-gray-900">Move to Next Status</h2>
                    <X size={20} onClick={onClose} className="absolute top-0 right-0 cursor-pointer" />
                </div>

                <div className="bg-sky-50/50 border border-sky-100 px-5 py-3 rounded-xl flex items-start gap-3">
                    <div className="text-[14px] text-sky-800 leading-relaxed font-medium">
                        You are about to move this candidate to the next stage in the hiring pipeline.
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-[15px] text-gray-800">
                        <span className="font-semibold">Current Status:</span> {STATUS_LABELS[currentStatus] || currentStatus}
                    </div>
                    <div className="text-[15px] text-gray-800">
                        <span className="font-semibold">Next Status:</span> {STATUS_LABELS[nextStatus] || nextStatus}
                    </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 px-5 py-3 rounded-xl text-center">
                    <span className="text-[14px] font-semibold text-amber-700 italic">Are you sure you want to proceed?</span>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                    <button onClick={onConfirm} className="flex-1 bg-green-700 text-white py-2.5 rounded-full font-medium text-[15px] hover:bg-green-800 transition-all">
                        Move to Next Status
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const SendOfferLetterModal = ({ isOpen, onClose, onSuccess, applicant }) => {
    const [formData, setFormData] = useState({
        offered_ctc: '',
        joining_date: null,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await sendOfferLetterApi(applicant.id, formData);
            toast.success('Offer letter sent successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to send offer letter');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[15px] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Send Offer Letter</h2>
                    <X size={20} onClick={onClose} className="cursor-pointer text-gray-500 hover:text-gray-700 transition-all" />
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Offered CTC (per annum) <span className="text-red-500">*</span></label>
                        <FormInput required type="number" placeholder="Enter annual package in ₹" value={formData.offered_ctc} onChange={(e) => setFormData({ ...formData, offered_ctc: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Expected Joining Date <span className="text-red-500">*</span></label>
                        <FormDate
                            required
                            name="joining_date"
                            value={formData.joining_date}
                            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                            placeholderText="dd-mm-yyyy"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-semibold text-gray-700">Additional Notes</label>
                        <FormTextarea placeholder="Any specific terms or welcoming message..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    <div className="pt-4 flex justify-center gap-3">
                        <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="px-8 py-2.5 rounded-full bg-green-600 text-white font-medium text-[15px] hover:bg-green-700 transition-all shadow-xs shadow-green-200">
                            {submitting ? 'Sending...' : 'Send Formal Offer'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};


const RequestDocumentsModal = ({ isOpen, onClose, onSuccess, applicant }) => {
    const [selectedDocuments, setSelectedDocuments] = useState([
        'Aadhar Card', 'PAN Card', 'Degree Certificate', 'Relieving Letter', 'Last 3 Months Payslips'
    ]);
    const [notes, setNotes] = useState('Please provide clear scanned copies of the above documents for onboarding.');
    const [submitting, setSubmitting] = useState(false);

    const docOptions = [
        'Aadhar Card', 'PAN Card', 'Degree Certificate', 'Relieving Letter',
        'Last 3 Months Payslips', 'Voter Id', 'Passport', '10th/12th Marksheets'
    ];

    const toggleDoc = (doc) => {
        setSelectedDocuments(prev =>
            prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedDocuments.length === 0) return toast.error('Please select at least one document');
        setSubmitting(true);
        try {
            await requestDocumentsApi(applicant.id, { documents: selectedDocuments, notes });
            toast.success('Document request sent successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to send document request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[15px] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-semibold text-gray-900">Request Documents</h2>
                    <X size={20} onClick={onClose} className="cursor-pointer text-gray-500 hover:text-gray-700" />
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[16px] font-semibold text-gray-700">Select Documents to Request</label>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {docOptions.map(doc => (
                                <div
                                    key={doc}
                                    onClick={() => toggleDoc(doc)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedDocuments.includes(doc)
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-100 border-dashed text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {selectedDocuments.includes(doc) ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded border-2 border-gray-200" />}
                                    <span className="text-[13px] font-semibold">{doc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Instructions</label>
                        <FormTextarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    <div className="pt-4 flex justify-center gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="px-10 py-3 rounded-full bg-green-600 text-white font-medium text-[15px] hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                            {submitting ? 'Sending Request...' : 'Send Request'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};


const CreateApplicantModal = ({ isOpen, onClose, onSuccess, initialJobId, jobs }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        job_id: initialJobId || '',
        experience_years: '',
        gender: 'Male',
        location: '',
        status: 'Applied',
        resume: null
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialJobId) setFormData(prev => ({ ...prev, job_id: initialJobId }));
    }, [initialJobId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.job_id) return toast.error('Please select a job');
        setSubmitting(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            await createApplicantApi(data);
            toast.success('Applicant added successfully');
            onSuccess();
            onClose();
            setFormData({ name: '', email: '', phone: '', job_id: initialJobId || '', experience_years: '', gender: 'Male', location: '', status: 'Applied', resume: null });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add applicant');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[15px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 pl-4">Add New Applicant</h2>
                        <p className="text-[13px] text-gray-500 font-medium mt-1 pl-4">Manual candidate entry for the recruitment pipeline</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Full Name <span className="text-red-500">*</span></label>
                            <FormInput
                                placeholder="Enter your full name"
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Email Address <span className="text-red-500">*</span></label>
                            <FormInput
                                required
                                placeholder="Enter your email address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Phone Number</label>
                            <FormInput
                                placeholder="Enter your phone number"
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Job Opening <span className="text-red-500">*</span></label>
                            <FormSelect
                                required
                                name="job_id"
                                value={formData.job_id}
                                onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                                placeholder="Select a Job"
                            >
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </FormSelect>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Experience (Years)</label>
                            <FormInput
                                placeholder="e.g. 3 Years"
                                type="text"
                                value={formData.experience_years}
                                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Gender</label>
                            <FormSelect
                                name="gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                placeholder="Select Gender"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </FormSelect>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Location</label>
                            <FormInput
                                type="text"
                                placeholder="e.g. Chennai, Tamil Nadu"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700 ml-1">Resume <span className="text-gray-400 font-normal normal-case italic">(PDF/Word)</span></label>
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-primary/50 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className={`mb-3 ${formData.resume ? 'text-primary' : 'text-gray-400'}`} size={24} />
                                        <p className="mb-2 text-sm text-gray-500 font-semibold">
                                            {formData.resume ? formData.resume.name : 'Click to upload resume'}
                                        </p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">PDF, DOC up to 5MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 md:flex-none px-8 py-2.5 rounded-full border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-3 px-9 py-2.5 rounded-full bg-primary text-white font-medium text-[14px] hover:bg-primary-hover transition-all shadow-full shadow-primary/20 tracking-widest flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Adding...' : 'Add Applicant'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};


const StatusBadge = ({ status }) => {
    const styles = {
        'Screening': 'bg-blue-100 text-blue-600 border-blue-200',
        'Interviewing': 'bg-yellow-100 text-yellow-600 border-yellow-200',
        'Offered': 'bg-purple-100 text-purple-600 border-purple-200',
        'Hired': 'bg-green-100 text-green-600 border-green-200',
        'Rejected': 'bg-red-100 text-red-600 border-red-200',
        'Applied': 'bg-sky-100 text-sky-600 border-sky-200',
        'Completed': 'bg-emerald-100 text-emerald-600 border-emerald-200 font-bold',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status === 'Completed' ? 'Hired' : status}
        </span>
    );
};

const PipelineStep = ({ label, active, completed, isLast }) => (
    <div className={`relative flex flex-col items-center flex-1 z-10 ${isLast ? '' : 'pr-0'}`}>
        {!isLast && (
            <div className={`absolute top-4 left-[50%] right-[-50%] h-1 -z-0 transition-all duration-700 ${completed ? 'bg-green-500' : 'bg-gray-100'}`} />
        )}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-500 z-10 ${completed ? 'bg-green-500 text-white shadow-md shadow-green-100' :
            active ? 'bg-primary text-white' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
            {completed ? <CheckCircle2 size={18} /> :
                active ? <Clock size={18} className="animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />}
        </div>
        <span className={`text-[11px] font-semibold text-center uppercase ${active ? 'text-primary' : completed ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
    </div>
);

const ApplicantsList = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const jobId = searchParams.get('jobId');

    const [applicants, setApplicants] = useState([]);
    const [jobDetails, setJobDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isNextStatusModalOpen, setIsNextStatusModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [allJobs, setAllJobs] = useState([]);

    const STATUS_FLOW = ['Applied', 'Interviewing', 'Offered', 'Hired', 'Completed'];
    const nextStatus = useMemo(() => {
        if (!selectedApplicant) return null;
        const currentIndex = STATUS_FLOW.indexOf(selectedApplicant.status);
        return currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
    }, [selectedApplicant]);

    const fetchAllJobs = async () => {
        try {
            const res = await getJobsApi();
            setAllJobs(res.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const storedId = localStorage.getItem('lastSelectedApplicantId');
            if (jobId) {
                const [applicantsRes, jobRes] = await Promise.all([
                    getApplicantsByJobApi(jobId),
                    getJobByIdApi(jobId)
                ]);
                const loadedApplicants = applicantsRes.data;
                setApplicants(loadedApplicants);
                setJobDetails(jobRes.data);

                if (loadedApplicants.length > 0) {
                    const previouslySelected = loadedApplicants.find(a => a.id === parseInt(storedId));
                    setSelectedApplicant(previouslySelected || loadedApplicants[0]);
                }
            } else {
                const response = await getApplicantsApi();
                const loadedApplicants = response.data;
                setApplicants(loadedApplicants);
                setJobDetails(null);

                if (loadedApplicants.length > 0) {
                    const previouslySelected = loadedApplicants.find(a => a.id === parseInt(storedId));
                    setSelectedApplicant(previouslySelected || loadedApplicants[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedApplicant?.id) {
            localStorage.setItem('lastSelectedApplicantId', selectedApplicant.id);
        }
    }, [selectedApplicant]);

    useEffect(() => {
        fetchData();
        fetchAllJobs();
    }, [jobId]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateApplicantStatusApi(id, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            // Update locally to avoid full refresh
            setApplicants(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            if (selectedApplicant?.id === id) {
                setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const filteredApplicants = useMemo(() => applicants.filter(app => {
        const nameMatch = app.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = app.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const jobMatch = app.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSearch = nameMatch || emailMatch || jobMatch;
        const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
        return matchesSearch && matchesStatus;
    }), [applicants, searchTerm, filterStatus]);

    const pipelineStats = useMemo(() => {
        const stats = {
            'Screening': 0,
            'Interview': 0,
            'Offered': 0,
            'Pre-onboarding': 0,
            'Hired': 0,
            'Rejected': 0
        };
        applicants.forEach(app => {
            if (app.status === 'Applied') stats['Screening']++;
            else if (app.status === 'Interviewing') stats['Interview']++;
            else if (stats.hasOwnProperty(app.status)) {
                stats[app.status]++;
            }
        });
        return stats;
    }, [applicants]);

    if (loading) return <ApplicantsSkeleton />;

    // If a specific job is selected
    if (jobId && jobDetails) {
        return (
            <div className="flex flex-col h-full bg-gray-50/30">
                {/* Header Section */}
                <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/job-recruitment/jobs')}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    {jobDetails.title} <span className="text-gray-400 font-medium text-[16px]">#{jobDetails.id?.toString().padStart(3, '0')}</span>
                                </h2>
                                <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                                    Dept: {jobDetails.department} | Branch: {jobDetails.branch || jobDetails.location}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-[13px] font-medium"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Applicant
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-gray-50/50 p-1.5 rounded-[10px] border border-gray-100 overflow-x-auto">
                            {Object.entries(pipelineStats).map(([key, count], idx) => (
                                <div key={key} className={`px-6 py-2 flex flex-col items-center gap-1 border-gray-200 cursor-default min-w-[120px] ${idx !== Object.entries(pipelineStats).length - 1 ? 'border-r' : ''}`}>
                                    <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">{key}</span>
                                    <span className={`text-[18px] font-semibold ${count > 0 ? (key === 'Rejected' ? 'text-red-500' : 'text-primary') : 'text-gray-400'}`}>{count}</span>
                                </div>
                            ))}
                        </div>
                        <div className="ml-auto px-6 py-4 bg-gray-50/50 rounded-[15px] border border-gray-100 text-right">
                            <div className="text-[18px] font-semibold text-gray-800 whitespace-nowrap">
                                {jobDetails.salary_range || `${jobDetails.min_salary} - ${jobDetails.max_salary} LPA`}
                            </div>
                            <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                                {jobDetails.job_type}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: Applicants List */}
                    <div className="w-[380px] border-r border-gray-100 bg-white flex flex-col shrink-0">
                        <div className="p-5 border-b border-gray-50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-semibold text-gray-600 uppercase tracking-wider">{applicants.length} candidates</span>
                                <button className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                                    <Filter size={18} />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search candidates..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-[14px] font-semibold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredApplicants.map(app => (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedApplicant(app)}
                                    className={`p-5 flex items-start gap-4 cursor-pointer transition-all border-l-[3px] ${selectedApplicant?.id === app.id ? 'bg-orange-300/5 border-orange-400' : 'bg-white border-transparent hover:bg-gray-50 border-gray-100'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                        {app.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-[14px] font-semibold text-gray-900 truncate">{app.name}</h4>
                                        </div>

                                        <div className="flex items-center gap-1 mt-2">
                                            <MailIcon size={10} className="text-green-700" />
                                            <span className="text-[11px] font-semibold text-gray-600">{app.email || '8383990217'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Phone size={10} className="text-green-700" />
                                            <span className="text-[11px] font-semibold text-gray-600">{app.phone || '8383990217'}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                                                {app.experience_years || '3 Years'} • {app.gender || 'Male'} • {app.location || 'Tamil Nadu'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredApplicants.length === 0 && (
                                <div className="p-10 text-center text-gray-400 font-semibold">No candidates found.</div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Applicant Details */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 custom-scrollbar">
                        {selectedApplicant ? (
                            <div className="max-w-5xl mx-auto space-y-6">
                                {selectedApplicant.status === 'Completed' && (
                                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-green-900 uppercase tracking-tight text-[16px]">{selectedApplicant.name} - HIRED SUCCESSFULLY!</h3>
                                                <p className="text-green-600 text-[13px] font-medium">Candidate has completed the hiring process and is now an employee.</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block bg-green-500 text-white px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-widest shadow-sm">Process Finalized</div>
                                    </motion.div>
                                )}
                                <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Candidate Details</h3>

                                <div className="bg-white rounded-[10px] p-6 border border-gray-100 shadow-xs relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row items-start gap-4">
                                        <div className="w-12 h-12 rounded-[10px] bg-primary text-white flex items-center justify-center font-semibold text-2xl shadow-xl shadow-primary/20 uppercase">
                                            {selectedApplicant.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-semibold text-gray-900">{selectedApplicant.name}</h2>
                                                <span className="text-gray-400 font-semibold text-[15px]">{selectedApplicant.experience_years || '3 Years'}</span>
                                            </div>
                                            <div className="text-gray-400 font-semibold text-[14px] uppercase tracking-wider">Candidate</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3 self-center md:self-start">
                                            <StatusBadge status={selectedApplicant.status === 'Applied' ? 'Screening' : selectedApplicant.status} />
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex items-center gap-2 mt-8 p-1.5 bg-gray-50 rounded-2xl w-fit overflow-x-auto">
                                        {['Overview', 'Questioning', 'Ratings & Reviews', 'Hiring Pipeline'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-6 py-2 rounded-xl text-[13px] font-semibold tracking-tight transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {activeTab === 'Overview' && (
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-[15px] p-6 border border-gray-100 shadow-sm">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="text-gray-200" fill="currentColor" />)}
                                                            <span className="text-gray-400 font-semibold ml-2">No ratings yet</span>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedApplicant.resume_url) {
                                                                        const fullUrl = selectedApplicant.resume_url.startsWith('http')
                                                                            ? selectedApplicant.resume_url
                                                                            : `${API_URL}/${selectedApplicant.resume_url.replace(/\\/g, '/')}`;
                                                                        window.open(fullUrl, '_blank');
                                                                    } else {
                                                                        toast.error('No resume available');
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[13px] font-medium hover:bg-primary/10 transition-all"
                                                            >
                                                                <Eye size={16} /> View Resume
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h4 className="text-[15px] font-semibold text-gray-900 border-l-[3px] border-primary pl-4 uppercase tracking-widest leading-none">Skills</h4>
                                                        <p className="text-gray-400 font-semibold italic pl-4">No skills specified</p>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-[12px] p-6 border border-gray-100 shadow-sm">
                                                    <h4 className="text-[15px] font-semibold text-gray-900 mb-8 border-l-[3px] border-primary pl-4 uppercase tracking-widest leading-none">Address Information</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Address Line</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">City</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">State/Province</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">{selectedApplicant.location || 'Tamil Nadu'}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Country</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Postal Code</div>
                                                            <div className="text-[14px] font-bold text-gray-600">N/A</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-[10px] p-6 border border-gray-100 shadow-xs">
                                                    <h4 className="text-[15px] font-semibold text-gray-900 mb-8 border-l-[3px] border-primary pl-4 uppercase tracking-widest leading-none">Professional Details</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Experience in Year(s)</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">{selectedApplicant.experience_years || '3 Years'}</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Highest Qualification</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Current Job Title</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Current Employer</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Current Salary</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">4</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Expected Salary</div>
                                                            <div className="text-[14px] font-semibold text-gray-600">N/A</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'Hiring Pipeline' && (
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-[12px] p-8 border border-gray-100 shadow-sm">
                                                    <h4 className="text-[16px] font-semibold text-gray-900 mb-10 border-l-[4px] border-primary pl-4 uppercase tracking-wider">Hiring Pipeline</h4>
                                                    <div className="relative flex items-center mb-6">
                                                        {(() => {
                                                            const steps = [
                                                                { label: "Resume Screening", key: 'Applied' },
                                                                { label: "Interviewing", key: 'Interviewing' },
                                                                { label: "Offer Letter", key: 'Offered' },
                                                                { label: "Hired", key: 'Hired' },
                                                                { label: "Recruited", key: 'Completed' }
                                                            ];
                                                            const currentIndex = steps.findIndex(s => s.key === selectedApplicant.status);

                                                            return steps.map((step, index) => (
                                                                <PipelineStep
                                                                    key={step.key}
                                                                    label={step.label}
                                                                    active={selectedApplicant.status === step.key && selectedApplicant.status !== 'Completed'}
                                                                    completed={currentIndex > index || (step.key === 'Hired' && selectedApplicant.is_doc_sent === 1) || selectedApplicant.status === 'Completed'}
                                                                    isLast={index === steps.length - 1}
                                                                />
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-[10px] p-6 border border-gray-100 shadow-xs">
                                                    <h4 className="text-[18px] font-semibold text-gray-900 mb-6">Activity Timeline</h4>
                                                    <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-50">
                                                        <div className="relative pl-8">
                                                            <div className="absolute left-0 top-1.5 w-[16px] h-[16px] rounded-full bg-green-500 border-4 border-white z-10" />
                                                            <div className="flex flex-col gap-1">
                                                                <div className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">
                                                                    {selectedApplicant.status === 'Applied' ? (
                                                                        <span>STATUS CHANGE BY admin</span>
                                                                    ) : selectedApplicant.status === 'Interviewing' ? (
                                                                        <span>STATUS CHANGE BY admin</span>
                                                                    ) : selectedApplicant.status === 'Offered' ? (
                                                                        <span className="text-blue-600 lowercase font-medium">sent offer letter</span>
                                                                    ) : selectedApplicant.status === 'Hired' ? (
                                                                        <span className="text-blue-600 lowercase font-medium">send document request . send manual</span>
                                                                    ) : (
                                                                        <span>Status changed to {selectedApplicant.status} by Admin</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] font-semibold text-gray-400">{new Date().toLocaleDateString('en-GB')}</div>
                                                            </div>
                                                        </div>

                                                        {selectedApplicant.status === 'Applied' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (selectedApplicant.resume_url) {
                                                                        const fullUrl = selectedApplicant.resume_url.startsWith('http')
                                                                            ? selectedApplicant.resume_url
                                                                            : `${API_URL}/${selectedApplicant.resume_url.replace(/\\/g, '/')}`;
                                                                        window.open(fullUrl, '_blank');
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 text-blue-600 text-[14px] font-medium hover:gap-3 transition-all ml-1 bg-white px-0 py-0 rounded-xl border-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={!selectedApplicant.resume_url}
                                                            >
                                                                <FileText size={18} className="text-blue-500" />
                                                                <span className="lowercase font-medium text-blue-600">view resume</span>
                                                            </button>
                                                        )}

                                                        {selectedApplicant.status === 'Interviewing' && (
                                                            <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 text-primary text-[14px] font-bold hover:gap-3 transition-all ml-1 bg-white px-0 py-0 rounded-xl border-none">
                                                                <PlusCircle size={18} className="text-blue-500" />
                                                                <span className="lowercase font-medium text-blue-600">Schedule a new Interview</span>
                                                            </button>
                                                        )}

                                                        {selectedApplicant.status === 'Offered' && (
                                                            <button onClick={() => setIsOfferModalOpen(true)} className="flex items-center gap-2 text-primary text-[14px] font-bold hover:gap-3 transition-all ml-1 bg-white px-0 py-0 rounded-xl border-none">
                                                                <PlusCircle size={18} className="text-blue-500" />
                                                                <span className="lowercase font-medium text-blue-600">sent offer letter</span>
                                                            </button>
                                                        )}

                                                        {selectedApplicant.status === 'Hired' && (
                                                            <div className="flex gap-1 ml-1">
                                                                <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center gap-1.5 text-blue-600 text-[14px] font-medium lowercase">
                                                                    <PlusCircle size={18} className="text-blue-500" /> send document request
                                                                </button>
                                                                <span className="text-gray-400">.</span>
                                                                <button className="text-blue-600 text-[14px] font-medium lowercase">send manual</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 mt-10">
                                                    {selectedApplicant.status !== 'Completed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(selectedApplicant.id, 'Rejected')}
                                                            className="px-6 py-2 rounded-full border border-red-300 text-red-600 font-semibold text-[13px] hover:bg-red-50 transition-all"
                                                        >
                                                            Reject Candidate
                                                        </button>
                                                    )}
                                                    {selectedApplicant.status !== 'Completed' && nextStatus && (
                                                        <button
                                                            onClick={() => setIsNextStatusModalOpen(true)}
                                                            className={`px-8 py-3 rounded-full text-white font-medium text-[14px] transition-all shadow-lg min-w-[200px] ${selectedApplicant.status === 'Hired' && selectedApplicant.is_doc_sent
                                                                ? 'bg-green-600 hover:bg-green-700 shadow-green-100 font-bold'
                                                                : 'bg-primary hover:bg-primary-hover shadow-blue-100'
                                                                }`}
                                                        >
                                                            {selectedApplicant.status === 'Hired' && selectedApplicant.is_doc_sent
                                                                ? `Confirm Recruited (${selectedApplicant.name})`
                                                                : nextStatus === 'Interviewing' ? 'Move to Interviewing' :
                                                                    nextStatus === 'Offered' ? 'Move to Offer stage' :
                                                                        nextStatus === 'Hired' ? 'Confirm Recruitment' :
                                                                            'Move to Next Status'
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {['Questioning', 'Ratings & Reviews'].includes(activeTab) && (
                                            <div className="bg-white rounded-[20px] p-16 border border-gray-100 shadow-sm text-center">
                                                <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                                                    <Star size={40} className="text-gray-200" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">No data yet</h3>
                                                <p className="text-gray-400 max-w-sm mx-auto font-bold">This section will be populated once interviews and evaluations begin.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-32">
                                <Users size={64} className="mb-6 opacity-20" />
                                <p className="text-lg font-semibold">Select a candidate to view details</p>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isCreateModalOpen && (
                        <CreateApplicantModal
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            onSuccess={fetchData}
                            initialJobId={jobId}
                            jobs={allJobs}
                        />
                    )}
                    {isScheduleModalOpen && (
                        <ScheduleInterviewModal
                            isOpen={isScheduleModalOpen}
                            onClose={() => setIsScheduleModalOpen(false)}
                            onSuccess={fetchData}
                            applicant={selectedApplicant}
                        />
                    )}
                    {isOfferModalOpen && (
                        <SendOfferLetterModal
                            isOpen={isOfferModalOpen}
                            onClose={() => setIsOfferModalOpen(false)}
                            onSuccess={fetchData}
                            applicant={selectedApplicant}
                        />
                    )}
                    {isRequestModalOpen && (
                        <RequestDocumentsModal
                            isOpen={isRequestModalOpen}
                            onClose={() => setIsRequestModalOpen(false)}
                            onSuccess={fetchData}
                            applicant={selectedApplicant}
                        />
                    )}
                    {isNextStatusModalOpen && (
                        <MoveStatusModal
                            isOpen={isNextStatusModalOpen}
                            onClose={() => setIsNextStatusModalOpen(false)}
                            onConfirm={() => {
                                handleStatusUpdate(selectedApplicant.id, nextStatus);
                                setIsNextStatusModalOpen(false);
                            }}
                            currentStatus={selectedApplicant.status}
                            nextStatus={nextStatus}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }


    // Default: Table view of all applicants
    const columns = [
        {
            header: 'Candidate',
            key: 'name',
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                        {row.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 text-[14.5px]">{row.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[12px] text-gray-400 flex items-center gap-1 font-medium">
                                <Mail size={12} /> {row.email}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Applied Position',
            key: 'job_title',
            render: (val, row) => (
                <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-gray-600 font-semibold">{val}</span>
                    <button
                        onClick={() => navigate(`/job-recruitment/applicants?jobId=${row.job_id}`)}
                        className="text-[11px] text-primary font-semibold hover:underline w-fit uppercase tracking-wider"
                    >
                        View Job Pipeline
                    </button>
                </div>
            )
        },
        {
            header: 'Applied Date',
            key: 'applied_at',
            render: (val) => (
                <div className="flex items-center gap-2 text-[13.5px] text-gray-500 font-semibold">
                    <Calendar size={14} className="text-gray-400" />
                    {new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (val) => <StatusBadge status={val === 'Applied' ? 'Screening' : val} />
        },
        {
            header: 'Resume',
            key: 'id',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (row.resume_url) {
                                const fullUrl = row.resume_url.startsWith('http')
                                    ? row.resume_url
                                    : `${API_URL}/${row.resume_url.replace(/\\/g, '/')}`;
                                window.open(fullUrl, '_blank');
                            } else {
                                toast.error('No resume available');
                            }
                        }}
                        className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="View Resume"
                        disabled={!row.resume_url}
                    >
                        <Eye size={18} className={!row.resume_url ? "opacity-30" : ""} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#111827]">All Applicants</h2>
                        <p className="text-gray-500 text-[15px] font-semibold mt-1">Track and manage all candidates across different job openings</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-[14px] font-medium tracking-wider"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Add Applicant
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search name or job..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full sm:w-72 text-[14px] font-semibold"
                            />
                        </div>

                        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 overflow-x-auto max-w-full">
                            {['All', 'Applied', 'Interviewing', 'Hired'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${filterStatus === status ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {status === 'All' ? 'All' : (status === 'Applied' ? 'Screening' : status)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredApplicants}
                        isLoading={loading}
                        emptyMessage="No candidates found matching your filter criteria."
                    />
                </div>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateApplicantModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={fetchData}
                        initialJobId={null}
                        jobs={allJobs}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ApplicantsList;
