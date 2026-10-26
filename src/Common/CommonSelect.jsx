import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CommonSelect - Comprehensive, modern Select component with support for:
 * - Single select & Multi-select (multiple={true})
 * - Searchable filtering with search bar (searchable={true})
 * - 'pill' variant (table toolbar filters) & 'form' variant (modal/form inputs)
 * - Icons, clearable selections, and smooth Framer Motion animations
 */
export default function CommonSelect({
    value,
    onChange,
    options = [],
    icon: Icon,
    placeholder = 'Select...',
    className = '',
    dropdownClassName = '',
    disabled = false,
    align = 'left',
    name,
    label,
    required = false,
    variant = 'pill', // 'pill' | 'form'
    multiple = false,
    isMulti = false,
    searchable = true,
    searchPlaceholder = 'Search...',
    isClearable = false,
    ...props
}) {
    const isMultiple = multiple || isMulti;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownAlign, setDropdownAlign] = useState(align);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Dynamic viewport-aware dropdown alignment
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (align === 'right' || rect.right > window.innerWidth - 220) {
                setDropdownAlign('right');
            } else {
                setDropdownAlign('left');
            }
        }
    }, [isOpen, align]);

    // Normalize options into { value, label, icon } format
    const normalizedOptions = useMemo(() => {
        return (options || []).map((opt) => {
            if (typeof opt === 'object' && opt !== null) {
                return {
                    value: opt.value !== undefined ? opt.value : opt.id,
                    label: opt.label !== undefined ? opt.label : (opt.name || String(opt.value)),
                    icon: opt.icon
                };
            }
            return { value: opt, label: String(opt) };
        });
    }, [options]);

    // Normalized selected values for multiple/single modes
    const selectedValues = useMemo(() => {
        if (!isMultiple) return [];
        if (Array.isArray(value)) return value.map(String);
        if (value === null || value === undefined || value === '') return [];
        return [String(value)];
    }, [value, isMultiple]);

    const selectedOption = useMemo(() => {
        if (isMultiple) return null;
        return normalizedOptions.find((opt) => String(opt.value) === String(value));
    }, [normalizedOptions, value, isMultiple]);

    // Filtered options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return normalizedOptions;
        const query = searchTerm.toLowerCase();
        return normalizedOptions.filter((opt) =>
            String(opt.label).toLowerCase().includes(query) ||
            String(opt.value).toLowerCase().includes(query)
        );
    }, [normalizedOptions, searchTerm]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Focus search input smoothly without viewport jumping
    useEffect(() => {
        if (isOpen && searchable) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus({ preventScroll: true });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, searchable]);

    const triggerChange = (newVal) => {
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: newVal
                }
            });
        }
    };

    const handleSelect = (optionValue) => {
        if (disabled) return;

        if (isMultiple) {
            const valStr = String(optionValue);
            const exists = selectedValues.includes(valStr);
            const newSelection = exists
                ? selectedValues.filter((v) => v !== valStr)
                : [...selectedValues, valStr];
            triggerChange(newSelection);
        } else {
            setIsOpen(false);
            setSearchTerm('');
            triggerChange(optionValue);
        }
    };

    const handleSelectAll = (e) => {
        e.stopPropagation();
        const allVals = normalizedOptions.map((opt) => String(opt.value));
        triggerChange(allVals);
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        triggerChange(isMultiple ? [] : '');
        if (!isMultiple) {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    // Determine label for display
    const displayLabel = useMemo(() => {
        if (isMultiple) {
            if (selectedValues.length === 0) return placeholder;
            if (selectedValues.length === 1) {
                const single = normalizedOptions.find((o) => String(o.value) === selectedValues[0]);
                return single ? single.label : placeholder;
            }
            return `${selectedValues.length} selected`;
        }
        return selectedOption ? selectedOption.label : placeholder;
    }, [isMultiple, selectedValues, selectedOption, normalizedOptions, placeholder]);

    const hasSelection = isMultiple
        ? selectedValues.length > 0
        : (value !== undefined && value !== null && value !== '');

    const hasValue = isMultiple
        ? selectedValues.length > 0
        : (value !== undefined && value !== null && value !== '' && value !== 'All');

    // Trigger button styles based on variant
    const triggerBaseStyles = variant === 'form'
        ? `w-full h-11 px-4 bg-white border rounded-[12px] text-[14px] font-medium justify-between ${isOpen ? 'border-primary ring-4 ring-primary/5 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`
        : `px-4 py-2 bg-white rounded-full border text-[13px] font-semibold justify-between gap-2 shadow-2xs ${isOpen ? 'border-primary ring-2 ring-primary/10 shadow-xs' : 'border-gray-200 hover:border-gray-300'
        }`;

    return (
        <div className={`relative ${variant === 'form' ? 'w-full space-y-1.5' : 'inline-block'} text-left`} ref={containerRef} {...props}>
            {label && (
                <label className="block text-[13px] font-semibold text-gray-700 ml-0.5">
                    {label}
                    {required && <span className="text-rose-500 ml-1">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={`flex items-center transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer focus:outline-none ${triggerBaseStyles} ${className}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && (
                        <Icon
                            size={variant === 'form' ? 18 : 15}
                            className={`shrink-0 transition-colors ${isOpen || hasValue ? 'text-primary' : 'text-gray-500'
                                }`}
                        />
                    )}
                    <span className={`truncate ${!hasSelection ? 'text-gray-400 font-normal' : 'text-gray-800 font-semibold'}`}>
                        {displayLabel}
                    </span>
                    {isMultiple && selectedValues.length > 1 && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                            {selectedValues.length}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isClearable && hasValue && !disabled && (
                        <X
                            size={14}
                            className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                            onClick={handleClearAll}
                        />
                    )}
                    <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-gray-600'
                            }`}
                    />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`absolute z-[100] top-full mt-1.5 ${variant === 'form' ? 'w-full min-w-[240px]' : 'min-w-[170px] w-max max-w-[260px]'
                            } bg-white rounded-2xl border border-gray-100 shadow-xl shadow-slate-900/10 overflow-hidden transform-gpu ${dropdownAlign === 'right' ? 'right-0' : 'left-0'
                            } ${dropdownClassName}`}
                        role="listbox"
                    >
                        {/* Search Input Field */}
                        {searchable && (
                            <div className="p-2.5 border-b border-gray-100 bg-gray-50/50">
                                <div className="relative flex items-center">
                                    <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="w-full pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors text-gray-700"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchTerm('');
                                                searchInputRef.current?.focus();
                                            }}
                                            className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Multi-Select Header (Select All / Clear) */}
                        {isMultiple && (
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/30 text-[11px] font-semibold text-gray-500">
                                <span>{selectedValues.length} of {normalizedOptions.length} selected</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-primary hover:underline cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-gray-400 hover:text-rose-500 cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto no-scrollbar p-1.5 space-y-0.5">
                            {filteredOptions.map((opt) => {
                                const isSelected = isMultiple
                                    ? selectedValues.includes(String(opt.value))
                                    : String(opt.value) === String(value);
                                const OptionIcon = opt.icon;

                                return (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[13px] transition-all text-left cursor-pointer group ${isSelected
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'text-gray-700 font-medium hover:bg-gray-50/90 hover:text-gray-900 active:bg-gray-100'
                                            }`}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            {/* Checkbox indicator for multi-select */}
                                            {isMultiple && (
                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border-gray-300 bg-white group-hover:border-primary/50'
                                                    }`}>
                                                    {isSelected && <Check size={11} className="stroke-[3]" />}
                                                </div>
                                            )}

                                            {OptionIcon && (
                                                <OptionIcon
                                                    size={14}
                                                    className={isSelected ? 'text-primary' : 'text-gray-400'}
                                                />
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                        </div>

                                        {/* Checkmark for single-select */}
                                        {!isMultiple && isSelected && (
                                            <Check size={14} className="shrink-0 stroke-[2.5] text-primary" />
                                        )}
                                    </button>
                                );
                            })}

                            {filteredOptions.length === 0 && (
                                <div className="py-6 text-center text-gray-400">
                                    <p className="text-xs font-semibold">No records found</p>
                                    {searchTerm && (
                                        <p className="text-[11px] text-gray-400 mt-0.5">Try searching with a different term</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Multi-select Done Action Footer */}
                        {isMultiple && (
                            <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
                                >
                                    Done ({selectedValues.length} selected)
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
