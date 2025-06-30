// User Types
export interface User {
  _id: string; // MongoDB document ID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'seller' | 'manager' | 'cashier' | 'inventory';
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Product Types
export interface Category {
  _id: string;
  id: string; // For compatibility
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  value: string;
  additionalCost?: number;
}

export interface Product {
  _id: string;
  id: string; // For compatibility
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitOfMeasure: string;
  variations?: ProductVariation[];
  images?: string[];
  isActive: boolean;
  taxable: boolean;
  taxRate?: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  totalSpent: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Sales Types
export interface SaleItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  totalPrice: number;
  variations?: { [key: string]: string };
}

export interface Payment {
  id?: string;
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'check';
  amount: number;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  gatewayResponse?: any;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customer?: Customer;
  sellerId: string;
  seller?: User;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  payments: Payment[];
  status: 'pending' | 'completed' | 'refunded' | 'partially_refunded';
  notes?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  saleId: string;
  sale?: Sale;
  items: SaleItem[];
  refundAmount: number;
  reason: string;
  processedBy: string;
  processor?: User;
  createdAt: string;
}

// Inventory Types
export interface InventoryMovement {
  id: string;
  productId: string;
  product?: Product;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'expired';
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  product?: Product;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  threshold?: number;
  currentStock: number;
  expiryDate?: string;
  isResolved: boolean;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  todaysSales: {
    amount: number;
    count: number;
    percentageChange: number;
  };
  monthlyRevenue: {
    amount: number;
    percentageChange: number;
  };
  totalCustomers: {
    count: number;
    percentageChange: number;
  };
  totalProducts: {
    count: number;
    lowStockCount: number;
  };
  totalUsers: {
    count: number;
    activeCount: number;
  };
}

export interface SalesChart {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
}

// Report Types
export interface SalesReport {
  period: {
    start: string;
    end: string;
  };
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  topProducts: TopProduct[];
  salesByCategory: {
    categoryName: string;
    totalSales: number;
    totalRevenue: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  salesByEmployee: {
    employeeId: string;
    employeeName: string;
    totalSales: number;
    totalRevenue: number;
  }[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface APIError {
  success: false;
  message: string;
  errors?: { [key: string]: string[] };
  code?: string;
}

// Form Types
export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitOfMeasure: string;
  isActive: boolean;
  taxable: boolean;
  taxRate?: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth?: string;
  notes?: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'seller' | 'manager' | 'cashier' | 'inventory';
  permissions: string[];
  isActive: boolean;
}

// Cart Types for POS
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  variations?: { [key: string]: string };
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  customer?: Customer;
}

// Settings Types
export interface POSSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  taxRate: number;
  receiptTemplate: string;
  autoGenerateBarcode: boolean;
  lowStockThreshold: number;
  allowNegativeStock: boolean;
  requireCustomerForSale: boolean;
  enableLoyaltyProgram: boolean;
  loyaltyPointsRate: number;
}

export interface PrinterSettings {
  name: string;
  type: 'thermal' | 'regular';
  width: number;
  connectionType: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  port?: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  id: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'damage' | 'expired';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalValue: number;
  reference?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  // Populated fields
  productId_populated?: {
    name: string;
    sku: string;
    unitOfMeasure: string;
  };
  userId_populated?: {
    firstName: string;
    lastName: string;
  };
}

export interface StockMovementFormData {
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'damage' | 'expired';
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  userId: string;
} 