import axios from 'axios';
import { successToast, errorToast } from '../components/toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
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
  login: (credentials: { email: string; password: string }) =>
    apiRequest.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; password: string; role: string }) =>
    apiRequest.post('/auth/register', userData),
  
  logout: () => apiRequest.post('/auth/logout'),
  
  refreshToken: () => apiRequest.post('/auth/refresh'),
  
  getProfile: () => apiRequest.get('/auth/profile'),
};

// Products API
export const productsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    apiRequest.get('/products', params),
  
  getById: (id: string) => apiRequest.get(`/products/${id}`),
  
  create: (productData: any) => apiRequest.post('/products', productData),
  
  update: (id: string, productData: any) => apiRequest.put(`/products/${id}`, productData),
  
  delete: (id: string) => apiRequest.delete(`/products/${id}`),
  
  bulkDelete: (ids: string[]) => apiRequest.post('/products/bulk-delete', { ids }),
  
  updateStock: (id: string, quantity: number, type: 'increase' | 'decrease') =>
    apiRequest.patch(`/products/${id}/stock`, { quantity, type }),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiRequest.get('/categories'),
  
  create: (categoryData: { name: string; description?: string }) =>
    apiRequest.post('/categories', categoryData),
  
  update: (id: string, categoryData: { name: string; description?: string }) =>
    apiRequest.put(`/categories/${id}`, categoryData),
  
  delete: (id: string) => apiRequest.delete(`/categories/${id}`),
};

// Sales API
export const salesAPI = {
  getAll: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    apiRequest.get('/sales', params),
  
  getById: (id: string) => apiRequest.get(`/sales/${id}`),
  
  create: (saleData: any) => apiRequest.post('/sales', saleData),
  
  refund: (id: string, items: any[]) => apiRequest.post(`/sales/${id}/refund`, { items }),
  
  getTodaysSales: () => apiRequest.get('/sales/today'),
  
  getReports: (params: { startDate: string; endDate: string; type: string }) =>
    apiRequest.get('/sales/reports', params),
};

// Customers API
export const customersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest.get('/customers', params),
  
  getById: (id: string) => apiRequest.get(`/customers/${id}`),
  
  create: (customerData: any) => apiRequest.post('/customers', customerData),
  
  update: (id: string, customerData: any) => apiRequest.put(`/customers/${id}`, customerData),
  
  delete: (id: string) => apiRequest.delete(`/customers/${id}`),
  
  getPurchaseHistory: (id: string) => apiRequest.get(`/customers/${id}/purchases`),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiRequest.get('/users', params),
  
  getById: (id: string) => apiRequest.get(`/users/${id}`),
  
  create: (userData: any) => apiRequest.post('/users', userData),
  
  update: (id: string, userData: any) => apiRequest.put(`/users/${id}`, userData),
  
  delete: (id: string) => apiRequest.delete(`/users/${id}`),
  
  updatePermissions: (id: string, permissions: string[]) =>
    apiRequest.patch(`/users/${id}/permissions`, { permissions }),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: { page?: number; limit?: number; lowStock?: boolean }) =>
    apiRequest.get('/inventory', params),
  
  getLowStock: () => apiRequest.get('/inventory/low-stock'),
  
  addStock: (productId: string, quantity: number, note?: string) =>
    apiRequest.post('/inventory/add-stock', { productId, quantity, note }),
  
  removeStock: (productId: string, quantity: number, note?: string) =>
    apiRequest.post('/inventory/remove-stock', { productId, quantity, note }),
  
  getMovements: (productId?: string) => apiRequest.get('/inventory/movements', { productId }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiRequest.get('/dashboard/stats'),
  
  getRecentSales: (limit?: number) => apiRequest.get('/dashboard/recent-sales', { limit }),
  
  getTopProducts: (limit?: number) => apiRequest.get('/dashboard/top-products', { limit }),
  
  getSalesChart: (period: 'day' | 'week' | 'month') =>
    apiRequest.get('/dashboard/sales-chart', { period }),
};

export default api; 