import '../../mongoose.server';

// Helper function to create audit log entries (can be used by other APIs)
export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  details,
  ipAddress = 'unknown',
  userAgent = 'unknown',
  severity = 'medium',
  status = 'success',
  sessionId,
  source = 'pos',
  metadata = {}
}: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'warning' | 'error' | 'info';
  sessionId?: string;
  source?: 'pos' | 'web' | 'mobile' | 'api' | 'system';
  metadata?: any;
}) {
  try {
    const { default: AuditLog } = await import('../models/AuditLog');
    
    const auditLog = new AuditLog({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity,
      status,
      sessionId,
      source,
      metadata
    });
    
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
} 