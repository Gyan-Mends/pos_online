// Script to populate audit logs with sample data via API
const sampleAuditLogs = [
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c", // Sample user ID
    action: "login",
    resource: "authentication",
    details: {
      description: "User logged in successfully",
      loginMethod: "email",
      deviceInfo: "Chrome on Windows"
    },
    severity: "low",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "create",
    resource: "product",
    resourceId: "product_123",
    details: {
      description: "New product created",
      productName: "Sample Product",
      category: "Electronics",
      price: 99.99
    },
    severity: "medium",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "update",
    resource: "product",
    resourceId: "product_123",
    details: {
      description: "Product price updated",
      oldPrice: 99.99,
      newPrice: 89.99,
      reason: "Promotional discount"
    },
    severity: "medium",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "create",
    resource: "sale",
    resourceId: "sale_456",
    details: {
      description: "New sale transaction completed",
      receiptNumber: "RCP-20241201-0001",
      totalAmount: 179.98,
      itemCount: 2,
      paymentMethod: "cash"
    },
    severity: "medium",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "refund",
    resource: "sale",
    resourceId: "sale_456",
    details: {
      description: "Partial refund processed",
      originalAmount: 179.98,
      refundAmount: 89.99,
      reason: "Defective item",
      refundMethod: "cash"
    },
    severity: "high",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "delete",
    resource: "product",
    resourceId: "product_789",
    details: {
      description: "Product deleted from inventory",
      productName: "Discontinued Item",
      reason: "End of life cycle"
    },
    severity: "high",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "failed_login",
    resource: "authentication",
    details: {
      description: "Failed login attempt",
      attemptedEmail: "hacker@example.com",
      failureReason: "Invalid credentials",
      securityAlert: true
    },
    severity: "critical",
    status: "error",
    source: "web"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "backup",
    resource: "system",
    details: {
      description: "System backup completed",
      backupType: "full",
      backupSize: "2.3 GB",
      duration: "45 minutes"
    },
    severity: "low",
    status: "success",
    source: "system"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "export",
    resource: "report",
    resourceId: "sales_report_2024_12",
    details: {
      description: "Sales report exported",
      reportType: "monthly_sales",
      format: "PDF",
      dateRange: "2024-12-01 to 2024-12-31"
    },
    severity: "medium",
    status: "success",
    source: "pos"
  },
  {
    userId: "67543f2b4a5c2d1e8f9a0b1c",
    action: "config_change",
    resource: "settings",
    resourceId: "tax_settings",
    details: {
      description: "Tax configuration updated",
      setting: "sales_tax_rate",
      oldValue: "8.5%",
      newValue: "9.0%",
      effectiveDate: "2024-01-01"
    },
    severity: "high",
    status: "success",
    source: "pos"
  }
];

// Function to create audit logs via API
async function createAuditLogs() {
  console.log('Creating audit logs via browser fetch...');
  
  for (const logData of sampleAuditLogs) {
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin' // Bypass auth check for seeding
        },
        body: JSON.stringify(logData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Created audit log: ${logData.action} - ${logData.resource}`);
      } else {
        console.error(`Failed to create audit log: ${response.status} - ${response.statusText}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error creating audit log:', error.message);
    }
  }
  
  console.log('Finished creating audit logs');
}

// Make available globally for browser console
if (typeof window !== 'undefined') {
  window.createAuditLogs = createAuditLogs;
  window.sampleAuditLogs = sampleAuditLogs;
  console.log('Audit log creation function available as window.createAuditLogs()');
} 