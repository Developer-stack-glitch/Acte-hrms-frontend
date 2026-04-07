import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Search, Plus } from 'lucide-react';

/**
 * A premium No Data component to show when lists or tables are empty.
 * 
 * @param {string} title - Main title for the empty state
 * @param {string} description - Subtitle/description
 * @param {React.ReactNode} icon - Optional custom icon
 * @param {string} type - 'empty' (default) or 'search' to change default icons/text
 * @param {Function} onAction - Optional callback for an action button
 * @param {string} actionText - Text for the action button
 */
const NoData = ({
    title = "No Data Found",
    description = "It looks like there's nothing here yet.",
    icon: IconComponent,
    type = 'empty',
    onAction,
    actionText = "Add New",
    variant = "default" // "default" or "mini"
}) => {

    const renderIcon = () => {
        const size = variant === 'mini' ? 24 : 40;
        if (IconComponent) {
            return React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={size} />;
        }
        if (type === 'search') return <Search size={size} />;
        return <Inbox size={size} />;
    };

    if (variant === 'mini') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-6 text-center"
            >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 mb-3 border border-gray-100/50">
                    {renderIcon()}
                </div>
                <p className="text-[14px] font-semibold text-gray-500 leading-tight">
                    {title}
                </p>
                {description && <p className="text-[12px] text-gray-500/90 mt-1">{description}</p>}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
            <div className="relative mb-8">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150 animate-pulse" />
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 rounded-full blur-2xl" />

                {/* Main Icon Container */}
                <div className="relative w-28 h-28 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-center text-primary/30 transform -rotate-3 transition-all hover:rotate-0 hover:scale-105 duration-500">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-inner">
                        {renderIcon()}
                    </div>

                    {/* Floating Decorative Elements */}
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-center text-primary"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </motion.div>
                </div>
            </div>

            <div className="space-y-3 max-w-sm">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {title}
                </h3>
                <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
                    {description}
                </p>
            </div>

            {onAction && (
                <motion.button
                    onClick={onAction}
                    className="mt-6 flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-full font-medium text-[15px] shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all group"
                >
                    <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                        <Plus size={18} strokeWidth={3} />
                    </div>
                    {actionText}
                </motion.button>
            )}
        </motion.div>
    );
};

export default NoData;
