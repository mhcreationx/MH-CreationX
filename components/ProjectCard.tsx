import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { FC, MouseEvent } from 'react';
import { Project, PaymentStatus, PaymentMethod, ProjectStatus } from '../types';
import { useAppStore } from '../store';
import {
  Edit, Trash2, Eye, ExternalLink, Download, FileText, CreditCard, Calendar,
  Clock, User, DollarSign, Package, CheckCircle, XCircle, AlertCircle, Images, Activity,
  Printer, Edit3, Image as ImageIcon, Maximize2, UserCheck, Palette, UserCircle,
  DownloadCloud, X, ChevronLeft, ChevronRight, ShieldCheck, Banknote, Smartphone, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import ProjectActivityModal from './ProjectActivityModal';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { deleteProject, updateProject, currentUser, isAuthenticated, currentCustomer, authType } = useAppStore();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'Admin';
  const isTeam = !!currentUser && !isAdmin;
  const isCustomer = authType === 'customer';
  const isMasterAdmin = currentUser?.username === 'moazzem@mahi';

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.NONE);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [walletNumber, setWalletNumber] = useState('');

  const isPaid = project.paymentStatus === PaymentStatus.PAID;
  const actualDue = isPaid ? 0 : Math.max(0, project.price - project.paidAmount);

  const firstImage =
    project.images.find(img => img.type === 'poster') ||
    project.images.find(img => img.type === 'thumbnail') ||
    project.images[0];

  // ── Lightbox: scroll through images with mouse wheel ──────────────────────
  useEffect(() => {
    if (!showLightbox || project.images.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 15) {
        e.preventDefault();
        setActivePreviewIndex(prev =>
          e.deltaY > 0
            ? (prev + 1) % project.images.length
            : (prev - 1 + project.images.length) % project.images.length
        );
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [showLightbox, project.images.length]);

  // ── Lightbox: lock body scroll + ESC to close ──────────────────────────────
  useEffect(() => {
    if (!showLightbox) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLightbox(false);
      if (e.key === 'ArrowRight')
        setActivePreviewIndex(prev => (prev + 1) % project.images.length);
      if (e.key === 'ArrowLeft')
        setActivePreviewIndex(prev => (prev - 1 + project.images.length) % project.images.length);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showLightbox, project.images.length]);

  const openLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    setActivePreviewIndex(0);
    setShowLightbox(true);
  };

  const closeLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    setShowLightbox(false);
  };

  // ── Payment ────────────────────────────────────────────────────────────────
  const handlePaymentConfirm = () => {
    updateProject(project.id, {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: payMethod,
      paidAmount: project.price,
      advanceAmount: 0,
      paymentDetails: {
        method: payMethod,
        bankName,
        accountNumber,
        walletNumber,
      },
    });
    setShowPaymentModal(false);
    setBankName('');
    setAccountNumber('');
    setWalletNumber('');
  };

  const toggleStatus = () => {
    if (!isAdmin) return;
    if (project.paymentStatus === PaymentStatus.PAID) {
      updateProject(project.id, {
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod: PaymentMethod.NONE,
        paymentDetails: undefined,
      });
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleDelete = () => {
    if (!isAdmin) {
      alert('Unauthorized: Admin Access Required.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      deleteProject(project.id);
    }
  };

  const handleDownloadClick = (e: MouseEvent) => {
    e.preventDefault();
    if (isPaid) {
      if (project.downloadLink) {
        window.open(project.downloadLink, '_blank', 'noopener,noreferrer');
      } else {
        alert('Download link not provisioned for this project.');
      }
    } else {
      alert('Only Paid for Project Download Link.');
    }
  };

  // ── PUBLIC / UNAUTHENTICATED CARD ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col liquid-glass-card rounded-[3rem] overflow-hidden group h-full shadow-[0_20px_50px_-10px_rgba(79,70,229,0.07)] dark:shadow-[0_25px_60px_-15px_rgba(2,6,23,0.7)]"
      >
        <div className="p-6 space-y-8 flex flex-col h-full">
          {/* FIX: constrain image height so the card never blows up to full-screen */}
          <div className="w-full rounded-[2rem] overflow-hidden border-[4px] border-white/60 dark:border-slate-800/80 bg-slate-950 shadow-xl relative shrink-0 aspect-[3/4]">
            {firstImage ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 1.5 }}
                src={firstImage.url}
                className="w-full h-full object-cover block"
                alt="Exhibit"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                <ImageIcon size={48} className="opacity-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>

          <div className="space-y-4 text-center pb-4 flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] border border-indigo-500/20 mx-auto shadow-sm">
              <UserCheck size={14} className="text-indigo-500 dark:text-indigo-400" />
              <span>{project.director || 'Studio Master'}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight line-clamp-2 px-2">
              {project.title}
            </h3>

            {(project.designerName || project.assistantName) && (
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {project.designerName && (
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <Palette size={12} className="text-indigo-500/50" /> {project.designerName}
                  </span>
                )}
                {project.assistantName && (
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <UserCircle size={12} className="text-emerald-500/50" /> {project.assistantName}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic opacity-60 line-clamp-2 px-4">
              "{project.description}"
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── AUTHENTICATED CARD (Admin / Staff / Customer) ─────────────────────────
  const hasDownloadLink = !!project.downloadLink;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.008 }}
        className="flex flex-col md:flex-row liquid-glass-card rounded-2xl overflow-hidden group w-full relative transition-all"
      >
        {/* Left accent bar */}
        <div className={`hidden md:flex w-2 shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="flex-1 flex flex-col sm:flex-row p-5 gap-6 items-start">

          {/* Mobile action row (outside poster image area) */}
          <div className="w-full sm:hidden flex items-center justify-end gap-2 no-print">
            {hasDownloadLink && (
              <button
                onClick={handleDownloadClick}
                className={`p-2 rounded-lg transition-all ${
                  isPaid
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
                title={isPaid ? 'Download' : 'Payment Required'}
              >
                <DownloadCloud size={18} />
              </button>
            )}
            <button
              onClick={() => setShowActivityModal(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Activity"
            >
              <Activity size={18} />
            </button>
            <button
              onClick={() => navigate(`/cash-memo/${project.id}`)}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              title="Print"
            >
              <Printer size={18} />
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate(`/edit/${project.id}`)}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                title="Edit"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {/* Desktop/tablet action buttons */}
          <div className="hidden sm:flex absolute top-4 right-4 items-center gap-2 no-print z-10">
            {hasDownloadLink && (
              <button
                onClick={handleDownloadClick}
                className={`p-2 rounded-lg transition-all ${
                  isPaid
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
                title={isPaid ? 'Download' : 'Payment Required'}
              >
                <DownloadCloud size={18} />
              </button>
            )}
            <button
              onClick={() => setShowActivityModal(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Activity size={18} />
            </button>
            <button
              onClick={() => navigate(`/cash-memo/${project.id}`)}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Printer size={18} />
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate(`/edit/${project.id}`)}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {/* Thumbnail — FIX: e.stopPropagation so click doesn't bubble */}
          <div
            className="w-full sm:w-[120px] aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in relative group/img"
            onClick={openLightbox}
          >
            {firstImage ? (
              <img
                src={firstImage.url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                alt={project.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="flex-1 min-w-0 py-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isPaid ? 'Paid' : 'Unpaid'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                {project.category}
              </span>
              <span className="text-[10px] text-slate-400">#{project.id.split('-')[1]}</span>
            </div>

            <h3
              className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 truncate"
              title={project.title}
            >
              {project.title}
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
              {project.description}
            </p>

            {isAdmin && ((project as any).createdByName || (project as any).createdByEmail) && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Owner: {(project as any).createdByName || (project as any).createdByEmail}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Price</p>
                <p className={`text-xl font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳{project.price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Advance</p>
                <p className="text-xl font-bold text-emerald-600">
                  ৳{(project.advanceAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Deadline</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date(project.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right action column */}
        <div className="w-full md:w-32 flex flex-row md:flex-col shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
          {isCustomer ? (
            <div className="flex-1 p-4 flex flex-col items-center justify-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
              <p className={`text-sm font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPaid ? '✓ Paid' : 'Pending'}
              </p>
              {project.downloadLink && isPaid && (
                <button
                  onClick={handleDownloadClick}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2"
                >
                  <DownloadCloud size={14} />
                  Download
                </button>
              )}
            </div>
          ) : (
            <>
              {isAdmin && (
                <>
                  <button
                    onClick={toggleStatus}
                    className={`flex-1 w-full text-[10px] font-bold uppercase tracking-wider transition-all p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 ${
                      isPaid ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-4 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center border-l md:border-l-0 md:border-t border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              {isTeam && (
                <div className="flex-1 w-full p-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Restricted
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── LIGHTBOX ── FIX: renamed isPosterHovered → showLightbox, z-[9999] */}
      <AnimatePresence>
        {showLightbox && project.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white p-4 z-10"
              onClick={closeLightbox}
            >
              <X size={32} />
            </button>

            {/* Arrow navigation */}
            {project.images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-black/30 rounded-full z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePreviewIndex(prev => (prev - 1 + project.images.length) % project.images.length);
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-black/30 rounded-full z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePreviewIndex(prev => (prev + 1) % project.images.length);
                  }}
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <img
              src={project.images[activePreviewIndex].url}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Thumbnail strip */}
            {project.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto p-4">
                {project.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePreviewIndex(i);
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activePreviewIndex === i ? 'border-white' : 'border-transparent opacity-50 hover:opacity-75'
                    }`}
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVITY MODAL ── FIX: z-[9999] so it renders above everything */}
      <ProjectActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        projectId={project.id}
        title={project.title}
      />

      {/* ── PAYMENT MODAL ── FIX: z-[9999] */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-10 bg-slate-950/95 backdrop-blur-3xl overflow-y-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[4rem] w-full max-w-3xl shadow-[0_0_160px_rgba(0,0,0,0.8)] border border-white/10 text-center"
          >
            <h3 className="text-4xl font-black tracking-tighter mb-12 uppercase text-slate-900 dark:text-white flex items-center justify-center gap-4">
              <ShieldCheck size={32} className="text-indigo-500" /> Treasury Settlement
            </h3>

            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: PaymentMethod.CASH,   icon: <Banknote size={20} />,   label: 'Cash'   },
                  { id: PaymentMethod.BKASH,  icon: <Smartphone size={20} />, label: 'bKash'  },
                  { id: PaymentMethod.NAGAD,  icon: <Smartphone size={20} />, label: 'Nagad'  },
                  { id: PaymentMethod.ROCKET, icon: <Smartphone size={20} />, label: 'Rocket' },
                  { id: PaymentMethod.BANK,   icon: <Landmark size={20} />,   label: 'Bank'   },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id as PaymentMethod)}
                    className={`p-6 rounded-[2rem] border-4 flex flex-col items-center gap-2 transition-all ${
                      payMethod === m.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl scale-105'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-500/30'
                    }`}
                  >
                    {m.icon}
                    <span className="font-black uppercase text-[10px] tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {payMethod === PaymentMethod.BANK && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <input
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="Enter Bank Name (e.g. Dutch Bangla)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500"
                    />
                    <input
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500"
                    />
                  </motion.div>
                )}

                {[PaymentMethod.BKASH, PaymentMethod.NAGAD, PaymentMethod.ROCKET].includes(payMethod) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <input
                      value={walletNumber}
                      onChange={e => setWalletNumber(e.target.value)}
                      placeholder={`${payMethod} Wallet Number`}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handlePaymentConfirm}
                  disabled={payMethod === PaymentMethod.NONE}
                  className="w-full bg-emerald-600 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all text-xs flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={24} /> Finalize Settlement
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-rose-500 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ProjectCard;