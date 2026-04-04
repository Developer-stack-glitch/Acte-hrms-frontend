import FormLabel from './FormLabel';

const FormSelect = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    disabled = false,
    className = "",
    icon: Icon,
    placeholder = "Select an option",
    extra,
    children,
    ...props
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                <FormLabel label={label} icon={Icon} required={required} />
                {extra}
            </div>
            <div className="relative">
                <select
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium disabled:bg-gray-50 disabled:text-gray-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                    {children}
                </select>
            </div>
        </div>
    );
};

export default FormSelect;
