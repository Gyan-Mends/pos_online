import mongoose, { Schema, Document } from 'mongoose';

// Store interface
export interface IStore extends Document {
  // Basic Information
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email: string;
  phone: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Business Information  
  businessRegistration?: string;
  taxId?: string;
  businessType?: string;
  
  // Operating Hours
  operatingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  
  // Currency and Regional Settings
  currency: string;
  timezone: string;
  dateFormat: string;
  
  // Receipt Settings
  receiptSettings: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    footerText?: string;
    headerText?: string;
  };
  
  // Notification Settings
  notifications: {
    lowStockAlert: boolean;
    lowStockThreshold: number;
    dailyReports: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  
  // Social Media
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  
  // Tax Settings
  taxSettings?: {
    rate: number;
    type: string;
    name: string;
  };
  
  // System Settings
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Store Schema
const storeSchema = new Schema<IStore>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Ghana' },
  },
  businessRegistration: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String,
    trim: true,
  },
  businessType: {
    type: String,
    enum: ['retail', 'wholesale', 'both', 'service', 'other'],
    default: 'retail',
  },
  operatingHours: {
    monday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    tuesday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    wednesday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    thursday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    friday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    saturday: { 
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      isClosed: { type: Boolean, default: false }
    },
    sunday: { 
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isClosed: { type: Boolean, default: true }
    },
  },
  currency: {
    type: String,
    default: 'GHS',
    enum: ['GHS', 'USD', 'EUR', 'GBP', 'NGN'],
  },
  timezone: {
    type: String,
    default: 'Africa/Accra',
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
  },
  receiptSettings: {
    showLogo: { type: Boolean, default: true },
    showAddress: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: true },
    showWebsite: { type: Boolean, default: false },
    footerText: { type: String, default: 'Thank you for your business!' },
    headerText: { type: String, default: '' },
  },
  notifications: {
    lowStockAlert: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 10 },
    dailyReports: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    monthlyReports: { type: Boolean, default: false },
  },
  socialMedia: {
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
  },
  taxSettings: {
    rate: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    name: { type: String, default: 'VAT' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Create indexes
storeSchema.index({ email: 1 });
storeSchema.index({ isActive: 1 });

// Export the model (check if it already exists to avoid recompilation error)
export default mongoose.models.Store || mongoose.model<IStore>('Store', storeSchema); 