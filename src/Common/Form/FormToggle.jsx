import React from 'react';
import { motion } from 'framer-motion';

const FormToggle = ({ checked, onChange, disabled = false, label }) => {
    return (
        <div className="flex items-center gap-3">
            {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 ${
                    checked ? 'bg-primary' : 'bg-gray-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 20 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
};

export default FormToggle;
