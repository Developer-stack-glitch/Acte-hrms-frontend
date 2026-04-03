import React from 'react';

const FormLabel = ({ label, icon: Icon, required }) => {
    if (!label) return null;

    const renderLabelContent = () => {
        if (typeof label !== 'string') return label;

        if (label.includes('*')) {
            const parts = label.split('*');
            return (
                <>
                    {parts[0]}
                    <span className="text-red-500 font-bold ml-1">*</span>
                    {parts[1]}
                </>
            );
        }

        return (
            <>
                {label}
                {required && <span className="text-red-500 font-bold ml-1">*</span>}
            </>
        );
    };

    return (
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            {Icon && <Icon size={16} className="text-gray-400 mr-1 shrink-0" />}
            <span className="flex items-center">
                {renderLabelContent()}
            </span>
        </label>
    );
};

export default FormLabel;
