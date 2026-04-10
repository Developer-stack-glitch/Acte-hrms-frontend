import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FullPageLoader = ({ isLoading, message = "Processing..." }) => {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] mb-0 flex items-center justify-center bg-black/30 backdrop-blur-[4px]"
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            {/* Outer rotating ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                            />

                            {/* Inner pulsing circle */}
                            <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-primary/20"
                            />

                            {/* Center Dot */}
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                            />
                        </div>

                        {/* Loading Text */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.h3
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-gray-900 font-semibold text-lg tracking-tight"
                            >
                                {message}
                            </motion.h3>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                                className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent w-24 opacity-60"
                            />
                            <p className="text-[11px] font-semibold text-white uppercase tracking-[0.2em] animate-pulse">
                                Please Wait
                            </p>
                        </div>
                    </div>

                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.1, 0.15, 0.1]
                            }}
                            transition={{ duration: 8, repeat: Infinity }}
                            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.05, 0.1, 0.05]
                            }}
                            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                            className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FullPageLoader;
