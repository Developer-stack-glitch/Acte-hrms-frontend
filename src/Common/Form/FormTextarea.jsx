import FormLabel from './FormLabel';

const FormTextarea = ({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    ...props
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel label={label} icon={Icon} required={required} />
            <div className="relative">
                <textarea
                    rows={rows}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-[10px] outline-none focus:border-primary/30 focus:bg-white transition-all font-medium text-gray-700 resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    {...props}
                />
            </div>
        </div>
    );
};

export default FormTextarea;
