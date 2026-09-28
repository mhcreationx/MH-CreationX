export interface NoticeConfig {
  enabled: boolean;
  imageUrl: string;
  imageName?: string;
  alwaysActive: boolean;
  startDate: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endDate: string;   // 'YYYY-MM-DD'
  endTime: string;   // 'HH:mm'
  frequency: 'session' | 'daily' | 'always';
  autoCloseEnabled?: boolean;
  autoCloseDuration?: number; // duration in seconds
  lastUpdated: string;
  updatedBy?: string;
}

export const DEFAULT_NOTICE_CONFIG: NoticeConfig = {
  enabled: true,
  imageUrl: '/notice-banner.svg',
  imageName: 'notice-banner.svg',
  alwaysActive: true,
  startDate: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endTime: '23:59',
  frequency: 'session',
  autoCloseEnabled: false,
  autoCloseDuration: 10,
  lastUpdated: new Date().toISOString()
};
