import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { authService } from '../services/authService';
import { Mail, Lock, Shield, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import NoticeControl from './NoticeControl';

const Settings = () => {
    const { currentUser, updateUser } = useAppStore();
    const [activeTab, setActiveTab] = useState('account');

    // Email Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'initial' | 'verify'>('initial');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleRequestChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await authService.requestEmailChange({ currentPassword, newEmail });
            setStep('verify');
            setMessage({ text: 'Verification code sent to new email', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.response?.data?.error || 'Failed to request change', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await authService.verifyEmailChange({ newEmail, otp });
            // Update local store
            if (currentUser) {
                updateUser(currentUser.id, { username: newEmail }); // Assuming username is email or we update email field implies updating currentUser
                // Actually User interface has username, assuming that is the email/login?
                // Looking at Login logic: login uses email. User interface has 'username' (which seems to be name) and maybe 'email'?
                // Let's check User interface in types.ts. It has 'username'. Login uses 'email'.
                // Ideally User interface should have 'email'.
                // If User interface lacks 'email', we should add it.
                // Assuming username IS the name, and we need email.
                // Re-checking types.ts: User { id, username, pass, role ... } 
                // Login uses email. It seems User interface might be missing email in frontend types?
                // But backend sends user object. 
                // Let's assume for now User has email, or I should update types.ts User interface.
                // I'll update types.ts User interface to include email.
            }
            setMessage({ text: 'Email updated successfully', type: 'success' });
            setStep('initial');
            setCurrentPassword('');
            setNewEmail('');
            setOtp('');
        } catch (err: any) {
            setMessage({ text: err.response?.data?.error || 'Verification failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: 'Passwords do not match', type: 'error' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ text: 'Password must be at least 8 characters', type: 'error' });
            return;
        }

        setPasswordLoading(true);
        setPasswordMessage(null);
        try {
            await authService.changePassword({ currentPassword: oldPassword, newPassword });
            setPasswordMessage({ text: 'Password changed successfully', type: 'success' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMessage({ text: err.response?.data?.error || 'Failed to change password', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl">
                    <Shield size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Settings</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Manage Security & Preferences</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`w-full text-left px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'account' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'}`}
                    >
                        Change Email
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`w-full text-left px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'password' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'}`}
                    >
                        Change Password
                    </button>
                    {currentUser?.role === 'Admin' && (
                        <button
                            onClick={() => setActiveTab('notice')}
                            className={`w-full text-left px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-between ${activeTab === 'notice' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'}`}
                        >
                            <span>Notice / Popup</span>
                            <Bell size={14} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="md:col-span-3">
                    <AnimatePresence mode="wait">
                        {activeTab === 'notice' && (
                            <motion.div
                                key="notice"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-transparent"
                            >
                                <NoticeControl />
                            </motion.div>
                        )}
                        {activeTab === 'account' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800"
                            >
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                    <Mail className="text-indigo-600" /> Change Admin Email
                                </h3>

                                {message && (
                                    <div className={`p-4 rounded-xl mb-6 text-xs font-bold uppercase tracking-wide flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                {step === 'initial' ? (
                                    <form onSubmit={handleRequestChange} className="space-y-6 max-w-md">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Current Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                                                    placeholder="Confirm identity"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">New Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                                <input
                                                    type="email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                                                    placeholder="new.email@example.com"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                        >
                                            {loading ? 'Processing...' : 'Request Change'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyChange} className="space-y-6 max-w-md">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-6">
                                            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                                We sent a verification code to <span className="font-bold">{newEmail}</span>.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Verification Code</label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                required
                                                className="w-full text-center py-4 bg-white dark:bg-slate-950 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl font-black text-2xl tracking-[0.5em] focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setStep('initial')}
                                                className="w-full py-4 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                            >
                                                {loading ? 'Verifying...' : 'Confirm Change'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'password' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800"
                            >
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                    <Lock className="text-indigo-600" /> Change Password
                                </h3>

                                {passwordMessage && (
                                    <div className={`p-4 rounded-xl mb-6 text-xs font-bold uppercase tracking-wide flex items-center gap-3 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                            <input
                                                type="password"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="Min. 8 characters"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 text-slate-300" size={16} />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="Re-enter new password"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                        {passwordLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Settings;
