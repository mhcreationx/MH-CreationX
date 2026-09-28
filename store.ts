import { create } from 'zustand';
import { AppState, Project, Expense, PaymentStatus, PaymentMethod, User, Customer, ProjectStatus, AuditLog, Message } from './types';
import { authService } from './services/authService';
import { mapProject } from './utils/mapping';
import type { LoginCredentials } from './types/authTypes';

// Define the store interface
interface ExtendedAppState extends AppState {
  // Projects
  addProject: (data: Omit<Project, 'id' | 'serialNumber' | 'secureToken'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Customers
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  toggleCustomerStatus: (id: string) => Promise<void>;

  // Expenses
  addExpense: (data: Omit<Expense, 'id'> & { date?: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Users
  addUser: (username: string, email: string, password: string, role: 'Admin' | 'Team') => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Auth
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAdmin: (username: string, password: string) => boolean;
  verifyDeviceOTP: (email: string, otp: string) => Promise<boolean>;
  loginCustomer: (customerId: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;

  // Messaging
  sendMessage: (text: string) => void;
  clearAuditLogs: () => void;

  // UI
  setShowLoginModal: (show: boolean) => void;
  toggleTheme: () => void;
  showLoginModal: boolean;
  isLoading: boolean;
  error: string | null;

  // Data Loading
  loadInitialData: (force?: boolean) => Promise<void>;
}

export const useAppStore = create<ExtendedAppState>((set, get) => ({
  // Initial State
  customers: [],
  expenses: [],
  users: [],
  auditLogs: [], // Always initialize as array, never undefined
  messages: [],
  visitorCount: 0,
  paymentVisibility: false,
  theme: (() => {
    // Check localStorage first
    const stored = localStorage.getItem('mh_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    // Otherwise use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })(),
  isAuthenticated: authService.isAuthenticated(),
  authType: (localStorage.getItem('mh_auth_type') as any) || (authService.isAuthenticated() ? 'staff' : null),
  currentUser: authService.getCurrentUser(),
  currentCustomer: localStorage.getItem('mh_current_customer')
    ? JSON.parse(localStorage.getItem('mh_current_customer') || 'null')
    : null,
  projects: localStorage.getItem('mh_auth_type') === 'customer' && localStorage.getItem('mh_projects')
    ? JSON.parse(localStorage.getItem('mh_projects') || '[]')
    : [],
  otpRequired: false,
  showLoginModal: false,

  // Global UI State
  isLoading: false,
  error: null,

  // Actions
  checkAuth: () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const storedAuthType = localStorage.getItem('mh_auth_type');
    set({
      isAuthenticated,
      currentUser: user,
      authType: (storedAuthType as any) || (isAuthenticated ? 'staff' : null),
      otpRequired: false
    });
  },

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.login(credentials);

      if ('requires_otp' in response && response.requires_otp) {
        set({ otpRequired: true, isLoading: false, showLoginModal: true });
        return; // Wait for OTP
      }

      if ('token' in response) {
        localStorage.setItem('mh_auth_type', 'staff');
        set({
          isAuthenticated: true,
          currentUser: response.user,
          authType: 'staff',
          showLoginModal: false,
          isLoading: false,
          otpRequired: false
        });
        get().loadInitialData();
      }
    } catch (error: any) {
      console.error("Login failed", error);
      set({ isLoading: false, error: error.message || 'Login failed' });
      throw error; // Re-throw for UI to handle if needed
    }
  },

  loginAdmin: (username, password) => {
    // Deprecated in favor of login()
    console.warn("Use login() instead of loginAdmin()");
    return false;
  },

  verifyDeviceOTP: async (email: string, otp: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.verifyDeviceOTP({ email, otp });
      if (response.token) {
        localStorage.setItem('mh_auth_type', 'staff');
        set({
          isAuthenticated: true,
          authType: 'staff',
          currentUser: response.user,
          otpRequired: false,
          showLoginModal: false,
          isLoading: false
        });
        get().loadInitialData();
        return true;
      }
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.response?.data?.error || "OTP Verification Failed" });
      throw e;
    }
    return false;
  },



  logout: () => {
    authService.logout();
    localStorage.removeItem('mh_auth_type');
    localStorage.removeItem('mh_current_customer');
    localStorage.removeItem('mh_projects');

    set({
      isAuthenticated: false,
      currentUser: null,
      currentCustomer: null,
      authType: null,
      projects: [],
      customers: [],
      expenses: [],
      users: [],
      auditLogs: []
    });
    get().loadInitialData();
    // Force reload to clean state if needed, or just let loadInitialData handle it (which will fetch public projects)
  },

  loadInitialData: async (force = false) => {
    const { authType, projects, customers } = get();

    // If we are a customer, refresh projects from server (staff projects are always refreshed below)
    if (authType === 'customer') {
      set({ isLoading: true, error: null });
      try {
        const { projectService } = await import('./services/projectService');
        const freshProjects = await projectService.getCustomerProjects().catch(() => []);
        set({ projects: freshProjects, isLoading: false });
      } catch (error: any) {
        console.error("Failed to refresh customer projects", error);
        set({ isLoading: false, error: 'Failed to refresh data.' });
      }
      return;
    }

    // Always refresh staff data from server to avoid stale cross-device state.
    // (Customer mode is handled above.)

    set({ isLoading: true, error: null });
    try {
      const { projectService } = await import('./services/projectService');
      const { customerService } = await import('./services/customerService');

      // Fetch public/common data
      const [projectsData, customersData] = await Promise.all([
        projectService.getProjects(1000, 0, '', 'All').catch(() => []),
        customerService.getCustomers().catch(() => [])
      ]);

      let expenses: Expense[] = [];
      let users: User[] = [];
      let auditLogs: AuditLog[] = [];

      if (authService.isAuthenticated()) {
        try {
          const { financeService } = await import('./services/financeService');
          const { auditService } = await import('./services/auditService');

          const [expensesData, auditData] = await Promise.all([
            financeService.getExpenses(200, 0).catch(() => []),
            auditService.getLogs(100).catch(err => {
              console.warn('Failed to load audit logs:', err);
              return []; // Return empty array on error
            })
          ]);

          let usersData: User[] = [];
          try {
            const { userService } = await import('./services/userService');
            usersData = await userService.getUsers().catch((err) => {
              console.error('Failed to fetch users:', err);
              return [];
            });
          } catch (e) {
            console.error('Failed to load user service:', e);
          }

          expenses = expensesData;
          auditLogs = auditData || [];
          users = usersData || [];

          // Fetch users if store has valid auth
          // Assuming we might have a users endpoint later
        } catch (e) {
          console.warn("Restricted data load failed", e);
        }
      }

      set({ projects: projectsData, customers: customersData, expenses, users, auditLogs, isLoading: false });

    } catch (error: any) {
      console.error("Failed to load initial data", error);
      set({ isLoading: false, error: 'Failed to connect to server.' });
    }
  },

  // Proxies to Services
  addProject: async (data) => {
    const { projectService } = await import('./services/projectService');
    await projectService.createProject(data);
    const projects = await projectService.getProjects(1000, 0, '', 'All');
    set({ projects });
  },

  updateProject: async (id, updates) => {
    const { projectService } = await import('./services/projectService');
    await projectService.updateProject(id, updates);
    const projects = await projectService.getProjects(1000, 0, '', 'All');
    set({ projects });
  },

  deleteProject: async (id) => {
    const { projectService } = await import('./services/projectService');
    await projectService.deleteProject(id);
    set((state) => ({ projects: state.projects.filter(p => p.id !== id) }));
  },

  addCustomer: async (data) => {
    const { customerService } = await import('./services/customerService');
    await customerService.createCustomer(data as any);
    const customers = await customerService.getCustomers();
    set({ customers });
  },

  updateCustomer: async (id, updates) => {
    const { customerService } = await import('./services/customerService');
    await customerService.updateCustomer(id, updates);
    const customers = await customerService.getCustomers();
    set({ customers });
  },

  deleteCustomer: async (id) => {
    const { customerService } = await import('./services/customerService');
    await customerService.deleteCustomer(id);
    set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
  },

  toggleCustomerStatus: async (id) => {
    const customer = get().customers.find(c => c.id === id);
    if (!customer) return;
    const { customerService } = await import('./services/customerService');
    // Assuming updateCustomer handles status change
    await customerService.updateCustomer(id, { isActive: !customer.isActive });
    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    }));
  },

  addExpense: async (data) => {
    const { financeService } = await import('./services/financeService');
    await financeService.createExpense(data as any);
    const expenses = await financeService.getExpenses(200);
    set({ expenses });
  },

  deleteExpense: async (id) => {
    const { financeService } = await import('./services/financeService');
    await financeService.deleteExpense(id);
    set((state) => ({ expenses: state.expenses.filter(e => e.id !== id) }));
  },

  addUser: async (username, email, password, role) => {
    try {
      const { userService } = await import('./services/userService');
      const data = await userService.createUser({ name: username, email, password, role });

      // Reload users to ensure sync or push to state
      set((state) => ({
        users: [...state.users, data.user || {
          id: crypto.randomUUID(),
          username,
          email,
          role,
          createdAt: new Date().toISOString()
        }]
      }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  updateUser: async (id, updates) => {
    const { userService } = await import('./services/userService');
    await userService.updateUser(id, updates);
    const users = await userService.getUsers();
    set({ users });
  },

  deleteUser: async (id) => {
    const { userService } = await import('./services/userService');
    await userService.deleteUser(id);
    set((state) => ({ users: state.users.filter(u => u.id !== id) }));
  },

  loginCustomer: async (customerId) => {
    try {
      set({ isLoading: true, error: null });
      // Fetch customer token/projects via NEW Endpoint
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/auth/client-login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: customerId })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Map projects to CamelCase before saving
        const mappedProjects = mapProject(data.projects || []);

        // Clear any stale staff/admin user data
        localStorage.removeItem('mh_user');

        // Save to localStorage
        localStorage.setItem('mh_auth_token', data.token);
        localStorage.setItem('mh_auth_type', 'customer');
        localStorage.setItem('mh_current_customer', JSON.stringify(data.customer));
        localStorage.setItem('mh_projects', JSON.stringify(mappedProjects));

        set({
          isAuthenticated: true,
          authType: 'customer',
          currentCustomer: data.customer,
          projects: mappedProjects,
          showLoginModal: false,
          isLoading: false,
          currentUser: undefined // Explicitly not a staff user
        });
        return true;
      } else {
        throw new Error(data.error || "Invalid Access Code");
      }
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false, error: e.message || "Customer Login Failed" });
    }
    return false;
  },

  sendMessage: (text) => {
    set((state) => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        text,
        senderId: state.currentUser?.id || 'anon',
        senderName: state.currentUser?.username || 'Guest',
        timestamp: new Date().toISOString()
      }]
    }));
  },

  clearAuditLogs: () => set({ auditLogs: [] }),
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mh_theme', newTheme);
    return { theme: newTheme };
  }),
}));
