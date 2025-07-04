import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Spinner,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Input,
  Pagination
} from "@heroui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { productsAPI, stockMovementsAPI, dashboardAPI } from '../../utils/api';
import { errorToast } from '../../components/toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const InventoryReport = () => {
  const [productsData, setProductsData] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    stockLevel: 'all',
    category: 'all',
    movementType: 'all'
  });
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
  });

  useEffect(() => {
    loadInventoryData();
  }, [filters, dateRange]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Load products data
      const productsParams = {
        limit: 1000,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.stockLevel === 'low' && { lowStock: true }),
        ...(filters.stockLevel === 'out' && { outOfStock: true }),
      };
      
      const productsResponse = await productsAPI.getAll(productsParams);
      const products = productsResponse.data || productsResponse;
      setProductsData(Array.isArray(products) ? products : products.data || []);
      
      // Load stock movements
      const movementsParams = {
        limit: 100,
        ...(filters.movementType !== 'all' && { type: filters.movementType }),
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      const movementsResponse = await stockMovementsAPI.getAll(movementsParams);
      const movements = movementsResponse.data || movementsResponse;
      setStockMovements(Array.isArray(movements) ? movements : movements.data || []);
      
      // Load dashboard data
      const dashboardResponse = await dashboardAPI.getStats();
      setDashboardData(dashboardResponse.data || dashboardResponse);
      
    } catch (error) {
      console.error('Error loading inventory data:', error);
      errorToast('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Calculate inventory summary
  const calculateInventorySummary = () => {
    if (!productsData.length) return null;
    
    const totalProducts = productsData.length;
    const totalStockValue = productsData.reduce((sum, product) => 
      sum + (product.stockQuantity * product.costPrice || 0), 0);
    const totalRetailValue = productsData.reduce((sum, product) => 
      sum + (product.stockQuantity * product.sellingPrice || 0), 0);
    const lowStockProducts = productsData.filter(product => product.stockQuantity < 10).length;
    const outOfStockProducts = productsData.filter(product => product.stockQuantity === 0).length;
    const totalUnits = productsData.reduce((sum, product) => sum + product.stockQuantity, 0);
    
    return {
      totalProducts,
      totalStockValue,
      totalRetailValue,
      lowStockProducts,
      outOfStockProducts,
      totalUnits,
      potentialProfit: totalRetailValue - totalStockValue
    };
  };

  // Get stock level distribution
  const getStockLevelDistribution = () => {
    if (!productsData.length) return { labels: [], datasets: [] };
    
    const stockRanges = [
      { label: 'Out of Stock', count: productsData.filter(p => p.stockQuantity === 0).length },
      { label: 'Low Stock (1-9)', count: productsData.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length },
      { label: 'Medium Stock (10-50)', count: productsData.filter(p => p.stockQuantity >= 10 && p.stockQuantity <= 50).length },
      { label: 'High Stock (50+)', count: productsData.filter(p => p.stockQuantity > 50).length },
    ];
    
    return {
      labels: stockRanges.map(item => item.label),
      datasets: [
        {
          label: 'Number of Products',
          data: stockRanges.map(item => item.count),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Get stock movement trend
  const getStockMovementTrend = () => {
    if (!stockMovements.length) return { labels: [], datasets: [] };
    
    // Group movements by date
    const movementsByDate = stockMovements.reduce((acc, movement) => {
      const date = format(new Date(movement.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { in: 0, out: 0 };
      }
      if (movement.quantity > 0) {
        acc[date].in += movement.quantity;
      } else {
        acc[date].out += Math.abs(movement.quantity);
      }
      return acc;
    }, {} as any);
    
    const dates = Object.keys(movementsByDate).sort();
    
    return {
      labels: dates.map(date => format(new Date(date), 'MMM dd')),
      datasets: [
        {
          label: 'Stock In',
          data: dates.map(date => movementsByDate[date].in),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Stock Out',
          data: dates.map(date => movementsByDate[date].out),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  };

  const summary = calculateInventorySummary();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'movements', label: 'Stock Movements' },
    { id: 'alerts', label: 'Alerts & Warnings' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stock levels, movements, valuations, and alerts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            onClick={loadInventoryData}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            color="secondary"
            variant="flat"
          >
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Stock Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalStockValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cost basis
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Retail Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalRetailValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Potential revenue
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Low Stock Items
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.lowStockProducts}
                  </p>
                  <p className="text-sm text-gray-500">
                    Need reordering
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.outOfStockProducts}
                  </p>
                  <p className="text-sm text-gray-500">
                    Critical
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Level Distribution
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Bar 
                  data={getStockLevelDistribution()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Movement Trend
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Line 
                  data={getStockMovementTrend()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Stock Movements
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Stock movements table">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>PRODUCT</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>REFERENCE</TableColumn>
                <TableColumn>NOTES</TableColumn>
              </TableHeader>
              <TableBody>
                {stockMovements.slice(0, 20).map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>
                      {formatDate(movement.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {movement.productId?.name || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {movement.productId?.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          movement.type === 'purchase' ? 'success' :
                          movement.type === 'sale' ? 'primary' :
                          movement.type === 'return' ? 'warning' :
                          movement.type === 'adjustment' ? 'secondary' : 'default'
                        }
                        variant="flat"
                      >
                        {movement.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {movement.reference || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {movement.notes || 'No notes'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Out of Stock Alert */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h3 className="text-lg font-semibold text-red-600">
                  Out of Stock Products
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {productsData.filter(p => p.stockQuantity === 0).slice(0, 10).map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} | Category: {product.categoryId?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <Chip size="sm" color="danger" variant="flat">
                      Out of Stock
                    </Chip>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-600">
                  Low Stock Alert
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {productsData.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).slice(0, 10).map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} | Remaining: {product.stockQuantity} units
                      </p>
                    </div>
                    <Chip size="sm" color="warning" variant="flat">
                      Low Stock
                    </Chip>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;