import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../server/data.json');
const initialDataPath = path.resolve(__dirname, '../server/initialData.json');

const adminHash = bcrypt.hashSync('admin123', 10);
const designerHash = bcrypt.hashSync('designer123', 10);

const existingData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {};

// 1. Users
const demoUsers = [
  {
    id: 'lulluvai-admin-id',
    name: 'Lullu Vai',
    email: 'lulluvai.fb@gmail.com',
    password: adminHash,
    role: 'Admin',
    avatar: null,
    is_active: true,
    created_at: '2026-09-28 11:52:00',
    updated_at: '2026-09-28 11:52:00'
  },
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'Moazzem Hossen',
    email: 'mhcreationx@gmail.com',
    password: adminHash,
    role: 'Admin',
    avatar: null,
    is_active: true,
    created_at: '2026-02-02 09:12:08',
    updated_at: '2026-09-28 11:52:00'
  },
  {
    id: 'sarah-manager-id',
    name: 'Sarah Ahmed',
    email: 'sarah.manager@mhcreationx.com',
    password: adminHash,
    role: 'Admin',
    avatar: null,
    is_active: true,
    created_at: '2026-03-01 10:00:00',
    updated_at: '2026-09-28 11:52:00'
  },
  {
    id: 'tanvir-designer-id',
    name: 'Tanvir Hasan',
    email: 'designer@mhcreationx.com',
    password: designerHash,
    role: 'Team',
    avatar: null,
    is_active: true,
    created_at: '2026-03-15 11:30:00',
    updated_at: '2026-09-28 11:52:00'
  },
  {
    id: 'ayesha-motion-id',
    name: 'Ayesha Rahman',
    email: 'motion@mhcreationx.com',
    password: adminHash,
    role: 'Team',
    avatar: null,
    is_active: true,
    created_at: '2026-04-01 09:00:00',
    updated_at: '2026-09-28 11:52:00'
  },
  {
    id: 'd0b4e037-0e3a-11f1-8a59-9c6b0053504c',
    name: 'Mahin',
    email: 'mahin@11',
    password: adminHash,
    role: 'Team',
    avatar: null,
    is_active: true,
    created_at: '2026-02-20 09:01:59',
    updated_at: '2026-02-20 09:01:59'
  }
];

// Merge users ensuring no duplicates by email or id
const userMap = new Map();
demoUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
(existingData.users || []).forEach(u => {
  if (!userMap.has(u.email.toLowerCase())) {
    userMap.set(u.email.toLowerCase(), u);
  }
});
const mergedUsers = Array.from(userMap.values());

// 2. Customers
const demoCustomers = [
  {
    id: 'SHAR758',
    name: 'Sharif',
    type: 'Director',
    phone: '+880 1877-809232',
    email: 'sharif.director@gmail.com',
    address: 'Gulshan-2, Dhaka',
    profile_image_url: '/uploads/customers/SHAR758/profile_sharif.png',
    status: 'Active',
    joined_at: '2026-02-18 18:56:14',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  },
  {
    id: 'NABIL902',
    name: 'Nabil Hossain',
    type: 'Producer',
    phone: '+880 1711-234567',
    email: 'nabil@cineverse.com',
    address: 'Banani Studio Hub, Dhaka',
    profile_image_url: '/uploads/customers/NABIL902/profile_nabil.png',
    status: 'Active',
    joined_at: '2026-03-01 10:00:00',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  },
  {
    id: 'PRIYA441',
    name: 'Priya Sen',
    type: 'Director',
    phone: '+880 1912-345678',
    email: 'priya@chorki.com',
    address: 'Dhanmondi, Dhaka',
    profile_image_url: '/uploads/customers/PRIYA441/profile_priya.png',
    status: 'Active',
    joined_at: '2026-03-10 14:30:00',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  },
  {
    id: 'RAHIM105',
    name: 'Rahim Chowdhury',
    type: 'Producer',
    phone: '+880 1819-876543',
    email: 'rahim@eaglemusic.com',
    address: 'Moghbazar, Dhaka',
    profile_image_url: '/uploads/customers/RAHIM105/profile_rahim.png',
    status: 'Active',
    joined_at: '2026-03-18 16:15:00',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  },
  {
    id: 'TAHS712',
    name: 'Tahsan Kabir',
    type: 'Director',
    phone: '+880 1688-990011',
    email: 'tahsan@apexmedia.com',
    address: 'Uttara Sector 7, Dhaka',
    profile_image_url: '/uploads/customers/TAHS712/profile_tahsan.png',
    status: 'Active',
    joined_at: '2026-04-02 09:20:00',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
  }
];

const customerMap = new Map();
demoCustomers.forEach(c => customerMap.set(c.id, c));
(existingData.customers || []).forEach(c => {
  if (!customerMap.has(c.id)) {
    customerMap.set(c.id, c);
  }
});
const mergedCustomers = Array.from(customerMap.values());

// 3. Projects
const demoProjects = [
  {
    id: 'PRJ-901a1e01',
    serial_number: 101,
    title: 'অপারেশন লাল পাহাড় (Operation Red Hill)',
    customer_id: 'NABIL902',
    category: 'Movie',
    description: 'High octane cinematic action thriller official release key visual & character posters',
    director: 'Nabil Hossain',
    status: 'In Progress',
    price: '18000.00',
    advance_amount: '9000.00',
    paid_amount: '9000.00',
    discount: '0.00',
    payment_status: 'Partial',
    payment_method: 'bKash',
    payment_details: { method: 'bKash', transactionId: 'TRX-BK-99201A' },
    delivery_date: '2026-10-15',
    is_visible_on_public: true,
    show_in_landing: true,
    show_in_animation: true,
    show_in_previous: true,
    secure_token: 'tok_redhill_901a',
    designer_name: 'Moazzem Hossen',
    assistant_name: 'Tanvir Hasan',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    drive_link: 'https://drive.google.com/drive/folders/cineverse-red-hill',
    created_at: '2026-09-10 10:00:00',
    updated_at: '2026-09-28 12:00:00'
  },
  {
    id: 'PRJ-902b2f02',
    serial_number: 102,
    title: 'কুয়াশার ডাক (Whispers in the Mist)',
    customer_id: 'PRIYA441',
    category: 'Natok / Drama',
    description: 'Moody psychological mystery drama series key art and title typography for OTT streaming',
    director: 'Priya Sen',
    status: 'Delivered',
    price: '12500.00',
    advance_amount: '5000.00',
    paid_amount: '12500.00',
    discount: '0.00',
    payment_status: 'Paid',
    payment_method: 'Bank',
    payment_details: { method: 'Bank Transfer', bankName: 'City Bank', accountNumber: '1102938475' },
    delivery_date: '2026-09-20',
    is_visible_on_public: true,
    show_in_landing: true,
    show_in_animation: true,
    show_in_previous: true,
    secure_token: 'tok_whispers_902b',
    designer_name: 'Tanvir Hasan',
    assistant_name: 'Ayesha Rahman',
    created_by: 'sarah-manager-id',
    drive_link: 'https://drive.google.com/drive/folders/chorki-whispers',
    created_at: '2026-09-01 14:00:00',
    updated_at: '2026-09-20 18:00:00'
  },
  {
    id: 'PRJ-903c3d03',
    serial_number: 103,
    title: 'মেঘের গান (Song of the Clouds)',
    customer_id: 'RAHIM105',
    category: 'Music Video',
    description: 'Soulful acoustic music video visual concept art, 4K YouTube banner & release thumbnail',
    director: 'Rahim Chowdhury',
    status: 'Delivered',
    price: '4500.00',
    advance_amount: '2000.00',
    paid_amount: '4500.00',
    discount: '0.00',
    payment_status: 'Paid',
    payment_method: 'Nagad',
    payment_details: { method: 'Nagad', walletNumber: '01819876543' },
    delivery_date: '2026-09-15',
    is_visible_on_public: true,
    show_in_landing: true,
    show_in_animation: true,
    show_in_previous: true,
    secure_token: 'tok_clouds_903c',
    designer_name: 'Ayesha Rahman',
    assistant_name: '',
    created_by: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    drive_link: 'https://drive.google.com/drive/folders/eagle-clouds-mv',
    created_at: '2026-08-28 09:30:00',
    updated_at: '2026-09-15 16:45:00'
  },
  {
    id: 'PRJ-904d4e04',
    serial_number: 104,
    title: 'মহাজাগতিক (Cosmic Odyssey)',
    customer_id: 'TAHS712',
    category: 'Documentary',
    description: 'Scientific feature documentary poster with astronomical composite illustrations',
    director: 'Tahsan Kabir',
    status: 'Pending',
    price: '15000.00',
    advance_amount: '5000.00',
    paid_amount: '5000.00',
    discount: '0.00',
    payment_status: 'Partial',
    payment_method: 'Cash',
    payment_details: { method: 'Cash' },
    delivery_date: '2026-10-30',
    is_visible_on_public: true,
    show_in_landing: true,
    show_in_animation: false,
    show_in_previous: true,
    secure_token: 'tok_cosmic_904d',
    designer_name: 'Moazzem Hossen',
    assistant_name: 'Tanvir Hasan',
    created_by: 'sarah-manager-id',
    drive_link: 'https://drive.google.com/drive/folders/apex-cosmic',
    created_at: '2026-09-22 11:15:00',
    updated_at: '2026-09-28 14:00:00'
  }
];

const projectMap = new Map();
demoProjects.forEach(p => projectMap.set(p.id, p));
(existingData.projects || []).forEach(p => {
  if (!projectMap.has(p.id)) {
    projectMap.set(p.id, p);
  }
});
const mergedProjects = Array.from(projectMap.values());

// 4. Project Images
const demoImages = [
  { id: 'img-901-1', project_id: 'PRJ-901a1e01', image_url: '/uploads/projects/operation_red_hill_poster.jpg', type: 'poster', created_at: '2026-09-10 10:05:00' },
  { id: 'img-901-2', project_id: 'PRJ-901a1e01', image_url: '/uploads/projects/operation_red_hill_youtube.jpg', type: 'youtube', created_at: '2026-09-10 10:06:00' },
  { id: 'img-902-1', project_id: 'PRJ-902b2f02', image_url: '/uploads/projects/whispers_mist_poster.jpg', type: 'poster', created_at: '2026-09-01 14:10:00' },
  { id: 'img-902-2', project_id: 'PRJ-902b2f02', image_url: '/uploads/projects/whispers_mist_thumb.jpg', type: 'thumbnail', created_at: '2026-09-01 14:12:00' },
  { id: 'img-903-1', project_id: 'PRJ-903c3d03', image_url: '/uploads/projects/song_clouds_poster.jpg', type: 'poster', created_at: '2026-08-28 09:35:00' },
  { id: 'img-904-1', project_id: 'PRJ-904d4e04', image_url: '/uploads/projects/cosmic_odyssey_poster.jpg', type: 'poster', created_at: '2026-09-22 11:20:00' }
];

const imageMap = new Map();
demoImages.forEach(img => imageMap.set(String(img.id), img));
(existingData.project_images || []).forEach(img => {
  if (!imageMap.has(String(img.id))) {
    imageMap.set(String(img.id), img);
  }
});
const mergedImages = Array.from(imageMap.values());

// 5. Expenses
const demoExpenses = [
  { id: 101, reason: 'Adobe Creative Cloud Master Studio Subscription', amount: '16500.00', category: 'Software', date: '2026-09-25', created_by: 'Moazzem Hossen', created_at: '2026-09-25 11:00:00' },
  { id: 102, reason: 'Dedicated Studio High-Speed Fiber Network (50 Mbps)', amount: '5200.00', category: 'Utility', date: '2026-09-20', created_by: 'Sarah Ahmed', created_at: '2026-09-20 10:30:00' },
  { id: 103, reason: 'AWS Cloud Storage & High-Speed Media CDN Hosting', amount: '4400.00', category: 'Hosting', date: '2026-09-18', created_by: 'Sarah Ahmed', created_at: '2026-09-18 15:45:00' },
  { id: 104, reason: 'SpyderX Pro Display Color Calibration Hardware', amount: '10500.00', category: 'Equipment', date: '2026-09-10', created_by: 'Moazzem Hossen', created_at: '2026-09-10 12:15:00' },
  { id: 105, reason: 'Cinema Typography & Master Font Licensing Bundle', amount: '5800.00', category: 'Assets', date: '2026-09-05', created_by: 'Tanvir Hasan', created_at: '2026-09-05 14:20:00' },
  { id: 106, reason: 'Studio Workspace Refreshments & Coffee Blend', amount: '2900.00', category: 'Office', date: '2026-09-01', created_by: 'Sarah Ahmed', created_at: '2026-09-01 09:10:00' }
];

const expenseMap = new Map();
demoExpenses.forEach(exp => expenseMap.set(String(exp.id), exp));
(existingData.expenses || []).forEach(exp => {
  if (!expenseMap.has(String(exp.id))) {
    expenseMap.set(String(exp.id), exp);
  }
});
const mergedExpenses = Array.from(expenseMap.values());

// 6. Live Chat Conversations
const demoChats = [
  {
    id: 'conv_cineverse_nabil',
    visitorId: 'NABIL902',
    visitorName: 'Nabil Hossain (CineVerse Films)',
    status: 'active',
    unreadCount: 0,
    createdAt: '2026-09-27T10:15:00.000Z',
    updatedAt: '2026-09-28T16:20:00.000Z',
    lastMessage: 'Awesome! The color grade on the teaser poster is spot on.'
  },
  {
    id: 'conv_priya_chorki',
    visitorId: 'PRIYA441',
    visitorName: 'Priya Sen (OTT Producer)',
    status: 'active',
    unreadCount: 1,
    createdAt: '2026-09-28T14:00:00.000Z',
    updatedAt: '2026-09-28T18:45:00.000Z',
    lastMessage: 'Could you send the 9:16 Instagram cut when ready?'
  },
  {
    id: 'conv_rahim_eagle',
    visitorId: 'RAHIM105',
    visitorName: 'Rahim Chowdhury (Eagle Music)',
    status: 'archived',
    unreadCount: 0,
    createdAt: '2026-09-25T11:00:00.000Z',
    updatedAt: '2026-09-26T17:30:00.000Z',
    lastMessage: 'Received all files for Song of the Clouds. Thank you!'
  }
];

const chatMap = new Map();
demoChats.forEach(c => chatMap.set(c.id, c));
(existingData.chat_conversations || []).forEach(c => {
  if (!chatMap.has(c.id)) {
    chatMap.set(c.id, c);
  }
});
const mergedChats = Array.from(chatMap.values());

// 7. Live Chat Messages
const demoMessages = [
  {
    id: 'msg_nab_1',
    conversationId: 'conv_cineverse_nabil',
    senderType: 'visitor',
    senderName: 'Nabil Hossain',
    text: 'Hello Moazzem! We have reviewed the character cuts for Operation Red Hill.',
    timestamp: '2026-09-27T10:15:00.000Z',
    read: true
  },
  {
    id: 'msg_nab_2',
    conversationId: 'conv_cineverse_nabil',
    senderType: 'admin',
    senderName: 'Moazzem Hossen',
    text: 'Hey Nabil! Glad to hear. I boosted the rim lighting and contrast on the protagonist title.',
    timestamp: '2026-09-27T10:25:00.000Z',
    read: true
  },
  {
    id: 'msg_nab_3',
    conversationId: 'conv_cineverse_nabil',
    senderType: 'visitor',
    senderName: 'Nabil Hossain',
    text: 'Awesome! The color grade on the teaser poster is spot on.',
    timestamp: '2026-09-28T16:20:00.000Z',
    read: true
  },
  {
    id: 'msg_pri_1',
    conversationId: 'conv_priya_chorki',
    senderType: 'visitor',
    senderName: 'Priya Sen',
    text: 'Hi team, Whispers in the Mist poster was approved by the streaming executives!',
    timestamp: '2026-09-28T14:00:00.000Z',
    read: true
  },
  {
    id: 'msg_pri_2',
    conversationId: 'conv_priya_chorki',
    senderType: 'visitor',
    senderName: 'Priya Sen',
    text: 'Could you send the 9:16 Instagram cut when ready?',
    timestamp: '2026-09-28T18:45:00.000Z',
    read: false
  },
  {
    id: 'msg_rah_1',
    conversationId: 'conv_rahim_eagle',
    senderType: 'visitor',
    senderName: 'Rahim Chowdhury',
    text: 'Received all files for Song of the Clouds. Thank you!',
    timestamp: '2026-09-26T17:30:00.000Z',
    read: true
  }
];

const msgMap = new Map();
demoMessages.forEach(m => msgMap.set(m.id, m));
(existingData.chat_messages || []).forEach(m => {
  if (!msgMap.has(m.id)) {
    msgMap.set(m.id, m);
  }
});
const mergedMessages = Array.from(msgMap.values());

// 8. Audit Logs
const demoAuditLogs = [
  {
    id: 'audit-101',
    action: 'Create Project',
    details: 'Created project "Operation Red Hill" for CineVerse Films',
    user_name: 'Moazzem Hossen',
    actor_type: 'user',
    actor_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    project_id: 'PRJ-901a1e01',
    customer_id: 'NABIL902',
    category: 'project',
    timestamp: '2026-09-28 12:00:00'
  },
  {
    id: 'audit-102',
    action: 'Payment Recorded',
    details: 'Received advance 9,000 BDT via bKash for Operation Red Hill',
    user_name: 'Sarah Ahmed',
    actor_type: 'user',
    actor_id: 'sarah-manager-id',
    project_id: 'PRJ-901a1e01',
    customer_id: 'NABIL902',
    category: 'finance',
    timestamp: '2026-09-28 12:05:00'
  },
  {
    id: 'audit-103',
    action: 'Project Delivered',
    details: 'Delivered final 4K package for Whispers in the Mist (Chorki Originals)',
    user_name: 'Tanvir Hasan',
    actor_type: 'user',
    actor_id: 'tanvir-designer-id',
    project_id: 'PRJ-902b2f02',
    customer_id: 'PRIYA441',
    category: 'project',
    timestamp: '2026-09-20 18:00:00'
  }
];

const logMap = new Map();
demoAuditLogs.forEach(l => logMap.set(String(l.id), l));
(existingData.audit_logs || []).forEach(l => {
  if (!logMap.has(String(l.id))) {
    logMap.set(String(l.id), l);
  }
});
const mergedAuditLogs = Array.from(logMap.values());

const finalData = {
  users: mergedUsers,
  customers: mergedCustomers,
  projects: mergedProjects,
  project_images: mergedImages,
  expenses: mergedExpenses,
  audit_logs: mergedAuditLogs,
  chat_conversations: mergedChats,
  chat_messages: mergedMessages
};

fs.writeFileSync(dbPath, JSON.stringify(finalData, null, 2), 'utf-8');
fs.writeFileSync(initialDataPath, JSON.stringify(finalData, null, 2), 'utf-8');
console.log('Seeding completed successfully!');
console.log({
  users: finalData.users.length,
  customers: finalData.customers.length,
  projects: finalData.projects.length,
  images: finalData.project_images.length,
  expenses: finalData.expenses.length,
  chats: finalData.chat_conversations.length,
  messages: finalData.chat_messages.length,
  logs: finalData.audit_logs.length
});
