import React, { useState, useEffect } from 'react';
import { Layout, AlignLeft, Plus, Loader2 } from 'lucide-react';
import { createDepartmentApi, getDepartmentsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormTextarea } from '../../Common/Form';
import DataTable from '../../Common/DataTable';

export default function AddDepartment({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const fetchDepartments = async () => {
        try {
            setListLoading(true);
            const res = await getDepartmentsApi();
            setDepartments(res.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createDepartmentApi(formData);
            toast.success('Department added successfully!');
            setFormData({
                name: '',
                description: ''
            });
            fetchDepartments();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add department');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Department Name', key: 'name' },
        { header: 'Description', key: 'description' },
    ];

    return (
        <div className="space-y-6">
            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-5">
                    <h2 className="text-2xl font-semibold text-gray-800">Add New Department</h2>
                    <p className="text-gray-500 text-[16px] mt-1">Create a new functional department within a company.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <FormInput
                            label="Department Name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Human Resources"
                            icon={Layout}
                        />

                        <FormTextarea
                            label="Description"
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Briefly describe the department's function..."
                            icon={AlignLeft}
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
                            {loading ? 'Adding...' : 'Add Department'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800">Department List</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage existing departments.</p>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={departments}
                        isLoading={listLoading}
                        pagination={{
                            current: 1,
                            pageSize: 10,
                            total: departments.length,
                            onChange: () => { }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
