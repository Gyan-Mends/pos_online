import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reference: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
});

const saleSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    default: 0
  },
  payments: [paymentSchema],
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'partially_refunded'],
    default: 'completed'
  },
  notes: String,
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate receipt number
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    try {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Use this.constructor instead of mongoose.model to avoid circular reference
      const Sale = this.constructor as any;
      const count = await Sale.countDocuments({
        createdAt: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });
      
      this.receiptNumber = `RCP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback receipt number
      const timestamp = Date.now();
      this.receiptNumber = `RCP-${timestamp}`;
    }
  }
  next();
});

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema); 