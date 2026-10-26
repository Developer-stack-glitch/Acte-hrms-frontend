import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FormLabel from './FormLabel';

/**
 * Robust parsing from 24h or 12h time string into { hour: 1..12, minute: 0..59, ampm: 'AM'|'PM' }
 */
const parseTimeString = (timeStr, defaultPeriod = 'PM') => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();
    if (!clean || clean === '--:--' || clean === '00:00:00' || clean === 'undefined') return null;

    const isPM = /pm/i.test(clean);
    const isAM = /am/i.test(clean);
    const hasPeriod = isPM || isAM;
    const period = isPM ? 'PM' : isAM ? 'AM' : defaultPeriod;

    // Remove non-digit, non-colon
    const numPart = clean.replace(/[^0-9:]/g, '');
    const parts = numPart.split(':');

    if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;
        if (m < 0) m = 0;
        if (m > 59) m = 59;

        if (hasPeriod) {
            if (h < 1) h = 12;
            if (h > 12) h = ((h - 1) % 12) + 1;
            return { hour: h, minute: m, ampm: period };
        } else {
            // Assume 24-hour format
            if (h >= 12) {
                const h12 = h === 12 ? 12 : h - 12;
                return { hour: h12, minute: m, ampm: 'PM' };
            } else {
                const h12 = h === 0 ? 12 : h;
                return { hour: h12, minute: m, ampm: 'AM' };
            }
        }
    } else if (parts.length === 1 && parts[0]) {
        let h = parseInt(parts[0], 10);
        if (isNaN(h)) return null;
        if (hasPeriod) {
            if (h < 1) h = 12;
            if (h > 12) h = ((h - 1) % 12) + 1;
            return { hour: h, minute: 0, ampm: period };
        } else if (h >= 0 && h <= 23) {
            if (h >= 12) {
                return { hour: h === 12 ? 12 : h - 12, minute: 0, ampm: 'PM' };
            } else {
                return { hour: h === 0 ? 12 : h, minute: 0, ampm: 'AM' };
            }
        }
    }
    return null;
};

const formatTo24Hour = (hour12, minute, ampm) => {
    let h = parseInt(hour12, 10);
    if (isNaN(h) || h < 1) h = 12;
    h = h % 12;
    if (ampm === 'PM') h += 12;
    const m = parseInt(minute, 10);
    const mClamped = isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
    return `${h.toString().padStart(2, '0')}:${mClamped.toString().padStart(2, '0')}`;
};

const formatTo12Hour = (hour12, minute, ampm) => {
    const h = parseInt(hour12, 10);
    const hClamped = isNaN(h) || h < 1 ? 12 : Math.min(12, h);
    const m = parseInt(minute, 10);
    const mClamped = isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
    return `${hClamped.toString().padStart(2, '0')}:${mClamped.toString().padStart(2, '0')} ${ampm}`;
};

const FormTime = ({
    label,
    value,
    onChange,
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    name,
    placeholder = "Select time",
    placeholderText,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);

    // Parse current value
    const parsed = useMemo(() => parseTimeString(value), [value]);

    // Active state in picker
    const now = new Date();
    const currentHour24 = now.getHours();
    const defaultH12 = currentHour24 >= 12 ? (currentHour24 === 12 ? 12 : currentHour24 - 12) : (currentHour24 === 0 ? 12 : currentHour24);
    const defaultM = now.getMinutes();
    const defaultPeriod = currentHour24 >= 12 ? 'PM' : 'AM';

    const activeHour = parsed ? parsed.hour : defaultH12;
    const activeMinute = parsed ? parsed.minute : defaultM;
    const activePeriod = parsed ? parsed.ampm : defaultPeriod;

    // Display text in the input
    const [inputText, setInputText] = useState(
        parsed ? formatTo12Hour(parsed.hour, parsed.minute, parsed.ampm) : ''
    );

    useEffect(() => {
        if (parsed) {
            setInputText(formatTo12Hour(parsed.hour, parsed.minute, parsed.ampm));
        } else if (!value) {
            setInputText('');
        }
    }, [parsed, value]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Auto-scroll hour & minute lists to active items when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (hourListRef.current) {
                    const activeHourEl = hourListRef.current.querySelector('[data-active="true"]');
                    if (activeHourEl) {
                        activeHourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }
                if (minuteListRef.current) {
                    const activeMinEl = minuteListRef.current.querySelector('[data-active="true"]');
                    if (activeMinEl) {
                        activeMinEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Emit change helper
    const emitChange = (h12, min, period) => {
        const val24 = formatTo24Hour(h12, min, period);
        setInputText(formatTo12Hour(h12, min, period));
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: val24,
                    type: 'time'
                }
            });
        }
    };

    // Handle user typing directly into input
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        if (!val.trim()) {
            if (onChange) {
                onChange({
                    target: {
                        name,
                        value: '',
                        type: 'time'
                    }
                });
            }
            return;
        }

        const p = parseTimeString(val, activePeriod);
        if (p) {
            const val24 = formatTo24Hour(p.hour, p.minute, p.ampm);
            if (onChange) {
                onChange({
                    target: {
                        name,
                        value: val24,
                        type: 'time'
                    }
                });
            }
        }
    };

    const handleInputBlur = () => {
        if (value) {
            const p = parseTimeString(value);
            if (p) {
                setInputText(formatTo12Hour(p.hour, p.minute, p.ampm));
            }
        } else if (!inputText.trim()) {
            setInputText('');
        }
    };

    // Quick Action Handlers
    const handleSetNow = () => {
        const d = new Date();
        const h24 = d.getHours();
        const m = d.getMinutes();
        const h12 = h24 >= 12 ? (h24 === 12 ? 12 : h24 - 12) : (h24 === 0 ? 12 : h24);
        const period = h24 >= 12 ? 'PM' : 'AM';
        emitChange(h12, m, period);
    };

    const handleClear = () => {
        setInputText('');
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: '',
                    type: 'time'
                }
            });
        }
        setIsOpen(false);
    };

    // Hours 1..12 and all 60 minutes 0..59
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className={`space-y-2 relative text-left ${className}`} ref={containerRef}>
            <FormLabel label={label} icon={Icon} required={required} />

            <div className="relative">
                <input
                    type="text"
                    name={name}
                    value={inputText}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onBlur={handleInputBlur}
                    placeholder={placeholderText || placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete="off"
                    className={`w-full h-11 pl-3.5 pr-10 bg-white border rounded-xl outline-none transition-all font-medium text-gray-800 text-sm select-none ${isOpen
                        ? 'border-primary ring-4 ring-primary/5 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    {...props}
                />

                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer p-1"
                >
                    <Clock size={18} className={isOpen || value ? 'text-primary' : 'text-gray-400'} />
                </button>
            </div>

            {/* Comprehensive Time Picker Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute z-[110] top-full mt-1.5 left-0 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden transform-gpu"
                    >
                        {/* Header: Manual Direct Inputs & AM/PM Selector */}
                        <div className="p-3 bg-gradient-to-b from-gray-50/80 to-gray-50/30 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[14px] font-semibold text-gray-600">
                                    Set Exact Time
                                </span>
                                <button
                                    type="button"
                                    onClick={handleSetNow}
                                    className="text-[11px] font-bold text-primary hover:text-primary-hover px-2 py-0.5 rounded-md hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                    Now
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                {/* Hour input */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={activeHour}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value, 10);
                                            if (!isNaN(h)) {
                                                const validH = Math.min(12, Math.max(1, h));
                                                emitChange(validH, activeMinute, activePeriod);
                                            }
                                        }}
                                        className="w-12 h-10 text-center font-semibold text-lg bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none shadow-2xs"
                                    />
                                    <span className="font-bold text-gray-400 text-lg">:</span>
                                    {/* Minute input */}
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={activeMinute.toString().padStart(2, '0')}
                                        onChange={(e) => {
                                            const m = parseInt(e.target.value, 10);
                                            if (!isNaN(m)) {
                                                const validM = Math.min(59, Math.max(0, m));
                                                emitChange(activeHour, validM, activePeriod);
                                            }
                                        }}
                                        className="w-12 h-10 text-center font-semibold text-lg bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none shadow-2xs"
                                    />
                                </div>

                                {/* AM / PM Segmented Control */}
                                <div className="flex p-1 bg-gray-200/60 rounded-xl gap-0.5 text-xs font-semibold shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => emitChange(activeHour, activeMinute, 'AM')}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activePeriod === 'AM'
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        AM
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => emitChange(activeHour, activeMinute, 'PM')}
                                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activePeriod === 'PM'
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        PM
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Selection Columns: Hours (1-12) & Minutes (0-59) */}
                        <div className="grid grid-cols-2 divide-x divide-gray-100 p-2">
                            {/* Hours Column */}
                            <div>
                                <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1 border-b border-gray-50 mb-1">
                                    Hour (1-12)
                                </div>
                                <div
                                    ref={hourListRef}
                                    className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 px-1 py-0.5"
                                >
                                    {hours.map((h) => {
                                        const isSelected = activeHour === h;
                                        return (
                                            <button
                                                key={h}
                                                type="button"
                                                data-active={isSelected}
                                                onClick={() => emitChange(h, activeMinute, activePeriod)}
                                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-between ${isSelected
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                                                    }`}
                                            >
                                                <span>{h.toString().padStart(2, '0')}</span>
                                                {isSelected && <Check size={12} className="stroke-[3]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Minutes Column (ALL 00 to 59!) */}
                            <div>
                                <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1 border-b border-gray-50 mb-1">
                                    Minute (00-59)
                                </div>
                                <div
                                    ref={minuteListRef}
                                    className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 px-1 py-0.5"
                                >
                                    {minutes.map((m) => {
                                        const isSelected = activeMinute === m;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                data-active={isSelected}
                                                onClick={() => emitChange(activeHour, m, activePeriod)}
                                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-between ${isSelected
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                                                    }`}
                                            >
                                                <span>{m.toString().padStart(2, '0')}</span>
                                                {isSelected && <Check size={12} className="stroke-[3]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Clear & Done */}
                        <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-5 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-hover shadow-xs transition-all cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FormTime;
