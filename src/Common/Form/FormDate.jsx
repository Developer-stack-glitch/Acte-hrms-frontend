import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FormLabel from './FormLabel';
import { Calendar } from 'lucide-react';

const FormDate = ({
    label,
    value,
    onChange,
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    name,
    ...props
}) => {
    // Handle the date object for react-datepicker
    const selectedDate = value ? new Date(value) : null;
    const isValidDate = selectedDate instanceof Date && !isNaN(selectedDate);

    const handleDateChange = (date) => {
        if (onChange) {
            // Format to YYYY-MM-DD to match standard HTML date input format
            const formattedDate = date ? date.toLocaleDateString('sv-SE') : ''; // sv-SE gives YYYY-MM-DD
            onChange({
                target: {
                    name: name,
                    value: formattedDate,
                    type: 'date'
                }
            });
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel label={label} icon={Icon} required={required} />
            <div className="relative react-datepicker-wrapper-full">
                <DatePicker
                    selected={isValidDate ? selectedDate : null}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    required={required}
                    disabled={disabled}
                    placeholderText="Select date"
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary/30 focus:bg-white transition-all font-medium text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    portalId="root"
                    {...props}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Calendar size={18} />
                </div>
            </div>
        </div>
    );
};

export default FormDate;
