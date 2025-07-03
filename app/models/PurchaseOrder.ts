import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'partial_received', 'fully_received', 'cancelled'],
    default: 'draft'
  },
  items: [purchaseOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
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
  currency: {
    type: String,
    default: 'USD'
  },
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'],
    default: 'net_30'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  receivingNotes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for supplier population
purchaseOrderSchema.virtual('supplier', {
  ref: 'Supplier',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Virtual for creator population
purchaseOrderSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for receiver population
purchaseOrderSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receivedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to check if order is fully received
purchaseOrderSchema.virtual('isFullyReceived').get(function() {
  return this.items.every(item => item.receivedQuantity >= item.orderedQuantity);
});

// Virtual to check if order is partially received
purchaseOrderSchema.virtual('isPartiallyReceived').get(function() {
  return this.items.some(item => item.receivedQuantity > 0);
});

// Virtual to calculate total received items
purchaseOrderSchema.virtual('totalItemsReceived').get(function() {
  return this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
});

// Virtual to calculate total ordered items
purchaseOrderSchema.virtual('totalItemsOrdered').get(function() {
  return this.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
});

// Add indexes for performance
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ supplierId: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ createdBy: 1 });

const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder; 