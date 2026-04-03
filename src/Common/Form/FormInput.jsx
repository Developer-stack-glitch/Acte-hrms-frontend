import FormLabel from './FormLabel';

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

    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel label={label} icon={Icon} required={required} />
            <div className="relative">
                <input
                    type={isNumber ? "text" : type}
                    value={displayValue || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary/30 focus:bg-white transition-all font-medium text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    {...props}
                />
            </div>
        </div>
    );
};

export default FormInput;

