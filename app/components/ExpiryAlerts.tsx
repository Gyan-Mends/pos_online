import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Button, 
  Badge, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure 
} from '@heroui/react';
import { 
  AlertTriangle, 
  Calendar, 
  Package, 
  Clock, 
  X, 
  FileText,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { productsAPI } from '../utils/api';
import { successToast, errorToast } from './toast';
import { notificationService, createExpiryNotification } from '../utils/notificationService';
import type { Product } from '../types';

interface ExpiryAlert {
  product: Product;
  daysUntilExpiry: number;
  status: 'critical' | 'warning' | 'expired';
}

interface ExpiryAlertsProps {
  onExpiryFound?: (alerts: ExpiryAlert[]) => void;
  showInline?: boolean;
}

const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({ onExpiryFound, showInline = false }) => {
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDisposeOpen, onOpen: onDisposeOpen, onClose: onDisposeClose } = useDisclosure();

  // Check for expiring products
  const checkExpiringProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ limit: 1000 });
      const products = (response as any)?.data || response || [];

      const alerts: ExpiryAlert[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      products.forEach((product: Product) => {
        if (product.expiryDate && product.isActive) {
          const expiryDate = new Date(product.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let status: 'critical' | 'warning' | 'expired';
          
          if (diffDays < 0) {
            status = 'expired';
          } else if (diffDays <= 7) {
            status = 'critical';
          } else if (diffDays <= 30) {
            status = 'warning';
          } else {
            return; // Skip products not expiring soon
          }

          alerts.push({
            product,
            daysUntilExpiry: diffDays,
            status
          });
        }
      });

      // Sort by urgency (expired first, then by days until expiry)
      alerts.sort((a, b) => {
        if (a.status === 'expired' && b.status !== 'expired') return -1;
        if (b.status === 'expired' && a.status !== 'expired') return 1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setExpiryAlerts(alerts);
      onExpiryFound?.(alerts);

      // Get current product IDs that have expiry issues
      const currentExpiryProductIds = alerts.map(alert => alert.product.id);
      
      // Remove notifications for products that are no longer expiring
      const allProducts = products.filter((product: Product) => product.expiryDate && product.isActive);
      allProducts.forEach((product: Product) => {
        if (!currentExpiryProductIds.includes(product.id)) {
          // Check if product is no longer in danger zone (more than 30 days to expiry)
          const expiryDate = new Date(product.expiryDate!);
          expiryDate.setHours(0, 0, 0, 0);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 30) {
            notificationService.removeNotificationsForProduct('expiry', product.id);
          }
        }
      });

      // Create notifications for expiring products (only if not already exists)
      alerts.forEach(alert => {
        if (!notificationService.hasNotificationForProduct('expiry', alert.product.id)) {
          const notification = createExpiryNotification(
            alert.product.name,
            alert.daysUntilExpiry,
            alert.product.id
          );
          notificationService.addNotification(notification);
        }
      });
    } catch (error) {
      console.error('Error checking expiring products:', error);
      errorToast('Failed to check expiring products');
    } finally {
      setLoading(false);
    }
  };

  // Mark product as disposed
  const handleDisposeProduct = async (product: Product) => {
    try {
      // Create disposal record in stock movements
      await productsAPI.updateStock(product.id, -product.stockQuantity, 'decrease');
      
      // Update product to mark as expired/disposed
      await productsAPI.update(product.id, {
        isActive: false,
        notes: `${product.notes || ''}\n[DISPOSED: ${new Date().toLocaleDateString()} - Product expired]`.trim()
      });

      successToast(`${product.name} marked as disposed`);
      onDisposeClose();
      checkExpiringProducts(); // Refresh alerts
    } catch (error) {
      errorToast('Failed to dispose product');
      console.error('Error disposing product:', error);
    }
  };

  // Get alert color based on status
  const getAlertColor = (status: string) => {
    switch (status) {
      case 'expired': return 'danger';
      case 'critical': return 'warning';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  // Get alert icon
  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'expired': return <X className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Format days message
  const formatDaysMessage = (days: number) => {
    if (days < 0) {
      return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    } else if (days === 0) {
      return 'Expires today';
    } else {
      return `Expires in ${days} day${days === 1 ? '' : 's'}`;
    }
  };

  useEffect(() => {
    checkExpiringProducts();
    
    // Set up periodic checking (every hour)
    const interval = setInterval(checkExpiringProducts, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Render inline version if requested
  const inlineContent = showInline && (
    <Card className="border-l-4 border-l-warning">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Product Expiry Alerts ({expiryAlerts.length})
            </h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onOpen}>
            View All
          </Button>
        </div>
        
        {expiryAlerts.length > 0 && (
          <div className="space-y-2">
            {expiryAlerts.slice(0, 3).map((alert) => (
              <div key={alert.product.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{alert.product.name}</span>
                </div>
                <Badge color={getAlertColor(alert.status)} variant="flat" size="sm">
                  {formatDaysMessage(alert.daysUntilExpiry)}
                </Badge>
              </div>
            ))}
            {expiryAlerts.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{expiryAlerts.length - 3} more products
              </p>
            )}
          </div>
        )}
        
        {expiryAlerts.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-600 dark:text-green-400">
              All products are safe from expiry
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );

  return (
    <>
      {/* Inline Content */}
      {inlineContent}
      
      {/* Full Modal View */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span>Product Expiry Alerts ({expiryAlerts.length})</span>
          </ModalHeader>
          <ModalBody>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Checking products...</p>
              </div>
            ) : expiryAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  All Products Safe
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No products are expiring in the next 30 days
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiryAlerts.map((alert) => (
                  <Card key={alert.product.id} className="border">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            {alert.product.images && alert.product.images.length > 0 ? (
                              <img 
                                src={alert.product.images[0]} 
                                alt={alert.product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {alert.product.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              SKU: {alert.product.sku} | Stock: {alert.product.stockQuantity}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Expiry: {new Date(alert.product.expiryDate!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            color={getAlertColor(alert.status)} 
                            variant="flat"
                            startContent={getAlertIcon(alert.status)}
                          >
                            {formatDaysMessage(alert.daysUntilExpiry)}
                          </Badge>
                          {alert.status === 'expired' && (
                            <Button
                              size="sm"
                              color="danger"
                              variant="ghost"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onClick={() => {
                                setSelectedProduct(alert.product);
                                onDisposeOpen();
                              }}
                            >
                              Dispose
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button 
              color="primary" 
              startContent={<FileText className="w-4 h-4" />}
              onClick={() => {
                // Generate expiry report (implement later)
                successToast('Expiry report generation coming soon!');
              }}
            >
              Generate Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Disposal Confirmation Modal */}
      <Modal isOpen={isDisposeOpen} onClose={onDisposeClose}>
        <ModalContent>
          <ModalHeader>Dispose Expired Product</ModalHeader>
          <ModalBody>
            {selectedProduct && (
              <div>
                <p className="mb-4">
                  Are you sure you want to dispose of <strong>{selectedProduct.name}</strong>?
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    This will:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Remove all stock quantity ({selectedProduct.stockQuantity} units)</li>
                    <li>• Mark the product as inactive</li>
                    <li>• Add disposal notes to the product record</li>
                    <li>• Create a stock movement record for tracking</li>
                  </ul>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDisposeClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => selectedProduct && handleDisposeProduct(selectedProduct)}
              startContent={<Trash2 className="w-4 h-4" />}
            >
              Dispose Product
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ExpiryAlerts;