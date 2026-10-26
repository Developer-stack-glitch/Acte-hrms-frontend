import React, { useState, useEffect } from 'react';
import {
    Search,
    Printer,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Globe,
    RefreshCw,
    Download,
    Plus,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsersApi, getCompaniesApi, updateUserApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ListSkeleton from '../../Common/CommonSkeletonLoader/ListSkeleton';

export default function EmployeeIdCard({ initialUser, onBack }) {
    const [selectedUser, setSelectedUser] = useState(initialUser);
    const [company, setCompany] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [backLogoError, setBackLogoError] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

    // Normalize image URLs whether starting with uploads/, /api/, or full URL
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
            return path;
        }
        const cleanPath = String(path).replace(/\\/g, '/').replace(/^\/+/, '');
        if (cleanPath.startsWith('api/')) {
            return `${API_URL}/${cleanPath}`;
        }
        return `${API_URL}/api/${cleanPath}`;
    };

    useEffect(() => {
        if (!initialUser) {
            fetchUsers();
        } else {
            setSelectedUser(initialUser);
        }
        fetchCompany();
    }, [initialUser]);

    useEffect(() => {
        setPhotoError(false);
    }, [selectedUser?.id]);

    const fetchCompany = async () => {
        try {
            const response = await getCompaniesApi();
            if (response.data && response.data.length > 0) {
                setCompany(response.data[0]); // Use first company
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await getUsersApi({ limit: 1000 });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        toast.success('Downloading ID Card...');
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUser) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        try {
            setUploadingPhoto(true);
            const localPreview = URL.createObjectURL(file);
            setPhotoError(false);

            // Instant UI feedback
            setSelectedUser(prev => ({
                ...prev,
                document_photo: localPreview
            }));

            const formData = new FormData();
            formData.append('photo', file);

            const res = await updateUserApi(selectedUser.id, formData);
            const savedPath = res.data?.user?.document_photo || res.data?.document_photo || localPreview;

            setSelectedUser(prev => ({
                ...prev,
                document_photo: savedPath
            }));

            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, document_photo: savedPath } : u));
            toast.success('Profile photo updated successfully');
        } catch (err) {
            console.error('Failed to upload photo:', err);
            toast.error('Failed to save photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.employee_name || u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.emp_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col w-full bg-[#f8fafc]">
            {/* Header / Toolbar */}
            <div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0 no-print">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={20} className="text-gray-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Employee ID Card</h1>
                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">Generate and print professional employee identity cards</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 no-print">
                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full font-semibold text-[13px] text-gray-700 hover:bg-gray-50 transition-all bg-white cursor-pointer shadow-xs active:scale-95"
                    >
                        <RefreshCw size={15} className={isFlipped ? 'rotate-180 transition-transform duration-300' : 'transition-transform duration-300'} />
                        Flip Card
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full font-semibold text-[13px] text-gray-700 hover:bg-gray-50 transition-all bg-white cursor-pointer shadow-xs active:scale-95"
                    >
                        <Download size={15} />
                        Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-full font-semibold text-[13px] hover:bg-primary-hover transition-all cursor-pointer shadow-md shadow-primary/20 active:scale-95"
                    >
                        <Printer size={15} />
                        Print Card
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-6 relative">
                {/* Left Sidebar: Search & List */}
                {!initialUser && (
                    <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col no-print">
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm text-gray-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-3 space-y-1.5 max-h-[calc(100vh-220px)] min-h-[460px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <ListSkeleton count={8} />
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                                    <Search size={32} className="opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">No users found</span>
                                </div>
                            ) : (
                                filteredUsers.map(user => {
                                    const userThumb = user.document_photo || user.profile_photo || user.photo;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setSearchQuery('');
                                            }}
                                            className={`w-full flex items-center gap-4 px-4 py-2.5 mb-1.5 rounded-xl transition-all cursor-pointer group ${selectedUser?.id === user.id
                                                ? 'bg-primary/5 border border-primary/10 shadow-sm'
                                                : 'hover:bg-gray-50 border border-transparent'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0 transition-transform group-hover:scale-110 overflow-hidden ${selectedUser?.id === user.id
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                                {userThumb ? (
                                                    <img
                                                        src={getImageUrl(userThumb)}
                                                        className="w-full h-full object-cover rounded-xl"
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    (user.employee_name || user.name || 'U').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <div className={`text-[15px] font-semibold leading-tight transition-colors ${selectedUser?.id === user.id ? 'text-primary' : 'text-gray-800'}`}>
                                                    {user.employee_name || user.name}
                                                </div>
                                                <div className="text-[11px] text-gray-600 font-medium uppercase tracking-widest mt-1 truncate">
                                                    {user.emp_id} • {user.designation_name || 'Staff'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Right Sticky Card Preview Area */}
                <div className="flex-1 w-full lg:sticky lg:top-4 self-start flex flex-col items-center justify-start pt-1">
                    {!selectedUser ? (
                        <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm w-full p-8">
                            <div className="p-8 bg-gray-50 rounded-[20px] border border-gray-200 mb-6 relative group shadow-xs">
                                <Search size={64} className="text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse border-4 border-white" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 tracking-tight">Select an Employee</h3>
                            <p className="text-gray-500 font-medium mt-2 max-w-[280px]">Choose an employee from the left panel to preview and print their professional ID card.</p>
                        </div>
                    ) : (
                        <div className="relative flex flex-col items-center justify-center scale-90 sm:scale-95 2xl:scale-100 origin-top transition-transform">
                            <div className="relative perspective-1000 w-[350px] h-[500px]">
                                <motion.div
                                    className="relative w-full h-full preserve-3d cursor-pointer"
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    {/* FRONT SIDE */}
                                    <div className="absolute inset-0 backface-hidden flex flex-col bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden select-none">
                                        {/* Accents */}
                                        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-blue-500/0 rounded-br-[100px]" />
                                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-green-400/20 to-blue-500/0 rounded-tl-[100px]" />

                                        <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-green-400 rounded-tl-2xl opacity-50" />
                                        <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-green-500 rounded-br-2xl opacity-50" />

                                        {/* Logo */}
                                        <div className="mt-6 px-8 flex justify-center">
                                            <div className="flex items-center gap-2">
                                                {company?.logo && !logoError ? (
                                                    <img
                                                        src={getImageUrl(company.logo)}
                                                        alt={company?.name || "Company Logo"}
                                                        onError={() => setLogoError(true)}
                                                        className="h-9 w-auto object-contain max-w-[200px]"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                            {(company?.name || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-sm tracking-tight truncate max-w-[180px]">
                                                            {company?.name || 'Company'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Photo */}
                                        <div className="mt-5 flex justify-center">
                                            <div className="relative group/photo p-1 rounded-[32px] bg-gradient-to-tr from-green-400 via-blue-400 to-blue-600 shadow-xl">
                                                <div className="w-38 h-42 rounded-[28px] bg-gray-50 overflow-hidden flex items-center justify-center border-4 border-white relative">
                                                    {(selectedUser.document_photo || selectedUser.photo || selectedUser.profile_photo) && !photoError ? (
                                                        <img
                                                            src={getImageUrl(selectedUser.document_photo || selectedUser.photo || selectedUser.profile_photo)}
                                                            alt={selectedUser.employee_name || selectedUser.name}
                                                            onError={() => setPhotoError(true)}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-blue-50/60 to-indigo-50/60 text-primary">
                                                            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-primary/10 flex items-center justify-center text-3xl font-black text-primary">
                                                                {(selectedUser.employee_name || selectedUser.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                                                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Hover Camera Overlay to change/upload photo */}
                                                    <label
                                                        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white no-print"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Click to upload profile photo"
                                                    >
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handlePhotoUpload}
                                                            disabled={uploadingPhoto}
                                                        />
                                                        {uploadingPhoto ? (
                                                            <RefreshCw size={22} className="animate-spin text-white mb-1" />
                                                        ) : (
                                                            <Camera size={22} className="text-white mb-1" />
                                                        )}
                                                        <span className="text-[11px] font-semibold tracking-wide">
                                                            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="mt-4 px-6 text-center">
                                            <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-tight leading-tight">
                                                {selectedUser.employee_name || selectedUser.name}
                                            </h2>
                                            <div className="mt-1.5 text-primary font-bold text-[13px] uppercase tracking-[0.2em]">
                                                {selectedUser.designation_name || 'Staff'}
                                            </div>
                                            <div className="mt-1 w-20 h-1 bg-primary/20 mx-auto rounded-full" />
                                        </div>

                                        <div className="mt-4 mb-6 text-center text-lg font-black text-gray-800 tracking-wider">
                                            <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Employee ID</div>
                                            ID NO : {selectedUser.emp_id || 'MARKERZ-01'}
                                        </div>
                                    </div>

                                    {/* BACK SIDE */}
                                    <div className="absolute inset-0 backface-hidden rotateY-180 flex flex-col bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden select-none">
                                        {/* Header with Logos */}
                                        <div className="pt-5 px-6 flex justify-between items-center">
                                            <div className="w-7 h-16 bg-blue-600 rounded-sm" />
                                            <div className="flex items-center gap-2">
                                                {company?.logo && !backLogoError ? (
                                                    <img
                                                        src={getImageUrl(company.logo)}
                                                        alt="Logo"
                                                        onError={() => setBackLogoError(true)}
                                                        className="h-8 w-auto object-contain max-w-[160px]"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {(company?.name || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-xs tracking-tight">
                                                            {company?.name || 'Company'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-7 h-16 bg-blue-600 rounded-sm" />
                                        </div>

                                        <div className="mt-4 border-y border-blue-100 py-1.5 px-8 text-center">
                                            <div className="text-base font-bold text-gray-800">
                                                Blood Group : <span className="text-red-500 font-extrabold">{selectedUser.blood_group || 'O+ve'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3.5 bg-green-500 py-2.5 px-6 text-center text-white font-medium text-base shadow-inner">
                                            Employee Contact : {selectedUser.per_contact_no || '9876543210'}
                                        </div>

                                        {/* Company Info */}
                                        <div className="mt-5 px-5 space-y-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="text-gray-600 shrink-0">
                                                    <MapPin size={22} className="text-black font-medium mt-0.5" />
                                                </div>
                                                <div className="text-[13px] font-medium text-gray-800 leading-snug">
                                                    {company?.address || 'Company Address'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3.5">
                                                <div className="text-gray-600 shrink-0">
                                                    <Mail size={22} className="text-black font-medium" />
                                                </div>
                                                <div className="text-[14px] font-medium text-gray-800 truncate">
                                                    {company?.email || 'email@company.com'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3.5">
                                                <div className="text-gray-600 shrink-0">
                                                    <Globe size={22} className="text-black font-medium" />
                                                </div>
                                                <div className="text-[14px] font-medium text-gray-800 truncate">
                                                    {company?.website || 'www.company.com'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto mb-5 px-5">
                                            <div className="bg-blue-600 text-white rounded-xl p-3.5 shadow-lg overflow-hidden relative group text-center">
                                                <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-[-20deg] translate-x-16" />
                                                <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-100/90 mb-0.5">If Found Please Inform</div>
                                                <div className="text-lg font-bold">{company?.phone || 'Phone Number'}</div>
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-400" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Print & 3D CSS Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .perspective-1000 { perspective: none !important; }
                    .preserve-3d { transform-style: flat !important; }
                    .backface-hidden { backface-visibility: visible !important; }
                    .rotateY-180 { transform: none !important; position: relative !important; top: 0; left: 0; }
                    
                    @page {
                        size: auto;
                        margin: 0;
                    }

                    .flex-1 { overflow: visible !important; height: auto !important; }
                    .backface-hidden { position: relative !important; display: block !important; margin-bottom: 20px; box-shadow: none !important; border: 1px solid #eee !important; page-break-inside: avoid; }
                }

                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .rotateY-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
}
