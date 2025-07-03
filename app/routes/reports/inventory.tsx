import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { productsAPI, apiRequest } from '../../utils/api';
import { errorToast } from '../../components/toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InventoryData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  stockMovements: any[];
  categoryStock: { category: string; count: number; value: number }[];
  lowStockProducts: any[];
  stockTrend: { date: string; totalStock: number; value: number }[];
  topMovingProducts: { product: any; movements: number }[];
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  useEffect(() => {
    fetchInventoryData();
  }, [dateRange]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfDay(dateRange.start), 'yyyy-MM-dd');
      const endDate = format(endOfDay(dateRange.end), 'yyyy-MM-dd');
      
      // Fetch products
      const productsResponse = await productsAPI.getAll({
        limit: 10000
      });

      // Fetch stock movements
      const movementsResponse = await apiRequest.get('/api/stock-movements', {
        startDate,
        endDate,
        limit: 10000
      });

      if (productsResponse.success && movementsResponse.success) {
        generateInventoryAnalytics(productsResponse.data, movementsResponse.data);
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryAnalytics = (products: any[], movements: any[]) => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);
    const outOfStockProducts = products.filter(p => p.stockQuantity === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);

    // Group products by category
    const categoryMap = new Map();
    products.forEach(product => {
      const category = product.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, value: 0 });
      }
      const cat = categoryMap.get(category);
      cat.count += product.stockQuantity;
      cat.value += (product.stockQuantity * product.costPrice);
    });

    const categoryStock = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);

    // Analyze stock movements
    const productMovementMap = new Map();
    const dailyStockMap = new Map();
    
    movements.forEach(movement => {
      // Track product movements
      const productId = movement.productId || movement.product?._id;
      if (!productMovementMap.has(productId)) {
        productMovementMap.set(productId, { count: 0, product: null });
      }
      productMovementMap.get(productId).count += 1;
      
      // Track daily stock changes
      const date = format(parseISO(movement.createdAt), 'yyyy-MM-dd');
      if (!dailyStockMap.has(date)) {
        dailyStockMap.set(date, { totalStock: 0, value: 0 });
      }
      // This is simplified - in reality you'd need to track cumulative changes
    });

    // Get products for movement analysis
    products.forEach(product => {
      if (productMovementMap.has(product._id)) {
        productMovementMap.get(product._id).product = product;
      }
    });

    const topMovingProducts = Array.from(productMovementMap.values())
      .filter(item => item.product)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({ product: item.product, movements: item.count }));

    // Generate daily stock trend (simplified)
    const stockTrend = Array.from(dailyStockMap.entries())
      .map(([date, data]) => ({ 
        date, 
        totalStock: totalProducts, // Simplified
        value: totalValue 
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setInventoryData({
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalValue,
      stockMovements: movements,
      categoryStock,
      lowStockProducts: lowStockProducts.slice(0, 10),
      stockTrend,
      topMovingProducts
    });
  };

  const setPeriod = (period: string) => {
    setSelectedPeriod(period);
    const end = new Date();
    let start: Date;
    
    switch (period) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '1y':
        start = subDays(end, 365);
        break;
      default:
        start = subDays(end, 30);
    }
    
    setDateRange({ start, end });
  };

  // Chart configurations
  const categoryStockConfig = {
    data: {
      labels: inventoryData?.categoryStock.map(c => c.category) || [],
      datasets: [
        {
          data: inventoryData?.categoryStock.map(c => c.count) || [],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'rgb(107, 114, 128)',
          },
        },
      },
    },
  };

  const stockValueConfig = {
    data: {
      labels: inventoryData?.categoryStock.map(c => c.category) || [],
      datasets: [
        {
          label: 'Stock Value',
          data: inventoryData?.categoryStock.map(c => c.value) || [],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(107, 114, 128, 0.1)' },
          ticks: { color: 'rgb(107, 114, 128)' },
        },
        x: {
          grid: { color: 'rgba(107, 114, 128, 0.1)' },
          ticks: { color: 'rgb(107, 114, 128)' },
        },
      },
      plugins: {
        legend: { labels: { color: 'rgb(107, 114, 128)' } },
      },
    },
  };

  const movementTrendConfig = {
    data: {
      labels: inventoryData?.stockMovements
        .slice(-30)
        .map(m => format(parseISO(m.createdAt), 'MMM dd')) || [],
      datasets: [
        {
          label: 'Stock Movements',
          data: inventoryData?.stockMovements
            .slice(-30)
            .map((_, index) => index + 1) || [],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(107, 114, 128, 0.1)' },
          ticks: { color: 'rgb(107, 114, 128)' },
        },
        x: {
          grid: { color: 'rgba(107, 114, 128, 0.1)' },
          ticks: { color: 'rgb(107, 114, 128)' },
        },
      },
      plugins: {
        legend: { labels: { color: 'rgb(107, 114, 128)' } },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stock levels, movements, and inventory analytics
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              size="sm"
              variant={selectedPeriod === period ? 'solid' : 'bordered'}
              onPress={() => setPeriod(period)}
            >
              {period === '7d' && 'Last 7 Days'}
              {period === '30d' && 'Last 30 Days'}
              {period === '90d' && 'Last 90 Days'}
              {period === '1y' && 'Last Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Products</p>
                  <p className="text-2xl font-bold">{inventoryData?.totalProducts.toLocaleString() || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Low Stock Items</p>
                  <p className="text-2xl font-bold">{inventoryData?.lowStockCount || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Out of Stock</p>
                  <p className="text-2xl font-bold">{inventoryData?.outOfStockCount || 0}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Inventory Value</p>
                  <p className="text-2xl font-bold">${inventoryData?.totalValue.toLocaleString() || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock by Category</h3>
            </div>
            <div className="h-64">
              <Doughnut {...categoryStockConfig} />
            </div>
          </CardBody>
        </Card>

        {/* Category Value */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Value by Category</h3>
            </div>
            <div className="h-64">
              <Bar {...stockValueConfig} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stock Movement Trend */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Movement Activity</h3>
          </div>
          <div className="h-80">
            <Line {...movementTrendConfig} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {inventoryData?.lowStockProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <Chip color="warning" size="sm">
                      {product.stockQuantity} left
                    </Chip>
                    <p className="text-xs text-gray-500 mt-1">Min: {product.minStockLevel}</p>
                  </div>
                </div>
              ))}
              {inventoryData?.lowStockProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">No low stock items</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Top Moving Products */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Active Products</h3>
            </div>
            <div className="space-y-3">
              {inventoryData?.topMovingProducts.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {item.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.movements} movements</p>
                    <p className="text-xs text-gray-500">Current: {item.product.stockQuantity}</p>
                  </div>
                </div>
              ))}
              {inventoryData?.topMovingProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">No movement data available</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 