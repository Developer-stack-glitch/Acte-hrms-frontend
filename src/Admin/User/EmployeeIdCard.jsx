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
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsersApi, getCompaniesApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ListSkeleton from '../../Common/CommonSkeletonLoader/ListSkeleton';

export default function EmployeeIdCard({ initialUser, onBack }) {
    const [selectedUser, setSelectedUser] = useState(initialUser);
    const [company, setCompany] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!initialUser) {
            fetchUsers();
        } else {
            setSelectedUser(initialUser);
        }
        fetchCompany();
    }, [initialUser]);

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

    const filteredUsers = users.filter(u =>
        (u.employee_name || u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.emp_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header / Toolbar */}
            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 no-print">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-500" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-semibold text-[#1e293b]">Employee ID Card</h1>
                        <p className="text-[13px] text-gray-500 font-medium mt-1">Generate and print professional employee identity cards</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 no-print">
                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full font-bold text-[13px] text-gray-600 hover:bg-gray-50 transition-all bg-white"
                    >
                        <RefreshCw size={16} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
                        Flip Card
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full font-bold text-[13px] text-gray-600 hover:bg-gray-50 transition-all bg-white"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium text-[13px] hover:bg-primary-hover transition-all"
                    >
                        <Printer size={16} />
                        Print Card
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-gray-50/30">
                {/* Left Sidebar: Search & List */}
                {!initialUser && (
                    <div className="w-[380px] border-r border-gray-200 bg-white flex flex-col no-print h-full">
                        <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search employee..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
                            {loading ? (
                                <ListSkeleton count={8} />
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                                    <Search size={32} className="opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">No users found</span>
                                </div>
                            ) : (
                                filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full flex items-center gap-4 px-4 py-2 mb-3 rounded-xl transition-all group ${selectedUser?.id === user.id
                                            ? 'bg-primary/5 border border-primary/10 shadow-sm'
                                            : 'hover:bg-gray-50 border border-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0 transition-transform group-hover:scale-110 ${selectedUser?.id === user.id
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            {user.document_photo ? (
                                                <img
                                                    src={`${API_URL}/${user.document_photo}`}
                                                    className="w-full h-full object-cover rounded-2xl"
                                                    alt=""
                                                />
                                            ) : (
                                                (user.employee_name || user.name || 'U').charAt(0)
                                            )}
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <div className={`text-[15px] font-black font-semibold leading-tight transition-colors ${selectedUser?.id === user.id ? 'text-primary' : 'text-gray-800'}`}>
                                                {user.employee_name || user.name}
                                            </div>
                                            <div className="text-[11px] text-gray-600 font-medium uppercase tracking-widest mt-1 truncate">
                                                {user.emp_id} • {user.designation_name || 'Staff'}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Right Content Area Card Preview */}
                <div className="flex-1 overflow-auto p-10 pt-2 flex flex-col items-center scroll-smooth min-h-[800px]">
                    {!selectedUser ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="p-8 bg-white rounded-[20px] border border-gray-200 mb-8 relative group">
                                <Search size={64} className="text-primary/20 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse border-4 border-white" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 tracking-tight">Select an Employee</h3>
                            <p className="text-gray-500 font-medium mt-2 max-w-[280px]">Choose an employee from the left panel to generate their professional ID card.</p>
                        </div>
                    ) : (
                        <div className="relative pt-4">
                            <div className="relative perspective-1000 w-[350px] h-[530px]">
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
                                        <div className="mt-8 px-8 flex justify-center">
                                            <div className="flex items-center gap-2">
                                                {company?.logo ? (
                                                    <img
                                                        src={`${API_URL}/${company.logo}`}
                                                        alt="Logo"
                                                        className="h-10 w-auto object-contain"
                                                    />
                                                ) : (
                                                    <div className="relative">
                                                        <svg width="40" height="40" viewBox="0 0 100 100" className="text-primary">
                                                            <path d="M20 80 L50 20 L80 80" fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" />
                                                            <path d="M40 80 L50 60 L60 80" fill="currentColor" />
                                                            <path d="M20 80 L35 50" fill="none" stroke="#4ade80" strokeWidth="12" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Photo */}
                                        <div className="mt-8 flex justify-center">
                                            <div className="relative p-1 rounded-[32px] bg-gradient-to-tr from-green-400 via-blue-400 to-blue-600 shadow-xl">
                                                <div className="w-40 h-46 rounded-[28px] bg-gray-100 overflow-hidden flex items-center justify-center border-4 border-white">
                                                    {selectedUser.document_photo ? (
                                                        <img
                                                            src={`${API_URL}/${selectedUser.document_photo}`}
                                                            alt="Employee"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                                            <div className="text-4xl font-bold">{(selectedUser.employee_name || selectedUser.name || 'U').charAt(0)}</div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">No Photo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="mt-6 px-6 text-center">
                                            <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-tight leading-tight">
                                                {selectedUser.employee_name || selectedUser.name}
                                            </h2>
                                            <div className="mt-2 text-primary font-bold text-[14px] uppercase tracking-[0.2em]">
                                                {selectedUser.designation_name || 'Staff'}
                                            </div>
                                            <div className="mt-1 w-24 h-1 bg-primary/20 mx-auto rounded-full" />
                                        </div>

                                        <div className="mt-5 mb-8 text-center text-xl font-black text-gray-800 tracking-wider">
                                            <div className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest mb-1">Employee ID</div>
                                            ID NO : {selectedUser.emp_id || 'MARKERZ-01'}
                                        </div>
                                    </div>

                                    {/* BACK SIDE */}
                                    <div className="absolute inset-0 backface-hidden rotateY-180 flex flex-col bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden select-none">
                                        {/* Header with Logos */}
                                        <div className="pt-6 px-6 flex justify-between items-center">
                                            <div className="w-8 h-18 bg-blue-600" />
                                            <div className="flex items-center gap-2">
                                                {company?.logo ? (
                                                    <img
                                                        src={`${API_URL}/${company.logo}`}
                                                        alt="Logo"
                                                        className="h-8 w-auto object-contain"
                                                    />
                                                ) : (
                                                    <svg width="30" height="30" viewBox="0 0 100 100" className="text-primary">
                                                        <path d="M20 80 L50 20 L80 80" fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" />
                                                        <path d="M40 80 L50 60 L60 80" fill="currentColor" />
                                                        <path d="M20 80 L35 50" fill="none" stroke="#4ade80" strokeWidth="12" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="w-8 h-18 bg-blue-600" />
                                        </div>

                                        <div className="mt-6 border-y-2 border-blue-50 py-2 px-8 text-center">
                                            <div className="text-lg font-black text-gray-800">
                                                Blood Group : <span className="text-red-500">{selectedUser.blood_group || 'O+ve'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 bg-green-500 py-3 px-6 text-center text-white font-medium text-lg shadow-inner">
                                            Employee Contact : {selectedUser.per_contact_no || '9876543210'}
                                        </div>

                                        {/* Company Info */}
                                        <div className="mt-8 px-4 space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="text-gray-600">
                                                    <MapPin size={26} className="text-black font-medium mt-1" />
                                                </div>
                                                <div className="text-[14px] font-medium text-gray-800 leading-relaxed pt-0.5">
                                                    {company?.address || 'Company Address'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-gray-600">
                                                    <Mail size={26} className="text-black font-medium" />
                                                </div>
                                                <div className="text-[15px] font-medium text-gray-800">
                                                    {company?.email || 'email@company.com'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-gray-600">
                                                    <Globe size={26} className="text-black font-medium" />
                                                </div>
                                                <div className="text-[15px] font-medium text-gray-800">
                                                    {company?.website || 'www.company.com'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-6 mb-6 px-6">
                                            <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg overflow-hidden relative group text-center">
                                                <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-[-20deg] translate-x-16" />
                                                <div className="text-[12px] font-semibold uppercase tracking-widest text-blue-100/80 mb-1">If Found Please Inform</div>
                                                <div className="text-xl font-black font-semibold">{company?.phone || 'Phone Number'}</div>
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

            {/* Print & Custom Styles */}
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

                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotateY-180 { transform: rotateY(180deg); }
                .preserve-3d { transform-style: preserve-3d; }
            `}</style>
        </div>
    );
}
