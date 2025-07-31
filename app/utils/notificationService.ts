export interface Notification {
  id: string;
  type: 'expiry' | 'low_stock' | 'system' | 'order';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
  data?: {
    productId?: string;
    orderId?: string;
    customerId?: string;
    action?: string;
    actionUrl?: string;
  };
}

export interface NotificationService {
  getAll(): Notification[];
  getUnreadCount(): number;
  markAsRead(id: string): void;
  markAllAsRead(): void;
  addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): void;
  removeNotification(id: string): void;
  clearAll(): void;
}

class LocalNotificationService implements NotificationService {
  private storageKey = 'pos_notifications';
  private listeners: Array<() => void> = [];

  private getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      return notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  private saveNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAll(): Notification[] {
    return this.getNotifications().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  markAsRead(id: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications(notifications);
    }
  }

  markAllAsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.isRead = true);
    this.saveNotifications(notifications);
  }

  addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      isRead: false
    };
    
    // Check for duplicate notifications (same type and product/data)
    const isDuplicate = notifications.some(n => 
      n.type === newNotification.type &&
      JSON.stringify(n.data) === JSON.stringify(newNotification.data)
    );
    
    if (!isDuplicate) {
      notifications.unshift(newNotification);
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      this.saveNotifications(notifications);
    }
  }

  hasNotificationForProduct(type: string, productId: string): boolean {
    const notifications = this.getNotifications();
    return notifications.some(n => 
      n.type === type &&
      n.data?.productId === productId
    );
  }

  removeNotificationsForProduct(type: string, productId: string): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => 
      !(n.type === type && n.data?.productId === productId)
    );
    this.saveNotifications(filtered);
  }

  removeNotification(id: string): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    this.saveNotifications(filtered);
  }

  clearAll(): void {
    this.saveNotifications([]);
  }
}

export const notificationService = new LocalNotificationService();

// Helper functions to create specific notification types
export const createExpiryNotification = (productName: string, daysUntilExpiry: number, productId: string): Omit<Notification, 'id' | 'createdAt' | 'isRead'> => {
  let severity: 'low' | 'medium' | 'high' | 'critical';
  let title: string;
  let message: string;

  if (daysUntilExpiry < 0) {
    severity = 'critical';
    title = 'Product Expired';
    message = `${productName} expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago`;
  } else if (daysUntilExpiry === 0) {
    severity = 'critical';
    title = 'Product Expiring Today';
    message = `${productName} expires today`;
  } else if (daysUntilExpiry <= 3) {
    severity = 'high';
    title = 'Product Expiring Soon';
    message = `${productName} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
  } else if (daysUntilExpiry <= 7) {
    severity = 'medium';
    title = 'Product Expiring This Week';
    message = `${productName} expires in ${daysUntilExpiry} days`;
  } else {
    severity = 'low';
    title = 'Product Expiring Soon';
    message = `${productName} expires in ${daysUntilExpiry} days`;
  }

  return {
    type: 'expiry',
    title,
    message,
    severity,
    data: {
      productId,
      action: 'View Product',
      actionUrl: `/products/view/${productId}`
    }
  };
};

export const createLowStockNotification = (productName: string, currentStock: number, minStock: number, productId: string): Omit<Notification, 'id' | 'createdAt' | 'isRead'> => {
  const severity = currentStock === 0 ? 'critical' : currentStock <= minStock / 2 ? 'high' : 'medium';
  
  return {
    type: 'low_stock',
    title: currentStock === 0 ? 'Product Out of Stock' : 'Low Stock Alert',
    message: currentStock === 0 
      ? `${productName} is out of stock`
      : `${productName} is running low (${currentStock} remaining, minimum: ${minStock})`,
    severity,
    data: {
      productId,
      action: 'Restock Product',
      actionUrl: `/products/view/${productId}`
    }
  };
};