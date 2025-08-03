import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Button,
  Spinner,
  Divider,
  Avatar
} from "@heroui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { dashboardAPI } from '../../utils/api';
import { errorToast } from '../../components/toast';
import { useStoreData } from '../../hooks/useStore';
import { useStockMonitoring } from '../../hooks/useStockMonitoring';
import DataTable, { type Column } from '../../components/DataTable';
import ExpiryAlerts from '../../components/ExpiryAlerts';

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

// Icons
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const DollarSignIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const PackageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const AlertTriangleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface DashboardData {
  todayStats: {
    revenue: number;
    count: number;
    revenueChange: number;
    countChange: number;
  };
  monthlyStats: {
    revenue: number;
    count: number;
    revenueChange: number;
  };
  weeklyTrend: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
  recentSales: Array<any>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  // Admin-specific fields
  totalCustomers?: number;
  totalProducts?: number;
  totalUsers?: number;
  lowStockProducts?: number;
  totalSales?: number;
  totalRevenue?: number;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { store, formatCurrency: storeFormatCurrency, isStoreOpen, getBusinessHours } = useStoreData();
  const { checkStockNow } = useStockMonitoring();

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      console.log('Dashboard response:', response);
      console.log('Dashboard response data:', response?.data);
      console.log('Dashboard today stats:', response?.data?.data?.todayStats);
      console.log('Dashboard monthly stats:', response?.data?.data?.monthlyStats);
      setDashboardData((response as any)?.data?.data || (response as any)?.data || response);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      errorToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Use store's currency formatting if available, fallback to default
    return store ? storeFormatCurrency(amount) : new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return {
      value: `${isPositive ? '+' : ''}${percentage.toFixed(1)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      icon: isPositive ? TrendingUpIcon : TrendingDownIcon,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No dashboard data available</p>
        <Button 
          color="primary" 
          onClick={loadDashboardData}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const weeklyChartData = {
    labels: dashboardData.weeklyTrend.map(item => 
      format(parseISO(item.date), 'MMM dd')
    ),
    datasets: [
      {
        label: 'Daily Revenue',
        data: dashboardData.weeklyTrend.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const monthlyChartData = {
    labels: dashboardData.monthlyTrend.map(item => 
      format(parseISO(item.month + '-01'), 'MMM yyyy')
    ),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: dashboardData.monthlyTrend.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const topProductsChartData = {
    labels: dashboardData.topProducts.map(product => product.name),
    datasets: [
      {
        data: dashboardData.topProducts.map(product => product.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const todayChange = formatPercentage(dashboardData.todayStats?.revenueChange || 0);
  const monthlyChange = formatPercentage(dashboardData.monthlyStats?.revenueChange || 0);

  // Define columns for recent sales data table
  const recentSalesColumns: Column<any>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size="sm"
            name={(record.customerId?.firstName || 'W')[0]}
            className="flex-shrink-0"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {record.customerId 
                ? `${record.customerId.firstName} ${record.customerId.lastName}` 
                : 'Walk-in Customer'
              }
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'receiptNumber',
      title: 'Receipt & Items',
      render: (_, record) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {record.receiptNumber}
          </p>
          <p className="text-sm text-gray-500">
            {record.items?.length || 0} items
          </p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      align: 'right' as const,
      render: (value) => (
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(value)}
        </p>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center' as const,
      render: (value) => (
        <Chip
          size="sm"
          color={value === 'completed' ? 'success' : 'warning'}
          variant="flat"
        >
          {value}
        </Chip>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'admin' 
              ? 'Overview of your entire business performance' 
              : `Welcome back, ${user?.firstName || 'Cashier'}! Here's your performance overview.`
            }
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          onClick={loadDashboardData}
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Store Status */}
      {store && (
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {store.address.street}, {store.address.city}
                  </p>
                </div>
                <Divider orientation="vertical" className="h-8" />
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isStoreOpen() ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${isStoreOpen() ? 'text-green-600' : 'text-red-600'}`}>
                    {isStoreOpen() ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Hours</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {(() => {
                    const hours = getBusinessHours();
                    return hours?.isClosed ? 'Closed' : `${hours?.open} - ${hours?.close}`;
                  })()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Product Expiry Alerts - Now handled by notification system */}
      <ExpiryAlerts showInline={false} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(dashboardData.todayStats?.revenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Today's Sales */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.todayStats?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(dashboardData.monthlyStats?.revenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Fourth Card - Admin-specific or Cashier-specific stat */}
        {user?.role === 'admin' ? (
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Low Stock Alert
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.lowStockProducts || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Monthly Sales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.monthlyStats?.count || 0}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Admin Overview Cards */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Customers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.totalCustomers || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.totalProducts || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <PackageIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.totalUsers || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dashboardData.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <DollarSignIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Trend */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              7-Day Sales Trend
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Line data={weeklyChartData} options={chartOptions} />
            </div>
          </CardBody>
        </Card>

        {/* Monthly Sales Trend */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              12-Month Revenue Trend
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Bar data={monthlyChartData} options={chartOptions} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Sales
            </h3>
            <Button color="primary" variant="light" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardBody>
            <DataTable
              data={dashboardData.recentSales}
              columns={recentSalesColumns}
              pageSize={5}
              showSearch={false}
              showPagination={false}
              emptyText="No recent sales found"
              tableClassName="shadow-none"
            />
          </CardBody>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.role === 'admin' ? 'Top Products' : 'My Top Products'}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 mb-6">
              {dashboardData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  {/* <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </p> */}
                </div>
              ))}
            </div>
            
            {/* Top Products Chart */}
            {dashboardData.topProducts.length > 0 && (
              <div className="h-48">
                <Doughnut 
                  data={topProductsChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 