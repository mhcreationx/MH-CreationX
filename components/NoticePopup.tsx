import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { NoticeConfig, DEFAULT_NOTICE_CONFIG } from '../types/noticeTypes';
import { noticeService } from '../services/noticeService';

const SESSION_DISMISSED_KEY = 'mh_notice_dismissed';

export interface NoticePopupProps {
  config?: NoticeConfig;
  isOpen?: boolean;
  onClose?: () => void;
  isPreview?: boolean;
}

export const NoticePopup: React.FC<NoticePopupProps> = ({
  config: externalConfig,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  isPreview = false
}) => {
  // Determine if component is externally controlled (e.g. in Admin Preview)
  const isControlled = typeof externalIsOpen === 'boolean';

  // Internal state for standalone usage (e.g. in App.tsx)
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalConfig, setInternalConfig] = useState<NoticeConfig>(externalConfig || DEFAULT_NOTICE_CONFIG);
  const [loaded, setLoaded] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Standalone mode: load configuration and evaluate 'Once Per Session' visibility
  useEffect(() => {
    if (isControlled) return;

    let isMounted = true;

    const initNotice = async () => {
      try {
        const config = await noticeService.getNoticeConfig();
        if (!isMounted) return;

        setInternalConfig(config);
        setLoaded(true);

        // Check if notice is active and not dismissed in current session
        const isDismissedThisSession = sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true';
        const isNoticeActive = noticeService.isNoticeActive(config);

        if (isNoticeActive && !isDismissedThisSession) {
          // Slight delay for smooth entrance after page loads
          const timer = setTimeout(() => {
            if (isMounted) setInternalOpen(true);
          }, 350);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.warn('Notice initialization notice error:', err);
      }
    };

    initNotice();

    return () => {
      isMounted = false;
    };
  }, [isControlled]);

  // Keep internal config updated if externalConfig changes
  useEffect(() => {
    if (externalConfig) {
      setInternalConfig(externalConfig);
    }
  }, [externalConfig]);

  const isOpen = isControlled ? externalIsOpen : internalOpen;
  const activeConfig = externalConfig || internalConfig;

  // Auto-close duration & timer
  const autoCloseEnabled = !!activeConfig.autoCloseEnabled;
  const autoCloseDuration = Math.max(1, activeConfig.autoCloseDuration || 10);
  const [secondsLeft, setSecondsLeft] = useState<number>(autoCloseDuration);

  // Reset timer when popup opens or duration changes
  useEffect(() => {
    if (isOpen && autoCloseEnabled) {
      setSecondsLeft(autoCloseDuration);
    }
  }, [isOpen, autoCloseEnabled, autoCloseDuration]);

  // Handle closing the popup
  const handleClose = () => {
    if (!isPreview) {
      // Mark as dismissed for the rest of this browser session ('Once Per Session' logic)
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      noticeService.recordNoticeDismissed(activeConfig);
    }

    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  // Run auto-close countdown timer
  useEffect(() => {
    if (!isOpen || !autoCloseEnabled) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoCloseEnabled, autoCloseDuration, isPreview]);

  // Close on ESC key & Accessibility focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button for accessibility
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Prevent background scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // If no image URL, do not render
  if (!activeConfig.imageUrl) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Announcement notice"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          {/* Background Overlay: Dark transparent with subtle blur
              Clicking outside does NOT close the popup (as requested) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[12px]"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Popup Container: Fluid responsive scale up to max-w-[90vw] & max-h-[85vh] */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[90vw] lg:max-w-[1080px] max-h-[85vh] flex flex-col items-center justify-center"
          >
            {/* Admin Preview Badge (only in preview mode) */}
            {isPreview && (
              <div className="mb-2 px-4 py-1 rounded-full bg-amber-500/90 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg flex items-center gap-2">
                <span>Preview Mode — Visitor Simulation</span>
              </div>
            )}

            {/* Notice Card Frame with Premium Borderless Liquid Glass Styling */}
            <div
              className="relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col transition-all duration-300"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.40)'
              }}
            >
              
              {/* Optional Progress Countdown Bar at the top if auto-close is enabled */}
              {autoCloseEnabled && (
                <div className="w-full h-[2px] bg-white/[0.04] overflow-hidden">
                  <motion.div
                    key={`progress-${autoCloseDuration}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(secondsLeft / autoCloseDuration) * 100}%` }}
                    transition={{ duration: 0.95, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-white/30 via-indigo-400/60 to-white/70"
                  />
                </div>
              )}

              {/* Top-Right Glass Circular Close Button (Subtle, semi-transparent, no heavy border) */}
              <button
                ref={closeBtnRef}
                type="button"
                onClick={handleClose}
                aria-label="Close notice"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/[0.18] active:scale-95 text-white/85 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
              </button>

              {/* 16:9 Aspect Ratio Notice Image Container (100% sharp original image, zero filter on image) */}
              <div className="relative w-full aspect-[16/9] flex items-center justify-center bg-black/40 select-none overflow-hidden">
                <img
                  src={activeConfig.imageUrl}
                  alt="Announcement notice"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  loading="eager"
                  decoding="async"
                />
              </div>

              {/* Bottom Glass Control Bar with Minimal CLOSE Button and optional Auto-Close Countdown */}
              <div
                className="w-full py-3 sm:py-3.5 px-4 flex flex-col sm:flex-row items-center justify-center gap-3 relative"
                style={{
                  backgroundColor: 'rgba(10, 15, 28, 0.50)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)'
                }}
              >
                
                {/* Auto-Close Countdown Badge if enabled */}
                {autoCloseEnabled && (
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                    className="sm:absolute sm:left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-slate-300 text-[11px] font-medium tracking-wider backdrop-blur-sm"
                  >
                    <Clock size={12} className="text-white/60 animate-pulse" />
                    <span>Auto-closes in {secondsLeft}s</span>
                  </div>
                )}

                {/* Primary Minimal Glass CLOSE Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close notice"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                  className="px-8 sm:px-11 py-2 sm:py-2.5 rounded-full hover:bg-white/[0.14] active:scale-95 text-white/90 hover:text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/30 flex items-center gap-2"
                >
                  <X size={15} />
                  <span>CLOSE</span>
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoticePopup;
