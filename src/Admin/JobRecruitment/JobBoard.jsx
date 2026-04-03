import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Briefcase, DollarSign, Clock, Edit2, Trash2, X, ChevronRight, User, Users, Globe, Building2 } from 'lucide-react';
import { getJobsApi, deleteJobApi } from '../../Action/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { JobBoardSkeleton } from '../../Common/CommonSkeletonLoader/JobRecruitmentSkeleton';

const JobDetailsModal = ({ job, onClose }) => {
    const navigate = useNavigate();
    if (!job) return null;

    const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : (job.skills || []);

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
                className="bg-white rounded-[15px] w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Modal Header */}
                <div className="relative p-8 bg-gradient-to-br from-primary/5 via-white to-white border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-13 h-13 rounded-[15px] bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0">
                                <h2 className="text-2xl font-semibold text-gray-900">{job.title}</h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${job.status === 'Open' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {job.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5"><Building2 size={16} className="text-primary/60" /> {job.department}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-primary/60" /> {job.branch || job.location}</span>
                                <span className="flex items-center gap-1.5"><Clock size={16} className="text-primary/60" /> {job.job_type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-10 min-w-0">
                            {/* Description */}
                            <section className="break-words">
                                <h3 className="text-[17px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    About the Role
                                </h3>
                                <div
                                    className="text-[15px] text-gray-600 leading-relaxed rich-text-preview"
                                    dangerouslySetInnerHTML={{ __html: job.description }}
                                />
                            </section>

                            {/* Requirements */}
                            {job.requirements && (
                                <section className="break-words">
                                    <h3 className="text-[17px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Requirements
                                    </h3>
                                    <div
                                        className="text-[15px] text-gray-600 leading-relaxed rich-text-preview"
                                        dangerouslySetInnerHTML={{ __html: job.requirements }}
                                    />
                                </section>
                            )}

                            {/* Skills Tag Cloud */}
                            {skills.length > 0 && (
                                <section>
                                    <h3 className="text-[17px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Key Skills & Technologies
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, idx) => (
                                            <span key={idx} className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-100 rounded-xl text-sm font-semibold hover:bg-white hover:border-primary/30 hover:text-primary transition-all cursor-default">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6 lg:sticky lg:top-0 h-fit">
                            <div className="p-6 bg-gray-50/50 rounded-[15px] border border-gray-100 space-y-6">
                                <h4 className="text-[15px] font-bold text-gray-900 mb-2">Job Overview</h4>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Experience</span>
                                        <span className="text-gray-900 font-semibold">{job.experience_years} Years+</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Salary Range</span>
                                        <span className="text-primary font-semibold">{job.salary_range || `${job.min_salary} - ${job.max_salary} LPA`}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Positions</span>
                                        <span className="text-gray-900 font-semibold">{job.num_positions} Opening(s)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">Gender Pref.</span>
                                        <span className="text-gray-900 font-semibold">{job.preferred_gender}</span>
                                    </div>
                                    {job.close_date && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Close Date</span>
                                            <span className="text-red-500 font-semibold">{new Date(job.close_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-white rounded-[15px] border border-gray-100 space-y-4">
                                <h4 className="text-[14px] font-bold text-gray-900 mb-2">Hiring Team</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/5">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-gray-800">{job.hiring_manager || 'Global Hiring'}</p>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Hiring Manager</p>
                                    </div>
                                </div>
                                {job.recruiters && (
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users size={14} className="text-gray-400" />
                                            <span className="text-[12px] font-semibold text-gray-500">Assigned Recruiters</span>
                                        </div>
                                        <p className="text-[13px] text-gray-600 font-medium pl-6">{job.recruiters}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-sky-50/50 rounded-[15px] border border-sky-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-sky-500 text-white rounded-lg">
                                        <Globe size={18} />
                                    </div>
                                    <h4 className="text-[14px] font-bold text-sky-900">Work Location</h4>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[13px] text-sky-800 font-semibold">{job.branch || 'Main Branch'}</p>
                                    <p className="text-[13px] text-sky-600/80 leading-relaxed font-medium">
                                        {job.city}{job.city && job.state ? ', ' : ''}{job.state} {job.zip_code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-white transition-all text-sm"
                    >
                        Close Details
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            navigate(`/job-recruitment/applicants?jobId=${job.id}`);
                        }}
                        className="px-8 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm flex items-center gap-2"
                    >
                        View Applicants
                        <ChevronRight size={16} />
                    </button>
                </div>
                <style>{`
                    .rich-text-preview {
                        word-break: break-word;
                        overflow-wrap: break-word;
                    }
                    .rich-text-preview ul, .rich-text-preview ol {
                        padding-left: 1.5rem;
                        margin-bottom: 1rem;
                        list-style-position: outside;
                    }
                    .rich-text-preview ul {
                        list-style-type: disc;
                    }
                    .rich-text-preview ol {
                        list-style-type: decimal;
                    }
                    .rich-text-preview li {
                        margin-bottom: 0.5rem;
                    }
                    .rich-text-preview p {
                        margin-bottom: 0.75rem;
                    }
                    .rich-text-preview table {
                        width: 100% !important;
                        border-collapse: collapse;
                        margin: 1rem 0;
                        overflow-x: auto;
                        display: block;
                    }
                `}</style>
            </motion.div>
        </motion.div>
    );
};

const JobBoard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await getJobsApi();
            setJobs(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        navigate(`/job-recruitment/create/${id}`);
    };

    const handleCreate = () => {
        navigate('/job-recruitment/create');
    };

    const handleDelete = (id) => {
        setDeleteModal({ show: true, jobId: id });
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteJobApi(deleteModal.jobId);
            toast.success('Job deleted successfully');
            fetchJobs();
            setDeleteModal({ show: false, jobId: null });
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <JobBoardSkeleton />;

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-2xl font-semibold text-[#1e293b]">Job Board</h2>
                    <p className="text-gray-500 text-[15px] font-medium mt-1">Manage all active and inactive job openings</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-hover transition-all shadow-xs shadow-primary/20 font-medium active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} />
                    Post New Job
                </button>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {jobs.map((job) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={job.id}
                        className="bg-white rounded-[15px] border border-gray-200 p-6 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${job.status === 'Open' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                {job.status}
                            </div>
                            <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl">
                                <button
                                    onClick={() => handleEdit(job.id)}
                                    className="p-2.5 text-gray-400 hover:text-primary hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                    title="Edit Job"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(job.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                    title="Delete Job"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 mb-4">
                            <h3 className="text-[22px] font-semibold text-gray-900 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                            <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide">{job.department}</p>
                        </div>

                        <div className="space-y-4 mb-4">
                            <div className="flex items-center gap-3 text-gray-600 text-[14px] font-medium mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                    <MapPin size={16} />
                                </div>
                                {job.branch || job.location}
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 text-[14px] font-medium mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                    <Briefcase size={16} />
                                </div>
                                {job.job_type}
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 text-[14px] font-medium mb-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                    <DollarSign size={16} />
                                </div>
                                {job.salary_range || `${job.min_salary} - ${job.max_salary} LPA`}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-[12px] text-gray-400 font-medium flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full">
                                    <Clock size={12} />
                                    {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedJob(job)}
                                className="flex items-center gap-2 text-[13px] font-semibold text-primary hover:gap-3 transition-all px-4 py-2 bg-primary/5 rounded-full hover:bg-primary/10"
                            >
                                Details
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {jobs.length === 0 && (
                <div className="text-center py-32 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 mt-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                        <Briefcase size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-[18px] font-semibold text-gray-800 mb-2">No active job postings</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">There are currently no job openings listed. Start by creating a new job profile.</p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full font-medium shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        Post New Job
                    </button>
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {selectedJob && (
                    <JobDetailsModal
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                    />
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, jobId: null })}
                onConfirm={confirmDelete}
                title="Delete Job Posting"
                message="Are you sure you want to delete this job posting? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
};

export default JobBoard;
