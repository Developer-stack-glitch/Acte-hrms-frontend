import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Eye, X, ChevronRight, User, Users, Globe, Building2, Send, Sparkles } from 'lucide-react';
import { getOpenPositionsApi } from '../Action/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { JobBoardSkeleton } from '../Common/CommonSkeletonLoader/JobRecruitmentSkeleton';

const JobDetailsModal = ({ job, onClose }) => {
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
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-green-100 text-green-600">
                                    OPEN
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
                        className="px-8 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm flex items-center gap-2"
                        onClick={() => toast.success("Application functionality coming soon for internal employees!")}
                    >
                        Apply for this Role
                        <Send size={16} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


export default function OpenJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await getOpenPositionsApi();
            setJobs(res.data || []);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
            toast.error('Failed to load job listings');
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <JobBoardSkeleton />;

    return (
        <div className="p-4 md:p-0 mx-auto min-h-screen bg-transparent">
            {/* Hero Section */}
            <div className="relative mb-10 p-6 md:p-8 rounded-[15px] bg-primary overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full" />

                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-[0.2em] mb-6 backdrop-blur-md">
                            Internal Career Portal
                        </span>
                        <h1 className="text-2xl md:text-4xl font-semibold text-white mb-2 leading-tight"> Grow your career at <span className="underline decoration-white/30 underline-offset-8">HQ Digital.</span></h1>
                        <p className="text-white/80 text-md md:text-lg font-medium leading-relaxed mb-0">
                            Explore open positions and departments. We're always looking for internal talent to lead our next big projects.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for your next role (e.g. Product Designer, DevOps)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 rounded-full outline-none text-[14px] font-medium transition-all"
                    />
                </div>
            </div>

            {/* Job Grid */}
            {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredJobs.map((job, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={job.id}
                            className="bg-white rounded-[15px] border border-gray-200 p-6 transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-green-50 text-green-600 border-green-100">
                                    OPEN
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles size={16} />
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

                            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
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
            ) : (

                <div className="text-center py-32 bg-gray-50/30 rounded-[60px] border-4 border-dashed border-gray-100 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-8 text-gray-200">
                        <Search size={48} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No openings found</h3>
                    <p className="text-gray-400 max-w-sm font-semibold text-md">We couldn't find any jobs matching your search criteria. Try a different keyword?</p>
                </div>
            )}

            <AnimatePresence>
                {selectedJob && (
                    <JobDetailsModal
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                    />
                )}
            </AnimatePresence>

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
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e1e7f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>

    );
}
