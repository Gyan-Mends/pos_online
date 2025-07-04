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
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { salesAPI, dashboardAPI, customersAPI, usersAPI } from '../../utils/api';
import { errorToast, successToast } from '../../components/toast';

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

const SalesReport = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    seller: 'all',
    customer: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadSalesData();
  }, [dateRange, filters, pagination.page]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      
      // Load sales data
      const salesParams = {
        page: pagination.page,
        limit: pagination.limit,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.seller !== 'all' && { sellerId: filters.seller }),
        ...(filters.customer !== 'all' && { customerId: filters.customer }),
      };
      
      const salesResponse = await salesAPI.getAll(salesParams);
      const sales = salesResponse.data || salesResponse;
      
      setSalesData(Array.isArray(sales) ? sales : sales.data || []);
      if (sales.pagination) {
        setPagination(prev => ({
          ...prev,
          total: sales.pagination.total,
          pages: sales.pagination.pages
        }));
      }
      
      // Load dashboard data for charts
      const dashboardResponse = await dashboardAPI.getStats();
      setDashboardData(dashboardResponse.data || dashboardResponse);
      
    } catch (error) {
      console.error('Error loading sales data:', error);
      errorToast('Failed to load sales data');
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

  const formatTime = (date: string | Date) => {
    return format(new Date(date), 'hh:mm a');
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!salesData.length) return null;
    
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const averageOrderValue = totalRevenue / totalSales;
    const totalItems = salesData.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);
    
    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      totalItems
    };
  };

  const summary = calculateSummary();

  // Prepare chart data
  const getSalesChartData = () => {
    if (!dashboardData?.weeklyTrend) return { labels: [], datasets: [] };
    
    return {
      labels: dashboardData.weeklyTrend.map((item: any) => 
        format(parseISO(item.date), 'MMM dd')
      ),
      datasets: [
        {
          label: 'Revenue',
          data: dashboardData.weeklyTrend.map((item: any) => item.revenue),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Sales Count',
          data: dashboardData.weeklyTrend.map((item: any) => item.count),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getTopProductsData = () => {
    if (!dashboardData?.topProducts) return { labels: [], datasets: [] };
    
    return {
      labels: dashboardData.topProducts.map((item: any) => item.name),
      datasets: [
        {
          data: dashboardData.topProducts.map((item: any) => item.revenue),
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
      x: {
        display: true,
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

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
            Sales Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed sales analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            onClick={loadSalesData}
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

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search sales..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <Select
              placeholder="Select status"
              selectedKeys={filters.status !== 'all' ? [filters.status] : []}
              onSelectionChange={(keys) => {
                const status = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, status }));
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="refunded">Refunded</SelectItem>
              <SelectItem key="partially_refunded">Partially Refunded</SelectItem>
            </Select>
            <Select
              placeholder="Select seller"
              selectedKeys={filters.seller !== 'all' ? [filters.seller] : []}
              onSelectionChange={(keys) => {
                const seller = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, seller }));
              }}
            >
              <SelectItem key="all">All Sellers</SelectItem>
              {/* Add seller options dynamically */}
            </Select>
            <Select
              placeholder="Select customer"
              selectedKeys={filters.customer !== 'all' ? [filters.customer] : []}
              onSelectionChange={(keys) => {
                const customer = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, customer }));
              }}
            >
              <SelectItem key="all">All Customers</SelectItem>
              {/* Add customer options dynamically */}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalSales}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalRevenue)}
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

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Order Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.averageOrderValue)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    Total Items Sold
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalItems}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Trend
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Line data={getSalesChartData()} options={chartOptions} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Products by Revenue
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Pie 
                data={getTopProductsData()} 
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

      {/* Sales Table */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Transactions
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {salesData.length} of {pagination.total} sales
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="Sales transactions table">
            <TableHeader>
              <TableColumn>RECEIPT</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>CUSTOMER</TableColumn>
              <TableColumn>SELLER</TableColumn>
              <TableColumn>ITEMS</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {salesData.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {sale.receiptNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatDate(sale.saleDate || sale.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(sale.saleDate || sale.createdAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.customerId ? (
                      <div>
                        <div className="font-medium">
                          {sale.customerId.firstName} {sale.customerId.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.customerId.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Walk-in Customer</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sale.sellerId ? (
                      <div className="font-medium">
                        {sale.sellerId.firstName} {sale.sellerId.lastName}
                      </div>
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {sale.items?.length || 0} items
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        sale.status === 'completed' ? 'success' :
                        sale.status === 'refunded' ? 'danger' :
                        sale.status === 'partially_refunded' ? 'warning' : 'default'
                      }
                      variant="flat"
                    >
                      {sale.status?.replace('_', ' ')}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                page={pagination.page}
                total={pagination.pages}
                onChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default SalesReport;