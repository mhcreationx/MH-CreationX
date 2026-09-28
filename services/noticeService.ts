import api from './api';
import { NoticeConfig, DEFAULT_NOTICE_CONFIG } from '../types/noticeTypes';

const LOCAL_STORAGE_KEY = 'mh_notice_config';
const SESSION_DISMISSED_KEY = 'mh_notice_dismissed';
const DAILY_DISMISSED_KEY = 'mh_notice_dismissed_date';

export const noticeService = {
  // Read notice settings from API with fallback to localStorage / default
  async getNoticeConfig(): Promise<NoticeConfig> {
    try {
      const response = await api.get('/notice/settings.php');
      if (response.data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (e) {
      console.warn('Notice API unavailable, reading from local cache');
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }

    return DEFAULT_NOTICE_CONFIG;
  },

  // Save notice settings to API and localStorage
  async saveNoticeConfig(updates: Partial<NoticeConfig>): Promise<NoticeConfig> {
    const current = await this.getNoticeConfig();
    const updated: NoticeConfig = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      const response = await api.post('/notice/settings.php', updated);
      if (response.data && response.data.config) {
        return response.data.config;
      }
    } catch (e) {
      console.warn('Could not persist notice config to server, cached locally:', e);
    }

    return updated;
  },

  // Upload notice image using the existing safe upload endpoint
  async uploadNoticeImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/uploads/upload-image.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.url) {
      return {
        url: response.data.url,
        filename: response.data.filename || file.name
      };
    }

    throw new Error('Image upload failed');
  },

  // Check if notice is currently active based on ON/OFF and scheduling
  isNoticeActive(config: NoticeConfig): boolean {
    if (!config || !config.enabled || !config.imageUrl) {
      return false;
    }

    if (config.alwaysActive) {
      return true;
    }

    try {
      const now = new Date();
      const start = new Date(`${config.startDate}T${config.startTime || '00:00'}`);
      const end = new Date(`${config.endDate}T${config.endTime || '23:59'}`);

      return now >= start && now <= end;
    } catch {
      return false;
    }
  },

  // Check if visitor should see the popup based on frequency and dismissed status
  shouldShowNotice(config: NoticeConfig): boolean {
    if (!this.isNoticeActive(config)) {
      return false;
    }

    const freq = config.frequency || 'session';

    if (freq === 'always') {
      return true;
    }

    if (freq === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      const dismissedDate = localStorage.getItem(DAILY_DISMISSED_KEY);
      return dismissedDate !== today;
    }

    // Default: 'session'
    const dismissedSession = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    return !dismissedSession;
  },

  // Mark notice as dismissed by visitor
  recordNoticeDismissed(config: NoticeConfig): void {
    const freq = config.frequency || 'session';

    if (freq === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(DAILY_DISMISSED_KEY, today);
    }

    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
  }
};
