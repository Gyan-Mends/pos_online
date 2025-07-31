import { productsAPI } from './api';
import { notificationService, createLowStockNotification } from './notificationService';
import type { Product } from '../types';

interface StockAlert {
  product: Product;
  currentStock: number;
  minStock: number;
  severity: 'critical' | 'high' | 'medium';
}

export class StockNotificationService {
  private static instance: StockNotificationService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): StockNotificationService {
    if (!StockNotificationService.instance) {
      StockNotificationService.instance = new StockNotificationService();
    }
    return StockNotificationService.instance;
  }

  public async checkLowStockProducts(): Promise<StockAlert[]> {
    try {
      const response = await productsAPI.getAll({ limit: 1000 });
      const products = (response as any)?.data || response || [];

      const alerts: StockAlert[] = [];
      const currentLowStockProductIds: string[] = [];

      products.forEach((product: Product) => {
        // Check various possible field names and default to true if not specified
        const trackQuantity = product.trackQuantity || product.trackStock || product.manageStock || true;
        const isActive = product.isActive !== false; // Default to true if not specified
        
        if (isActive && trackQuantity) {
          const currentStock = product.stockQuantity || 0;
          const minStock = product.minimumStock || 10; // Default minimum stock

          if (currentStock <= minStock) {
            let severity: 'critical' | 'high' | 'medium';
            
            if (currentStock === 0) {
              severity = 'critical';
            } else if (currentStock <= minStock / 2) {
              severity = 'high';
            } else {
              severity = 'medium';
            }

            alerts.push({
              product,
              currentStock,
              minStock,
              severity
            });

            currentLowStockProductIds.push(product.id);

            // Create notification only if it doesn't already exist
            if (!notificationService.hasNotificationForProduct('low_stock', product.id)) {
              const notification = createLowStockNotification(
                product.name,
                currentStock,
                minStock,
                product.id
              );
              notificationService.addNotification(notification);
            }
          } else {
            // If stock is above minimum, remove any existing low stock notifications
            if (notificationService.hasNotificationForProduct('low_stock', product.id)) {
              notificationService.removeNotificationsForProduct('low_stock', product.id);
            }
          }
        }
      });

      return alerts.sort((a, b) => {
        // Sort by severity (critical first) then by stock level
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return a.currentStock - b.currentStock;
      });

    } catch (error) {
      console.error('Error checking low stock products:', error);
      return [];
    }
  }

  public startPeriodicCheck(intervalMinutes: number = 60): void {
    this.stopPeriodicCheck();
    
    // Run initial check
    this.checkLowStockProducts();
    
    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this.checkLowStockProducts();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`Started low stock monitoring (checking every ${intervalMinutes} minutes)`);
  }

  public stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Stopped low stock monitoring');
    }
  }

  public async checkSpecificProduct(productId: string): Promise<StockAlert | null> {
    try {
      const product = await productsAPI.getById(productId);
      
      // Check various possible field names and default to true if not specified
      const trackQuantity = product.trackQuantity || product.trackStock || product.manageStock || true;
      const isActive = product.isActive !== false; // Default to true if not specified
      
      if (!product || !isActive || !trackQuantity) {
        return null;
      }

      const currentStock = product.stockQuantity || 0;
      const minStock = product.minimumStock || 10;

      if (currentStock <= minStock) {
        let severity: 'critical' | 'high' | 'medium';
        
        if (currentStock === 0) {
          severity = 'critical';
        } else if (currentStock <= minStock / 2) {
          severity = 'high';
        } else {
          severity = 'medium';
        }

        const alert: StockAlert = {
          product,
          currentStock,
          minStock,
          severity
        };

        // Create notification only if it doesn't already exist
        if (!notificationService.hasNotificationForProduct('low_stock', product.id)) {
          const notification = createLowStockNotification(
            product.name,
            currentStock,
            minStock,
            product.id
          );
          notificationService.addNotification(notification);
        }

        return alert;
      }

      return null;
    } catch (error) {
      console.error('Error checking specific product stock:', error);
      return null;
    }
  }
}

export const stockNotificationService = StockNotificationService.getInstance();