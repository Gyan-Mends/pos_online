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
import { format, subDays, startOfDay, endOfDay, parseISO, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
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
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(period));
    const newDateRange = {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    };
    
    console.log('Date range updated:', {
      period,
      startDate: format(newDateRange.start, 'yyyy-MM-dd HH:mm:ss'),
      endDate: format(newDateRange.end, 'yyyy-MM-dd HH:mm:ss'),
      startFormatted: format(newDateRange.start, 'yyyy-MM-dd'),
      endFormatted: format(newDateRange.end, 'yyyy-MM-dd')
    });
    
    setDateRange(newDateRange);
  }, [period]);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Load sales data for revenue - temporarily remove date filtering for testing
      const salesParams = {
        limit: 1000,
        // Comment out date filtering to test
        // startDate: format(dateRange.start, 'yyyy-MM-dd'),
        // endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      console.log('Loading sales with params:', salesParams);
      console.log('Current date range:', {
        start: dateRange.start,
        end: dateRange.end,
        startFormatted: format(dateRange.start, 'yyyy-MM-dd'),
        endFormatted: format(dateRange.end, 'yyyy-MM-dd')
      });
      
      const salesResponse = await salesAPI.getAll(salesParams) as any;
      console.log('Raw sales response:', salesResponse);
      
      const sales = salesResponse.data || salesResponse;
      console.log('Extracted sales:', sales);
      
      const salesArray = Array.isArray(sales) ? sales : (sales.data || []);
      console.log('Final sales array:', salesArray);
      console.log('Total sales found:', salesArray.length);
      
      if (salesArray.length > 0) {
        console.log('Sample sale:', salesArray[0]);
        console.log('Sample sale date:', salesArray[0].saleDate || salesArray[0].createdAt);
      }
      
      setSalesData(salesArray);
      
      // Load purchase orders for expenses
      const expenseParams = {
        limit: 1000,
        // startDate: format(dateRange.start, 'yyyy-MM-dd'),
        // endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      try {
        const expenseResponse = await purchaseOrdersAPI.getAll(expenseParams) as any;
        const expenses = expenseResponse.data || expenseResponse;
        const expenseArray = Array.isArray(expenses) ? expenses : (expenses.data || []);
        setExpenseData(expenseArray);
        console.log('Expenses data received:', expenseArray.length);
      } catch (error) {
        console.warn('Could not load purchase orders:', error);
        setExpenseData([]);
      }
      
      // Load dashboard data for additional summary
      try {
        const dashboardResponse = await dashboardAPI.getStats() as any;
        setFinancialData(dashboardResponse.data || dashboardResponse);
      } catch (error) {
        console.warn('Could not load dashboard data:', error);
        setFinancialData(null);
      }
      
    } catch (error) {
      console.error('Error loading financial data:', error);
      errorToast('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Calculate financial summary from actual sales data
  const calculateFinancialSummary = () => {
    console.log('Calculating financial summary with salesData:', salesData.length);
    
    if (!salesData.length) {
      console.log('No sales data available');
      return {
        totalRevenue: 0,
        totalCosts: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        profitMargin: 0,
        revenueGrowth: 0,
        avgOrderValue: 0,
        totalSales: 0
      };
    }
    
    // Revenue calculations
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalSales = salesData.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    console.log('Financial summary calculations:', {
      totalRevenue,
      totalSales,
      avgOrderValue,
      sampleSale: salesData[0]
    });
    
    // Cost calculations from actual product cost prices
    const totalCosts = salesData.reduce((sum, sale) => {
      const saleItems = sale.items || [];
      return sum + saleItems.reduce((itemSum: number, item: any) => {
        const costPrice = item.product?.costPrice || (item.product?.price || 0) * 0.7; // Default to 70% of price as cost
        return itemSum + (costPrice * (item.quantity || 0));
      }, 0);
    }, 0);
    
    // Expense calculations
    const totalExpenses = expenseData.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
    
    // Profit calculations
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Growth calculations (comparing to previous period)
    const revenueGrowth = financialData?.todayStats?.revenueChange || 0;
    
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

  // Generate daily trend data from sales data
  const generateDailyTrend = () => {
    console.log('Generating daily trend with salesData:', salesData.length);
    
    if (!salesData.length) {
      console.log('No sales data available for trend generation');
      return [];
    }
    
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    console.log('Date range for trend:', {
      start: format(dateRange.start, 'yyyy-MM-dd'),
      end: format(dateRange.end, 'yyyy-MM-dd'),
      totalDays: days.length
    });
    
    const trendData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySales = salesData.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const isInRange = saleDate >= dayStart && saleDate <= dayEnd;
        
        // Debug first few iterations
        if (days.indexOf(day) < 3) {
          console.log(`Day ${format(day, 'yyyy-MM-dd')} - Sale date: ${format(saleDate, 'yyyy-MM-dd')} - In range: ${isInRange}`);
        }
        
        return isInRange;
      });
      
      const revenue = daySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const count = daySales.length;
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        revenue,
        count
      };
    });
    
    console.log('Generated trend data:', trendData.slice(0, 5)); // Show first 5 days
    return trendData;
  };

  // Generate monthly trend data from sales data
  const generateMonthlyTrend = () => {
    if (!salesData.length) return [];
    
    const months = eachMonthOfInterval({ 
      start: startOfMonth(subDays(dateRange.end, 365)), 
      end: endOfMonth(dateRange.end) 
    });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });
      
      const revenue = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const count = monthSales.length;
      
      return {
        month: format(month, 'yyyy-MM'),
        revenue,
        count
      };
    });
  };

  // Get revenue trend data
  const getRevenueTrendData = () => {
    const trendData = generateDailyTrend();
    
    if (trendData.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [
          {
            label: 'Revenue',
            data: [0],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      };
    }
    
    return {
      labels: trendData.map(item => format(parseISO(item.date), 'MMM dd')),
      datasets: [
        {
          label: 'Daily Revenue',
          data: trendData.map(item => item.revenue),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Daily Sales Count',
          data: trendData.map(item => item.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  // Get profit analysis data
  const getProfitAnalysisData = () => {
    const summary = calculateFinancialSummary();
    
    return {
      labels: ['Revenue', 'Costs', 'Expenses', 'Net Profit'],
      datasets: [
        {
          data: [
            summary.totalRevenue,
            summary.totalCosts,
            summary.totalExpenses,
            Math.max(0, summary.netProfit) // Ensure non-negative for visualization
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
    const monthlyData = generateMonthlyTrend();
    
    if (monthlyData.length === 0) {
      return { 
        labels: ['No Data'], 
        datasets: [
          {
            label: 'Revenue',
            data: [0],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          }
        ]
      };
    }
    
    return {
      labels: monthlyData.map(item => format(parseISO(item.month + '-01'), 'MMM yyyy')),
      datasets: [
        {
          label: 'Monthly Revenue',
          data: monthlyData.map(item => item.revenue),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Estimated Profit',
          data: monthlyData.map(item => item.revenue * 0.3), // 30% profit margin estimate
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Generate cash flow data
  const getCashFlowData = () => {
    const dailyData = generateDailyTrend();
    const expensesByDay = expenseData.reduce((acc, expense) => {
      const day = format(new Date(expense.createdAt), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + (expense.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    let cumulativeCash = 0;
    const cashFlowData = dailyData.map(item => {
      const dayExpenses = expensesByDay[item.date] || 0;
      const netCashFlow = item.revenue - dayExpenses;
      cumulativeCash += netCashFlow;
      
      return {
        date: item.date,
        cashIn: item.revenue,
        cashOut: dayExpenses,
        netFlow: netCashFlow,
        cumulative: cumulativeCash
      };
    });
    
    return {
      labels: cashFlowData.map(item => format(parseISO(item.date), 'MMM dd')),
      datasets: [
        {
          label: 'Cash In',
          data: cashFlowData.map(item => item.cashIn),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Cash Out',
          data: cashFlowData.map(item => item.cashOut),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  };

  const summary = calculateFinancialSummary();

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
                  {summary.totalRevenue > 0 ? ((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1) : 0}% margin
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
                        ticks: {
                          callback: function(value: any) {
                            return Math.round(value);
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
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${formatCurrency(context.parsed)}`;
                          }
                        }
                      }
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
                    {summary.totalSales}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Total Sales</p>
                </div>
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.avgOrderValue)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Avg Order Value</p>
                </div>
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPercentage(summary.revenueGrowth)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Growth Rate</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'profit' && (
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
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Total Revenue</span>
                    <span className="text-green-600">{formatCurrency(summary.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Cost of Goods Sold</span>
                    <span className="text-red-600">-{formatCurrency(summary.totalCosts)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-green-600">Gross Profit</span>
                    <span className="text-green-600">{formatCurrency(summary.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Operating Expenses</span>
                    <span className="text-red-600">-{formatCurrency(summary.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-gray-800 dark:border-gray-200">
                    <span className="font-bold text-lg">Net Profit</span>
                    <span className={`font-bold text-lg ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Profit Margin</span>
                    <span className={`font-medium ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profit Analysis
                </h3>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  <Doughnut 
                    data={getProfitAnalysisData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right' as const,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${formatCurrency(context.parsed)}`;
                            }
                          }
                        }
                      },
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Cash Flow
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Bar 
                  data={getCashFlowData()} 
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody className="p-6 text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Cash In
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-6 text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total Cash Out
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-6 text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Net Cash Flow
                </p>
                <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netProfit)}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;