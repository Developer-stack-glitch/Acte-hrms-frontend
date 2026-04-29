import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FormLabel from './FormLabel';

const SearchableSelect = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    placeholder = "Select an option",
    direction = "down",
    extra,
    name,
    isClearable = true,
    ...props
}) => {
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

    const filteredOptions = (options || []).filter(opt =>
        (opt?.label || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const handleSelect = (optionValue) => {
        // Create a synthetic event object to match standard onChange
        onChange({
            target: {
                name,
                value: optionValue
            }
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        handleSelect('');
    };

    return (
        <div className={`space-y-2 ${className}`} ref={dropdownRef}>
            <div className="flex items-center justify-between">
                <FormLabel label={label} icon={Icon} required={required} />
                {extra}
            </div>

            <div className="relative group">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] outline-none transition-all text-[15px] font-medium disabled:bg-gray-50 disabled:text-gray-500 ${isOpen ? 'border-primary ring-0' : 'border-gray-200 hover:border-primary/50'
                        }`}
                >
                    <span className={`truncate mr-6 ${!selectedOption ? 'text-gray-400 font-normal' : 'text-gray-700 font-medium'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <div className="flex items-center gap-2">
                        {isClearable && selectedOption && !disabled && (
                            <X
                                size={18}
                                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: direction === 'up' ? -5 : 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: direction === 'up' ? -5 : 5 }}
                            className={`absolute z-[100] ${direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-200/80 overflow-hidden min-w-[250px]`}
                        >
                            <div className="p-2.5 border-b border-gray-50 bg-gray-50/30">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-8 py-2 w-full bg-white border border-gray-200 rounded-lg outline-none focus:border-primary text-[13px] font-medium transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar">
                                {isClearable && value && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelect('')}
                                        className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-[13px] font-semibold mb-1 group/clear"
                                    >
                                        <X size={14} className="mr-2 group-hover/clear:scale-110 transition-transform" />
                                        Clear Selection
                                    </button>
                                )}
                                {filteredOptions.length > 0 ? (
                                    <div className="space-y-0.5">
                                        {filteredOptions.map((opt) => {
                                            const isSelected = String(opt.value) === String(value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => handleSelect(opt.value)}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left group ${isSelected ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-medium'
                                                        }`}
                                                >
                                                    <span className={`text-[13px] ${isSelected ? 'font-bold' : ''}`}>
                                                        {opt.label}
                                                    </span>
                                                    {isSelected && (
                                                        <Check size={14} strokeWidth={3} className="text-primary" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-gray-50/30 rounded-lg">
                                        <p className="text-[12px] text-gray-400 font-medium">No records found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SearchableSelect;
