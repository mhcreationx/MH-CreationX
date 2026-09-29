import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Upload,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  Save,
  Image as ImageIcon,
  Timer
} from 'lucide-react';
import { NoticeConfig, DEFAULT_NOTICE_CONFIG } from '../types/noticeTypes';
import { noticeService } from '../services/noticeService';
import NoticePopup from './NoticePopup';
import { useAppStore } from '../store';

export const NoticeControl: React.FC = () => {
  const { currentUser } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<NoticeConfig>(DEFAULT_NOTICE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const data = await noticeService.getNoticeConfig();
        if (isMounted) {
          setConfig(data);
        }
      } catch (err: any) {
        console.error('Failed to load notice config:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleEnabled = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleToggleAlwaysActive = () => {
    setConfig(prev => ({ ...prev, alwaysActive: !prev.alwaysActive }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check format
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Upload using existing upload endpoint
      const result = await noticeService.uploadNoticeImage(file);
      setConfig(prev => ({
        ...prev,
        imageUrl: result.url,
        imageName: file.name
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Upload API error, converting to local preview:', err);
      // Fallback to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setConfig(prev => ({
            ...prev,
            imageUrl: reader.result as string,
            imageName: file.name
          }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updated = await noticeService.saveNoticeConfig({
        ...config,
        updatedBy: currentUser?.name || currentUser?.username || 'Admin'
      });
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset notice to official default announcement?')) {
      setConfig({
        ...DEFAULT_NOTICE_CONFIG,
        lastUpdated: new Date().toISOString()
      });
    }
  };

  const isCurrentlyActive = noticeService.isNoticeActive(config);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Bell size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              Notice / Announcement
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
              Official Home Page Visitor Announcement Control
            </p>
          </div>
        </div>

        {/* Action Buttons: Preview & Save */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Eye size={16} />
            <span>Preview Notice</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide flex items-center gap-3 shadow-sm"
        >
          <CheckCircle2 size={18} />
          <span>Notice configuration updated and saved successfully!</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wide flex items-center gap-3 shadow-sm"
        >
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Notice Status (ON / OFF) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  Notice Status
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Turn the announcement popup ON or OFF for all visitors on the Home Page.
                </p>
              </div>

              {/* Status Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  config.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-pressed={config.enabled}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                    config.enabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <span
                className={`w-3 h-3 rounded-full ${
                  config.enabled
                    ? isCurrentlyActive
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Current Status:{' '}
                {config.enabled
                  ? isCurrentlyActive
                    ? 'ACTIVE (Visitors currently see this popup on Home Page)'
                    : 'SCHEDULED / INACTIVE (Outside active time window)'
                  : 'OFF (Popup is disabled)'}
              </span>
            </div>
          </div>

          {/* Section B & C: Upload Notice Image */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-500" />
                  Notice Image
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a 16:9 ratio image (e.g., 1920×1080). Supported: JPG, JPEG, PNG, WEBP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{isUploading ? 'Uploading...' : 'Change Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  title="Reset to default banner"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview Box (16:9) */}
            <div className="space-y-3">
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner group flex items-center justify-center">
                {config.imageUrl ? (
                  <img
                    src={config.imageUrl}
                    alt="Notice preview"
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                    <ImageIcon size={48} strokeWidth={1.5} />
                    <span className="text-xs font-bold uppercase tracking-wider">No image uploaded</span>
                  </div>
                )}

                {/* Hover overlay with Change Image */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload New Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span>File: {config.imageName || 'notice-banner.svg'}</span>
                <span>Aspect Ratio: 16:9 (Recommended 1920×1080)</span>
              </div>
            </div>
          </div>

          {/* Section D & E: Schedule & Time Control */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-500" />
                  Schedule &amp; Time Control
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure when the notice is automatically shown to visitors.
                </p>
              </div>

              {/* Always Active Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 dark:bg-slate-800/70 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={config.alwaysActive}
                  onChange={handleToggleAlwaysActive}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Always Active
                </span>
              </label>
            </div>

            {!config.alwaysActive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Start Date & Time */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    <Clock size={15} className="text-indigo-500" />
                    <span>Start Schedule</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={config.startDate}
                        onChange={e => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={config.startTime}
                        onChange={e => setConfig(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    <Clock size={15} className="text-rose-500" />
                    <span>End Schedule</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={config.endDate}
                        onChange={e => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={config.endTime}
                        onChange={e => setConfig(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-3">
                <Info size={18} className="shrink-0" />
                <span>
                  <strong>Always Active Mode is enabled.</strong> The announcement will remain active indefinitely whenever Notice Status is ON, without relying on date boundaries.
                </span>
              </div>
            )}

            {/* Frequency Setting */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Display Frequency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'session', label: 'Once Per Session', desc: 'Recommended (default)' },
                  { id: 'daily', label: 'Once Per Day', desc: 'Shows once every 24 hours' },
                  { id: 'always', label: 'Every Visit', desc: 'Shows on every page reload' }
                ].map(freq => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, frequency: freq.id as any }))}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      config.frequency === freq.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:border-indigo-400/40'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase tracking-wider">{freq.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        config.frequency === freq.id ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      {freq.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section F: Optional Automatic Closing Timer */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Timer size={18} className="text-indigo-500" />
                  Automatic Closing Timer
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automatically dismiss the popup after a configurable duration if the visitor doesn't close it.
                </p>
              </div>

              {/* Auto-Close Toggle Switch */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, autoCloseEnabled: !prev.autoCloseEnabled }))}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  config.autoCloseEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-pressed={config.autoCloseEnabled}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                    config.autoCloseEnabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.autoCloseEnabled ? (
              <div className="space-y-6 pt-2">
                {/* Duration Slider & Number Input */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Clock size={15} className="text-indigo-500" />
                      <span>Timer Duration</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="3"
                        max="60"
                        value={config.autoCloseDuration || 10}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setConfig(prev => ({
                            ...prev,
                            autoCloseDuration: isNaN(val) ? 10 : Math.max(3, Math.min(60, val))
                          }));
                        }}
                        className="w-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seconds</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={config.autoCloseDuration || 10}
                    onChange={e => setConfig(prev => ({ ...prev, autoCloseDuration: parseInt(e.target.value, 10) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Presets:</span>
                    {[5, 8, 10, 15, 20, 30].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, autoCloseDuration: sec }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (config.autoCloseDuration || 10) === sec
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-3">
                  <Info size={18} className="shrink-0" />
                  <span>
                    When enabled, a subtle animated progress bar and countdown badge appear on the popup, automatically closing it after <strong>{config.autoCloseDuration || 10} seconds</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 font-medium flex items-center gap-3">
                <Info size={18} className="shrink-0" />
                <span>
                  <strong>Auto-Close is currently disabled.</strong> The notice popup will only close when the visitor explicitly clicks the top &times; or bottom CLOSE button (or presses ESC).
                </span>
              </div>
            )}
          </div>

          {/* Section F: Important Notice & Subtle Glowing Pulse Animation */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  Important Notice & Glowing Pulse
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enables a subtle, ambient glowing pulse animation around the popup container to draw visitor attention.
                </p>
              </div>

              {/* Glowing Pulse Toggle Switch */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, isImportant: prev.isImportant === undefined ? false : !prev.isImportant }))}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  config.isImportant ?? true ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-pressed={config.isImportant ?? true}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                    config.isImportant ?? true ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-3">
              <Sparkles size={18} className="shrink-0 text-indigo-500" />
              <span>
                {config.isImportant ?? true ? (
                  <>
                    <strong>Glowing pulse is active.</strong> A delicate framer-motion luminous aura gently breathes behind the floating glass card to capture visitor focus without distracting from the artwork.
                  </>
                ) : (
                  <>
                    <strong>Glowing pulse is inactive.</strong> The notice card renders with clean cinematic glass without the ambient breathing glow.
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Notice Information Panel (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <Info size={16} className="text-indigo-500" />
              Notice Information
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Live Status
                </span>
                <div className="font-bold flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      config.enabled && isCurrentlyActive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className={config.enabled && isCurrentlyActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                    {config.enabled
                      ? isCurrentlyActive
                        ? 'Active & Displaying'
                        : 'Inactive (Outside Schedule)'
                      : 'Disabled (OFF)'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Active Schedule
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  {config.alwaysActive
                    ? 'Always Active (No expiration)'
                    : `${config.startDate} ${config.startTime} → ${config.endDate} ${config.endTime}`}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Frequency Mode
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {config.frequency === 'session'
                    ? 'Once Per Session (SessionStorage)'
                    : config.frequency === 'daily'
                    ? 'Once Per Day (24-Hour Reset)'
                    : 'Every Single Visit'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Auto-Close Timer
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.autoCloseEnabled ? 'bg-indigo-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {config.autoCloseEnabled
                      ? `Enabled (${config.autoCloseDuration || 10} seconds)`
                      : 'Disabled (Manual Close Only)'}
                  </span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Last Updated
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  {config.lastUpdated
                    ? new Date(config.lastUpdated).toLocaleString()
                    : 'Not yet saved'}
                </p>
                {config.updatedBy && (
                  <p className="text-[10px] text-slate-400 font-semibold">
                    By: {config.updatedBy}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Preview Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Eye size={15} />
              <span>Test Live Preview</span>
            </button>
          </div>

          {/* Privacy & Safety Note */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
              <ShieldAlert size={14} className="text-indigo-500" />
              <span>Isolated Architecture</span>
            </div>
            <p>
              Notice data is managed in an isolated namespace. Existing customer records, projects, and transactions are completely protected and untouched.
            </p>
          </div>
        </div>
      </div>

      {/* Live Admin Preview Modal */}
      <NoticePopup
        config={config}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        isPreview={true}
      />
    </div>
  );
};

export default NoticeControl;
