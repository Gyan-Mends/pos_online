import { productsAPI } from './api';
import { notificationService, createLowStockNotification } from './notificationService';

export const debugLowStockNotifications = async () => {
  console.log('🔍 DEBUG: Starting low stock check...');
  
  try {
    // Get all products
    const response = await productsAPI.getAll({ limit: 1000 });
    const products = (response as any)?.data || response || [];
    
    console.log(`📦 Found ${products.length} products`);
    
    // Check each product for low stock
    const lowStockProducts = [];
    
    for (const product of products) {
      const productId = product.id || product._id;
      console.log(`\n📝 Checking product: ${product.name}`);
      console.log(`  - ID: ${productId}`);
      console.log(`  - Active: ${product.isActive}`);
      console.log(`  - Track Quantity: ${product.trackQuantity}`);
      console.log(`  - Current Stock: ${product.stockQuantity}`);
      console.log(`  - Minimum Stock: ${product.minimumStock}`);
      
      // Focus on the Envelopes product specifically
      if (product.name.toLowerCase().includes('envelope')) {
        console.log(`  🎯 ENVELOPE PRODUCT FOUND!`);
        console.log(`  - Full product data:`, product);
      }
      
      // Check various possible field names for quantity tracking
      const trackQuantity = product.trackQuantity || product.trackStock || product.manageStock || true; // Default to true if not specified
      const isActive = product.isActive !== false; // Default to true if not specified
      
      console.log(`  - Computed Active: ${isActive}`);
      console.log(`  - Computed Track Quantity: ${trackQuantity}`);
      
      if (isActive && trackQuantity) {
        const currentStock = product.stockQuantity || 0;
        const minStock = product.minimumStock || 10;
        
        if (currentStock <= minStock) {
          console.log(`  ⚠️  LOW STOCK DETECTED!`);
          lowStockProducts.push({
            name: product.name,
            currentStock,
            minStock,
            id: product.id || product._id
          });
          
          // Check if notification already exists
          const hasNotification = notificationService.hasNotificationForProduct('low_stock', product.id || product._id);
          console.log(`  - Has existing notification: ${hasNotification}`);
          
          if (!hasNotification) {
            // Create notification
            const notification = createLowStockNotification(
              product.name,
              currentStock,
              minStock,
              product.id || product._id
            );
            notificationService.addNotification(notification);
            console.log(`  ✅ Created notification for ${product.name}`);
          } else {
            console.log(`  ⏭️  Notification already exists for ${product.name}`);
          }
        } else {
          console.log(`  ✅ Stock level OK (${currentStock} > ${minStock})`);
        }
      } else {
        if (!product.isActive) console.log(`  ⏭️  Product inactive`);
        if (!product.trackQuantity) console.log(`  ⏭️  Quantity tracking disabled`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  - Total products: ${products.length}`);
    console.log(`  - Low stock products: ${lowStockProducts.length}`);
    console.log(`  - Current notifications: ${notificationService.getAll().length}`);
    
    // Force refresh notifications
    const currentNotifications = notificationService.getAll();
    console.log('\n🔔 Current notifications:');
    console.log(`  - Total stored: ${currentNotifications.length}`);
    
    if (currentNotifications.length > 0) {
      currentNotifications.forEach((n, index) => {
        console.log(`  ${index + 1}. ${n.type}: ${n.title} (${n.severity}) - Read: ${n.isRead}`);
        console.log(`     Created: ${n.createdAt}`);
        console.log(`     Data:`, n.data);
      });
    } else {
      console.log('  ❌ No notifications found in storage!');
      
      // Check localStorage directly
      const rawData = localStorage.getItem('pos_notifications');
      console.log('  📱 Raw localStorage data:', rawData);
      
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          console.log('  📊 Parsed data:', parsed);
        } catch (e) {
          console.log('  ❌ Error parsing localStorage data:', e);
        }
      }
    }
    
    return {
      totalProducts: products.length,
      lowStockProducts,
      totalNotifications: currentNotifications.length
    };
    
  } catch (error) {
    console.error('❌ Error in debug function:', error);
    throw error;
  }
};

// Function to manually trigger low stock check
export const manualLowStockCheck = async () => {
  console.log('🚀 Manual low stock check triggered');
  const result = await debugLowStockNotifications();
  return result;
};