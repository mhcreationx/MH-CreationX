
export enum ProjectCategory {
  MOVIE = 'Movie',
  NATOK_DRAMA = 'Natok / Drama',
  CINEMA = 'Cinema',
  FUNNY_VIDEO = 'Funny Video',
  MUSIC_VIDEO = 'Music Video',
  POSTER = 'Poster',
  THUMBNAIL = 'Thumbnail',
  BANNER = 'Banner',
  LOGO = 'Logo',
  OTHER = 'Other'
}

export enum ProjectStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  DELIVERED = 'Delivered'
}

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PARTIAL = 'Partial'
}

export enum PaymentMethod {
  BKASH = 'bKash',
  NAGAD = 'Nagad',
  ROCKET = 'Rocket',
  BANK = 'Bank',
  CASH = 'Cash',
  NONE = 'None'
}

export interface PaymentDetails {
  method: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  walletNumber?: string;
}

export interface ProjectImage {
  id: string;
  url: string;
  type: 'design' | 'poster' | 'thumbnail' | 'custom' | 'youtube' | 'facebook';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  profileImageUrl?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userName: string;
  category: 'project' | 'finance' | 'user' | 'system';
  details: string;
  timestamp: string;
  projectId?: string; // Track specific project changes
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface Project {
  id: string;
  serialNumber: number;
  customerId: string;
  clientName: string;
  clientType: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  createDate: string;
  deliveryDate: string;
  price: number;
  advanceAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetails;
  posterCount: number;
  thumbnailCount: number;
  bannerCount: number;
  transactionRef?: string;
  director?: string;
  designerName?: string;
  assistantName?: string;
  images: ProjectImage[];
  secureToken: string;
  isVisibleOnPublic: boolean;
  showInAnimation: boolean;
  showInPrevious: boolean;
  downloadLink?: string; // Google Drive download link for clients
  created_by: string;
}

export interface Expense {
  id: string;
  reason: string;
  amount: number;
  category?: string;
  date: string;
}

export interface User {
  id: string;
  name?: string;
  username: string;
  email?: string;
  pass: string;
  role: 'Admin' | 'Team';
  profilePic?: string;
  createdAt: string;
}

export interface AppState {
  projects: Project[];
  customers: Customer[];
  expenses: Expense[];
  users: User[];
  auditLogs: AuditLog[];
  messages: Message[];
  visitorCount: number;
  paymentVisibility: boolean;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  authType: 'staff' | 'customer' | null;
  currentUser: User | null;
  currentCustomer: Customer | null;
  otpRequired: boolean;
}
