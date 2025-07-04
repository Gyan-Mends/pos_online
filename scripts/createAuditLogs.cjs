const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas (simplified versions)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  avatar: String
});

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
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
  sessionId: String,
  source: { 
    type: String, 
    enum: ['pos', 'web', 'mobile', 'api', 'system'],
    default: 'pos'
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  collection: 'auditlogs'
});

const User = mongoose.model('User', userSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function createSampleAuditLogs() {
  try {
    console.log('Creating sample audit logs...');
    
    // Get or create a sample user
    let user = await User.findOne({ email: 'admin@pos.com' });
    if (!user) {
      user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@pos.com',
        role: 'admin',
        avatar: '/avatars/admin.jpg'
      });
      console.log('Created sample admin user');
    }
    
    // Create sample audit logs
    const sampleLogs = [
      {
        userId: user._id,
        action: 'login',
        resource: 'authentication',
        details: {
          description: 'User logged in successfully',
          loginMethod: 'email',
          deviceInfo: 'Chrome on Windows'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'low',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'create',
        resource: 'product',
        resourceId: 'product_123',
        details: {
          description: 'New product created',
          productName: 'Sample Product',
          category: 'Electronics',
          price: 99.99
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'update',
        resource: 'product',
        resourceId: 'product_123',
        details: {
          description: 'Product price updated',
          oldPrice: 99.99,
          newPrice: 89.99,
          reason: 'Promotional discount'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'create',
        resource: 'sale',
        resourceId: 'sale_456',
        details: {
          description: 'New sale transaction completed',
          receiptNumber: 'RCP-20241201-0001',
          totalAmount: 179.98,
          itemCount: 2,
          paymentMethod: 'cash'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'refund',
        resource: 'sale',
        resourceId: 'sale_456',
        details: {
          description: 'Partial refund processed',
          originalAmount: 179.98,
          refundAmount: 89.99,
          reason: 'Defective item',
          refundMethod: 'cash'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'high',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'delete',
        resource: 'product',
        resourceId: 'product_789',
        details: {
          description: 'Product deleted from inventory',
          productName: 'Discontinued Item',
          reason: 'End of life cycle'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'high',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'failed_login',
        resource: 'authentication',
        details: {
          description: 'Failed login attempt',
          attemptedEmail: 'hacker@example.com',
          failureReason: 'Invalid credentials',
          securityAlert: true
        },
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        severity: 'critical',
        status: 'error',
        sessionId: 'failed_session_' + Date.now(),
        source: 'web'
      },
      {
        userId: user._id,
        action: 'backup',
        resource: 'system',
        details: {
          description: 'System backup completed',
          backupType: 'full',
          backupSize: '2.3 GB',
          duration: '45 minutes'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'POS-System-Service/1.0',
        severity: 'low',
        status: 'success',
        sessionId: 'system_backup_' + Date.now(),
        source: 'system'
      },
      {
        userId: user._id,
        action: 'export',
        resource: 'report',
        resourceId: 'sales_report_2024_12',
        details: {
          description: 'Sales report exported',
          reportType: 'monthly_sales',
          format: 'PDF',
          dateRange: '2024-12-01 to 2024-12-31'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      },
      {
        userId: user._id,
        action: 'config_change',
        resource: 'settings',
        resourceId: 'tax_settings',
        details: {
          description: 'Tax configuration updated',
          setting: 'sales_tax_rate',
          oldValue: '8.5%',
          newValue: '9.0%',
          effectiveDate: '2024-01-01'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'high',
        status: 'success',
        sessionId: 'session_' + Date.now(),
        source: 'pos'
      }
    ];
    
    // Add random timestamps within the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    for (const log of sampleLogs) {
      const randomTime = new Date(sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime()));
      log.createdAt = randomTime;
      log.updatedAt = randomTime;
    }
    
    // Clear existing audit logs
    await AuditLog.deleteMany({});
    console.log('Cleared existing audit logs');
    
    // Insert sample audit logs
    await AuditLog.insertMany(sampleLogs);
    console.log(`Created ${sampleLogs.length} sample audit logs`);
    
    // Show summary
    const counts = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Audit log summary by action:');
    counts.forEach(item => {
      console.log(`- ${item._id}: ${item.count}`);
    });
    
  } catch (error) {
    console.error('Error creating sample audit logs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
createSampleAuditLogs(); 