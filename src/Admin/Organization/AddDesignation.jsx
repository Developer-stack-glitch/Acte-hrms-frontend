import React, { useState, useEffect } from 'react';
import { Briefcase, AlignLeft, Plus, Loader2, Building2, Layout } from 'lucide-react';
import { createDesignationApi, getCompaniesApi, getDepartmentsApi, getDesignationsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormSelect, FormTextarea } from '../../Common/Form';
import FormSkeleton from '../../Common/CommonSkeletonLoader/FormSkeleton';
import DataTable from '../../Common/DataTable';

export default function AddDesignation({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [formData, setFormData] = useState({
        department_id: '',
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setDataLoading(true);
            const [depRes, desigRes] = await Promise.all([
                getDepartmentsApi(),
                getDesignationsApi()
            ]);
            setDepartments(depRes.data);
            setDesignations(desigRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setDataLoading(false);
            setListLoading(false);
        }
    };

    const fetchDesignations = async () => {
        try {
            setListLoading(true);
            const res = await getDesignationsApi();
            setDesignations(res.data);
        } catch (error) {
            console.error('Failed to fetch designations:', error);
        } finally {
            setListLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.department_id) {
            toast.error('Please select a department');
            return;
        }

        setLoading(true);
        try {
            await createDesignationApi(formData);
            toast.success('Designation added successfully!');
            setFormData({
                department_id: '',
                name: '',
                description: ''
            });
            fetchDesignations();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add designation');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Designation Name', key: 'name' },
        {
            header: 'Department',
            key: 'department_name',
            render: (val, row) => <span>{row.department_name || departments.find(d => d.id === row.department_id)?.name || 'N/A'}</span>
        },
        { header: 'Description', key: 'description' },
    ];

    if (dataLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Add New Designation</h2>
                    <p className="text-gray-500 text-[15px] mt-1">Define new job roles and titles for your organization.</p>
                </div>

                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-4">
                    <div className="mt-0.5">
                        <Layout size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-orange-900">Department Association</h4>
                        <p className="text-[13px] text-orange-700 mt-0.5 leading-relaxed">
                            Designations must be linked to a specific department. If you don't see the desired department, please create it first in the <span className="font-bold underline cursor-pointer">Add Department</span> tab.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormSelect
                            label="Select Department"
                            name="department_id"
                            required
                            value={formData.department_id}
                            onChange={handleChange}
                            options={departments.map(dep => ({
                                value: dep.id,
                                label: `${dep.name} ${dep.company_name ? `(${dep.company_name})` : ''}`
                            }))}
                            placeholder="Select a department"
                            icon={Layout}
                            className="md:col-span-2"
                        />

                        <FormInput
                            label="Designation Name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Senior Software Engineer"
                            icon={Briefcase}
                            className="md:col-span-2"
                        />

                        <FormTextarea
                            label="Description"
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Briefly describe the responsibilities of this role..."
                            icon={AlignLeft}
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
                            {loading ? 'Adding...' : 'Add Designation'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Designation List</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage existing job roles.</p>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={designations}
                        isLoading={listLoading}
                        pagination={{
                            current: 1,
                            pageSize: 10,
                            total: designations.length,
                            onChange: () => { }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
