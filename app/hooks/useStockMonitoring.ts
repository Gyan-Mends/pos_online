import { useCallback } from 'react';
import { stockNotificationService } from '../utils/stockNotificationService';

export const useStockMonitoring = () => {
  // Function to check stock immediately after any stock-affecting operation
  const checkStockNow = useCallback(async (productIds?: string[]) => {
    if (productIds && productIds.length > 0) {
      // Check specific products
      for (const productId of productIds) {
        await stockNotificationService.checkSpecificProduct(productId);
      }
    } else {
      // Check all products
      await stockNotificationService.checkLowStockProducts();
    }
  }, []);

  // Function to check stock after sale completion
  const checkStockAfterSale = useCallback(async (saleItems: Array<{ productId?: string; product?: { id?: string; _id?: string } }>) => {
    const productIds = saleItems.map(item => 
      item.productId || item.product?.id || item.product?._id
    ).filter(Boolean) as string[];
    
    await checkStockNow(productIds);
  }, [checkStockNow]);

  // Function to check stock after inventory adjustment
  const checkStockAfterInventoryChange = useCallback(async (productId: string) => {
    await stockNotificationService.checkSpecificProduct(productId);
  }, []);

  // Function to check stock after product update
  const checkStockAfterProductUpdate = useCallback(async (productId: string) => {
    await stockNotificationService.checkSpecificProduct(productId);
  }, []);

  return {
    checkStockNow,
    checkStockAfterSale,
    checkStockAfterInventoryChange,
    checkStockAfterProductUpdate
  };
};