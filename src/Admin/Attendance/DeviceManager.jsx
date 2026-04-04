import React, { useState, useEffect } from 'react';
import { Tablet, Plus, Edit2, Trash2, Save, X, Loader2, MapPin, Hash, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevicesApi, createDeviceApi, updateDeviceApi, deleteDeviceApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { FormInput } from '../../Common/Form';
import DataTable from '../../Common/DataTable';

export default function DeviceManager() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = userInfo.role === 'admin' || userInfo.role === 'superadmin';

    const [formData, setFormData] = useState({
        name: '',
        serial_number: '',
        location: ''
    });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            setFetching(true);
            const res = await getDevicesApi();
            setDevices(res.data);
        } catch (error) {
            toast.error('Failed to fetch devices');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.serial_number) {
            return toast.error('Name and Serial Number are required');
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateDeviceApi(editingId, formData);
                toast.success('Device updated successfully');
            } else {
                await createDeviceApi(formData);
                toast.success('Device added successfully');
            }
            fetchDevices();
            handleCloseForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save device');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (device) => {
        setFormData({
            name: device.name,
            serial_number: device.serial_number,
            location: device.location || ''
        });
        setEditingId(device.id);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        try {
            setLoading(true);
            await deleteDeviceApi(deletingId);
            toast.success('Device deleted successfully');
            fetchDevices();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete device');
        } finally {
            setLoading(false);
            setDeletingId(null);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ name: '', serial_number: '', location: '' });
    };

    const columns = [
        {
            header: 'Device Info',
            key: 'name',
            render: (val, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Tablet size={20} />
                    </div>
                    <div className="font-semibold text-gray-900 text-[15px]">{val}</div>
                </div>
            )
        },
        {
            header: 'Serial Number',
            key: 'serial_number',
            render: (val) => (
                <span className="text-sm font-black text-gray-500 font-mono tracking-wider">
                    {val}
                </span>
            )
        },
        {
            header: 'Location',
            key: 'location',
            render: (val) => (
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {val || 'Not Specified'}
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            align: 'center',
            render: () => (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-1.5 w-max mx-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Connected
                </span>
            )
        }
    ];


    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Tablet size={24} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Biometric Devices</h2>
                    </div>
                    <p className="text-gray-500 text-sm font-medium ml-1">
                        Manage and monitor registered biometric attendance devices.
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium bg-primary text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 hover:bg-primary-hover"
                    >
                        <Plus size={18} /> Add New Device
                    </button>
                )}
            </div>

            {/* Form Modal/Section */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-gray-200 rounded-[15px] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Edit2 size={20} />
                                </div>
                                <h3 className="font-semibold text-gray-900 text-xl">{editingId ? 'Edit Device Details' : 'Register New Biometric Device'}</h3>
                            </div>
                            <button onClick={handleCloseForm} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                        <Tablet size={14} className="text-primary" /> Device Name
                                    </label>
                                    <FormInput
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Main Office Device"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                        <Hash size={14} className="text-primary" /> Serial Number
                                    </label>
                                    <FormInput
                                        type="text"
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleChange}
                                        placeholder="e.g. CGKK231063361"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                        <MapPin size={14} className="text-primary" /> Location
                                    </label>
                                    <FormInput
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Reception Desk"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="px-6 py-2.5 rounded-full font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 rounded-full font-medium bg-primary text-white shadow-lg shadow-primary/10 transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {editingId ? 'Update Device' : 'Save Device'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Device List */}
            <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-xl shadow-gray-200/40 min-h-[400px]">
                <DataTable
                    columns={columns}
                    data={devices}
                    isLoading={fetching}
                    onEdit={isAdmin ? handleEdit : null}
                    onDelete={isAdmin ? (row) => handleDeleteClick(row.id) : null}
                    emptyMessage="No biometric devices found"
                    rowClassName="h-16"
                />
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Device"
                message="Are you sure you want to remove this biometric device? It will no longer be used for attendance syncing."
                confirmText="Yes, delete it"
                isLoading={loading}
            />
        </div>
    );
}
