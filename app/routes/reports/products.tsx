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
import { Package, TrendingUp, Star, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { salesAPI, productsAPI } from '../../utils/api';
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

interface ProductData {
  totalProducts: number;
  totalRevenue: number;
  averageMargin: number;
  topSellingProducts: { product: any; quantity: number; revenue: number; profit: number }[];
  categoryPerformance: { category: string; revenue: number; profit: number; products: number }[];
  profitMargins: { product: any; margin: number; revenue: number }[];
  salesTrend: { date: string; sales: number; revenue: number }[];
  slowMovingProducts: { product: any; lastSold: string; stock: number }[];
}

export default function ProductReportsPage() {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  useEffect(() => {
    fetchProductData();
  }, [dateRange]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfDay(dateRange.start), 'yyyy-MM-dd');
      const endDate = format(endOfDay(dateRange.end), 'yyyy-MM-dd');
      
      // Fetch sales data
      const salesResponse = await salesAPI.getAll({
        startDate,
        endDate,
        limit: 10000
      });

      // Fetch products
      const productsResponse = await productsAPI.getAll({
        limit: 10000
      });

      if (salesResponse.success && productsResponse.success) {
        generateProductAnalytics(salesResponse.data, productsResponse.data);
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  };

  const generateProductAnalytics = (sales: any[], products: any[]) => {
    const totalProducts = products.length;
    let totalRevenue = 0;
    let totalProfit = 0;

    // Create product map for quick lookup
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id, {
        ...product,
        totalSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        lastSold: null
      });
    });

    // Analyze sales data
    const categoryMap = new Map();
    const dailySalesMap = new Map();

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      
      const saleDate = format(parseISO(sale.saleDate), 'yyyy-MM-dd');
      if (!dailySalesMap.has(saleDate)) {
        dailySalesMap.set(saleDate, { sales: 0, revenue: 0 });
      }
      const dayData = dailySalesMap.get(saleDate);
      dayData.sales += 1;
      dayData.revenue += sale.totalAmount;

      sale.items.forEach((item: any) => {
        const productId = item.productId || item.product?._id;
        const product = productMap.get(productId);
        
        if (product) {
          const itemProfit = item.totalPrice - ((product.costPrice || 0) * item.quantity);
          
          product.totalSold += item.quantity;
          product.totalRevenue += item.totalPrice;
          product.totalProfit += itemProfit;
          product.lastSold = sale.saleDate;
          
          totalProfit += itemProfit;

          // Category analysis
          const category = product.category || 'Other';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { revenue: 0, profit: 0, products: new Set() });
          }
          const catData = categoryMap.get(category);
          catData.revenue += item.totalPrice;
          catData.profit += itemProfit;
          catData.products.add(productId);
        }
      });
    });

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Top selling products
    const topSellingProducts = Array.from(productMap.values())
      .filter(p => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)
      .map(p => ({
        product: p,
        quantity: p.totalSold,
        revenue: p.totalRevenue,
        profit: p.totalProfit
      }));

    // Category performance
    const categoryPerformance = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        profit: data.profit,
        products: data.products.size
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Profit margins
    const profitMargins = Array.from(productMap.values())
      .filter(p => p.totalRevenue > 0)
      .map(p => ({
        product: p,
        margin: p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue) * 100 : 0,
        revenue: p.totalRevenue
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    // Sales trend
    const salesTrend = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Slow moving products
    const thirtyDaysAgo = subDays(new Date(), 30);
    const slowMovingProducts = Array.from(productMap.values())
      .filter(p => !p.lastSold || parseISO(p.lastSold) < thirtyDaysAgo)
      .filter(p => p.stockQuantity > 0)
      .sort((a, b) => b.stockQuantity - a.stockQuantity)
      .slice(0, 10)
      .map(p => ({
        product: p,
        lastSold: p.lastSold ? format(parseISO(p.lastSold), 'MMM dd, yyyy') : 'Never',
        stock: p.stockQuantity
      }));

    setProductData({
      totalProducts,
      totalRevenue,
      averageMargin,
      topSellingProducts,
      categoryPerformance,
      profitMargins,
      salesTrend,
      slowMovingProducts
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
  const categoryPerformanceConfig = {
    data: {
      labels: productData?.categoryPerformance.map(c => c.category) || [],
      datasets: [
        {
          label: 'Revenue',
          data: productData?.categoryPerformance.map(c => c.revenue) || [],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Profit',
          data: productData?.categoryPerformance.map(c => c.profit) || [],
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
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

  const topProductsConfig = {
    data: {
      labels: productData?.topSellingProducts.map(p => p.product.name.slice(0, 15) + '...') || [],
      datasets: [
        {
          label: 'Quantity Sold',
          data: productData?.topSellingProducts.map(p => p.quantity) || [],
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: 'y' as const,
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

  const salesTrendConfig = {
    data: {
      labels: productData?.salesTrend.map(d => format(parseISO(d.date), 'MMM dd')) || [],
      datasets: [
        {
          label: 'Daily Revenue',
          data: productData?.salesTrend.map(d => d.revenue) || [],
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Product performance analytics and sales insights
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

      {/* Key Product Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Products</p>
                  <p className="text-2xl font-bold">{productData?.totalProducts.toLocaleString() || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Product Revenue</p>
                  <p className="text-2xl font-bold">${productData?.totalRevenue.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Profit Margin</p>
                  <p className="text-2xl font-bold">{productData?.averageMargin.toFixed(1) || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Active Categories</p>
                  <p className="text-2xl font-bold">{productData?.categoryPerformance.length || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Product Sales Trend */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Sales Trend</h3>
          </div>
          <div className="h-80">
            <Line {...salesTrendConfig} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Performance</h3>
            </div>
            <div className="h-64">
              <Bar {...categoryPerformanceConfig} />
            </div>
          </CardBody>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
            </div>
            <div className="h-64">
              <Bar {...topProductsConfig} />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Profit Margins */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Best Profit Margins</h3>
            </div>
            <div className="space-y-3">
              {productData?.profitMargins.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Revenue: ${item.revenue.toLocaleString()}</p>
                  </div>
                  <Chip color="success" size="sm">
                    {item.margin.toFixed(1)}%
                  </Chip>
                </div>
              ))}
              {productData?.profitMargins.length === 0 && (
                <p className="text-center text-gray-500 py-4">No sales data available</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Slow Moving Products */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Slow Moving Products</h3>
            </div>
            <div className="space-y-3">
              {productData?.slowMovingProducts.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last sold: {item.lastSold}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.stock} in stock</p>
                    <Chip color="warning" size="sm">
                      Slow moving
                    </Chip>
                  </div>
                </div>
              ))}
              {productData?.slowMovingProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">No slow moving products</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Products</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Margin</th>
                </tr>
              </thead>
              <tbody>
                {productData?.categoryPerformance.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{category.category}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{category.products}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${category.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${category.profit.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {category.revenue > 0 ? ((category.profit / category.revenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 