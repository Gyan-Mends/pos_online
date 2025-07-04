import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'login', 'logout', 'password_change', 'user_created', 'user_updated', 'user_deleted',
      // Product actions
      'product_created', 'product_updated', 'product_deleted', 'stock_adjusted',
      // Sale actions
      'sale_created', 'sale_updated', 'sale_refunded', 'sale_cancelled',
      // Customer actions
      'customer_created', 'customer_updated', 'customer_deleted',
      // Purchase order actions
      'purchase_order_created', 'purchase_order_updated', 'purchase_order_received',
      // Category actions
      'category_created', 'category_updated', 'category_deleted',
      // Supplier actions
      'supplier_created', 'supplier_updated', 'supplier_deleted',
      // Settings actions
      'settings_updated', 'backup_created', 'backup_restored',
      // System actions
      'system_startup', 'system_shutdown', 'database_maintenance',
      // Security actions
      'failed_login', 'unauthorized_access', 'permission_denied',
      // Other actions
      'other'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'user', 'product', 'sale', 'customer', 'purchase_order', 'category', 
      'supplier', 'settings', 'system', 'security', 'stock', 'other'
    ]
  },
  resourceId: {
    type: String,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'success'
  },
  sessionId: {
    type: String,
    required: false
  },
  source: {
    type: String,
    enum: ['pos', 'web', 'mobile', 'api', 'system'],
    default: 'pos'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, createdAt: -1 });
AuditLogSchema.index({ resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted display
AuditLogSchema.virtual('displayName').get(function() {
  const action = this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `${action} - ${this.resource}`;
});

// Virtual for user display
AuditLogSchema.virtual('userDisplay').get(function() {
  if (this.user) {
    return `${this.user.firstName} ${this.user.lastName}`;
  }
  return 'Unknown User';
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog; 