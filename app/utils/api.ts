import axios from 'axios';
import { successToast, errorToast } from '../components/toast';

// Create axios instance
const api = axios.create({
  baseURL: typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:5173',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  
  refund: (id: string, items: any[]) => apiRequest.post(`/api/sales/${id}/refund`, { items }),
  
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
  
  updatePermissions: (id: string, permissions: string[]) =>
    apiRequest.patch(`/api/users/${id}/permissions`, { permissions }),
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

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiRequest.get('/dashboard/stats'),
  
  getSalesChart: (period: string) => apiRequest.get(`/dashboard/sales-chart?period=${period}`),
  
  getTopProducts: (limit?: number) => apiRequest.get(`/dashboard/top-products?limit=${limit || 5}`),
  
  getRecentSales: (limit?: number) => apiRequest.get(`/dashboard/recent-sales?limit=${limit || 10}`),
  
  getLowStockAlerts: () => apiRequest.get('/dashboard/low-stock-alerts'),
};

export default api; 