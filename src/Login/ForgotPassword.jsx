import { useState, useRef } from 'react';
import { Mail, ChevronRight, Command, Globe, CheckCircle2, ArrowLeft, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordApi, verifyOtpApi, resetPasswordApi } from '../Action/api';
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

export default function ForgotPassword() {
    const [step, setStep] = useState('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef([]);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await forgotPasswordApi({ email });
            setStep('OTP');
            toast.success('6-digit OTP sent to your email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            toast.error('Please enter full 6-digit OTP');
            return;
        }
        setIsLoading(true);
        try {
            await verifyOtpApi({ email, otp: otpValue });
            setStep('RESET');
            toast.success('OTP verified successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            await resetPasswordApi({ email, otp: otp.join(''), newPassword });
            setStep('SUCCESS');
            toast.success('Password updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
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
            {/* Left Column: Branding */}
            <div className="hidden lg:flex lg:w-[45%] relative p-16 flex-col justify-between overflow-hidden sidebar-abstract-bg">
                <div className="grain-overlay opacity-[0.03]" />
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
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <h1 className="text-white text-6xl font-bold leading-[1.1] tracking-tight mb-8">
                            Identify <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">Verification.</span>
                        </h1>
                        <p className="text-blue-100/60 text-lg leading-relaxed mb-12">
                            Secure your account using two-factor authentication. We prioritize your privacy and workspace security above all.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-white/40 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <Globe size={14} />
                        <span>Security Standard: ISO 27001</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Portal */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-20 relative bg-[#fafafa]">
                <div className="w-full max-w-[480px]">
                    <AnimatePresence mode="wait">
                        {step === 'EMAIL' && (
                            <motion.div
                                key="step-email"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <motion.div variants={itemVariants} className="mb-9">
                                    <Link to="/login" className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-8 hover:gap-3 transition-all">
                                        <ArrowLeft size={18} />
                                        Back to Login
                                    </Link>
                                    <h2 className="text-[2.5rem] font-semibold text-gray-900 leading-tight mb-3">Forgot password?</h2>
                                    <p className="text-gray-500 font-medium tracking-tight">Enter your work email and we'll send you an OTP code.</p>
                                </motion.div>

                                <form onSubmit={handleEmailSubmit} className="space-y-4">
                                    <motion.div variants={itemVariants}>
                                        <FloatingInput
                                            label="Work Email Address"
                                            icon={Mail}
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <motion.button
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            className="w-full py-3 active-nav-item text-white rounded-full text-lg font-medium shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:bg-gray-400 group"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>Receive OTP</span>
                                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}

                        {step === 'OTP' && (
                            <motion.div
                                key="step-otp"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <motion.div variants={itemVariants} className="mb-9">
                                    <button onClick={() => setStep('EMAIL')} className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-8 hover:gap-3 transition-all">
                                        <ArrowLeft size={18} />
                                        Change Email
                                    </button>
                                    <h2 className="text-[2.5rem] font-semibold text-gray-900 leading-tight mb-3">Verify OTP.</h2>
                                    <p className="text-gray-500 font-medium tracking-tight">
                                        We've sent a 6-digit verification code to <span className="text-primary font-semibold">{email}</span>.
                                    </p>
                                </motion.div>

                                <form onSubmit={handleOtpSubmit} className="space-y-8">
                                    <motion.div variants={itemVariants} className="flex gap-2 justify-between">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => (otpRefs.current[idx] = el)}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                className="w-12 h-14 text-center text-2xl font-semibold border-1 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                            />
                                        ))}
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <motion.button
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            className="w-full py-3 active-nav-item text-white rounded-full text-lg font-medium shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:bg-gray-400 group"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>Verify Code</span>
                                                    <ShieldCheck size={20} />
                                                </div>
                                            )}
                                        </motion.button>
                                    </motion.div>

                                    <p className="text-center text-sm font-semibold text-gray-500">
                                        Didn't receive code? <button type="button" onClick={handleEmailSubmit} className="text-primary hover:underline">Resend</button>
                                    </p>
                                </form>
                            </motion.div>
                        )}

                        {step === 'RESET' && (
                            <motion.div
                                key="step-reset"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <motion.div variants={itemVariants} className="mb-9">
                                    <h2 className="text-[2.5rem] font-semibold text-gray-900 leading-tight mb-3">New password.</h2>
                                    <p className="text-gray-500 font-medium tracking-tight">Choose a strong, unique password to secure your account.</p>
                                </motion.div>

                                <form onSubmit={handleResetSubmit} className="space-y-4">
                                    <motion.div variants={itemVariants}>
                                        <FloatingInput
                                            label="New Password"
                                            icon={Lock}
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            showPassword={showNewPassword}
                                            setShowPassword={setShowNewPassword}
                                        />
                                    </motion.div>
                                    <motion.div variants={itemVariants}>
                                        <FloatingInput
                                            label="Confirm New Password"
                                            icon={Lock}
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            showPassword={showConfirmPassword}
                                            setShowPassword={setShowConfirmPassword}
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <motion.button
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            className="w-full py-3 active-nav-item text-white rounded-full text-lg font-medium shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:bg-gray-400"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <span>Update Password</span>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        )}

                        {step === 'SUCCESS' && (
                            <motion.div
                                key="step-success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-md"
                                >
                                    <CheckCircle2 className="text-green-500" size={48} />
                                </motion.div>
                                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Password Updated!</h2>
                                <p className="text-gray-500 font-medium leading-relaxed mb-10">
                                    Your account security has been restored. You can now use your new password to sign in to your workspace.
                                </p>
                                <Link
                                    to="/login"
                                    className="block w-full py-4 bg-primary text-white rounded-full text-lg font-medium shadow-xl shadow-primary/10 hover:bg-primary-hover transition-transform"
                                >
                                    Back to Login
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Info */}
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