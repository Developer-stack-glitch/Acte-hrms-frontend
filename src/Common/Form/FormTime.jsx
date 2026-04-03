import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FormLabel from './FormLabel';
import { Clock } from 'lucide-react';

const FormTime = ({
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
    // Handle the time for react-datepicker
    // value is likely "HH:mm"
    const selectedTime = value ? new Date(`2000-01-01T${value}`) : null;
    const isValidTime = selectedTime instanceof Date && !isNaN(selectedTime);

    const handleTimeChange = (date) => {
        if (onChange) {
            // Format to HH:mm
            const formattedTime = date ? date.toTimeString().slice(0, 5) : '';
            onChange({
                target: {
                    name: name,
                    value: formattedTime,
                    type: 'time'
                }
            });
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel label={label} icon={Icon} required={required} />
            <div className="relative react-datepicker-wrapper-full">
                <DatePicker
                    selected={isValidTime ? selectedTime : null}
                    onChange={handleTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="HH:mm"
                    required={required}
                    disabled={disabled}
                    placeholderText="Select time"
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary/30 focus:bg-white transition-all font-medium text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                    portalId="root"
                    {...props}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Clock size={18} />
                </div>
            </div>
        </div>
    );
};

export default FormTime;
