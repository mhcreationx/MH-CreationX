import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { Search, Plus, Wallet, Clock, CheckCircle2, PlayCircle, LogIn, ChevronDown, Filter, Phone, Mail, MapPin, ShieldAlert, BadgeCheck, X, Image as ImageIcon, MonitorPlay, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import { ProjectStatus, PaymentStatus } from '../types';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

const FluidSlider = ({ projects }: { projects: any[] }) => {
  // Now explicitly filtering by the new showInAnimation flag
  const posters = useMemo(() => {
    const ts = (p: any) => {
      const d = p?.createDate || p?.created_at || p?.updated_at || p?.createdAt;
      const t = d ? new Date(d).getTime() : NaN;
      return Number.isFinite(t) ? t : 0;
    };
    const latestSelected = projects
      .filter(p => p.showInAnimation)
      .sort((a, b) => ts(b) - ts(a))
      .slice(0, 15);
    return latestSelected.flatMap(p => p.images.filter((img: any) => img.type === 'poster'));
  }, [projects]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (posters.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % posters.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [posters.length]);

  if (posters.length === 0) return null;

  const getIndex = (offset: number) => (index + offset + posters.length) % posters.length;

  return (
    <div className="relative w-full overflow-hidden no-print py-12 md:py-20 bg-indigo-600/5 dark:bg-indigo-950/10 border-y border-white/60 dark:border-white/10 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-4 relative flex items-center justify-center h-[380px] sm:h-[480px] md:h-[650px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`main-${index}`}
            initial={{ x: '100%', opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-100%', opacity: 0, scale: 0.8 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-30 w-full max-w-[260px] sm:max-w-[340px] md:max-w-[480px] aspect-[3546/4433] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_32px_96px_-16px_rgba(15,23,42,0.4)] border-4 border-white/80 dark:border-white/20"
          >
            <img src={posters[getIndex(0)].url} className="w-full h-full object-cover" alt="Hero Main" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-10 text-white">
              <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] opacity-80 text-cyan-300">Featured Asset</span>
              <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight">MH Creation X Masterpiece</h2>
            </div>
          </motion.div>

          <motion.div
            key={`next-${index}`}
            initial={{ x: '150%', opacity: 0 }}
            animate={{ x: '75%', opacity: 0.25 }}
            exit={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-20 w-full max-w-[200px] sm:max-w-[260px] md:max-w-[360px] aspect-[3546/4433] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden blur-[4px] scale-90 hidden sm:block border-2 border-white/30"
          >
            <img src={posters[getIndex(1)].url} className="w-full h-full object-cover" alt="Hero Next" loading="lazy" />
            <div className="absolute inset-0 glass opacity-40" />
          </motion.div>

          <motion.div
            key={`prev-${index}`}
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: '-75%', opacity: 0.25 }}
            exit={{ x: '-150%', opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-20 w-full max-w-[200px] sm:max-w-[260px] md:max-w-[360px] aspect-[3546/4433] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden blur-[4px] scale-90 hidden sm:block border-2 border-white/30"
          >
            <img src={posters[getIndex(-1)].url} className="w-full h-full object-cover" alt="Hero Prev" loading="lazy" />
            <div className="absolute inset-0 glass opacity-40" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 md:mt-12 flex justify-center gap-2 md:gap-3 px-4 flex-wrap">
        {posters.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
              index === i
                ? 'w-8 md:w-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-indigo-600/50'
                : 'w-2 md:w-3 bg-slate-300/80 dark:bg-slate-700/80 hover:bg-slate-400'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { projects, currentUser, currentCustomer, isAuthenticated, setShowLoginModal, loadInitialData } = useAppStore();

  const now = new Date();

  // Animations from About Page
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseX.set(clientX - centerX);
    mouseY.set(clientY - centerY);
  };

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    // Load projects on mount (public or auth)
    loadInitialData();
  }, [loadInitialData]);

  const [displayLimit, setDisplayLimit] = useState(6);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'remaining' | 'paid' | 'unpaid' | 'inAnimation' | 'inPrevious'>('all');
  const isAdmin = currentUser?.role === 'Admin';
  const isTeam = currentUser?.role === 'Team';
  const isStaff = !!currentUser;

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(now.getMonth() + 1);

  const [searchTerm, setSearchTerm] = useState('');

  const years = useMemo(() => {
    const yrs = projects
      .map(p => p.createDate)
      .filter(Boolean)
      .map(d => new Date(d as any).getFullYear());
    const uniq = Array.from(new Set(yrs));
    uniq.sort((a, b) => b - a);
    return uniq.length ? uniq : [now.getFullYear()];
  }, [projects, now]);

  const matchesDateFilter = (p: any) => {
    if (!p.createDate) return false;
    if (selectedMonth === 'all') return true;
    const d = new Date(p.createDate);
    return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
  };

  const filteredProjects = useMemo(() => projects
    .filter(p => {
      const belongsToUser = isAdmin || (isTeam && p.created_by === currentUser?.id) || (currentCustomer && p.customerId === currentCustomer.id);
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.customerId || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = matchesDateFilter(p);

      let matchesFilter = true;
      if (statusFilter === 'pending') matchesFilter = p.status === ProjectStatus.PENDING;
      if (statusFilter === 'remaining') matchesFilter = p.paymentStatus !== PaymentStatus.PAID;
      if (statusFilter === 'paid') matchesFilter = p.paymentStatus === PaymentStatus.PAID;
      if (statusFilter === 'unpaid') matchesFilter = p.paymentStatus === PaymentStatus.UNPAID;
      if (statusFilter === 'inAnimation') matchesFilter = !!p.showInAnimation;
      if (statusFilter === 'inPrevious') matchesFilter = !!p.showInPrevious;

      // Public home page now respects the showInPrevious flag for the main grid
      if (!isAuthenticated) return p.showInPrevious && matchesSearch;

      return belongsToUser && matchesSearch && matchesFilter && matchesDate;
    })
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime()),
    [projects, isAdmin, currentCustomer, currentUser?.id, isTeam, searchTerm, statusFilter, isAuthenticated, selectedYear, selectedMonth]
  );

  const visibleProjects = filteredProjects.slice(0, displayLimit);

  const [previewProject, setPreviewProject] = useState<any | null>(null);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  useEffect(() => {
    if (!previewProject) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewProject(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [previewProject]);

  const stats = useMemo(() => {
    const relevantProjects = isAdmin
      ? projects
      : isTeam
        ? projects.filter(p => p.created_by === currentUser?.id)
        : projects.filter(p => currentCustomer && p.customerId === currentCustomer.id);

    const relevantProjectsByDate = relevantProjects.filter(matchesDateFilter);

    const totalContractValue = relevantProjectsByDate.reduce((acc, p) => acc + (p.price || 0), 0);
    const totalPaid = relevantProjectsByDate.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const totalDue = Math.max(0, totalContractValue - totalPaid);
    const pendingCount = relevantProjectsByDate.filter(p => p.status === ProjectStatus.PENDING).length;
    const runningCount = relevantProjectsByDate.filter(p => p.status === ProjectStatus.RUNNING).length;
    const completedCount = relevantProjectsByDate.filter(p => p.status === ProjectStatus.DELIVERED).length;
    // Keep totalEarnings key for backward compatibility in the UI; it represents total contract value.
    return { totalEarnings: totalContractValue, totalAdvance: totalPaid, totalDue, pendingCount, runningCount, completedCount };
  }, [projects, isAdmin, isTeam, currentCustomer, currentUser?.id, selectedYear, selectedMonth]);

  return (
    <div className="flex flex-col w-full min-h-screen no-print" onMouseMove={handleMouseMove}>

      {!isAuthenticated && (
        <div className="pt-24 md:pt-36 pb-12 text-center overflow-hidden px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="space-y-4"
          >
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="text-4xl sm:text-6xl md:text-[10rem] font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none"
            >
              MH Creation<motion.span
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 200, damping: 10 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 inline-block drop-shadow-sm"
              >X</motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: ['0.1em', '0.8em', '0.8em'] }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut", times: [0, 0.5, 1] }}
              className="text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] sm:text-sm md:text-xl tracking-[0.5em] md:tracking-[0.8em] pl-1 md:pl-2"
            >
              Designer By Moazzem Hossen
            </motion.p>
          </motion.div>
        </div>
      )}

      {!isAuthenticated && <FluidSlider projects={projects} />}

      {!isAuthenticated && (
        <section className="relative h-auto md:h-screen flex items-center justify-center overflow-hidden py-12 md:py-24">
          <motion.div
            style={{ y: y1, opacity: opacityHero }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent mix-blend-overlay"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>
          </motion.div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mb-8"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Established 2022</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.1]">
                Crafting <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Digital Legacy</span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mb-10 leading-relaxed font-medium">
                MH Creation X is a premier design and production studio founded by Moazzem Hossen. We blend cinematic storytelling with cutting-edge visual design.
              </p>

              <div className="flex gap-6">

                <motion.a
                  href="mailto:mhcreationx@gmail.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="liquid-glass-card px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-900 dark:text-white shadow-xl hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Start Collaboration
                </motion.a>
              </div>
            </motion.div>

            <motion.div
              style={{ x: springX, y: springY }}
              className="relative hidden md:block"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 transform rotate-[-5deg] hover:rotate-0 transition-all duration-500">
                {/* Use DTLS images */}
                <img src="/DTLS/PHOTO-1.jpg" alt="Moazzem Hossen" className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <div>
                    <p className="text-white font-black text-xl">Moazzem Hossen</p>
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Founder & Creative Director</p>
                  </div>
                </div>
              </div>

              {/* Floating Element - Transparent PNG */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-10 w-48 z-20"
              >
                <img src="/DTLS/MH-Logo-Dark.png" alt="Logo" className="w-full h-auto drop-shadow-2xl opacity-90 dark:invert" />
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      <div className={`w-full mx-auto pb-40 px-4 sm:px-8 md:px-12 ${isAuthenticated ? 'max-w-[1500px] py-6' : 'max-w-none'}`}>

        {!isAuthenticated && (
          <div className="text-center space-y-12 mt-8 md:mt-16 mb-16 md:mb-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-6"
            >
              <button
                onClick={() => setShowLoginModal(true)}
                className="group relative px-8 py-4 rounded-2xl liquid-glass-card hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <LogIn size={18} className="group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 text-indigo-600 dark:text-indigo-400" />
                  <span>Authorized Login</span>
                </div>
              </button>
            </motion.div>
          </div>
        )}

        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10"
          >
            <StatusCard label="Pending Tasks" count={stats.pendingCount} icon={<Clock size={20} />} color="bg-amber-500" />
            <StatusCard label="Live Production" count={stats.runningCount} icon={<PlayCircle size={20} />} color="bg-indigo-600" />
            <StatusCard label="Final Delivery" count={stats.completedCount} icon={<CheckCircle2 size={20} />} color="bg-emerald-600" />
          </motion.div>
        )}

        <div className="flex flex-col xl:flex-row gap-10">
          <div className="flex-1 space-y-10">

            {isAuthenticated && (
              <div className="glass py-4 px-4 sm:px-6 rounded-[2rem] md:rounded-[2.5rem] flex flex-col gap-4 border border-white/60 dark:border-white/10 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search master records..."
                      className="w-full bg-white/50 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 rounded-[1.8rem] py-3.5 pl-14 pr-6 font-bold shadow-inner outline-none focus:border-indigo-500 transition-all text-sm md:text-base backdrop-blur-md"
                    />
                  </div>
                  {isStaff && (
                    <Link to="/add" className="w-full md:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-8 sm:px-10 py-3.5 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-3 shrink-0 transition-all active:scale-95 border border-white/20">
                      <Plus size={20} /> New Project
                    </Link>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="w-full sm:w-auto bg-white/50 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 rounded-[1.5rem] py-2.5 px-6 font-black shadow-inner outline-none focus:border-indigo-500 transition-all text-[11px] uppercase tracking-widest backdrop-blur-md"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedMonth(v === 'all' ? 'all' : parseInt(v, 10));
                    }}
                    className="w-full sm:w-auto bg-white/50 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 rounded-[1.5rem] py-2.5 px-6 font-black shadow-inner outline-none focus:border-indigo-500 transition-all text-[11px] uppercase tracking-widest backdrop-blur-md"
                  >
                    <option value="all">All</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(`${selectedYear}-${String(m).padStart(2, '0')}-01`).toLocaleDateString('en-US', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 border-t border-slate-200/50 dark:border-slate-800/60 pt-3">
                  <Filter size={14} className="text-slate-400 mr-2" />
                  <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All Assets" />
                  <FilterButton active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} label="Pending" />
                  <FilterButton active={statusFilter === 'paid'} onClick={() => setStatusFilter('paid')} label="Paid" icon={<BadgeCheck size={12} />} />
                  <FilterButton active={statusFilter === 'unpaid'} onClick={() => setStatusFilter('unpaid')} label="Unpaid" icon={<ShieldAlert size={12} />} />
                  <FilterButton active={statusFilter === 'remaining'} onClick={() => setStatusFilter('remaining')} label="Remaining" />
                  <FilterButton active={statusFilter === 'inAnimation'} onClick={() => setStatusFilter('inAnimation')} label="In Animation" icon={<MonitorPlay size={12} />} />
                  <FilterButton active={statusFilter === 'inPrevious'} onClick={() => setStatusFilter('inPrevious')} label="In Previous" icon={<History size={12} />} />
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center space-y-4 mb-16 md:mb-24"
              >
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tight text-slate-900 dark:text-white"
                >
                  Previous Projects
                </motion.h2>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "auto" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="w-12 sm:w-16 md:w-24 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mx-auto rounded-full shadow-md shadow-indigo-600/30"
                />
              </motion.div>
            )}

            <motion.div
              layout
              className={`grid gap-6 md:gap-12 ${isAuthenticated ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}
            >
              <AnimatePresence mode="popLayout">
                {visibleProjects.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="w-full"
                  >
                    {isAuthenticated ? (
                      <ProjectCard project={p} />
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setPreviewProject(p);
                          setPreviewActiveIndex(0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreviewProject(p);
                            setPreviewActiveIndex(0);
                          }
                        }}
                        className="block w-full text-left cursor-pointer focus:outline-none"
                      >
                        <ProjectCard project={p} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleProjects.length === 0 && (
                <div className="col-span-full p-12 sm:p-20 text-center glass rounded-[2.5rem] md:rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] opacity-40">No system entries found</p>
                </div>
              )}
            </motion.div>

            <AnimatePresence>
              {!isAuthenticated && previewProject && (() => {
                const images = Array.isArray(previewProject.images) ? previewProject.images : [];
                const posters = images.filter((img: any) => img.type === 'poster');
                const others = images.filter((img: any) => img.type !== 'poster');
                const ordered = [...posters, ...others];
                const active = ordered[previewActiveIndex] || ordered[0];
                const canPrev = previewActiveIndex > 0;
                const canNext = previewActiveIndex < ordered.length - 1;

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-modal bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
                    onClick={() => setPreviewProject(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setPreviewProject(null);
                      if (e.key === 'ArrowLeft' && canPrev) setPreviewActiveIndex(i => i - 1);
                      if (e.key === 'ArrowRight' && canNext) setPreviewActiveIndex(i => i + 1);
                    }}
                    tabIndex={0}
                    ref={(el) => el?.focus()}
                  >
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setPreviewProject(null)}
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                      title="Close"
                    >
                      <X size={22} />
                    </button>

                    {/* Title */}
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Preview</p>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate max-w-[50vw]">{previewProject.title}</h3>
                    </div>

                    {/* Main image area */}
                    <div className="flex-1 flex items-center justify-center w-full relative px-16" onClick={(e) => e.stopPropagation()}>
                      {/* Left arrow */}
                      {canPrev && (
                        <button
                          type="button"
                          onClick={() => setPreviewActiveIndex(i => i - 1)}
                          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>
                      )}

                      {active ? (
                        <motion.img
                          key={active.url}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          src={active.url}
                          alt={active.type || 'Preview'}
                          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                        />
                      ) : (
                        <div className="w-full h-[40vh] flex flex-col items-center justify-center text-white/20">
                          <ImageIcon size={48} />
                          <p className="mt-4 text-xs font-bold">No images</p>
                        </div>
                      )}

                      {/* Right arrow */}
                      {canNext && (
                        <button
                          type="button"
                          onClick={() => setPreviewActiveIndex(i => i + 1)}
                          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {ordered.length > 1 && (
                      <div className="w-full flex justify-center gap-2 sm:gap-3 py-4 sm:py-6 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                        {ordered.map((img: any, idx: number) => (
                          <button
                            key={img.id || `${img.url}-${idx}`}
                            type="button"
                            onClick={() => setPreviewActiveIndex(idx)}
                            className={`relative shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === previewActiveIndex
                              ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.3)]'
                              : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                              }`}
                          >
                            <img src={img.url} alt={img.type} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {filteredProjects.length > displayLimit && (
              <div className="flex justify-center pt-12 md:pt-20">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 6)}
                  className="group flex items-center gap-4 sm:gap-6 liquid-glass-card px-8 sm:px-14 py-4 sm:py-7 rounded-[2rem] md:rounded-[3rem] font-black uppercase text-[10px] md:text-xs tracking-[0.4em] shadow-xl hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 cursor-pointer"
                >
                  Explore More <ChevronDown className="group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="w-full xl:w-[360px] shrink-0 self-start xl:sticky xl:top-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6 sm:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-white/10 space-y-8 max-h-[calc(100vh-7rem)] overflow-y-auto"
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                  <Wallet size={16} className="text-indigo-500" /> Financial Dashboard
                </h4>
                <div className="space-y-4 md:space-y-5">
                  <VerticalSummary label="Total Potential" value={stats.totalEarnings} color="text-emerald-500" bg="bg-emerald-50/10" />
                  <VerticalSummary label="Revenue Cleared" value={stats.totalAdvance} color="text-indigo-500" bg="bg-indigo-50/10" />
                  <VerticalSummary label="Accounts Receivable" value={stats.totalDue} color="text-rose-500" bg="bg-rose-50/10" />
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <footer className="mt-40 border-t border-white/60 dark:border-white/10 glass py-16 md:py-24 px-6 md:px-10">
          <div className="max-w-7xl mx-auto space-y-16 md:y-20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tighter">MH Creation X</span>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mt-1">Premium Production Engine</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-md">
                  The leading design solution for high-end cinematic visual assets. Specializing in natok posters, movie thumbnails, and professional digital identity.
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Secure Channels</h4>
                <ul className="space-y-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">
                  <li className="flex items-center gap-3"><Phone size={14} className="text-indigo-600 dark:text-indigo-400" /> +880 1768 443633</li>
                  <li className="flex items-center gap-3"><Mail size={14} className="text-indigo-600 dark:text-indigo-400" /> mhcreationx@gmail.com</li>
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Headquarters</h4>
                <ul className="space-y-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">
                  <li className="flex items-center gap-3"><MapPin size={14} className="text-indigo-600 dark:text-indigo-400" /> Dhaka, Bangladesh</li>
                  <li className="text-slate-400 font-bold opacity-60">Established 2024</li>
                </ul>
              </div>
            </div>

            <div className="pt-10 md:pt-12 border-t border-slate-200/50 dark:border-slate-800/60 text-center">
              <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                © {new Date().getFullYear()} MH Creation X
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const FilterButton = ({ active, onClick, label, icon }: any) => (
  <button
    onClick={onClick}
    className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-2 ${
      active
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 border border-white/20'
        : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30'
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatusCard = ({ label, count, icon, color }: any) => (
  <div className="liquid-glass-card p-6 md:p-7 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 sm:gap-6 md:gap-7 group hover:border-indigo-500/40 transition-all duration-300">
    <div className={`w-12 h-12 md:w-14 md:h-14 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0 border border-white/20`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mt-0.5 text-slate-900 dark:text-white">{count}</h3>
    </div>
  </div>
);

const VerticalSummary = ({ label, value, color, bg }: any) => (
  <div className={`${bg} p-4 sm:p-6 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 transition-all hover:translate-x-1 shadow-sm`}>
    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{label}</p>
    <p className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tighter ${color}`}>৳{value.toLocaleString()}</p>
  </div>
);

export default Dashboard;