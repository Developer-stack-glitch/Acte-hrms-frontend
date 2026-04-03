import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBranchesApi, getDesignationsApi, getShiftsApi, getDepartmentsApi } from '../../Action/api';

const FILTER_CATEGORIES = [
    { id: 'department', label: 'Department' },
    { id: 'designation', label: 'Designation' },
    { id: 'shift', label: 'Shift' },
    { id: 'gender', label: 'Gender' },
    { id: 'employment_type', label: 'Employment Type' },
    { id: 'branch', label: 'Branch' }
];

const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Intern', 'Probation', 'Notice Period'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function UserFilter({ isOpen, onClose, onApply, currentFilters }) {
    const [activeCategory, setActiveCategory] = useState('department');
    const [tempFilters, setTempFilters] = useState(currentFilters || {});
    const [options, setOptions] = useState({
        department: [],
        designation: [],
        shift: [],
        gender: GENDER_OPTIONS,
        employment_type: EMPLOYMENT_TYPES,
        branch: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            setTempFilters(currentFilters || {});
        }
    }, [isOpen, currentFilters]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const [departments, designations, branches, shifts] = await Promise.all([
                getDepartmentsApi(),
                getDesignationsApi(),
                getBranchesApi(),
                getShiftsApi()
            ]);

            setOptions(prev => ({
                ...prev,
                department: departments.data,
                designation: designations.data,
                branch: branches.data,
                shift: shifts.data.map(item => ({ id: item.id, name: `${item.name} (${item.start_time} - ${item.end_time})` }))
            }));
        } catch (error) {
            console.error('Error fetching filter options:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (category, value) => {
        setTempFilters(prev => {
            const currentValues = prev[category] || [];
            if (currentValues.includes(value)) {
                return { ...prev, [category]: currentValues.filter(v => v !== value) };
            } else {
                return { ...prev, [category]: [...currentValues, value] };
            }
        });
    };

    const deselectAll = (category) => {
        setTempFilters(prev => ({ ...prev, [category]: [] }));
    };

    const handleReset = () => {
        setTempFilters({});
    };

    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end mb-0">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/30"
                />

                {/* Drawer */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">Filter Users</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50">
                            <div className="flex flex-col">
                                {FILTER_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-4 py-4 text-left text-[14px] font-semibold transition-all relative ${activeCategory === cat.id
                                            ? 'bg-white text-primary'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {cat.label}
                                        {tempFilters[cat.id]?.length > 0 && (
                                            <span className="ml-3 w-2 h-2 rounded-full bg-primary inline-block" />
                                        )}
                                        {activeCategory === cat.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[15px] font-semibold text-gray-800">
                                    {FILTER_CATEGORIES.find(c => c.id === activeCategory)?.label}
                                </h3>
                                <button
                                    onClick={() => deselectAll(activeCategory)}
                                    className="text-[12px] font-semibold text-primary hover:underline"
                                >
                                    Deselect All
                                </button>
                            </div>

                            <div className="space-y-2">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    options[activeCategory]?.map((optionObj) => {
                                        const isSimple = typeof optionObj === 'string';
                                        const optionId = isSimple ? optionObj : optionObj.id;
                                        const optionName = isSimple ? optionObj : optionObj.name;
                                        const isChecked = tempFilters[activeCategory]?.includes(optionId);
                                        return (
                                            <button
                                                key={optionId}
                                                onClick={() => toggleFilter(activeCategory, optionId)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isChecked
                                                    ? 'bg-[#f0f7ff] text-primary shadow-sm'
                                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className={`text-[14px] font-medium ${isChecked ? 'text-primary' : 'text-gray-500'}`}>
                                                    {optionName}
                                                </span>
                                                {isChecked && (
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <Check size={18} className="text-primary" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                                {!loading && options[activeCategory]?.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 font-medium font-bold text-[14px]">
                                        No options available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between gap-8">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 text-gray-500 font-bold text-[14px] hover:text-gray-700 transition-colors"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 bg-primary text-white py-2.5 rounded-full font-semibold text-[14px] shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                        >
                            Apply
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
