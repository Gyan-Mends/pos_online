import { data } from 'react-router';

// GET /api/audit - Get all audit logs with optional filters
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: AuditLog } = await import('../../models/AuditLog');
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');
    
    // Get current user from headers for role-based access control
    const currentUserRole = request.headers.get('x-user-role');
    
    // Only admin users can access audit logs
    if (currentUserRole !== 'admin') {
      return data(
        {
          success: false,
          message: 'Access denied: Admin privileges required'
        },
        { status: 403 }
      );
    }
    
    // Build query filters
    const query: any = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (source) query.source = source;
    
    // Text search across multiple fields
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { 'details.description': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);
    
    // Get audit logs with pagination
    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Transform the data to match expected structure
    const transformedLogs = auditLogs.map(log => ({
      ...log,
      id: log._id.toString(),
      user: log.userId,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }));
    
    return data({
      success: true,
      data: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Error in audit loader:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to load audit logs'
      },
      { status: 500 }
    );
  }
}

// POST /api/audit - Create new audit log entry
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: AuditLog } = await import('../../models/AuditLog');
    
    const method = request.method;
    
    if (method === 'POST') {
      const auditData = await request.json();
      
      // Validate required fields
      if (!auditData.userId || !auditData.action || !auditData.resource) {
        return data(
          {
            success: false,
            message: 'User ID, action, and resource are required'
          },
          { status: 400 }
        );
      }
      
      // Get IP address from request
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      // Get user agent
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      // Create the audit log
      const auditLog = new AuditLog({
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: auditData.details || {},
        ipAddress,
        userAgent,
        severity: auditData.severity || 'medium',
        status: auditData.status || 'success',
        sessionId: auditData.sessionId,
        source: auditData.source || 'pos',
        metadata: auditData.metadata || {}
      });
      
      await auditLog.save();
      
      // Populate user data for response
      await auditLog.populate('userId', 'firstName lastName email avatar');
      
      return data({
        success: true,
        data: {
          ...auditLog.toObject(),
          id: auditLog._id.toString(),
          user: auditLog.userId,
          createdAt: auditLog.createdAt.toISOString(),
          updatedAt: auditLog.updatedAt.toISOString()
        },
        message: 'Audit log created successfully'
      });
    }
    
    return data(
      {
        success: false,
        message: 'Method not allowed'
      },
      { status: 405 }
    );
    
  } catch (error: any) {
    console.error('Error in audit API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

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
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: AuditLog } = await import('../../models/AuditLog');
    
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