
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import {
  LayoutDashboard, LogOut, Sun, Moon, Users,
  Shield, UserCheck, DollarSign, User as UserIcon, Receipt, Menu, X, Activity, BarChart3, Phone, Mail, LogIn, Eye, EyeOff, MessageSquare, Bell
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceOTPModal from './DeviceOTPModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ChatWidget from './ChatWidget';
import { chatService } from '../services/chatService';

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated, authType, login, loginCustomer, logout, theme, toggleTheme,
    currentUser, updateUser, showLoginModal, setShowLoginModal, currentCustomer, projects, customers
  } = useAppStore();
  const location = useLocation();
  const [isAdminMode, setIsAdminMode] = useState(false); // Default to client access
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [unreadSmsCount, setUnreadSmsCount] = useState(0);

  // Poll SMS unread count and send heartbeat if staff is authenticated
  useEffect(() => {
    if (!isAuthenticated || authType !== 'staff') return;

    const checkSms = async () => {
      try {
        const data = await chatService.getAdminConversations('active');
        setUnreadSmsCount(data.totalUnread || 0);
      } catch (e) {
        // Silent catch for background polling
      }
    };

    checkSms();
    const interval = setInterval(checkSms, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, authType]);

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const customerPreview = !isAdminMode
    ? customers?.find(c => c.id?.toLowerCase() === customerId.trim().toLowerCase())
    : null;

  useEffect(() => {
    // Check system preference on mount
    if (!localStorage.getItem('mh_theme')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    if (isAdminMode) {
      try {
        await login({ email, password }); // Fixed: backend expects 'email' field
        setShowLoginModal(false);
        setEmail('');
        setPassword('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid credentials');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      if (await loginCustomer(customerId)) {
        setShowLoginModal(false);
        setCustomerId('');
      } else {
        setError('Invalid Customer ID');
      }
      setIsLoggingIn(false);
    }
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser(currentUser.id, { profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = currentUser?.role === 'Admin';
  const isStaff = !!currentUser;
  const isCustomerAuth = !currentUser && !!currentCustomer;
  const isHomePage = location.pathname === '/' || location.pathname === '/projects';
  const showSidebar = isAuthenticated;

  const NavContent = () => (
    <>
      <div className="p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col group">
          <span className="font-black tracking-tighter text-2xl leading-none text-slate-900 dark:text-white">MH Creation X</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-1">Official Workspace</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-rose-500 cursor-pointer">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 mb-4">Operations</p>
        <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Workspace" active={isHomePage} onClick={() => setIsMobileMenuOpen(false)} />
        <NavLink to="/about" icon={<Users size={20} />} label="About Studio" active={location.pathname === '/about'} onClick={() => setIsMobileMenuOpen(false)} />
        {isStaff && (
          <>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 mt-10 mb-4">Master Control</p>
            <NavLink to="/sms" icon={<MessageSquare size={20} />} label="SMS / Messages" badge={unreadSmsCount} active={location.pathname === '/sms'} onClick={() => setIsMobileMenuOpen(false)} />
            <NavLink to="/customers" icon={<Users size={20} />} label="Client Registry" active={location.pathname === '/customers'} onClick={() => setIsMobileMenuOpen(false)} />
            <NavLink to="/finance" icon={<DollarSign size={20} />} label="Treasury Hub" active={location.pathname === '/finance'} onClick={() => setIsMobileMenuOpen(false)} />
            <NavLink to="/analytics" icon={<BarChart3 size={20} />} label="Engagement" active={location.pathname === '/analytics'} onClick={() => setIsMobileMenuOpen(false)} />
            <NavLink to="/audit" icon={<Activity size={20} />} label="Audit Trail" active={location.pathname === '/audit'} onClick={() => setIsMobileMenuOpen(false)} />
            <NavLink to="/voucher" icon={<Receipt size={20} />} label="Ledger/Audit" active={location.pathname === '/voucher'} onClick={() => setIsMobileMenuOpen(false)} />
            {isAdmin && <NavLink to="/users" icon={<Shield size={20} />} label="Identities" active={location.pathname === '/users'} onClick={() => setIsMobileMenuOpen(false)} />}
            {isAdmin && <NavLink to="/notice" icon={<Bell size={20} />} label="Notice / Announcement" active={location.pathname === '/notice'} onClick={() => setIsMobileMenuOpen(false)} />}
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4 mt-10 mb-4">System</p>
            <NavLink to="/settings" icon={<UserIcon size={20} />} label="Settings" active={location.pathname === '/settings'} onClick={() => setIsMobileMenuOpen(false)} />
          </>
        )}
      </div>

      {isAuthenticated && (
        <div className="p-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 overflow-hidden shadow-lg border-2 border-white dark:border-slate-900 group-hover:scale-105 transition-transform">
                {currentUser?.profilePic ? (
                  <img
                    src={resolveImageUrl(currentUser.profilePic)}
                    className="w-full h-full object-cover"
                    alt="Profile"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '';
                    }}
                  />
                ) : currentCustomer?.profileImageUrl ? (
                  <img
                    src={resolveImageUrl(currentCustomer.profileImageUrl)}
                    className="w-full h-full object-cover"
                    alt="Profile"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white"><UserIcon size={24} /></div>
                )}
              </div>
              {isAdmin && <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />}
            </label>
            <div className="min-w-0">
              <p className="font-black text-sm truncate uppercase tracking-tighter">{currentUser?.username || currentCustomer?.name}</p>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                {isAdmin ? 'Master Administrator' : isCustomerAuth ? 'Verified Client' : 'Team Member'}
              </p>
            </div>
          </div>
          <button onClick={logout} className="w-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white transition-all cursor-pointer">
            <LogOut size={16} /> Terminate Session
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/80 text-slate-900 dark:text-white transition-colors duration-500">
      {/* Sidebar - Desktop */}
      {showSidebar && (
        <aside className="no-print hidden md:flex flex-col w-[320px] glass border-r border-white/60 dark:border-white/10 sticky top-0 h-screen z-sticky shadow-2xl backdrop-blur-2xl">
          <NavContent />
        </aside>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="no-print fixed inset-0 z-modal-backdrop md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute left-0 top-0 bottom-0 w-[300px] glass bg-white/95 dark:bg-slate-900/95 flex flex-col shadow-2xl border-r border-white/20">
              <NavContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 glass border-b border-white/60 dark:border-white/10 backdrop-blur-2xl h-20 px-6 md:px-10">
          <div className="flex items-center justify-between h-full w-full">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex flex-col">
                <span className="font-black tracking-tighter text-xl text-slate-900 dark:text-white bg-clip-text">MH Creation X</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button - Only on mobile when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors text-slate-600 dark:text-slate-400"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-2xl glass hover:border-indigo-500/40 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>

              {!isAuthenticated && (
                <button onClick={() => setShowLoginModal(true)} className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/20">
                  <LogIn size={16} /> Login
                </button>
              )}
            </div>
          </div>
        </header>



        {/* Content wrapper */}
        <div className={`pt-20 ${!isAuthenticated && isHomePage ? 'p-0' : 'p-6 md:p-12'} ${isAuthenticated ? 'pt-24 md:pt-28' : 'pt-20'}`}>
          {children}
        </div>

        <footer className="no-print border-t border-slate-200 dark:border-slate-800 glass py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a href="tel:+8801768443633" className="flex items-center gap-2 transition-colors hover:text-indigo-600">
                <Phone size={16} />
                +880 1768 443633
              </a>
              <a href="mailto:mhcreationx@gmail.com" className="flex items-center gap-2 transition-colors hover:text-indigo-600">
                <Mail size={16} />
                mhcreationx@gmail.com
              </a>
            </div>
            <div className="text-slate-400 text-center md:text-right text-xs">
              © {new Date().getFullYear()} MH Creation X
            </div>
          </div>
        </footer>
      </main>

      {/* Login Modal */}
      <DeviceOTPModal />
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-6 no-print">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLoginModal(false)} className="absolute inset-0 bg-slate-950/75 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md liquid-glass-card bg-white/90 dark:bg-slate-900/90 rounded-[3.5rem] p-10 md:p-12 shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden backdrop-blur-2xl">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"><X size={24} /></button>
              </div>

              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-purple-600/15 text-indigo-600 dark:text-indigo-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-inner">
                  {isAdminMode ? <Shield size={36} /> : <UserIcon size={36} />}
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase">{isAdminMode ? 'System Auth' : 'Client Access'}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Authorization Required</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {isAdminMode ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email or Username</label>
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                        placeholder="admin, designer, or email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-400">Demo password: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">admin123</code></span>
                        <button
                          type="button"
                          onClick={() => { setShowLoginModal(false); setShowForgotPassword(true); }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      {/* Quick Demo Staff Personas */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Quick Demo Personas:</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('mhcreationx@gmail.com');
                              setPassword('admin123');
                              setError('');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer transition-colors"
                          >
                            Admin (Moazzem)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('lulluvai.fb@gmail.com');
                              setPassword('admin123');
                              setError('');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-100 border border-purple-200/50 dark:border-purple-800/50 cursor-pointer transition-colors"
                          >
                            Owner (Lullu Vai)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmail('designer@mhcreationx.com');
                              setPassword('designer123');
                              setError('');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 border border-blue-200/50 dark:border-blue-800/50 cursor-pointer transition-colors"
                          >
                            Designer (Tanvir)
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Customer ID</label>
                    </div>
                    <input
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-center tracking-widest uppercase text-slate-900 dark:text-white"
                      placeholder="e.g. SHAR758 or NABIL902"
                    />

                    {/* Quick Demo Clients */}
                    <div className="pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Quick Demo Clients:</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setCustomerId('SHAR758'); setError(''); }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer transition-colors"
                        >
                          Sharif (SHAR758)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCustomerId('NABIL902'); setError(''); }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/50 dark:border-emerald-800/50 cursor-pointer transition-colors"
                        >
                          CineVerse (NABIL902)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCustomerId('PRIYA441'); setError(''); }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 hover:bg-violet-100 border border-violet-200/50 dark:border-violet-800/50 cursor-pointer transition-colors"
                        >
                          OTT Chorki (PRIYA441)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 overflow-hidden flex items-center justify-center text-white shadow-sm">
                          {customerPreview?.profileImageUrl ? (
                            <img
                              src={resolveImageUrl(customerPreview.profileImageUrl)}
                              className="w-full h-full object-cover"
                              alt={customerPreview.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '';
                              }}
                            />
                          ) : (
                            <UserIcon size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate uppercase tracking-tight">
                            {customerPreview?.name || 'Client Access'}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                            {customerPreview ? `ID: ${customerPreview.id}` : 'Enter your customer ID'}
                          </p>
                        </div>
                      </div>
                      {customerPreview?.type ? (
                        <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          {customerPreview.type}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                  {isLoggingIn ? 'Logging in...' : 'Sign In'}
                </button>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }}
                    className="w-full text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {isAdminMode ? 'Switch to Client Access' : 'Switch to Staff Login'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}

      {/* Floating Live SMS / Chat Widget - Persistent across all pages */}
      <ChatWidget />
    </div>
  );
};

const NavLink = ({ to, icon, label, active, onClick, badge }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${
      active
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-white/20 translate-x-1'
        : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border hover:border-white/40 dark:hover:border-white/10 hover:translate-x-1'
    }`}
  >
    <div className="flex items-center gap-4">
      {icon}
      <span>{label}</span>
    </div>
    {badge && badge > 0 ? (
      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
        {badge}
      </span>
    ) : null}
  </Link>
);

export default Layout;
