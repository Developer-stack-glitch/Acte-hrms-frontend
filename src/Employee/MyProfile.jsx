import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    Shield, CreditCard, Building, Globe, Camera,
    Edit2, Camera as CameraIcon, CheckCircle2,
    Clock, Award, Heart, Fingerprint, FileText,
    Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getProfileApi, updateUserApi, getUserByIdApi } from '../Action/api';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MyProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const { data } = userId ? await getUserByIdApi(userId) : await getProfileApi();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        const loadingToast = toast.loading('Uploading profile image...');

        try {
            await updateUserApi(profile.id, formData);
            toast.success('Profile image updated successfully', { id: loadingToast });
            fetchProfile(); // Refresh profile data
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile image', { id: loadingToast });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <Shield size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-semibold">Profile not found</p>
            </div>
        );
    }

    const ProfileSection = ({ title, icon: Icon, children }) => (
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                    <Icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children}
            </div>
        </section>
    );

    const InfoItem = ({ label, value, icon: Icon, isSensitive = false }) => {
        const [showSensitive, setShowSensitive] = useState(false);

        const getDisplayValue = () => {
            if (!value) return 'Not provided';
            if (isSensitive && !showSensitive) {
                // If it's a long number like Aadhar, mask all but last 4
                if (value.length > 4) {
                    return `•••• •••• ${value.slice(-4)}`;
                }
                return '•••• ••••';
            }
            return value;
        };

        const isValueProvided = value && value !== 'Not provided';

        return (
            <div className="group">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3 ml-1">{label}</p>
                <div className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all border border-gray-200 duration-300 ${isSensitive && isValueProvided
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-gray-50/50 border-transparent hover:border-primary/10 group-hover:bg-primary/5'
                    }`}>
                    {Icon && <Icon size={16} className={`${isSensitive && isValueProvided ? 'text-primary' : 'text-gray-400'} group-hover:text-primary transition-colors shrink-0`} />}
                    <span className={`text-[14px] font-semibold truncate flex-1 ${isSensitive && isValueProvided ? 'text-primary' : 'text-gray-700'}`}>
                        {getDisplayValue()}
                    </span>
                    {isSensitive && isValueProvided && (
                        <button
                            onClick={() => setShowSensitive(!showSensitive)}
                            className="p-1.5 hover:bg-primary/10 text-primary/50 hover:text-primary rounded-lg transition-all"
                            title={showSensitive ? 'Hide Sensitive Info' : 'Show Sensitive Info'}
                        >
                            {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            {/* Header Hero Section */}
            <div className="relative overflow-hidden bg-white rounded-[20px] shadow-xl shadow-primary/5 border border-primary/5">
                {/* Decorative Background */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                <div className="relative px-6 pt-12 pb-6 flex flex-col md:flex-row items-end gap-8">
                    {/* Avatar Container */}
                    <div className="relative group">
                        <div className="w-26 h-26 md:w-32 md:h-32 rounded-[15px] premium-gradient p-0.5 shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 relative">
                            <div className="w-full h-full rounded-[15px] bg-white flex items-center justify-center overflow-hidden">
                                <img
                                    src={profile.document_photo ? `${import.meta.env.VITE_API_URL}/${profile.document_photo}` : `https://ui-avatars.com/api/?name=${profile.employee_name || profile.name}&background=f1f5f9&color=1d4ed8&bold=true&size=200`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[30px] z-10 backdrop-blur-[2px]">
                                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            onClick={handleImageClick}
                            disabled={uploading}
                            className={`absolute -bottom-2 -right-2 p-3 bg-white text-primary rounded-2xl shadow-xl hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95 border border-primary/10 z-20 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <CameraIcon size={20} />
                        </button>
                    </div>

                    {/* Basic Info Header */}
                    <div className="flex-1 space-y-3 pb-2 text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                                {profile.employee_name || profile.name}
                            </h1>
                            <span className="inline-flex items-center px-4 py-1 rounded-full bg-green-50 text-green-600 text-[13px] font-semibold border border-green-200 self-center md:self-auto">
                                <CheckCircle2 size={12} className="mr-1" /> Active
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-gray-500 font-medium">
                            <div className="flex items-center gap-2">
                                <Briefcase size={16} className="text-primary/70" />
                                <span>{profile.designation_name || 'Staff'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building size={16} className="text-primary/70" />
                                <span>{profile.department_name || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Fingerprint size={16} className="text-primary/70" />
                                <span className="font-semibold text-gray-700">ID: {profile.emp_id || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Employee Button for Admins - Moved to far right */}
                    {(() => {
                        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                        if ((userInfo.role === 'admin' || userInfo.role === 'superadmin') && profile?.id) {
                            return (
                                <div className="pb-3 self-center md:self-end">
                                    <button
                                        onClick={() => navigate('/users/database', { state: { editUserId: profile.id } })}
                                        className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-white text-[14px] font-medium border border-primary shadow-md shadow-primary/20 hover:bg-primary-hover transition-all transform active:scale-95 whitespace-nowrap"
                                    >
                                        <Edit2 size={14} className="mr-2" /> Edit Employee Data
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 gap-6">
                {/* Personal Information */}
                <ProfileSection title="Personal Information" icon={User}>
                    <InfoItem label="Full Name" value={profile.employee_name} icon={User} />
                    <InfoItem label="Email Address" value={profile.email} icon={Mail} />
                    <InfoItem label="Gender" value={profile.gender} icon={User} />
                    <InfoItem label="Personal Email" value={profile.per_mail_id} icon={Globe} />
                    <InfoItem label="Phone Number" value={profile.per_contact_no} icon={Phone} />
                    <InfoItem label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'} icon={Calendar} />
                    <InfoItem label="Blood Group" value={profile.blood_group} icon={Heart} />
                    <InfoItem label="Father/Spouse" value={profile.father_spouse_name} icon={User} />
                    <InfoItem label="Mother's Name" value={profile.mother_name} icon={User} />
                </ProfileSection>

                {/* Professional Information */}
                <ProfileSection title="Work & Organization" icon={Briefcase}>
                    <InfoItem label="Employee ID" value={profile.emp_id} icon={Fingerprint} />
                    <InfoItem label="Designation" value={profile.designation_name} icon={Award} />
                    <InfoItem label="Department" value={profile.department_name} icon={Building} />
                    <InfoItem label="Company" value={profile.company_name || 'HRM Application'} icon={Building} />
                    <InfoItem label="Branch" value={profile.branch_name} icon={MapPin} />
                    <InfoItem label="Work Location" value={profile.work_location} icon={Globe} />
                    <InfoItem label="Shift" value={profile.shift_name} icon={Clock} />
                    <InfoItem label="Engagement Type" value={profile.employment_type} icon={Briefcase} />
                    <InfoItem label="Joined On" value={profile.doj ? new Date(profile.doj).toLocaleDateString() : 'N/A'} icon={Calendar} />
                </ProfileSection>

                {/* Documentation & Identifiers */}
                <ProfileSection title="KYC & Legal" icon={Shield}>
                    <InfoItem label="Aadhar Number" value={profile.aadhar} icon={Fingerprint} isSensitive />
                    <InfoItem label="PAN Number" value={profile.pan} icon={Fingerprint} isSensitive />
                    <InfoItem label="ESI Status/No" value={profile.esi} icon={Shield} isSensitive />
                    <InfoItem label="PF Number" value={profile.pf} icon={Shield} isSensitive />
                    <InfoItem label="UAN Number" value={profile.uan} icon={Fingerprint} isSensitive />
                </ProfileSection>

                {/* Banking Information */}
                <ProfileSection title="Banking Details" icon={CreditCard}>
                    <InfoItem label="Account Number" value={profile.bank_ac_no} icon={CreditCard} isSensitive />
                    <InfoItem label="IFSC Code" value={profile.ifsc} icon={Building} isSensitive />
                    <InfoItem label="Bank Name" value="Primary Bank Account" icon={Building} />
                </ProfileSection>

                {/* Addresses */}
                <ProfileSection title="Residential Details" icon={MapPin}>
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">Current Address</p>
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex gap-4">
                                <MapPin size={20} className="text-primary/40 shrink-0" />
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                    {profile.temp_address || 'Address not specified'}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">Permanent Address</p>
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex gap-4">
                                <MapPin size={20} className="text-primary/40 shrink-0" />
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                    {profile.perm_address || 'Address not specified'}
                                </p>
                            </div>
                        </div>
                    </div>
                </ProfileSection>
            </div>
        </motion.div>
    );
}