import { productsAPI, stockMovementsAPI } from './api';
import type { Product } from '../types';

export class ExpiryService {
  private static instance: ExpiryService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): ExpiryService {
    if (!ExpiryService.instance) {
      ExpiryService.instance = new ExpiryService();
    }
    return ExpiryService.instance;
  }

  // Start the automatic expiry checking service
  public startService(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('Expiry service is already running');
      return;
    }

    console.log(`Starting expiry service with ${intervalMinutes} minute intervals`);
    this.isRunning = true;

    // Run immediately on start
    this.checkAndUpdateExpiredProducts();

    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.checkAndUpdateExpiredProducts();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop the automatic expiry checking service
  public stopService(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Expiry service stopped');
  }

  // Check and update expired products
  public async checkAndUpdateExpiredProducts(): Promise<{
    expiredProducts: Product[];
    updatedCount: number;
  }> {
    try {
      console.log('Checking for expired products...');
      
      const response = await productsAPI.getAll({ limit: 1000 });
      const products = (response as any)?.data || response || [];

      const expiredProducts: Product[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const product of products) {
        if (product.expiryDate && product.isActive) {
          const expiryDate = new Date(product.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);

          // Check if product has expired
          if (expiryDate < today) {
            expiredProducts.push(product);
          }
        }
      }

      console.log(`Found ${expiredProducts.length} expired products`);

      let updatedCount = 0;
      for (const product of expiredProducts) {
        try {
          await this.markProductAsExpired(product);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update expired product ${product.name}:`, error);
        }
      }

      console.log(`Successfully updated ${updatedCount} expired products`);

      return {
        expiredProducts,
        updatedCount
      };
    } catch (error) {
      console.error('Error checking expired products:', error);
      return {
        expiredProducts: [],
        updatedCount: 0
      };
    }
  }

  // Mark a product as expired
  private async markProductAsExpired(product: Product): Promise<void> {
    const expiredNotes = `${product.notes || ''}\n[AUTO-EXPIRED: ${new Date().toLocaleDateString()} - Product passed expiry date]`.trim();

    // Update product status
    await productsAPI.update(product.id, {
      isActive: false,
      notes: expiredNotes
    });

    // Create stock movement record for tracking
    if (product.stockQuantity > 0) {
      try {
        await stockMovementsAPI.create({
          productId: product.id,
          type: 'expired',
          quantity: -product.stockQuantity,
          previousStock: product.stockQuantity,
          newStock: 0,
          notes: `Product expired on ${new Date(product.expiryDate!).toLocaleDateString()}`,
          reference: `EXP-${Date.now()}`,
          unitCost: product.costPrice,
          totalValue: product.stockQuantity * product.costPrice
        });
      } catch (error) {
        console.error('Failed to create expiry stock movement:', error);
      }
    }

    console.log(`Marked product as expired: ${product.name}`);
  }

  // Get products expiring soon (for alerts)
  public async getExpiringProducts(daysAhead: number = 30): Promise<{
    expired: Product[];
    critical: Product[]; // <= 7 days
    warning: Product[];  // <= 30 days
  }> {
    try {
      const response = await productsAPI.getAll({ limit: 1000 });
      const products = (response as any)?.data || response || [];

      const expired: Product[] = [];
      const critical: Product[] = [];
      const warning: Product[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const product of products) {
        if (product.expiryDate && product.isActive) {
          const expiryDate = new Date(product.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);

          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            expired.push(product);
          } else if (diffDays <= 7) {
            critical.push(product);
          } else if (diffDays <= daysAhead) {
            warning.push(product);
          }
        }
      }

      return { expired, critical, warning };
    } catch (error) {
      console.error('Error getting expiring products:', error);
      return { expired: [], critical: [], warning: [] };
    }
  }

  // Manual disposal of expired products with tracking
  public async disposeExpiredProduct(product: Product, reason?: string): Promise<void> {
    try {
      const disposalNotes = `${product.notes || ''}\n[DISPOSED: ${new Date().toLocaleDateString()} - ${reason || 'Product expired'}]`.trim();

      // Update product
      await productsAPI.update(product.id, {
        isActive: false,
        stockQuantity: 0,
        notes: disposalNotes
      });

      // Create disposal stock movement
      if (product.stockQuantity > 0) {
        await stockMovementsAPI.create({
          productId: product.id,
          type: 'disposal',
          quantity: -product.stockQuantity,
          previousStock: product.stockQuantity,
          newStock: 0,
          notes: `Product disposed: ${reason || 'Expired'}`,
          reference: `DISP-${Date.now()}`,
          unitCost: product.costPrice,
          totalValue: product.stockQuantity * product.costPrice
        });
      }

      console.log(`Product disposed: ${product.name}`);
    } catch (error) {
      console.error('Error disposing product:', error);
      throw error;
    }
  }

  // Generate expiry summary report
  public async generateExpirySummary(): Promise<{
    totalProductsWithExpiry: number;
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
    totalExpiredValue: number;
    nextExpiringProducts: Array<{
      product: Product;
      daysUntilExpiry: number;
    }>;
  }> {
    try {
      const { expired, critical, warning } = await this.getExpiringProducts();
      
      const response = await productsAPI.getAll({ limit: 1000 });
      const allProducts = (response as any)?.data || response || [];
      const productsWithExpiry = allProducts.filter((p: Product) => p.expiryDate);

      const totalExpiredValue = expired.reduce(
        (total, product) => total + (product.stockQuantity * product.costPrice),
        0
      );

      // Get next 5 products expiring
      const allExpiring = [...critical, ...warning];
      const today = new Date();
      const nextExpiring = allExpiring
        .map(product => ({
          product,
          daysUntilExpiry: Math.ceil((new Date(product.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
        .slice(0, 5);

      return {
        totalProductsWithExpiry: productsWithExpiry.length,
        expiredCount: expired.length,
        criticalCount: critical.length,
        warningCount: warning.length,
        totalExpiredValue,
        nextExpiringProducts: nextExpiring
      };
    } catch (error) {
      console.error('Error generating expiry summary:', error);
      throw error;
    }
  }

  public isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const expiryService = ExpiryService.getInstance();

// Auto-start service on import (can be disabled if needed)
if (typeof window !== 'undefined') {
  // Only start in browser environment
  setTimeout(() => {
    expiryService.startService(60); // Check every hour
  }, 5000); // Wait 5 seconds after app load
}