import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Card, 
  CardBody, 
  Button, 
  Badge,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Progress
} from '@heroui/react';
import { 
  ArrowLeft,
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Barcode,
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  Eye,
  Archive,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import ConfirmModal from '../../components/confirmModal';
import { successToast, errorToast } from '../../components/toast';
import { productsAPI, categoriesAPI, stockMovementsAPI } from '../../utils/api';
import type { Product, Category, StockMovement } from '../../types';

export default function ProductViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: 'delete' | 'deactivate' | 'activate' | 'archive';
  }>({ open: false, action: 'delete' });

  useEffect(() => {
    loadProduct();
    loadStockMovements();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await productsAPI.getById(id!);
      const productData = (response as any)?.data || response;
      
      // Add id field for compatibility
      const processedProduct = {
        ...productData,
        id: productData._id || productData.id
      };
      
      setProduct(processedProduct);
      
      // Load category details
      if (processedProduct?.categoryId) {
        const categoriesResponse = await categoriesAPI.getAll();
        const categoriesData = (categoriesResponse as any)?.data || categoriesResponse || [];
        
        const foundCategory = categoriesData.find((c: Category) => 
          c._id === processedProduct.categoryId || c.id === processedProduct.categoryId
        );
        
        if (foundCategory) {
          setCategory({
            ...foundCategory,
            id: foundCategory._id || foundCategory.id
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      errorToast('Failed to load product details');
      console.error('Error loading product:', error);
      setLoading(false);
    }
  };

  const loadStockMovements = async () => {
    try {
      if (!id) return;
      
      const response = await stockMovementsAPI.getByProductId(id, { limit: 20 });
      const movementsData = (response as any)?.data || response || [];
      
      // Process movements to add id field for compatibility
      const processedMovements = movementsData.map((movement: any) => ({
        ...movement,
        id: movement._id || movement.id,
        // Handle populated fields
        productName: movement.productId_populated?.name || movement.productId?.name,
        productSku: movement.productId_populated?.sku || movement.productId?.sku,
        unitOfMeasure: movement.productId_populated?.unitOfMeasure || movement.productId?.unitOfMeasure,
        userName: movement.userId_populated ? 
          `${movement.userId_populated.firstName} ${movement.userId_populated.lastName}` :
          movement.userId?.firstName ? 
            `${movement.userId.firstName} ${movement.userId.lastName}` : 
            'Unknown User'
      }));
      
      setStockMovements(processedMovements);
    } catch (error) {
      console.error('Error loading stock movements:', error);
      // Don't show error toast for movements as it's not critical
      // Just use empty array as fallback
      setStockMovements([]);
    }
  };

  const handleBack = () => {
    navigate('/products');
  };

  const handleEdit = () => {
    // Navigate back to products page and trigger edit mode
    navigate('/products', { 
      state: { 
        editProductId: product?.id,
        editProduct: product 
      } 
    });
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await productsAPI.delete(product.id);
      successToast('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      errorToast('Failed to delete product');
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    
    try {
      await productsAPI.update(product.id, { isActive: !product.isActive });
      const updatedProduct = { ...product, isActive: !product.isActive };
      setProduct(updatedProduct);
      successToast(`Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmModal({ open: false, action: 'activate' });
    } catch (error) {
      errorToast('Failed to update product status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'adjustment':
        return <Settings className="w-4 h-4 text-orange-500" />;
      case 'return':
        return <ArrowLeft className="w-4 h-4 text-purple-500" />;
      case 'damage':
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600 dark:text-green-400';
      case 'sale':
        return 'text-blue-600 dark:text-blue-400';
      case 'adjustment':
        return 'text-orange-600 dark:text-orange-400';
      case 'return':
        return 'text-purple-600 dark:text-purple-400';
      case 'damage':
      case 'expired':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const calculateStockLevel = () => {
    if (!product) return 0;
    const maxStock = product.maxStockLevel || 100;
    return Math.min((product.stockQuantity / maxStock) * 100, 100);
  };

  const getStockStatus = () => {
    if (!product) return { label: 'Unknown', color: 'default' as const };
    
    if (product.stockQuantity <= 0) {
      return { label: 'Out of Stock', color: 'danger' as const };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { label: 'Low Stock', color: 'warning' as const };
    } else {
      return { label: 'In Stock', color: 'success' as const };
    }
  };

  const calculateProfitMargin = () => {
    if (!product || product.price <= 0) return 0;
    return ((product.price - product.costPrice) / product.price * 100);
  };

  const calculateStockValue = () => {
    if (!product) return 0;
    return product.stockQuantity * product.costPrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Product not found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The product you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={handleBack}>
          Back to Products
        </Button>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const stockLevel = calculateStockLevel();
  const profitMargin = calculateProfitMargin();
  const stockValue = calculateStockValue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Product Details & Stock Information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={handleEdit}
            startContent={<Edit className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            color={product.isActive ? "warning" : "success"}
            onClick={() => setConfirmModal({ 
              open: true, 
              action: product.isActive ? 'deactivate' : 'activate' 
            })}
            startContent={product.isActive ? <Archive className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          >
            {product.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            color="danger"
            onClick={() => setConfirmModal({ open: true, action: 'delete' })}
            startContent={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Summary Card */}
        <div className="lg:col-span-1">
          <Card className="customed-dark-card">
            <CardBody className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {product.description || 'No description available'}
                </p>
                
                <div className="flex justify-center mb-4">
                  <Chip
                    color={stockStatus.color}
                    variant="flat"
                    className="font-medium"
                    startContent={stockStatus.color === 'danger' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  >
                    {stockStatus.label}
                  </Chip>
                </div>

                <div className="flex justify-center mb-6">
                  <Badge color={product.isActive ? 'success' : 'default'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <Divider className="mb-4" />

                {/* Key Information */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      SKU
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{product.sku}</span>
                  </div>
                  
                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Barcode className="w-4 h-4 mr-1" />
                        Barcode
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{product.barcode}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Category
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category?.name || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unit</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{product.unitOfMeasure}</span>
                  </div>

                  {product.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{product.location}</span>
                    </div>
                  )}
                </div>

                <Divider className="my-4" />

                {/* Pricing Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sale Price</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cost Price</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(product.costPrice)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</span>
                    <span className={`text-sm font-medium ${profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stock Value</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(stockValue)}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          <Card className="customed-dark-card">
            <CardBody className="p-6">
              <Tabs 
                selectedKey={activeTab} 
                onSelectionChange={(key) => setActiveTab(key as string)}
                classNames={{
                  tabList: "dark:bg-default",
                  tab: "text-gray-900 dark:text-white",
                  tabContent: "text-gray-900 dark:text-white",
                }}
              >
                <Tab key="overview" title="Overview">
                  <div className="space-y-6">
                    {/* Stock Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Stock Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Current Stock
                          </label>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product.stockQuantity} {product.unitOfMeasure}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {stockStatus.label}
                          </p>
                        </div>
                        
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Stock Level
                          </label>
                          <div className="mt-2">
                            <Progress 
                              value={stockLevel} 
                              color={stockStatus.color}
                              size="sm"
                              className="mb-2"
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {stockLevel.toFixed(1)}% of maximum capacity
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Min Stock Level
                          </label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.minStockLevel} {product.unitOfMeasure}
                          </p>
                          {product.stockQuantity <= product.minStockLevel && (
                            <p className="text-sm text-red-500 mt-1">⚠️ Below minimum level</p>
                          )}
                        </div>
                        
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Max Stock Level
                          </label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.maxStockLevel || 'N/A'} {product.maxStockLevel ? product.unitOfMeasure : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Additional Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.supplier && (
                          <div className="p-4  ">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                              <Truck className="w-4 h-4 mr-1" />
                              Supplier
                            </label>
                            <p className="text-gray-900 dark:text-white">{product.supplier}</p>
                          </div>
                        )}
                        
                        {product.batchNumber && (
                          <div className="p-4  ">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Batch Number
                            </label>
                            <p className="text-gray-900 dark:text-white">{product.batchNumber}</p>
                          </div>
                        )}
                        
                        {product.expiryDate && (
                          <div className="p-4  ">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Expiry Date
                            </label>
                            <p className="text-gray-900 dark:text-white">
                              {new Date(product.expiryDate).toLocaleDateString()}
                            </p>
                            {new Date(product.expiryDate) < new Date() && (
                              <p className="text-sm text-red-500 mt-1">⚠️ Expired</p>
                            )}
                          </div>
                        )}
                        
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Tax Settings
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {product.taxable ? (
                              <span className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                Taxable ({product.taxRate || 0}%)
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <XCircle className="w-4 h-4 text-gray-500 mr-1" />
                                Non-taxable
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Created
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(product.createdAt)}
                          </p>
                        </div>

                        <div className="p-4  ">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Last Updated
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(product.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab key="movements" title="Stock Movements">
                  <div className="space-y-4">
                    {stockMovements.length > 0 ? (
                      <div className="space-y-4">
                        {stockMovements.map((movement) => (
                          <div
                            key={movement.id}
                            className="flex items-start space-x-4 p-4  "
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center">
                              {getMovementIcon(movement.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                  {movement.type}
                                </h4>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(movement.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`font-medium ${getMovementColor(movement.type)}`}>
                                  {movement.quantity > 0 ? '+' : ''}{movement.quantity} {product?.unitOfMeasure || 'pcs'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Stock: {movement.previousStock} → {movement.newStock}
                                </span>
                                {movement.reference && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Ref: {movement.reference}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                {movement.unitCost > 0 && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Unit Cost: {formatCurrency(movement.unitCost)}
                                  </span>
                                )}
                                {movement.totalValue > 0 && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Value: {formatCurrency(movement.totalValue)}
                                  </span>
                                )}
                                {(movement as any).userName && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    By: {(movement as any).userName}
                                  </span>
                                )}
                              </div>
                              {movement.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {movement.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No stock movements recorded yet
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                          Stock movements will appear here when inventory changes occur
                        </p>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onOpenChange={() => setConfirmModal({ open: false, action: 'delete' })}
        header={
          confirmModal.action === 'delete' 
            ? 'Delete Product'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate Product'
            : 'Activate Product'
        }
        content={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete "${product?.name}"? This action cannot be undone and will remove all associated data.`
            : confirmModal.action === 'deactivate'
            ? `Are you sure you want to deactivate "${product?.name}"? It will no longer be available for sale.`
            : `Are you sure you want to activate "${product?.name}"? It will be available for sale again.`
        }
      >
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmModal({ open: false, action: 'delete' })}
          >
            Cancel
          </Button>
          <Button
            color={confirmModal.action === 'delete' ? 'danger' : 'warning'}
            onClick={() => {
              switch (confirmModal.action) {
                case 'delete':
                  handleDelete();
                  break;
                case 'deactivate':
                case 'activate':
                  handleToggleStatus();
                  break;
              }
            }}
          >
            {confirmModal.action === 'delete' 
              ? 'Delete'
              : confirmModal.action === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
            }
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 
