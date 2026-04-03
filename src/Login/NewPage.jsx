import React from 'react';
import { motion } from 'framer-motion';

export default function NewPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 backdrop-blur-md p-10 rounded-[32px] shadow-2xl border border-white/20 text-center max-w-lg w-full"
            >
                <h1 className="text-4xl font-bold text-primary mb-4">Welcome</h1>
                <p className="text-gray-600 mb-8 text-lg">You have successfully logged into the system.</p>
                <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-8" />
                <p className="text-gray-400 text-sm italic">New dashboard coming soon...</p>
            </motion.div>
        </div>
    );
}