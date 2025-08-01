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
    const currentUserId = request.headers.get('x-user-id');
    
    // For now, allow access to authenticated users (can be restricted later)
    // Only admin users can access all audit logs, others see limited data
    console.log('Audit API access - User Role:', currentUserRole, 'User ID:', currentUserId);
    
    if (!currentUserId) {
      return data(
        {
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }
    
    // Build query filters
    const query: any = {};
    
    // Non-admin users can only see their own audit logs
    if (currentUserRole !== 'admin') {
      query.userId = currentUserId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (userId && currentUserRole === 'admin') query.userId = userId; // Only admins can filter by specific user
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (source) query.source = source;

    // Handle action filtering - exclude system activities but allow specific action filters
    const excludedActions = ['page_hidden', 'page_visible', 'page_unload', 'system_startup', 'system_shutdown'];
    if (action) {
      // If filtering by specific action, only show that action (unless it's excluded)
      if (!excludedActions.includes(action)) {
        query.action = action;
      } else {
        // If trying to filter by excluded action, return no results
        query.action = { $in: [] };
      }
    } else {
      // If no action filter, exclude system activities
      query.action = { $nin: excludedActions };
    }
    
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
      
      console.log('🔍 Creating audit log with data:', {
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        severity: auditData.severity || 'medium',
        status: auditData.status || 'success',
        source: auditData.source || 'pos'
      });

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
      
      console.log('💾 Saving audit log to database...');
      await auditLog.save();
      console.log('✅ Audit log saved successfully');
      
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

 