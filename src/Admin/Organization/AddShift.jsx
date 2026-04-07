import React, { useState, useEffect } from 'react';
import { Clock, Plus, Loader2 } from 'lucide-react';
import { createShiftApi, getShiftsApi } from '../../Action/api';
import toast from 'react-hot-toast';
import { FormInput, FormTime } from '../../Common/Form';
import DataTable from '../../Common/DataTable';

export default function AddShift({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [shifts, setShifts] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        start_time: '',
        end_time: ''
    });

    const calculateDuration = (start, end) => {
        if (!start || !end) return null;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h} hrs ${m} mins`;
    };

    const fetchShifts = async () => {
        try {
            setListLoading(true);
            const res = await getShiftsApi();
            setShifts(res.data);
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
            toast.error('Failed to load shifts');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const duration = calculateDuration(formData.start_time, formData.end_time);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createShiftApi(formData);
            toast.success('Shift added successfully!');
            setFormData({
                name: '',
                start_time: '',
                end_time: ''
            });
            fetchShifts();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add shift');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Shift Name', key: 'name' },
        { header: 'Start Time', key: 'start_time' },
        { header: 'End Time', key: 'end_time' },
        {
            header: 'Duration',
            key: 'duration',
            render: (val, row) => <span>{calculateDuration(row.start_time, row.end_time)}</span>
        },
    ];

    return (
        <div className="space-y-6">
            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">Add New Shift</h2>
                    <p className="text-gray-500 text-[15px] mt-1">Configure work timings and shift schedules.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Shift Name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Morning Shift"
                            icon={Clock}
                            className="md:col-span-2"
                        />

                        <FormTime
                            label="Start Time"
                            name="start_time"
                            required
                            value={formData.start_time}
                            onChange={handleChange}
                        />

                        <FormTime
                            label="End Time"
                            name="end_time"
                            required
                            value={formData.end_time}
                            onChange={handleChange}
                        />
                    </div>
                    {duration && (
                        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                            <Clock size={16} className="text-primary" />
                            <span className="text-sm font-bold text-primary">Shift Duration: {duration}</span>
                            {duration === '9 hrs 30 mins' && (
                                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto">Correct Timing</span>
                            )}
                        </div>
                    )}

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
                            {loading ? 'Adding...' : 'Add Shift'}
                        </button>
                    </div>
                </form >
            </div >

            <div className="p-6 mx-auto bg-white rounded-[8px] shadow-sm">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800">Shift List</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage work shift schedules.</p>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={shifts}
                        isLoading={listLoading}
                        pagination={{
                            current: 1,
                            pageSize: 10,
                            total: shifts.length,
                            onChange: () => { }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
