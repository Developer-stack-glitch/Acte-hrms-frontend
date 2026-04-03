import React, { useState, useEffect } from 'react';
import { Tablet, Plus, Edit2, Trash2, Save, X, Loader2, MapPin, Hash, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevicesApi, createDeviceApi, updateDeviceApi, deleteDeviceApi } from '../../Action/api';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../Common/ConfirmationModal';
import { FormInput } from '../../Common/Form';

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
            <div className="bg-white border border-gray-200 rounded-[15px] overflow-hidden shadow-xl shadow-gray-200/40">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[15px] font-semibold text-gray-700">Device Info</th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-gray-700">Serial Number</th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-gray-700">Location</th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-gray-700 text-center">Status</th>
                                {isAdmin && <th className="px-6 py-4 text-[15px] font-semibold text-gray-700 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/80">
                            {fetching ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={40} className="animate-spin text-primary opacity-20" />
                                            <span className="text-gray-400 font-semibold tracking-tight">Loading devices...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : devices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                <Tablet size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">No devices registered</h3>
                                                <p className="text-gray-500 text-sm">Add a biometric device to start fetching attendance.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device) => (
                                    <tr key={device.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Tablet size={20} />
                                                </div>
                                                <div className="font-semibold text-gray-900 text-[15px]">{device.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-gray-500 font-mono tracking-wider">
                                            {device.serial_number}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                                <MapPin size={14} className="text-gray-400" />
                                                {device.location || 'Not Specified'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-1.5 w-max mx-auto">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Connected
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(device)}
                                                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary hover:border-primary/20 hover:shadow-md transition-all active:scale-90"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(device.id)}
                                                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-md transition-all active:scale-90"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-gray-50">
                    {devices.map((device) => (
                        <div key={device.id} className="p-4 space-y-4 active:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                        <Tablet size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-lg">{device.name}</h4>
                                        <span className="text-[10px] font-black text-gray-400 uppercase font-mono">{device.serial_number}</span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <MapPin size={14} />
                                {device.location || 'N/A'}
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(device)}
                                        className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all font-primary"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(device.id)}
                                        className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold flex items-center justify-center hover:bg-rose-100 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
