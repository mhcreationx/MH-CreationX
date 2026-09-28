import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Team';
  avatar?: string | null;
  is_active: number | string | boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  profile_image_url?: string | null;
  status: 'Active' | 'Inactive';
  joined_at: string;
  created_by?: string | null;
}

export interface DbProjectImage {
  id?: number | string;
  project_id: string;
  image_url: string;
  type: string;
  created_at?: string;
}

export interface DbProject {
  id: string;
  serial_number: number;
  title: string;
  customer_id: string;
  category: string;
  description?: string | null;
  director?: string | null;
  status: string;
  price: number | string;
  advance_amount: number | string;
  paid_amount: number | string;
  discount: number | string;
  payment_status: string;
  payment_method: string;
  payment_details?: any;
  delivery_date?: string | null;
  is_visible_on_public: number | string | boolean;
  show_in_landing: number | string | boolean;
  show_in_animation: number | string | boolean;
  show_in_previous: number | string | boolean;
  secure_token?: string | null;
  designer_name?: string | null;
  assistant_name?: string | null;
  created_by?: string | null;
  drive_link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: number | string;
  reason: string;
  amount: number | string;
  category: string;
  date: string;
  created_by?: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: number | string;
  action: string;
  details: string;
  user_name: string;
  actor_type?: string;
  actor_id?: string | null;
  project_id?: string | null;
  customer_id?: string | null;
  category: 'project' | 'finance' | 'user' | 'system';
  timestamp: string;
}

export interface DbChatMessage {
  id: string;
  conversationId: string;
  senderType: 'visitor' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface DbChatConversation {
  id: string; // conversationId (e.g. conv_...)
  visitorId: string;
  visitorName: string;
  status: 'active' | 'archived';
  unreadCount: number; // unread by admin
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

class DatabaseStore {
  users: DbUser[] = [];
  customers: DbCustomer[] = [];
  projects: DbProject[] = [];
  project_images: DbProjectImage[] = [];
  expenses: DbExpense[] = [];
  audit_logs: DbAuditLog[] = [];
  chat_conversations: DbChatConversation[] = [];
  chat_messages: DbChatMessage[] = [];
  private dbPath = path.resolve(__dirname, 'data.json');

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.customers = data.customers || [];
        this.projects = data.projects || [];
        this.project_images = data.project_images || [];
        this.expenses = data.expenses || [];
        this.audit_logs = data.audit_logs || [];
        this.chat_conversations = data.chat_conversations || [];
        this.chat_messages = data.chat_messages || [];
        return;
      }
    } catch (e) {
      console.warn('Could not read existing data.json, falling back to initial data');
    }

    try {
      const initialPath = path.resolve(__dirname, 'initialData.json');
      if (fs.existsSync(initialPath)) {
        const raw = fs.readFileSync(initialPath, 'utf-8');
        const data = JSON.parse(raw);
        this.users = (data.users || []).map((u: any) => ({
          ...u,
          is_active: u.is_active === '1' || u.is_active === 1 || u.is_active === true
        }));
        this.customers = data.customers || [];
        this.projects = (data.projects || []).map((p: any) => ({
          ...p,
          serial_number: Number(p.serial_number) || 1,
          price: p.price ?? 0,
          advance_amount: p.advance_amount ?? 0,
          paid_amount: p.paid_amount ?? 0,
          discount: p.discount ?? 0,
          is_visible_on_public: p.is_visible_on_public === '1' || p.is_visible_on_public === 1,
          show_in_animation: p.show_in_animation === '1' || p.show_in_animation === 1,
          show_in_previous: p.show_in_previous === '1' || p.show_in_previous === 1,
          show_in_landing: p.show_in_landing === '1' || p.show_in_landing === 1,
        }));
        this.project_images = data.project_images || [];
        this.expenses = data.expenses || [];
        this.audit_logs = data.audit_logs || [];
        this.chat_conversations = data.chat_conversations || [];
        this.chat_messages = data.chat_messages || [];
      }
    } catch (e) {
      console.error('Error loading initial data:', e);
    }

    // Ensure default master admin exists
    const adminExists = this.users.some(u => u.role === 'Admin');
    if (!adminExists) {
      this.users.push({
        id: 'admin-master-id',
        name: 'Moazzem Hossen',
        email: 'mhcreationx@gmail.com',
        role: 'Admin',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.save();
  }

  save() {
    try {
      const data = {
        users: this.users,
        customers: this.customers,
        projects: this.projects,
        project_images: this.project_images,
        expenses: this.expenses,
        audit_logs: this.audit_logs,
        chat_conversations: this.chat_conversations,
        chat_messages: this.chat_messages
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  getProjectWithImages(project: DbProject) {
    const images = this.project_images
      .filter(img => String(img.project_id) === String(project.id))
      .map(img => ({
        id: img.id,
        url: img.image_url,
        type: img.type
      }));

    const customer = this.customers.find(c => String(c.id) === String(project.customer_id));

    return {
      ...project,
      client_name: customer?.name || 'Unknown',
      client_type: customer?.type || 'Client',
      images
    };
  }

  addAuditLog(entry: Omit<DbAuditLog, 'id' | 'timestamp'>) {
    const newLog: DbAuditLog = {
      id: Date.now(),
      ...entry,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.audit_logs.unshift(newLog);
    // Keep max 1000 logs
    if (this.audit_logs.length > 1000) {
      this.audit_logs = this.audit_logs.slice(0, 1000);
    }
    this.save();
    return newLog;
  }
}

export const db = new DatabaseStore();
