import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Loader2, Search, Globe, Mail, Phone, MapPin, Trash2, ArrowLeft } from 'lucide-react';
import { getCompaniesApi, deleteCompanyApi } from '../../Action/api';
import AddCompany from './AddCompany';
import toast, { ErrorIcon } from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';
import CardGridSkeleton from '../../Common/CommonSkeletonLoader/CardGridSkeleton';

export default function CompanyManagement() {
    const [view, setView] = useState('list');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

    useEffect(() => {
        if (view === 'list') {
            fetchCompanies();
        }
    }, [view]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await getCompaniesApi();
            setCompanies(res.data);
        } catch (error) {
            toast.error('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (company) => {
        setSelectedCompany(company);
        setView('edit');
    };

    const handleDeleteClick = (company) => {
        setCompanyToDelete(company);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!companyToDelete) return;

        try {
            setIsDeleting(true);
            await deleteCompanyApi(companyToDelete.id);
            toast.success('Company deleted successfully');
            fetchCompanies();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error(error.response?.data?.message || 'Failed to delete company');
        } finally {
            setIsDeleting(false);
            setCompanyToDelete(null);
        }
    };

    const handleAdd = () => {
        setSelectedCompany(null);
        setView('add');
    };

    const handleBack = () => {
        setView('list');
        setSelectedCompany(null);
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (view === 'add' || view === 'edit') {
        return (
            <div className="relative">
                <button
                    onClick={handleBack}
                    className="absolute top-4 left-7 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors z-10"
                >
                    <ArrowLeft size={16} />
                    Back to List
                </button>
                <AddCompany
                    company={selectedCompany}
                    onSuccess={handleBack}
                />
            </div>
        );
    }

    return (
        <div className="p-6 mx-auto bg-white rounded-[8px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Company Management</h2>
                    <p className="text-gray-500 text-[16px] mt-1">View and manage all registered companies</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                >
                    <Plus size={20} />
                    Add New Company
                </button>
            </div>

            <div className="mb-6 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search by company name or email..."
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <CardGridSkeleton count={3} />
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <ErrorIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800">No companies found</h3>
                    <p className="text-gray-500 font-medium">Register your first company to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            className="bg-white border border-gray-200 rounded-[15px] p-6 hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center overflow-hidden">
                                    {company.logo ? (
                                        <img src={`${API_URL}/${company.logo}`} alt={company.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="text-gray-300" size={32} />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(company)}
                                        className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                                        title="Edit Company"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {company.is_deletable !== 0 && (
                                        <button
                                            onClick={() => handleDeleteClick(company)}
                                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                                            title="Delete Company"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-2xl font-semibold text-gray-900 mb-4 line-clamp-1">{company.name}</h3>

                            <div className="space-y-3">
                                {company.email && (
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Mail size={16} />
                                        <span className="text-sm font-medium line-clamp-1">{company.email}</span>
                                    </div>
                                )}
                                {company.phone && (
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Phone size={16} />
                                        <span className="text-sm font-medium">{company.phone}</span>
                                    </div>
                                )}
                                {company.website && (
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Globe size={16} />
                                        <span className="text-sm font-medium line-clamp-1 underline decoration-primary/20">{company.website}</span>
                                    </div>
                                )}
                                <div className="flex items-start gap-3 text-gray-500 pt-2 border-t border-gray-50 mt-4">
                                    <MapPin size={16} className="mt-1 shrink-0" />
                                    <span className="text-[13px] font-medium leading-relaxed line-clamp-2">
                                        {company.address || 'No address provided'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Company"
                message={`Are you sure you want to delete ${companyToDelete?.name}? This will also delete its dedicated database if it exists. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
}
