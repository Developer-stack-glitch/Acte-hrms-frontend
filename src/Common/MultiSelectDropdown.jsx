import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MultiSelectDropdown = ({ label, items, selectedItems, onChange, placeholder = "Search..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredItems = (items || []).filter(item =>
        (item?.label || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleItem = (id) => {
        const newSelected = selectedItems.includes(id)
            ? selectedItems.filter(itemId => itemId !== id)
            : [...selectedItems, id];
        onChange(newSelected);
    };

    const selectAll = () => {
        const validIds = (items || []).filter(item => item.type !== 'header').map(item => item.id);
        onChange(validIds);
    };

    const deselectAll = () => onChange([]);

    return (
        <div className="relative space-y-2" ref={dropdownRef}>
            <label className="text-sm font-semibold text-gray-700 px-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl mt-1 text-[14px] font-medium text-gray-700 transition-all focus:ring-2 focus:ring-primary/20 ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'
                    }`}
            >
                <span className="truncate">
                    {selectedItems.length > 0 ? `${selectedItems.length} selected` : label?.startsWith('Select') ? label : `Select ${label}`}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[100] top-full w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden min-w-[280px] mt-1"
                    >
                        <div className="p-3 border-b border-gray-50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-full focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all w-full text-[14px]"
                                />
                            </div>
                        </div>

                        <div className="flex px-3 py-3 gap-2 bg-gray-50/50 border-b border-gray-100">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="flex-1 py-1.5 text-[13px] font-semibold text-primary bg-white hover:bg-primary hover:text-white rounded-full transition-all border border-primary/80"
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={deselectAll}
                                className="flex-1 py-1.5 text-[13px] font-semibold text-rose-600 bg-white hover:bg-rose-600 hover:text-white rounded-full transition-all border border-rose-500"
                            >
                                Deselect All
                            </button>
                        </div>

                        <div className="max-h-[250px] overflow-y-auto p-2 custom-scrollbar">
                            {filteredItems.length > 0 ? (
                                <div className="space-y-0.5">
                                    {filteredItems.map((item) => {
                                        const isHeader = item.type === 'header';
                                        if (isHeader) {
                                            return (
                                                <div key={item.id} className="px-1 py-2 text-[14px] font-semibold text-gray-600 mt-2 first:mt-0">
                                                    {item.label}
                                                </div>
                                            );
                                        }
                                        const isSelected = selectedItems.includes(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleItem(item.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${isSelected ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <span className={`text-[13px] font-medium ${isSelected ? 'font-semibold' : ''}`}>
                                                    {item.label}
                                                </span>
                                                {isSelected && (
                                                    <div className="bg-primary text-white p-0.5 rounded-full">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-xs text-gray-400 font-medium">No results found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultiSelectDropdown;
