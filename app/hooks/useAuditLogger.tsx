import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { auditAPI } from '../utils/api';

interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'warning' | 'error' | 'info';
  source?: 'pos' | 'web' | 'mobile' | 'api' | 'system';
  metadata?: any;
}

export const useAuditLogger = () => {
  const location = useLocation();

  // Get user data from localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get current user for audit logging:', error);
      return null;
    }
  }, []);

  // Get client information
  const getClientInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      ipAddress: 'client-side', // Will be populated by server
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || null,
      sessionId: sessionStorage.getItem('sessionId') || 
                 `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }, []);

  // Main logging function
  const logAuditEvent = useCallback(async (data: AuditLogData) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        console.warn('No user found for audit logging');
        return;
      }

      console.log('🔍 Attempting to log audit event:', data.action, data.resource);

      const clientInfo = getClientInfo();
      
      // Ensure session ID is stored
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', clientInfo.sessionId);
      }

      const auditData = {
        userId: user._id || user.id,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: {
          ...data.details,
          ...clientInfo
        },
        severity: data.severity || 'low',
        status: data.status || 'success',
        source: data.source || 'web',
        sessionId: clientInfo.sessionId,
        metadata: {
          ...data.metadata,
          browser: navigator.userAgent,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      console.log('📤 Sending audit data to API:', auditData);

      // Log to API
      const response = await auditAPI.create(auditData);
      
      if (response.success === false) {
        console.error('❌ Audit API returned error:', response.message);
        throw new Error(response.message);
      }
      
      console.log('✅ Audit log created successfully:', response);
    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Action attempted:', data.action, 'Resource:', data.resource);
      // Don't throw error to avoid breaking user experience
    }
  }, [getCurrentUser, getClientInfo]);

  // Log page navigation
  const logPageNavigation = useCallback((pathname: string, search?: string) => {
    const pageNames: Record<string, string> = {
      '/': 'Dashboard',
      '/pos': 'Point of Sale',
      '/products': 'Products',
      '/inventory': 'Inventory',
      '/sales': 'Sales',
      '/customers': 'Customers',
      '/users': 'Users',
      '/reports': 'Reports',
      '/audit': 'Audit Trail',
      '/settings': 'Settings',
      '/profile': 'Profile'
    };

    const pageName = pageNames[pathname] || pathname.replace('/', '').replace('-', ' ');
    
    logAuditEvent({
      action: 'page_visited',
      resource: 'navigation',
      resourceId: pathname,
      details: {
        pageName,
        pathname,
        search: search || window.location.search,
        previousPage: document.referrer,
        loadTime: Date.now()
      },
      severity: 'low',
      status: 'info',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log user actions
  const logUserAction = useCallback((action: string, details?: any) => {
    logAuditEvent({
      action,
      resource: 'user',
      details,
      severity: 'low',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log product actions
  const logProductAction = useCallback((action: string, productId?: string, details?: any) => {
    logAuditEvent({
      action,
      resource: 'product',
      resourceId: productId,
      details,
      severity: 'medium',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log sale actions
  const logSaleAction = useCallback((action: string, saleId?: string, details?: any) => {
    logAuditEvent({
      action,
      resource: 'sale',
      resourceId: saleId,
      details,
      severity: 'high',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log security events
  const logSecurityEvent = useCallback((action: string, details?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'high') => {
    logAuditEvent({
      action,
      resource: 'security',
      details,
      severity,
      status: 'warning',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log system events
  const logSystemEvent = useCallback((action: string, details?: any) => {
    logAuditEvent({
      action,
      resource: 'system',
      details,
      severity: 'medium',
      status: 'info',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log login/logout events
  const logAuthEvent = useCallback((action: 'login' | 'logout', details?: any) => {
    logAuditEvent({
      action,
      resource: 'authentication',
      details,
      severity: 'medium',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Track page navigation changes
  useEffect(() => {
    logPageNavigation(location.pathname, location.search);
  }, [location.pathname, location.search, logPageNavigation]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSystemEvent('page_hidden', {
          page: location.pathname,
          timestamp: new Date().toISOString()
        });
      } else {
        logSystemEvent('page_visible', {
          page: location.pathname,
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname, logSystemEvent]);

  // Track beforeunload (page closing)
  useEffect(() => {
    const handleBeforeUnload = () => {
      logSystemEvent('page_unload', {
        page: location.pathname,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('sessionStartTime') || '0')
      });
    };

    // Store session start time
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname, logSystemEvent]);

  return {
    logAuditEvent,
    logPageNavigation,
    logUserAction,
    logProductAction,
    logSaleAction,
    logSecurityEvent,
    logSystemEvent,
    logAuthEvent
  };
};

// Utility hook for automatic audit logging on component mount
export const usePageAudit = (pageName?: string, additionalData?: any) => {
  const location = useLocation();
  const { logPageNavigation } = useAuditLogger();

  useEffect(() => {
    if (pageName) {
      logPageNavigation(location.pathname, location.search);
    }
  }, [location, pageName, logPageNavigation]);
};

export default useAuditLogger;