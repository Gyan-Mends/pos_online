import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Select, SelectItem, Button, Chip, Badge } from '@heroui/react';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  BarChart3, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Boxes
} from 'lucide-react';
import { Link } from 'react-router';
import { successToast, errorToast } from '../../components/toast';
import { productsAPI, stockMovementsAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import type { Product, StockMovement } from '../../types';

interface StockLevelData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  topMovingItems: Product[];
  slowMovingItems: Product[];
  stockAlerts: Product[];
}

export default function InventoryPage() {
  const [stockData, setStockData] = useState<StockLevelData>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    topMovingItems: [],
    slowMovingItems: [],
    stockAlerts: []
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, stockFilter]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [productsResponse, movementsResponse] = await Promise.all([
        productsAPI.getAll({ limit: 1000 }),
        stockMovementsAPI.getAll({ limit: 1000 })
      ]);

      const productsData = (productsResponse as any)?.data || productsResponse || [];
      const movementsData = (movementsResponse as any)?.data || movementsResponse || [];
      
      const processedProducts = productsData.map((p: any) => ({
        ...p,
        id: p._id || p.id
      }));

      setProducts(processedProducts);
      setMovements(movementsData);
      calculateStockMetrics(processedProducts, movementsData);
    } catch (error) {
      errorToast('Failed to load inventory data');
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStockMetrics = (products: Product[], movements: StockMovement[]) => {
    const totalItems = products.filter(p => p.isActive).length;
    const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);
    const lowStockItems = products.filter(p => p.isActive && p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length;
    const outOfStockItems = products.filter(p => p.isActive && p.stockQuantity === 0).length;
    
    // Calculate expiring items (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItems = products.filter(p => 
      p.isActive && 
      p.expiryDate && 
      new Date(p.expiryDate) <= thirtyDaysFromNow &&
      new Date(p.expiryDate) > new Date()
    ).length;

    // Get stock alerts (low stock + out of stock + expiring)
    const stockAlerts = products.filter(p => 
      p.isActive && (
        p.stockQuantity <= p.minStockLevel ||
        (p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow && new Date(p.expiryDate) > new Date())
      )
    );

    // Calculate top moving items (most sales in recent movements)
    const recentMovements = movements.filter(m => 
      m.type === 'sale' && 
      new Date(m.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );
    
    const productSales = recentMovements.reduce((acc, movement) => {
      const productId = movement.productId;
      acc[productId] = (acc[productId] || 0) + Math.abs(movement.quantity);
      return acc;
    }, {} as Record<string, number>);

    const topMovingItems = products
      .filter(p => productSales[p._id] || productSales[p.id])
      .sort((a, b) => (productSales[b._id] || productSales[b.id] || 0) - (productSales[a._id] || productSales[a.id] || 0))
      .slice(0, 5);

    // Slow moving items (no sales in 30 days but have stock)
    const slowMovingItems = products
      .filter(p => p.isActive && p.stockQuantity > 0 && !productSales[p._id] && !productSales[p.id])
      .slice(0, 5);

    setStockData({
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      expiringItems,
      topMovingItems,
      slowMovingItems,
      stockAlerts
    });
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    // Stock level filter
    switch (stockFilter) {
      case 'low_stock':
        filtered = filtered.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(p => p.stockQuantity === 0);
        break;
      case 'adequate':
        filtered = filtered.filter(p => p.stockQuantity > p.minStockLevel);
        break;
      case 'expiring':
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        filtered = filtered.filter(p => 
          p.expiryDate && 
          new Date(p.expiryDate) <= thirtyDays &&
          new Date(p.expiryDate) > new Date()
        );
        break;
    }

    setFilteredProducts(filtered);
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stockQuantity === 0) return 'danger';
    if (product.stockQuantity <= product.minStockLevel) return 'warning';
    return 'success';
  };

  const getStockStatusText = (product: Product) => {
    if (product.stockQuantity === 0) return 'Out of Stock';
    if (product.stockQuantity <= product.minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Product',
      render: (product) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</span>
        </div>
      )
    },
    {
      key: 'stockQuantity',
      label: 'Current Stock',
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{product.stockQuantity}</span>
          <span className="text-sm text-gray-500">{product.unitOfMeasure}</span>
        </div>
      )
    },
    {
      key: 'minStockLevel',
      label: 'Min Level',
      render: (product) => (
        <span className="text-gray-600 dark:text-gray-300">{product.minStockLevel}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => (
        <Chip 
          size="sm" 
          color={getStockStatusColor(product)}
          variant="flat"
        >
          {getStockStatusText(product)}
        </Chip>
      )
    },
    {
      key: 'value',
      label: 'Stock Value',
      render: (product) => (
        <span className="font-medium">{formatCurrency(product.stockQuantity * product.costPrice)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div className="flex gap-2">
          <Button 
            as={Link}
            to={`/products/view/${product._id || product.id}`}
            size="sm"
            variant="ghost"
            isIconOnly
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Level Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor stock levels, track movements, and manage inventory alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            as={Link} 
            to="/inventory/adjustments"
            color="primary"
            startContent={<Package className="w-4 h-4" />}
          >
            Adjust Stock
          </Button>
          <Button 
            onClick={loadInventoryData}
            variant="bordered"
            isIconOnly
            isLoading={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stockData.totalItems}</p>
              </div>
              <Boxes className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Value</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stockData.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stockData.lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stockData.outOfStockItems}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{stockData.expiringItems}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <Card className="customed-dark-card">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Stock Alerts
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stockData.stockAlerts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No stock alerts</p>
              ) : (
                stockData.stockAlerts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current: {product.stockQuantity} | Min: {product.minStockLevel}
                      </p>
                    </div>
                    <Chip 
                      size="sm" 
                      color={getStockStatusColor(product)}
                      variant="flat"
                    >
                      {getStockStatusText(product)}
                    </Chip>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Top Moving Items */}
        <Card className="customed-dark-card">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Top Moving Items
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stockData.topMovingItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent sales data</p>
              ) : (
                stockData.topMovingItems.map((product, index) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.stockQuantity}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stock Level Table */}
      <Card className="customed-dark-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Levels</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4" />}
                className="w-64"
              />
              <Select
                placeholder="Filter by stock"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-48"
              >
                <SelectItem key="all" value="all">All Items</SelectItem>
                <SelectItem key="low_stock" value="low_stock">Low Stock</SelectItem>
                <SelectItem key="out_of_stock" value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem key="adequate" value="adequate">Adequate Stock</SelectItem>
                <SelectItem key="expiring" value="expiring">Expiring Soon</SelectItem>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <DataTable
            data={filteredProducts}
            columns={columns}
            loading={loading}
            emptyMessage="No products found"
          />
        </CardBody>
      </Card>
    </div>
  );
}