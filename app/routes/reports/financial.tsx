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
  DateRangePicker
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
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { salesAPI, dashboardAPI, purchaseOrdersAPI } from '../../utils/api';
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

const FinancialReport = () => {
  const [financialData, setFinancialData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('30');
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
  });

  useEffect(() => {
    loadFinancialData();
  }, [period, dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Load sales data for revenue
      const salesParams = {
        limit: 1000,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      const salesResponse = await salesAPI.getAll(salesParams) as any;
      const sales = salesResponse.data || salesResponse;
      setSalesData(Array.isArray(sales) ? sales : sales.data || []);
      
      // Load purchase orders for expenses
      const expenseParams = {
        limit: 1000,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      const expenseResponse = await purchaseOrdersAPI.getAll(expenseParams) as any;
      const expenses = expenseResponse.data || expenseResponse;
      setExpenseData(Array.isArray(expenses) ? expenses : expenses.data || []);
      
      // Load dashboard data for summary
      const dashboardResponse = await dashboardAPI.getStats() as any;
      setFinancialData(dashboardResponse.data || dashboardResponse);
      
    } catch (error) {
      console.error('Error loading financial data:', error);
      errorToast('Failed to load financial data');
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate financial summary
  const calculateFinancialSummary = () => {
    if (!salesData.length) return null;
    
    // Revenue calculations
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalSales = salesData.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Cost calculations (assuming 70% of revenue is cost)
    const totalCosts = salesData.reduce((sum, sale) => {
      const saleItems = sale.items || [];
      return sum + saleItems.reduce((itemSum: number, item: any) => {
        return itemSum + ((item.product?.costPrice || 0) * (item.quantity || 0));
      }, 0);
    }, 0);
    
    // Expense calculations
    const totalExpenses = expenseData.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
    
    // Profit calculations
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Growth calculations (comparing to previous period)
    const previousPeriodRevenue = financialData?.monthlyStats?.revenue || totalRevenue;
    const revenueGrowth = previousPeriodRevenue > 0 ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCosts,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      revenueGrowth,
      avgOrderValue,
      totalSales
    };
  };

  // Get revenue trend data
  const getRevenueTrendData = () => {
    if (!financialData?.weeklyTrend || !Array.isArray(financialData.weeklyTrend)) {
      return { labels: [], datasets: [] };
    }
    
    const validData = financialData.weeklyTrend.filter((item: any) => item && item.date);
    
    if (validData.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    return {
      labels: validData.map((item: any) => {
        try {
          if (typeof item.date === 'string') {
            return format(parseISO(item.date), 'MMM dd');
          } else {
            return format(new Date(item.date), 'MMM dd');
          }
        } catch (error) {
          console.warn('Error parsing date:', item.date);
          return 'Invalid Date';
        }
      }),
      datasets: [
        {
          label: 'Revenue',
          data: validData.map((item: any) => item.revenue || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Sales Count',
          data: validData.map((item: any) => (item.count || 0) * avgOrderValue),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  };

  // Get profit analysis data
  const getProfitAnalysisData = () => {
    const summary = calculateFinancialSummary();
    if (!summary) return { labels: [], datasets: [] };
    
    return {
      labels: ['Revenue', 'Costs', 'Expenses', 'Net Profit'],
      datasets: [
        {
          data: [
            summary.totalRevenue,
            summary.totalCosts,
            summary.totalExpenses,
            summary.netProfit
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Get monthly comparison data
  const getMonthlyComparisonData = () => {
    if (!financialData?.monthlyTrend || !Array.isArray(financialData.monthlyTrend)) {
      return { labels: [], datasets: [] };
    }
    
    const validData = financialData.monthlyTrend.filter((item: any) => item && item.date);
    
    if (validData.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    return {
      labels: validData.map((item: any) => {
        try {
          if (typeof item.date === 'string') {
            return format(parseISO(item.date), 'MMM');
          } else {
            return format(new Date(item.date), 'MMM');
          }
        } catch (error) {
          console.warn('Error parsing date:', item.date);
          return 'Invalid Date';
        }
      }),
      datasets: [
        {
          label: 'Revenue',
          data: validData.map((item: any) => item.revenue || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Profit',
          data: validData.map((item: any) => (item.revenue || 0) * 0.3), // Assuming 30% profit margin
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  const summary = calculateFinancialSummary();
  const avgOrderValue = summary?.avgOrderValue || 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'profit', label: 'Profit & Loss' },
    { id: 'cashflow', label: 'Cash Flow' },
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
            Financial Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revenue, profit, expenses, and financial analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            placeholder="Select period"
            selectedKeys={[period]}
            onSelectionChange={(keys) => {
              const newPeriod = Array.from(keys)[0] as string;
              setPeriod(newPeriod);
            }}
            className="w-40"
          >
            <SelectItem key="7">Last 7 Days</SelectItem>
            <SelectItem key="30">Last 30 Days</SelectItem>
            <SelectItem key="90">Last 90 Days</SelectItem>
            <SelectItem key="365">Last Year</SelectItem>
          </Select>
          <Button
            color="primary"
            variant="flat"
            onClick={loadFinancialData}
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
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                  <p className="text-sm text-green-600">
                    {formatPercentage(summary.revenueGrowth)}
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
                    Gross Profit
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.grossProfit)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1)}% margin
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

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Net Profit
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.netProfit)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.profitMargin.toFixed(1)}% margin
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

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {expenseData.length} transactions
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                Revenue Trend
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Line 
                  data={getRevenueTrendData()} 
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
                        ticks: {
                          callback: function(value: any) {
                            return formatCurrency(value);
                          },
                        },
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
                Financial Breakdown
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Doughnut 
                  data={getProfitAnalysisData()} 
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
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Revenue Comparison
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Bar 
                  data={getMonthlyComparisonData()} 
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
                        ticks: {
                          callback: function(value: any) {
                            return formatCurrency(value);
                          },
                        },
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
                Revenue Details
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {summary?.totalSales || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Total Sales</p>
                </div>
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary?.avgOrderValue || 0)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Avg Order Value</p>
                </div>
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPercentage(summary?.revenueGrowth || 0)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Growth Rate</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'profit' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profit & Loss Statement
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Total Revenue</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Cost of Goods Sold</span>
                    <span className="font-bold text-red-600">
                      -{formatCurrency(summary.totalCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Gross Profit</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(summary.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Operating Expenses</span>
                    <span className="font-bold text-red-600">
                      -{formatCurrency(summary.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold">Net Profit</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(summary.netProfit)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Key Metrics
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Gross Profit Margin</span>
                    <span className="font-bold">
                      {((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Net Profit Margin</span>
                    <span className="font-bold">
                      {summary.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Expense Ratio</span>
                    <span className="font-bold">
                      {((summary.totalExpenses / summary.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Revenue Growth</span>
                    <span className="font-bold">
                      {formatPercentage(summary.revenueGrowth)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Cash flow transactions">
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {salesData.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {formatDate(transaction.saleDate || transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color="success" variant="flat">
                        Revenue
                      </Chip>
                    </TableCell>
                    <TableCell>
                      Sale - {transaction.receiptNumber}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(transaction.totalAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {transaction.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
                {expenseData.slice(0, 5).map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      {formatDate(expense.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color="danger" variant="flat">
                        Expense
                      </Chip>
                    </TableCell>
                    <TableCell>
                      Purchase Order - {expense.orderNumber}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(expense.totalAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          expense.status === 'completed' ? 'success' :
                          expense.status === 'pending' ? 'warning' : 'default'
                        }
                        variant="flat"
                      >
                        {expense.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default FinancialReport;