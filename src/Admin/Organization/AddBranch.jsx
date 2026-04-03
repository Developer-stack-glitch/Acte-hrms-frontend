import React, { useState, useEffect } from 'react';
import { GitBranch, MapPin, Phone, Hash, Plus, Loader2 } from 'lucide-react';
import { createBranchApi, getBranchesApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormTextarea } from '../../Common/Form';
import DataTable from '../../Common/DataTable';

export default function AddBranch({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        branch_code: '',
        address: '',
        phone: ''
    });

    const fetchBranches = async () => {
        try {
            setListLoading(true);
            const res = await getBranchesApi();
            setBranches(res.data);
        } catch (error) {
            console.error('Failed to fetch branches:', error);
            toast.error('Failed to load branches');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createBranchApi(formData);
            toast.success('Branch added successfully!');
            setFormData({
                name: '',
                branch_code: '',
                address: '',
                phone: ''
            });
            fetchBranches();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add branch');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Branch Name', key: 'name' },
        { header: 'Branch Code', key: 'branch_code' },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address' },
    ];

    return (
        <div className="space-y-6">
            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-5">
                    <h2 className="text-2xl font-semibold text-gray-800">Add New Branch</h2>
                    <p className="text-gray-500 text-sm mt-1">Add a new physical location for a company.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Branch Name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. North Region Office"
                            icon={GitBranch}
                        />

                        <FormInput
                            label="Branch Code"
                            name="branch_code"
                            value={formData.branch_code}
                            onChange={handleChange}
                            placeholder="e.g. BR-001"
                            icon={Hash}
                        />

                        <FormInput
                            label="Branch Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            icon={Phone}
                            className="md:col-span-2"
                        />

                        <FormTextarea
                            label="Branch Address"
                            name="address"
                            rows="3"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter full branch address..."
                            icon={MapPin}
                            className="md:col-span-2"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary/10 text-[14px]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Plus size={18} />
                            )}
                            {loading ? 'Adding...' : 'Add Branch'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800">Branch List</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage existing physical locations.</p>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={branches}
                        isLoading={listLoading}
                        pagination={{
                            current: 1,
                            pageSize: 10,
                            total: branches.length,
                            onChange: () => { }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}