import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Shield,
    Bell,
    Building2,
    Smartphone,
    Database,
    Settings as SettingsIcon,
    ChevronRight,
    Save,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getProfileApi,
    updateUserApi,
    getCompaniesApi,
    updateCompanyApi
} from '../../Action/api';
import { FormInput } from '../Form';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [fullProfile, setFullProfile] = useState({});
    const fileInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [orgData, setOrgData] = useState({});
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        // Profile
        off_contact_no: '',
        per_contact_no: '',
        // Security
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        // Org
        company_name: '',
        company_email: '',
        company_website: '',
        company_tax_id: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            setUser(userInfo);

            // Fetch Full User Profile
            const profileRes = await getProfileApi();
            setFullProfile(profileRes.data);

            if (profileRes.data.document_photo) {
                setPreviewUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/api/${profileRes.data.document_photo}`);
            }

            setFormData(prev => ({
                ...prev,
                off_contact_no: profileRes.data.off_contact_no || '',
                per_contact_no: profileRes.data.per_contact_no || '',
            }));

            // If Admin, fetch Org Data
            if (userInfo.role === 'admin' || userInfo.role === 'superadmin') {
                const companiesRes = await getCompaniesApi();
                if (companiesRes.data && companiesRes.data.length > 0) {
                    const company = companiesRes.data[0];
                    setOrgData(company);
                    if (company.logo) {
                        setLogoPreviewUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/api/${company.logo}`);
                    }
                    setFormData(prev => ({
                        ...prev,
                        company_name: company.name || '',
                        company_email: company.email || '',
                        company_website: company.website || '',
                        company_tax_id: company.tax_id || ''
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching settings data:', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFullProfile(prev => ({ ...prev, document_photo: null }));
    };
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedLogo(file);
            setLogoPreviewUrl(URL.createObjectURL(file));
        }
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (activeTab === 'profile') {
                const updateData = new FormData();
                updateData.append('off_contact_no', formData.off_contact_no);
                updateData.append('per_contact_no', formData.per_contact_no);

                if (selectedFile) {
                    updateData.append('photo', selectedFile);
                } else if (fullProfile.document_photo === null) {
                    updateData.append('document_photo', '');
                }

                await updateUserApi(fullProfile.id, updateData);
                toast.success('Profile updated successfully');
                fetchInitialData(); // Refresh data to get new photo path
                setSelectedFile(null);
            }
            else if (activeTab === 'security') {
                if (formData.newPassword) {
                    if (formData.newPassword !== formData.confirmPassword) {
                        toast.error('Passwords do not match');
                        setIsSaving(false);
                        return;
                    }
                    await updateUserApi(fullProfile.id, {
                        password: formData.newPassword
                    });
                    toast.success('Password updated successfully');
                    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                } else {
                    toast.error('Please enter a new password');
                }
            }
            else if (activeTab === 'organization' && orgData.id) {
                const updateData = new FormData();
                updateData.append('name', formData.company_name);
                updateData.append('email', formData.company_email);
                updateData.append('website', formData.company_website);
                updateData.append('tax_id', formData.company_tax_id);

                if (selectedLogo) {
                    updateData.append('logo', selectedLogo);
                }

                await updateCompanyApi(orgData.id, updateData);
                toast.success('Organization settings updated');
                fetchInitialData();
                setSelectedLogo(null);
            }
            else {
                await new Promise(resolve => setTimeout(resolve, 800));
                toast.success('Settings updated');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User, show: true },
        { id: 'security', label: 'Security', icon: Shield, show: true },
        { id: 'notifications', label: 'Notifications', icon: Bell, show: true },
        { id: 'organization', label: 'Organization', icon: Building2, show: isAdmin },
        { id: 'system', label: 'System Config', icon: Database, show: isAdmin },
    ].filter(tab => tab.show);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Syncing Data...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <section>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                Personal Profile
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormGroup label="Full Name" value={fullProfile?.employee_name || fullProfile?.name} readOnly />
                                <FormGroup label="Email Address" value={fullProfile?.email} readOnly />
                                <FormGroup label="Office Contact" name="off_contact_no" value={formData.off_contact_no} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                                <FormGroup label="Personal Contact" name="per_contact_no" value={formData.per_contact_no} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                                <FormGroup label="Designation" value={fullProfile?.designation_name} readOnly />
                                <FormGroup label="Department" value={fullProfile?.department_name} readOnly />
                            </div>
                        </section>
                        <section className="bg-gray-50/50 p-4 rounded-[15px] border border-gray-200">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-24 h-24 rounded-[15px] bg-white shadow-2xl flex items-center justify-center p-1 border-2 border-primary/20">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="avatar" className="w-full h-full rounded-[15px] object-cover" />
                                    ) : (
                                        <img src={`https://ui-avatars.com/api/?name=${fullProfile?.employee_name || 'User'}&background=1d4ed8&color=fff&size=200`} alt="avatar" className="w-full h-full rounded-[15px] object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-lg font-semibold text-gray-800">Profile Avatar</h4>
                                    <p className="text-sm text-gray-400 font-semibold mt-1">This photo will be visible across the HRM portal for identification.</p>
                                    <div className="flex justify-center md:justify-start gap-4 mt-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700 transition-all hover:bg-gray-50"
                                        >
                                            Upload New
                                        </button>
                                        <button
                                            onClick={handleRemovePhoto}
                                            className="px-6 py-2.5 text-[13px] font-semibold text-red-400 hover:text-red-500 transition-all rounded-full border border-gray-200"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                );
            case 'security':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        <section>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                Password Control
                            </h3>
                            <div className="grid grid-cols-1 gap-6 max-w-md">
                                <FormGroup label="New Password" type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="••••••••" />
                                <FormGroup label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" />
                            </div>
                        </section>
                        <section className="bg-primary/5 p-4 rounded-[15px] border border-primary/10">
                            <div className="flex items-center justify-between gap-6 flex-wrap">
                                <div className="flex gap-5">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary">
                                        <Smartphone size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-[17px] font-semibold text-gray-800">Multi-Factor Authentication</h4>
                                        <p className="text-sm text-gray-500 font-medium mt-1">Strengthen your account security using TOTP validataion.</p>
                                    </div>
                                </div>
                                <button className="px-6 py-2.5 bg-primary text-white rounded-full font-medium text-[14px] shadow-md shadow-primary/10 hover:bg-primary-hover transition-all">Setup MFA</button>
                            </div>
                        </section>
                    </motion.div>
                );
            case 'notifications':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Notification Stream
                        </h3>
                        <ToggleItem title="Payroll Disburse Alerts" description="Get instant notification when your monthly payslip is generated." defaultChecked />
                        <ToggleItem title="Leave Status Change" description="Real-time updates on your leave approval or rejection." defaultChecked />
                        <ToggleItem title="Company Bulletins" description="Broadcasts and announcements from HR or Management." />
                        <ToggleItem title="Security Watch" description="Alerts for logins from unrecognized devices or locations." defaultChecked />
                    </motion.div>
                );
            case 'organization':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                        <section>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                Corporate Identity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormGroup label="Company Legal Name" name="company_name" value={formData.company_name} onChange={handleInputChange} />
                                <FormGroup label="Official Support Email" name="company_email" value={formData.company_email} onChange={handleInputChange} />
                                <FormGroup label="Corporate Website" name="company_website" value={formData.company_website} onChange={handleInputChange} />
                                <FormGroup label="Tax Registration ID" name="company_tax_id" value={formData.company_tax_id} onChange={handleInputChange} />
                            </div>
                        </section>
                        <section className="bg-gray-50/50 p-4 rounded-[15px] border border-gray-100 flex items-center justify-between gap-8 flex-wrap">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white rounded-xl p-1 shadow-xs border-2 border-primary/5 overflow-hidden flex items-center justify-center font-semibold italic text-primary">
                                    {logoPreviewUrl ? (
                                        <img src={logoPreviewUrl} className="w-full h-full object-contain" />
                                    ) : (
                                        'LOGO'
                                    )}
                                </div>
                                <div>
                                    <p className="text-[17px] font-semibold text-gray-800">System Brand Logo</p>
                                    <p className="text-sm text-gray-400 font-semibold mt-1">Recommended size: 512x512px (PNG, SVG)</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={logoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                            <button
                                onClick={() => logoInputRef.current.click()}
                                className="px-8 py-3.5 bg-primary text-white rounded-full font-medium text-[14px] hover:bg-primary-hover transition-all"
                            >
                                Upload New Logo
                            </button>
                        </section>
                    </motion.div>
                );
            case 'system':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Core Engine Protocols
                        </h3>
                        <ToggleItem title="Automated Biometric Sync" description="Enable real-time background synchronization with office devices." defaultChecked />
                        <ToggleItem title="Geofencing Restrictions" description="Lock attendance actions to verified GPS coordinates." />
                        <ToggleItem title="Strict Overtime Flow" description="Mandate multi-level approval for all work beyond shift hours." defaultChecked />
                        <ToggleItem title="Public Recruitment Portal" description="Control visibility of open positions on the public web." defaultChecked />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-full bg-transparent p-2 sm:p-4 lg:p-2 pb-20">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-4 bg-primary/10 rounded-full shadow-inner group cursor-pointer transition-all duration-500">
                        <SettingsIcon className="text-primary group-hover:rotate-90 transition-transform duration-700" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Portal Settings</h2>
                        <p className="text-gray-400 text-[16px] font-medium">Operational Architecture</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-9">
                <aside className="w-full xl:w-80 shrink-0">
                    <div className="bg-white border border-gray-200 rounded-[15px] p-3 sticky top-24">
                        <div className="px-4 py-2 mb-2">
                            <h3 className="text-[16px] font-semibold text-gray-700">Management Space</h3>
                        </div>
                        <nav className="flex flex-col gap-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                                            ${isActive
                                                ? 'bg-primary/5 text-primary shadow-sm shadow-primary/5'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <div className={`
                                            w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500
                                            ${isActive
                                                ? 'bg-primary text-white shadow-xs shadow-primary/30 rotate-0'
                                                : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:rotate-6 group-hover:scale-110 border border-gray-100/50'}
                                        `}>
                                            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <span className={`text-[15px] block leading-none ${isActive ? 'font-semibold' : 'font-semibold'}`}>
                                                {tab.label}
                                            </span>
                                        </div>

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeBar"
                                                className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(29,78,216,0.3)]"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}

                                        {!isActive && (
                                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-gray-300" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden relative">
                        <div className="p-6 md:p-6">
                            {renderContent()}

                            <div className="mt-14 pt-8 border-t border-gray-100 flex items-center justify-between gap-8 flex-wrap">
                                <div>
                                    <p className="text-[16px] font-semibold text-gray-800">Dynamic Preference Engine</p>
                                    <p className="text-[12px] text-gray-400 font-semibold mt-1 uppercase tracking-wider">
                                        Last Synced: {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none px-9 py-3 rounded-full text-[15px] font-semibold text-gray-500 bg-gray-50 hover:text-gray-800 hover:bg-gray-100 transition-all active:scale-95">Discard</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-12 py-3 bg-primary text-white rounded-full text-[16px] font-medium hover:bg-primary-hover shadow-xs shadow-primary/20 transition-all disabled:opacity-75 active:scale-95"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Applying Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>Save Preferences</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const FormGroup = ({ label, name, type = "text", placeholder, value, readOnly, onChange }) => (
    <div className="flex flex-col gap-2.5">
        <label className="text-[15px] font-semibold text-gray-700 ml-1">{label}</label>
        <FormInput
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            disabled={readOnly}
            className="rounded-xl border-gray-200 focus:ring-4 focus:ring-primary/5 transition-all"
        />
    </div>
);

const ToggleItem = ({ title, description, defaultChecked }) => (
    <div className="flex items-center justify-between p-4 rounded-[15px] border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all duration-300 group">
        <div className="flex flex-col pr-4">
            <h4 className="text-[16px] font-semibold text-gray-800 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-[13px] text-gray-400 font-semibold mt-1 leading-relaxed lowercase first-letter:uppercase">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer overflow-visible shrink-0 scale-110">
            <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
            <div className="w-12 h-7 bg-gray-200/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-200 after:border-0 after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-lg peer-checked:bg-primary transition-all shadow-inner"></div>
        </label>
    </div>
);

export default Settings;
