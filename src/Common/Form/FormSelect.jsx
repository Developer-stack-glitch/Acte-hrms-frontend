import React, { useMemo } from 'react';
import FormLabel from './FormLabel';
import CommonSelect from '../CommonSelect';

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
    searchable = false,
    ...props
}) => {
    // If options or children (e.g. <option> tags) are passed, normalize them
    const resolvedOptions = useMemo(() => {
        let opts = options && options.length > 0 ? [...options] : [];
        if (children) {
            React.Children.forEach(children, (child) => {
                if (child && child.props && child.props.value !== undefined) {
                    if (child.props.value !== "") {
                        opts.push({
                            value: child.props.value,
                            label: child.props.children || String(child.props.value)
                        });
                    }
                }
            });
        }
        return opts;
    }, [options, children]);

    return (
        <div className={`space-y-1.5 ${className}`}>
            {(label || extra) && (
                <div className="flex items-center justify-between">
                    <FormLabel label={label} icon={Icon} required={required} />
                    {extra}
                </div>
            )}
            <CommonSelect
                variant="form"
                value={value}
                onChange={onChange}
                options={resolvedOptions}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                icon={Icon}
                searchable={searchable}
                {...props}
            />
        </div>
    );
};

export default FormSelect;
