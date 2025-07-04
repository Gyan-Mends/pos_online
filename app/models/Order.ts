import mongoose, { Schema, Document } from 'mongoose';

// Order Item interface
export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variations?: Array<{
    name: string;
    value: string;
    additionalCost: number;
  }>;
}

// Shipping Address interface
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

// Payment Information interface
export interface PaymentInfo {
  method: 'card' | 'mobile_money' | 'bank_transfer' | 'cash' | 'other';
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway?: string;
  transactionId?: string;
}

// Status History interface
export interface StatusHistory {
  status: string;
  timestamp: Date;
  notes?: string;
  updatedBy: mongoose.Types.ObjectId;
}

// Order interface
export interface IOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Order Status
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: StatusHistory[];
  
  // Shipping Information
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express' | 'overnight' | 'pickup';
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  
  // Payment Information
  paymentInfo: PaymentInfo;
  
  // Order Management
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'ecommerce' | 'pos' | 'phone' | 'email';
  notes?: string;
  internalNotes?: string;
  
  // Fulfillment
  assignedTo?: mongoose.Types.ObjectId;
  packedBy?: mongoose.Types.ObjectId;
  shippedBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  orderDate: Date;
  confirmedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Order Item Schema
const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  variations: [{
    name: { type: String, required: true },
    value: { type: String, required: true },
    additionalCost: { type: Number, default: 0 }
  }]
});

// Shipping Address Schema
const ShippingAddressSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'US'
  },
  phone: String
});

// Payment Info Schema
const PaymentInfoSchema = new Schema({
  method: {
    type: String,
    enum: ['card', 'mobile_money', 'bank_transfer', 'cash', 'other'],
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  gateway: String,
  transactionId: String
});

// Status History Schema
const StatusHistorySchema = new Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Main Order Schema
const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true
  },
  customerInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String
  },
  items: [OrderItemSchema],
  
  // Amounts
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [StatusHistorySchema],
  
  // Shipping
  shippingAddress: ShippingAddressSchema,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'pickup'],
    default: 'standard'
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Payment
  paymentInfo: PaymentInfoSchema,
  
  // Management
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  source: {
    type: String,
    enum: ['ecommerce', 'pos', 'phone', 'email'],
    default: 'ecommerce'
  },
  notes: String,
  internalNotes: String,
  
  // Fulfillment
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  packedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  shippedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  packedAt: Date,
  shippedAt: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

// Generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Count orders for today
      const Order = this.constructor as any;
      const count = await Order.countDocuments({
        createdAt: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });
      
      this.orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      const timestamp = Date.now();
      this.orderNumber = `ORD-${timestamp}`;
    }
  }
  next();
});

// Update status history when status changes
OrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    // This will be handled by the API when updating status
  }
  next();
});

// Indexes for performance
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ 'customerInfo.email': 1 });
OrderSchema.index({ 'paymentInfo.reference': 1 });
OrderSchema.index({ source: 1 });
OrderSchema.index({ priority: 1 });

// Instance methods
OrderSchema.methods.updateStatus = function(newStatus: string, notes: string, updatedBy: mongoose.Types.ObjectId) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy
  });
  
  // Update relevant timestamps
  const now = new Date();
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'packed':
      this.packedAt = now;
      break;
    case 'shipped':
      this.shippedAt = now;
      break;
    case 'delivered':
      this.deliveredAt = now;
      this.actualDelivery = now;
      break;
  }
};

// Static methods
OrderSchema.statics.findByOrderNumber = function(orderNumber: string) {
  return this.findOne({ orderNumber })
    .populate('customerId', 'firstName lastName email phone')
    .populate('assignedTo', 'firstName lastName')
    .populate('packedBy', 'firstName lastName')
    .populate('shippedBy', 'firstName lastName')
    .populate('statusHistory.updatedBy', 'firstName lastName');
};

OrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status })
    .populate('customerId', 'firstName lastName email phone')
    .sort({ orderDate: -1 });
};

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order; 