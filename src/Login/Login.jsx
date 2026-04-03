import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Globe, ChevronRight, Activity, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../Action/api';
import toast from 'react-hot-toast';

const FloatingInput = ({ label, icon: Icon, type, name, value, onChange, required, showPassword, setShowPassword }) => {
    const [isFocused, setIsFocused] = useState(false);
    const isFilled = value && value.length > 0;

    return (
        <div className="relative mb-6">
            <div className={`
                absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10
                ${isFocused ? 'text-primary' : 'text-gray-400'}
            `}>
                <Icon size={20} />
            </div>
            <input
                type={type === 'password' && showPassword ? 'text' : type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    w-full py-4 pl-12 pr-12 rounded-[15px] border-1 transition-all duration-300 outline-none font-medium
                    ${isFocused ? 'border-primary ring-4 ring-primary/5 bg-white pt-6 pb-2' : 'border-gray-200 bg-gray-50/50'}
                    ${isFilled ? 'pt-6 pb-2' : ''}
                `}
                placeholder={isFocused ? '' : ''}
            />
            <label className={`
                absolute left-12 transition-all duration-200 pointer-events-none
                ${(isFocused || isFilled)
                    ? 'top-2 text-[10px] font-bold uppercase tracking-widest text-primary'
                    : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'}
            `}>
                {label}
            </label>
            {type === 'password' && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                    tabIndex="-1"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            )}
        </div>
    );
};

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        staySignedIn: false
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await loginApi(formData);
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            localStorage.setItem('companyId', response.data.company);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid credentials or server error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen w-full flex bg-white overflow-hidden font-sans">
            {/* Left Column: Enterprise Branding */}
            <div className="hidden lg:flex lg:w-[45%] relative p-16 flex-col justify-between overflow-hidden sidebar-abstract-bg">
                <div className="grain-overlay opacity-[0.03]" />

                {/* Branding Top */}
                <div className="relative z-10 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <Command className="text-white" size={24} />
                        </div>
                        <span className="text-white font-semibold text-xl">Enterprise HRMS</span>
                    </motion.div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80 text-[10px] uppercase font-bold tracking-widest mb-6">
                        <Activity size={12} className="text-green-400" />
                        <span>System Status: Optimal</span>
                    </div>
                </div>

                {/* Main Value Proposition */}
                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <h1 className="text-white text-6xl font-bold leading-[1.1] tracking-tight mb-8">
                            Modernize your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">Workforce.</span>
                        </h1>
                        <p className="text-blue-100/60 text-lg leading-relaxed mb-12">
                            A centralized platform designed for large-scale organizational excellence, real-time analytics, and seamless employee experiences.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Active Users', value: '45k+', trend: '+12%' },
                            { label: 'Uptime', value: '99.9%', trend: 'Global' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                                className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm"
                            >
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{stat.label}</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-white text-2xl font-bold leading-none">{stat.value}</span>
                                    <span className="text-blue-300 text-[10px] font-semibold pb-1">{stat.trend}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 flex items-center justify-between text-white/40 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <Globe size={14} />
                        <span>Available in 24 Regions</span>
                    </div>
                    <div className="flex gap-4">
                        <span>v3.4.0</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Secure Portal */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-20 relative bg-[#fafafa]">
                <div className="w-full max-w-[440px]">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemVariants} className="mb-9">
                            <div className="lg:hidden flex items-center gap-2 mb-8">
                                <Command className="text-primary" size={28} />
                                <span className="text-gray-900 font-bold text-xl tracking-tight">Enterprise HRMS</span>
                            </div>
                            <h2 className="text-[2.5rem] font-semibold text-gray-900 leading-tight mb-3">Sign in.</h2>
                            <p className="text-gray-500 font-medium">Enter your organizational credentials to continue.</p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-2">
                            <motion.div variants={itemVariants}>
                                <FloatingInput
                                    label="Organizational Email"
                                    icon={Mail}
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <FloatingInput
                                    label="Security Password"
                                    icon={Lock}
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex justify-between items-center pb-9 px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={formData.staySignedIn}
                                            onChange={(e) => setFormData({ ...formData, staySignedIn: e.target.checked })}
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-200 rounded-lg group-hover:border-primary transition-colors peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                                            <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900">Stay signed in</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors underline underline-offset-4">Forgot Password?</Link>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <motion.button
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    className="w-full py-3 active-nav-item text-white rounded-full text-lg font-medium shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:bg-gray-400 group relative overflow-hidden"
                                    disabled={isLoading}
                                >
                                    <AnimatePresence mode="wait">
                                        {isLoading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"
                                            />
                                        ) : (
                                            <motion.div key="text" className="flex items-center gap-2">
                                                <span>Access Dashboard</span>
                                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </motion.div>
                        </form>

                        <motion.div variants={itemVariants} className="mt-6 text-center">
                            <p className="text-sm font-semibold text-gray-500">
                                New organization?{' '}
                                <a href="#" className="text-primary hover:underline underline-offset-4 decoration-2 ml-1">Request Onboarding</a>
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Footer Links */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-8 hidden sm:flex justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Legal Terms</a>
                        </div>
                        <span>Security Verified &copy; 2026</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
