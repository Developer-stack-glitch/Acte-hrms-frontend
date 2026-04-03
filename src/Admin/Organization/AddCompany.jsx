import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, MapPin, Hash, Plus, Loader2, Upload, X } from 'lucide-react';
import { updateCompanyApi, createCompanyApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormTextarea } from '../../Common/Form';

export default function AddCompany({ onSuccess, company }) {
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

    const [formData, setFormData] = useState({
        name: '',
        registration_number: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        logo: null
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                registration_number: company.registration_number || '',
                email: company.email || '',
                phone: company.phone || '',
                address: company.address || '',
                website: company.website || '',
                logo: null // Don't try to send existing file back as File object
            });
            if (company.logo) {
                setLogoPreview(`${API_URL}/${company.logo}`);
            }
        }
    }, [company, API_URL]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            setFormData({ ...formData, [name]: file });
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setLogoPreview(reader.result);
                reader.readAsDataURL(file);
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const removeLogo = () => {
        setFormData({ ...formData, logo: null });
        setLogoPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            if (company) {
                await updateCompanyApi(company.id, data);
                toast.success('Company updated successfully!');
            } else {
                await createCompanyApi(data);
                toast.success('Company added successfully!');
            }

            if (!company) {
                setFormData({
                    name: '',
                    registration_number: '',
                    email: '',
                    phone: '',
                    address: '',
                    website: '',
                    logo: null
                });
                setLogoPreview(null);
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${company ? 'update' : 'add'} company`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 mx-auto bg-white rounded-[8px]">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mt-4 text-gray-800">{company ? 'Edit Company' : 'Add New Company'}</h2>
                <p className="text-gray-500 text-[16px] mt-1">{company ? 'Update company registration and contact details.' : 'Register a new company entity in the system.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Logo Upload Section */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload size={16} className="text-primary" />
                            Company Logo
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                name="logo"
                                id="logo-upload"
                                accept="image/*"
                                onChange={handleChange}
                                className="hidden"
                            />
                            {!logoPreview ? (
                                <label
                                    htmlFor="logo-upload"
                                    className="flex flex-col items-center justify-center w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group"
                                >
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                                        <Upload size={32} />
                                    </div>
                                    <span className="mt-3 text-[13px] font-bold text-gray-500">Upload Logo</span>
                                    <span className="text-[11px] text-gray-400 mt-1 font-medium italic">PNG, JPG (Max 2MB)</span>
                                </label>
                            ) : (
                                <div className="relative w-full aspect-square bg-white border border-gray-100 rounded-3xl shadow-xl p-4 flex items-center justify-center">
                                    <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain rounded-xl" />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Fields Section */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Company Name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Acme Corp"
                            icon={Building2}
                            className="md:col-span-2"
                        />

                        <FormInput
                            label="Registration Number"
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleChange}
                            placeholder="REG123456"
                            icon={Hash}
                        />

                        <FormInput
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="contact@acme.com"
                            icon={Mail}
                        />

                        <FormInput
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            icon={Phone}
                        />

                        <FormInput
                            label="Website URL"
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://www.acme.com"
                            icon={Globe}
                        />

                        <FormTextarea
                            label="Office Address"
                            name="address"
                            rows="3"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter full company address..."
                            icon={MapPin}
                            className="md:col-span-2"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Plus size={20} className={company ? 'rotate-45' : ''} />
                        )}
                        {loading ? (company ? 'Updating...' : 'Adding...') : (company ? 'Update Company' : 'Save Company Details')}
                    </button>
                </div>
            </form>
        </div>
    );
}
