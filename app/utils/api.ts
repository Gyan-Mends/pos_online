import axios from 'axios';
import { successToast, errorToast } from '../components/toast';

// Create axios instance
const api = axios.create({
  baseURL: typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:5173',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and user info
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user information for role-based filtering
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        config.headers['x-user-id'] = user._id;
        config.headers['x-user-role'] = user.role;
      } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiRequest = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<T> => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // DELETE request
  delete: async <T>(url: string): Promise<T> => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) =>
    apiRequest.post('/api/login', credentials),
  
  register: (userData: { name: string; email: string; password: string; role: string }) =>
    apiRequest.post('/auth/register', userData),
  
  logout: () => apiRequest.post('/auth/logout'),
  
  refreshToken: () => apiRequest.post('/auth/refresh'),
  
  getProfile: () => apiRequest.get('/auth/profile'),
};

// Products API
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    apiRequest.get('/api/products', params),
  
  getById: (id: string) => apiRequest.get(`/api/products/${id}`),
  
  create: (productData: any) => apiRequest.post('/api/products', productData),
  
  update: (id: string, productData: any) => apiRequest.put(`/api/products/${id}`, productData),
  
  delete: (id: string) => apiRequest.delete(`/api/products/${id}`),
  
  bulkDelete: (ids: string[]) => apiRequest.post('/api/products/bulk-delete', { ids }),
  
  updateStock: (id: string, quantity: number, type: 'increase' | 'decrease') =>
    apiRequest.patch(`/api/products/${id}/stock`, { quantity, type }),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiRequest.get('/api/categories'),
  
  create: (categoryData: { name: string; description?: string }) =>
    apiRequest.post('/api/categories', categoryData),
  
  update: (id: string, categoryData: { name: string; description?: string }) =>
    apiRequest.put(`/api/categories/${id}`, categoryData),
  
  delete: (id: string) => apiRequest.delete(`/api/categories/${id}`),
};

// Sales API
export const salesAPI = {
  getAll: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    apiRequest.get('/api/sales', params),
  
  getById: (id: string) => apiRequest.get(`/api/sales/${id}`),
  
  create: (saleData: any) => apiRequest.post('/api/sales', saleData),
  
  refund: (id: string, refundData: { items: any[]; reason: string; processedBy: string }) => 
    apiRequest.post(`/api/sales/${id}/refund`, refundData),
  
  getTodaysSales: () => apiRequest.get('/api/sales/today'),
  
  getReports: (params: { startDate: string; endDate: string; type: string }) =>
    apiRequest.get('/api/sales/reports', params),
};

// Customers API
export const customersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest.get('/api/customers', params),
  
  getById: (id: string) => apiRequest.get(`/api/customers/${id}`),
  
  create: (customerData: any) => apiRequest.post('/api/customers', customerData),
  
  update: (id: string, customerData: any) => apiRequest.put(`/api/customers/${id}`, customerData),
  
  delete: (id: string) => apiRequest.delete(`/api/customers/${id}`),
  
  getPurchaseHistory: (id: string) => apiRequest.get(`/api/customers/${id}/purchases`),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiRequest.get('/api/users', params),
  
  getById: (id: string) => apiRequest.get(`/api/users/${id}`),
  
  create: (userData: any) => apiRequest.post('/api/users', userData),
  
  update: (id: string, userData: any) => apiRequest.put(`/api/users/${id}`, userData),
  
  delete: (id: string) => apiRequest.delete(`/api/users/${id}`),
  
  changePassword: (id: string, passwordData: { currentPassword: string; newPassword: string }) =>
    apiRequest.put(`/api/users/${id}`, { ...passwordData, changePassword: true }),
  
  updateProfile: (id: string, profileData: any) => apiRequest.put(`/api/users/${id}`, profileData),
  
  getCurrentUser: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  updateCurrentUser: (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  },
};

// Profile API (for current user)
export const profileAPI = {
  getProfile: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  updateProfile: async (profileData: any) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const response = await apiRequest.put(`/api/users/${user._id}`, profileData) as any;
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    }
    throw new Error('User not found');
  },
  
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return await apiRequest.put(`/api/users/${user._id}`, { ...passwordData, changePassword: true });
    }
    throw new Error('User not found');
  },
  
  uploadAvatar: async (avatarFile: File) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return await apiRequest.post(`/api/users/${user._id}/avatar`, formData);
    }
    throw new Error('User not found');
  },
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: { page?: number; limit?: number; lowStock?: boolean }) =>
    apiRequest.get('/inventory', params),
  
  getLowStock: () => apiRequest.get('/inventory/low-stock'),
  
  getMovements: (params?: { page?: number; limit?: number; productId?: string; type?: string }) =>
    apiRequest.get('/inventory/movements', params),
  
  createMovement: (movementData: any) => apiRequest.post('/inventory/movements', movementData),
  
  adjustStock: (productId: string, adjustment: { quantity: number; type: string; reason: string }) =>
    apiRequest.post(`/inventory/products/${productId}/adjust`, adjustment),
};

// Stock Movements API
export const stockMovementsAPI = {
  getAll: (params?: { page?: number; limit?: number; productId?: string }) =>
    apiRequest.get('/api/stock-movements', params),
  
  getByProductId: (productId: string, params?: { page?: number; limit?: number }) =>
    apiRequest.get('/api/stock-movements', { ...params, productId }),
  
  create: (movementData: any) => apiRequest.post('/api/stock-movements', movementData),
  
  update: (id: string, movementData: any) => apiRequest.put(`/api/stock-movements/${id}`, movementData),
  
  delete: (id: string) => apiRequest.delete(`/api/stock-movements/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) =>
    apiRequest.get('/api/suppliers', params),
  
  getById: (id: string) => apiRequest.get(`/api/suppliers/${id}`),
  
  create: (supplierData: any) => apiRequest.post('/api/suppliers', supplierData),
  
  update: (id: string, supplierData: any) => apiRequest.put(`/api/suppliers/${id}`, supplierData),
  
  delete: (id: string) => apiRequest.delete(`/api/suppliers/${id}`),
};

// Purchase Orders API - AUTOMATED STOCK RECEIVING SYSTEM
export const purchaseOrdersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; supplierId?: string }) =>
    apiRequest.get('/api/purchase-orders', params),
  
  getById: (id: string) => apiRequest.get(`/api/purchase-orders/${id}`),
  
  create: (orderData: any) => apiRequest.post('/api/purchase-orders', orderData),
  
  update: (id: string, orderData: any) => apiRequest.put(`/api/purchase-orders/${id}`, orderData),
  
  delete: (id: string) => apiRequest.delete(`/api/purchase-orders/${id}`),
  
  // 🚀 AUTOMATED STOCK RECEIVING - THE KEY FUNCTION!
  receive: (id: string, receivingData: any) => 
    apiRequest.post(`/api/purchase-orders/${id}/receive`, receivingData),
  
  // Send to supplier (change status to 'sent')
  send: (id: string) => apiRequest.put(`/api/purchase-orders/${id}`, { status: 'sent' }),
  
  // Confirm order (change status to 'confirmed') 
  confirm: (id: string) => apiRequest.put(`/api/purchase-orders/${id}`, { status: 'confirmed' }),
  
  // Cancel order (change status to 'cancelled')
  cancel: (id: string) => apiRequest.put(`/api/purchase-orders/${id}`, { status: 'cancelled' }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiRequest.get('/api/dashboard'),
  
  getSalesChart: (period: string) => apiRequest.get(`/dashboard/sales-chart?period=${period}`),
  
  getTopProducts: (limit?: number) => apiRequest.get(`/dashboard/top-products?limit=${limit || 5}`),
  
  getRecentSales: (limit?: number) => apiRequest.get(`/dashboard/recent-sales?limit=${limit || 10}`),
  
  getLowStockAlerts: () => apiRequest.get('/dashboard/low-stock-alerts'),
};

// Reports API
export const reportsAPI = {
  // Sales Reports
  getSalesReport: (params: { 
    startDate: string; 
    endDate: string; 
    groupBy?: 'day' | 'week' | 'month';
    sellerId?: string;
    customerId?: string;
  }) => apiRequest.get('/api/sales', params),
  
  getSalesAnalytics: (params: { 
    startDate: string; 
    endDate: string; 
    metrics?: string[];
  }) => apiRequest.get('/api/dashboard', params),
  
  getTopSellingProducts: (params: { 
    startDate: string; 
    endDate: string; 
    limit?: number;
  }) => apiRequest.get('/api/dashboard', params),
  
  getSalesByEmployee: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/sales', params),
  
  // Products Reports
  getProductsReport: (params?: { 
    category?: string; 
    lowStock?: boolean;
    inactive?: boolean;
  }) => apiRequest.get('/api/products', params),
  
  getProductPerformance: (params: { 
    startDate: string; 
    endDate: string; 
    productId?: string;
  }) => apiRequest.get('/api/sales', { ...params, productAnalytics: true }),
  
  getProductProfitability: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/dashboard', { ...params, type: 'profitability' }),
  
  getCategoryAnalytics: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/dashboard', { ...params, type: 'categories' }),
  
  // Inventory Reports  
  getInventoryReport: (params?: { 
    lowStock?: boolean;
    outOfStock?: boolean;
    category?: string;
  }) => apiRequest.get('/api/products', params),
  
  getStockMovements: (params: { 
    startDate: string; 
    endDate: string; 
    productId?: string;
    type?: string;
  }) => apiRequest.get('/api/stock-movements', params),
  
  getStockValuation: () => apiRequest.get('/api/products', { valuation: true }),
  
  getStockAlerts: () => apiRequest.get('/api/products', { lowStock: true }),
  
  // Employee Reports
  getEmployeeReport: (params?: { 
    role?: string;
    active?: boolean;
    startDate?: string;
    endDate?: string;
  }) => apiRequest.get('/api/users', params),
  
  getEmployeePerformance: (params: { 
    startDate: string; 
    endDate: string; 
    employeeId?: string;
  }) => apiRequest.get('/api/sales', { ...params, groupBy: 'seller' }),
  
  getEmployeeActivity: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/sales', { ...params, activity: true }),
  
  // Financial Reports
  getFinancialReport: (params: { 
    startDate: string; 
    endDate: string; 
    type?: 'revenue' | 'profit' | 'expenses';
  }) => apiRequest.get('/api/dashboard', { ...params, financial: true }),
  
  getRevenueAnalytics: (params: { 
    startDate: string; 
    endDate: string; 
    groupBy?: 'day' | 'week' | 'month';
  }) => apiRequest.get('/api/dashboard', { ...params, type: 'revenue' }),
  
  getProfitAnalytics: (params: { 
    startDate: string; 
    endDate: string; 
    groupBy?: 'day' | 'week' | 'month';
  }) => apiRequest.get('/api/dashboard', { ...params, type: 'profit' }),
  
  getExpenseReport: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/purchase-orders', params),
  
  getCashFlowReport: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/dashboard', { ...params, type: 'cashflow' }),
  
  // Export functions
  exportSalesReport: (params: { 
    startDate: string; 
    endDate: string; 
    format: 'csv' | 'pdf' | 'excel';
  }) => apiRequest.get('/api/sales/export', params),
  
  exportProductsReport: (params: { 
    format: 'csv' | 'pdf' | 'excel';
    category?: string;
  }) => apiRequest.get('/api/products/export', params),
  
  exportInventoryReport: (params: { 
    format: 'csv' | 'pdf' | 'excel';
    lowStock?: boolean;
  }) => apiRequest.get('/api/products/export', params),
  
  exportFinancialReport: (params: { 
    startDate: string; 
    endDate: string; 
    format: 'csv' | 'pdf' | 'excel';
  }) => apiRequest.get('/api/dashboard/export', params),
};

// Audit API
export const auditAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string;
    userId?: string;
    action?: string;
    resource?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'success' | 'warning' | 'error' | 'info';
    source?: 'pos' | 'web' | 'mobile' | 'api' | 'system';
    search?: string;
  }) => apiRequest.get('/api/audit', params),
  
  create: (auditData: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'success' | 'warning' | 'error' | 'info';
    sessionId?: string;
    source?: 'pos' | 'web' | 'mobile' | 'api' | 'system';
    metadata?: any;
  }) => apiRequest.post('/api/audit', auditData),
  
  // Helper functions for common audit actions
  logUserAction: (action: string, details?: any) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return apiRequest.post('/api/audit', {
          userId: user._id,
          action,
          resource: 'user',
          resourceId: user._id,
          details,
          severity: 'low',
          status: 'success',
          source: 'pos'
        });
      } catch (error) {
        console.warn('Failed to log user action:', error);
      }
    }
  },
  
  logProductAction: (action: string, productId: string, details?: any) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return apiRequest.post('/api/audit', {
          userId: user._id,
          action,
          resource: 'product',
          resourceId: productId,
          details,
          severity: 'medium',
          status: 'success',
          source: 'pos'
        });
      } catch (error) {
        console.warn('Failed to log product action:', error);
      }
    }
  },
  
  logSaleAction: (action: string, saleId: string, details?: any) => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return apiRequest.post('/api/audit', {
          userId: user._id,
          action,
          resource: 'sale',
          resourceId: saleId,
          details,
          severity: 'high',
          status: 'success',
          source: 'pos'
        });
      } catch (error) {
        console.warn('Failed to log sale action:', error);
      }
    }
  },
  
  logSecurityEvent: (action: string, details?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'high') => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return apiRequest.post('/api/audit', {
          userId: user._id,
          action,
          resource: 'security',
          details,
          severity,
          status: 'warning',
          source: 'pos'
        });
      } catch (error) {
        console.warn('Failed to log security event:', error);
      }
    }
  },
  
  // Search and filter functions
  searchLogs: (searchTerm: string, filters?: any) => {
    return apiRequest.get('/api/audit', { search: searchTerm, ...filters });
  },
  
  getLogsByUser: (userId: string, params?: any) => {
    return apiRequest.get('/api/audit', { userId, ...params });
  },
  
  getLogsByResource: (resource: string, resourceId?: string, params?: any) => {
    return apiRequest.get('/api/audit', { resource, resourceId, ...params });
  },
  
  getLogsByAction: (action: string, params?: any) => {
    return apiRequest.get('/api/audit', { action, ...params });
  },
  
  getLogsByDateRange: (startDate: string, endDate: string, params?: any) => {
    return apiRequest.get('/api/audit', { startDate, endDate, ...params });
  },
  
  // Analytics functions
  getAuditAnalytics: (params: { 
    startDate: string; 
    endDate: string; 
    groupBy?: 'day' | 'week' | 'month';
  }) => apiRequest.get('/api/audit', { ...params, analytics: true }),
  
  getSecuritySummary: (params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/audit', { ...params, resource: 'security', summary: true }),
  
  getUserActivitySummary: (userId: string, params: { 
    startDate: string; 
    endDate: string; 
  }) => apiRequest.get('/api/audit', { ...params, userId, summary: true }),
  
  // Export functions
  exportAuditLogs: (params: { 
    startDate: string; 
    endDate: string; 
    format: 'csv' | 'pdf' | 'excel';
    filters?: any;
  }) => apiRequest.get('/api/audit/export', params),
};

// Store API
export const storeAPI = {
  getStore: () => apiRequest.get('/api/store'),
  
  updateStore: (storeData: any) => apiRequest.post('/api/store', storeData),
  
  createStore: (storeData: any) => apiRequest.post('/api/store', storeData),
  
  deleteStore: () => apiRequest.delete('/api/store'),
};

export default api; 