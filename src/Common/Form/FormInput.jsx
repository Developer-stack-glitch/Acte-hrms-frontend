import React, { useState } from 'react';
import FormLabel from './FormLabel';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    isNumber = false,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    // Format value for display if it's a number field
    const displayValue = isNumber && value !== undefined && value !== null && value !== ''
        ? new Intl.NumberFormat('en-IN').format(value.toString().replace(/,/g, ''))
        : value;

    const handleChange = (e) => {
        if (isNumber) {
            // Remove commas before passing to parent
            const rawValue = e.target.value.replace(/,/g, '');
            // Only allow digits and decimal point
            if (rawValue !== '' && isNaN(rawValue)) return;

            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    name: props.name || e.target.name,
                    value: rawValue
                }
            };
            onChange(syntheticEvent);
        } else {
            onChange(e);
        }
    };

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : (isNumber ? 'text' : type);

    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel label={label} icon={Icon} required={required} />
            <div className="relative group/input">
                <input
                    type={inputType}
                    value={displayValue || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`w-full h-11 ${isPassword ? 'pr-11' : 'px-3'} px-4 bg-[#fff] border border-gray-200 rounded-[12px] outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors rounded-lg bg-transparent border-none outline-none"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormInput;

