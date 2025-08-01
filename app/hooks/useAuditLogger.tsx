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
      '/': 'Dashboard - Main Overview',
      '/dashboard': 'Dashboard - Main Overview',
      '/pos': 'Point of Sale - Transaction Processing',
      '/products': 'Products Management - Product Catalog',
      '/products/create': 'Products - Create New Product',
      '/products/edit': 'Products - Edit Product',
      '/inventory': 'Inventory Management - Stock Overview',
      '/inventory/movements': 'Inventory - Stock Movements',
      '/inventory/adjustments': 'Inventory - Stock Adjustments',
      '/sales': 'Sales Management - Transaction History',
      '/sales/create': 'Sales - Create New Sale',
      '/sales/reports': 'Sales - Reports & Analytics',
      '/customers': 'Customer Management - Customer Database',
      '/customers/create': 'Customers - Add New Customer',
      '/users': 'User Management - Staff Administration',
      '/reports': 'Reports & Analytics - Business Intelligence',
      '/reports/sales': 'Reports - Sales Analytics',
      '/reports/inventory': 'Reports - Inventory Analytics',
      '/audit': 'Audit Trail - System Activity Logs',
      '/settings': 'System Settings - Configuration',
      '/settings/store': 'Settings - Store Configuration',
      '/settings/tax': 'Settings - Tax Configuration',
      '/profile': 'User Profile - Personal Settings',
      '/login': 'Login Page - User Authentication',
      '/logout': 'Logout - Session Termination'
    };

    // Get more descriptive page name
    let pageName = pageNames[pathname];
    
    // Handle dynamic routes
    if (!pageName) {
      if (pathname.startsWith('/products/')) {
        pageName = 'Products - Product Details';
      } else if (pathname.startsWith('/customers/')) {
        pageName = 'Customers - Customer Profile';
      } else if (pathname.startsWith('/sales/')) {
        pageName = 'Sales - Sale Details';
      } else if (pathname.startsWith('/users/')) {
        pageName = 'Users - User Profile';
      } else {
        // Fallback: clean up pathname
        pageName = pathname
          .replace('/', '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page';
      }
    }

    // Get previous page name for context
    const referrerPath = document.referrer ? new URL(document.referrer).pathname : null;
    const previousPageName = referrerPath ? pageNames[referrerPath] || referrerPath : 'Direct Access';
    
    logAuditEvent({
      action: 'page_visited',
      resource: 'navigation',
      resourceId: pathname,
      details: {
        pageName,
        pathname,
        fullUrl: window.location.href,
        search: search || window.location.search,
        previousPage: document.referrer,
        previousPageName,
        navigationTime: new Date().toISOString(),
        sessionDuration: Date.now() - parseInt(sessionStorage.getItem('sessionStartTime') || '0'),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      },
      severity: 'low',
      status: 'info',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Log user actions
  const logUserAction = useCallback((action: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      actionDescription: getUserActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'user',
      details: enhancedDetails,
      severity: 'low',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get user action descriptions
  const getUserActionDescription = (action: string, details?: any) => {
    switch (action) {
      case 'cart_cleared':
        return `Cleared shopping cart (${details?.itemCount || 0} items, Total: ${details?.cartTotal || 'N/A'})`;
      case 'login':
        return `User logged in successfully (Method: ${details?.loginMethod || 'Unknown'})`;
      case 'logout':
        return `User logged out (Session duration: ${Math.round((details?.sessionDuration || 0) / 1000)}s)`;
      case 'password_change':
        return `User changed their password`;
      case 'profile_updated':
        return `User updated their profile information`;
      default:
        return `User action: ${action}`;
    }
  };

  // Log product actions
  const logProductAction = useCallback((action: string, productId?: string, details?: any) => {
    // Create more descriptive details for product actions
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      actionDescription: getProductActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'product',
      resourceId: productId,
      details: enhancedDetails,
      severity: 'medium',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get product action descriptions
  const getProductActionDescription = (action: string, details?: any) => {
    switch (action) {
      case 'product_added_to_cart':
        return `Added "${details?.productName || 'Unknown Product'}" to cart (Qty: ${details?.quantity || 1}, Price: ${details?.price || 'N/A'})`;
      case 'product_created':
        return `Created new product "${details?.productName || 'Unknown Product'}"`;
      case 'product_updated':
        return `Updated product "${details?.productName || 'Unknown Product'}"`;
      case 'product_deleted':
        return `Deleted product "${details?.productName || 'Unknown Product'}"`;
      case 'stock_adjusted':
        return `Adjusted stock for "${details?.productName || 'Unknown Product'}" (New Qty: ${details?.newQuantity || 'N/A'})`;
      default:
        return `Product action: ${action}`;
    }
  };

  // Log sale actions
  const logSaleAction = useCallback((action: string, saleId?: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      currentPage: window.location.pathname,
      actionDescription: getSaleActionDescription(action, details)
    };

    logAuditEvent({
      action,
      resource: 'sale',
      resourceId: saleId,
      details: enhancedDetails,
      severity: 'high',
      status: 'success',
      source: 'web'
    });
  }, [logAuditEvent]);

  // Helper function to get sale action descriptions
  const getSaleActionDescription = (action: string, details?: any) => {
    switch (action) {
      case 'sale_completed':
        return `Completed sale #${details?.receiptNumber || 'Unknown'} - Total: ${details?.totalAmount || 'N/A'} (${details?.itemCount || 0} items, Payment: ${details?.paymentMethod || 'Unknown'}, Customer: ${details?.customerName || 'Walk-in'})`;
      case 'sale_created':
        return `Created new sale #${details?.receiptNumber || 'Unknown'}`;
      case 'sale_updated':
        return `Updated sale #${details?.receiptNumber || 'Unknown'}`;
      case 'sale_refunded':
        return `Refunded sale #${details?.receiptNumber || 'Unknown'} - Amount: ${details?.refundAmount || 'N/A'}`;
      case 'sale_cancelled':
        return `Cancelled sale #${details?.receiptNumber || 'Unknown'}`;
      default:
        return `Sale action: ${action}`;
    }
  };

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
    console.log('🧭 Page navigation detected:', location.pathname, location.search);
    
    // Small delay to ensure the page has loaded
    const timer = setTimeout(() => {
      logPageNavigation(location.pathname, location.search);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, logPageNavigation]);

  // Store session start time (for session duration tracking)
  useEffect(() => {
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
  }, []);

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