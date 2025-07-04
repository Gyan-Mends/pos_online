import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Spinner,
  Select,
  SelectItem,
  DateRangePicker,
  Chip
} from "@heroui/react";
import { Link } from 'react-router';
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
import { dashboardAPI, reportsAPI } from '../../utils/api';
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

// Icons
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartBarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const DollarSignIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

interface ReportData {
  salesSummary: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    salesGrowth: number;
  };
  productSummary: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topSellingProduct: string;
  };
  inventorySummary: {
    totalValue: number;
    lowStockAlerts: number;
    totalMovements: number;
    stockTurnover: number;
  };
  employeeSummary: {
    totalEmployees: number;
    activeEmployees: number;
    topPerformer: string;
    avgPerformance: number;
  };
  financialSummary: {
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    monthlyGrowth: number;
  };
  chartData: {
    salesTrend: Array<{ date: string; sales: number; revenue: number }>;
    topProducts: Array<{ name: string; sales: number }>;
    categoryDistribution: Array<{ category: string; value: number }>;
  };
}

export default function ReportsOverview() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data for overview
      const dashboardResponse = await dashboardAPI.getStats();
      const dashboardData = dashboardResponse.data || dashboardResponse;
      
      // Transform dashboard data into report format
      const transformedData: ReportData = {
        salesSummary: {
          totalSales: dashboardData.todayStats?.count || 0,
          totalRevenue: dashboardData.todayStats?.revenue || 0,
          averageOrderValue: dashboardData.todayStats?.revenue / (dashboardData.todayStats?.count || 1) || 0,
          salesGrowth: dashboardData.todayStats?.revenueChange || 0,
        },
        productSummary: {
          totalProducts: dashboardData.totalProducts || 0,
          lowStockProducts: dashboardData.lowStockProducts || 0,
          outOfStockProducts: 0,
          topSellingProduct: dashboardData.topProducts?.[0]?.name || 'N/A',
        },
        inventorySummary: {
          totalValue: dashboardData.totalRevenue || 0,
          lowStockAlerts: dashboardData.lowStockProducts || 0,
          totalMovements: 0,
          stockTurnover: 0,
        },
        employeeSummary: {
          totalEmployees: dashboardData.totalUsers || 0,
          activeEmployees: dashboardData.totalUsers || 0,
          topPerformer: 'N/A',
          avgPerformance: 0,
        },
        financialSummary: {
          totalRevenue: dashboardData.totalRevenue || 0,
          totalProfit: dashboardData.totalRevenue * 0.3 || 0, // Assuming 30% profit margin
          profitMargin: 30,
          monthlyGrowth: dashboardData.monthlyStats?.revenueChange || 0,
        },
        chartData: {
          salesTrend: dashboardData.weeklyTrend || [],
          topProducts: dashboardData.topProducts || [],
          categoryDistribution: []
        }
      };
      
      setReportData(transformedData);
    } catch (error) {
      console.error('Error loading report data:', error);
      errorToast('Failed to load report data');
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const reportCards = [
    {
      title: 'Sales Reports',
      description: 'Detailed sales analytics, trends, and performance metrics',
      icon: ChartBarIcon,
      color: 'bg-blue-100 text-blue-600',
      link: '/reports/sales',
      metrics: reportData ? [
        { label: 'Total Sales', value: reportData.salesSummary.totalSales.toString() },
        { label: 'Revenue', value: formatCurrency(reportData.salesSummary.totalRevenue) },
        { label: 'Growth', value: formatPercentage(reportData.salesSummary.salesGrowth) }
      ] : []
    },
    {
      title: 'Product Reports',
      description: 'Product performance, inventory levels, and category analytics',
      icon: CubeIcon,
      color: 'bg-green-100 text-green-600',
      link: '/reports/products',
      metrics: reportData ? [
        { label: 'Total Products', value: reportData.productSummary.totalProducts.toString() },
        { label: 'Low Stock', value: reportData.productSummary.lowStockProducts.toString() },
        { label: 'Top Seller', value: reportData.productSummary.topSellingProduct }
      ] : []
    },
    {
      title: 'Inventory Reports',
      description: 'Stock levels, movements, valuations, and alerts',
      icon: CubeIcon,
      color: 'bg-yellow-100 text-yellow-600',
      link: '/reports/inventory',
      metrics: reportData ? [
        { label: 'Total Value', value: formatCurrency(reportData.inventorySummary.totalValue) },
        { label: 'Low Stock Alerts', value: reportData.inventorySummary.lowStockAlerts.toString() },
        { label: 'Stock Turnover', value: reportData.inventorySummary.stockTurnover.toString() }
      ] : []
    },
    {
      title: 'Employee Reports',
      description: 'Staff performance, activity, and productivity metrics',
      icon: UsersIcon,
      color: 'bg-purple-100 text-purple-600',
      link: '/reports/employees',
      metrics: reportData ? [
        { label: 'Total Staff', value: reportData.employeeSummary.totalEmployees.toString() },
        { label: 'Active', value: reportData.employeeSummary.activeEmployees.toString() },
        { label: 'Top Performer', value: reportData.employeeSummary.topPerformer }
      ] : []
    },
    {
      title: 'Financial Reports',
      description: 'Revenue, profit, expenses, and financial analytics',
      icon: DollarSignIcon,
      color: 'bg-red-100 text-red-600',
      link: '/reports/financial',
      metrics: reportData ? [
        { label: 'Total Revenue', value: formatCurrency(reportData.financialSummary.totalRevenue) },
        { label: 'Profit Margin', value: `${reportData.financialSummary.profitMargin}%` },
        { label: 'Monthly Growth', value: formatPercentage(reportData.financialSummary.monthlyGrowth) }
      ] : []
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Chart data
  const salesTrendData = reportData ? {
    labels: reportData.chartData.salesTrend.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Revenue',
        data: reportData.chartData.salesTrend.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  } : { labels: [], datasets: [] };

  const topProductsData = reportData ? {
    labels: reportData.chartData.topProducts.map(item => item.name),
    datasets: [
      {
        data: reportData.chartData.topProducts.map(item => item.revenue),
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
  } : { labels: [], datasets: [] };

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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analytics and reporting dashboard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            onClick={loadReportData}
            isLoading={loading}
          >
            Refresh Data
          </Button>
          <Button
            color="secondary"
            variant="flat"
            startContent={<DownloadIcon />}
          >
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(reportData?.financialSummary.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DollarSignIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Sales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData?.salesSummary.totalSales || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
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
                  {reportData?.productSummary.totalProducts || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <CubeIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Low Stock Alerts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData?.inventorySummary.lowStockAlerts || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <TrendingUpIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Chart Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Trend
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Line data={salesTrendData} options={chartOptions} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Products
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Doughnut 
                data={topProductsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {reportCards.map((report, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <report.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2 mb-4">
                {report.metrics.map((metric, metricIndex) => (
                  <div key={metricIndex} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
              <Link to={report.link}>
                <Button 
                  color="primary" 
                  variant="light" 
                  className="w-full"
                  endContent={<FileTextIcon className="w-4 h-4" />}
                >
                  View Detailed Report
                </Button>
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}