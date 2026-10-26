import React, { useState, useRef, useEffect, useMemo } from 'react';
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
    const searchInputRef = useRef(null);

    // Filter options smoothly with memoization
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options || [];
        const term = searchTerm.toLowerCase();
        return (options || []).filter(opt =>
            (opt?.label || "").toLowerCase().includes(term) ||
            String(opt?.value || "").toLowerCase().includes(term)
        );
    }, [options, searchTerm]);

    const selectedOption = useMemo(() => {
        return (options || []).find(opt => String(opt.value) === String(value));
    }, [options, value]);

    // Handle click outside to close cleanly
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Smooth focus without causing layout or viewport jumping/glitching
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus({ preventScroll: true });
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
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
        <div className={`space-y-1.5 ${className}`} ref={dropdownRef} {...props}>
            {(label || extra) && (
                <div className="flex items-center justify-between">
                    <FormLabel label={label} icon={Icon} required={required} />
                    {extra}
                </div>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-[12px] outline-none text-[14px] font-medium transition-colors select-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
                        isOpen
                            ? 'border-primary ring-3 ring-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-2.5 truncate">
                        {Icon && !label && (
                            <Icon
                                size={18}
                                className={`shrink-0 transition-colors ${
                                    isOpen || selectedOption ? 'text-primary' : 'text-gray-400'
                                }`}
                            />
                        )}
                        <span className={`truncate ${!selectedOption ? 'text-gray-400 font-normal' : 'text-gray-800'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isClearable && selectedOption && !disabled && (
                            <X
                                size={15}
                                className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ease-out ${
                                isOpen ? 'rotate-180 text-primary' : ''
                            }`}
                        />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: direction === 'up' ? -4 : 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: direction === 'up' ? -4 : 4 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{ transformOrigin: direction === 'up' ? 'bottom' : 'top' }}
                            className={`absolute z-[100] ${
                                direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                            } left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/80 overflow-hidden min-w-[260px] transform-gpu`}
                            role="listbox"
                        >
                            {/* Search input header */}
                            <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
                                <div className="relative flex items-center">
                                    <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors text-gray-700 placeholder-gray-400"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchTerm('');
                                                searchInputRef.current?.focus({ preventScroll: true });
                                            }}
                                            className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Options list */}
                            <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                                {isClearable && value && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelect('')}
                                        className="w-full flex items-center px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors text-[12px] font-semibold mb-1 group/clear cursor-pointer"
                                    >
                                        <X size={13} className="mr-2 group-hover/clear:scale-110 transition-transform" />
                                        Clear Selection
                                    </button>
                                )}

                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((opt) => {
                                        const isSelected = String(opt.value) === String(value);
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSelect(opt.value)}
                                                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors text-left cursor-pointer group ${
                                                    isSelected
                                                        ? 'bg-primary text-white font-semibold shadow-xs'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary active:bg-gray-100'
                                                }`}
                                                role="option"
                                                aria-selected={isSelected}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                {isSelected && (
                                                    <Check size={14} className="shrink-0 stroke-[2.5]" />
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="py-6 text-center text-gray-400">
                                        <p className="text-xs font-semibold">No records found</p>
                                        {searchTerm && (
                                            <p className="text-[11px] text-gray-400 mt-0.5">Try searching with a different term</p>
                                        )}
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
