import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, DateRangePicker } from '@heroui/react';
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
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, BarChart3 } from 'lucide-react';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { salesAPI } from '../../utils/api';
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

interface SalesData {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  saleDate: string;
  status: string;
  items: any[];
  customer: any;
  seller: any;
  payments: any[];
}

interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  dailySales: { date: string; sales: number; revenue: number }[];
  topCustomers: { name: string; totalSpent: number; orderCount: number }[];
  paymentMethods: { method: string; amount: number; count: number }[];
  salesByHour: { hour: number; sales: number; revenue: number }[];
}

export default function SalesReportsPage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfDay(dateRange.start), 'yyyy-MM-dd');
      const endDate = format(endOfDay(dateRange.end), 'yyyy-MM-dd');
      
      const response: any = await salesAPI.getAll({
        startDate,
        endDate,
        limit: 1000
      });

      if (response.success) {
        setSalesData(response.data);
        generateAnalytics(response.data);
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (sales: SalesData[]) => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Unique customers
    const uniqueCustomers = new Set(sales.filter(s => s.customer).map(s => s.customer._id));
    const totalCustomers = uniqueCustomers.size;

    // Daily sales aggregation
    const dailySalesMap = new Map();
    sales.forEach(sale => {
      const date = format(parseISO(sale.saleDate), 'yyyy-MM-dd');
      if (!dailySalesMap.has(date)) {
        dailySalesMap.set(date, { sales: 0, revenue: 0 });
      }
      const day = dailySalesMap.get(date);
      day.sales += 1;
      day.revenue += sale.totalAmount;
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top customers
    const customerMap = new Map();
    sales.forEach(sale => {
      if (sale.customer) {
        const customerId = sale.customer._id;
        const customerName = `${sale.customer.firstName} ${sale.customer.lastName}`;
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, { name: customerName, totalSpent: 0, orderCount: 0 });
        }
        const customer = customerMap.get(customerId);
        customer.totalSpent += sale.totalAmount;
        customer.orderCount += 1;
      }
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Payment methods
    const paymentMap = new Map();
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (!paymentMap.has(payment.method)) {
          paymentMap.set(payment.method, { amount: 0, count: 0 });
        }
        const method = paymentMap.get(payment.method);
        method.amount += payment.amount;
        method.count += 1;
      });
    });

    const paymentMethods = Array.from(paymentMap.entries())
      .map(([method, data]) => ({ method, ...data }));

    // Sales by hour
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { sales: 0, revenue: 0 });
    }
    
    sales.forEach(sale => {
      const hour = new Date(sale.saleDate).getHours();
      const hourData = hourlyMap.get(hour);
      hourData.sales += 1;
      hourData.revenue += sale.totalAmount;
    });

    const salesByHour = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }));

    setAnalytics({
      totalSales,
      totalRevenue,
      averageOrderValue,
      totalCustomers,
      dailySales,
      topCustomers,
      paymentMethods,
      salesByHour
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
  const salesTrendConfig = {
    data: {
      labels: analytics?.dailySales.map(d => format(parseISO(d.date), 'MMM dd')) || [],
      datasets: [
        {
          label: 'Revenue',
          data: analytics?.dailySales.map(d => d.revenue) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Orders',
          data: analytics?.dailySales.map(d => d.sales) || [],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      scales: {
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
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
            color: 'rgb(107, 114, 128)',
          },
        },
        x: {
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgb(107, 114, 128)',
          },
        },
      },
    },
  };

  const paymentMethodsConfig = {
    data: {
      labels: analytics?.paymentMethods.map(p => p.method.replace('_', ' ').toUpperCase()) || [],
      datasets: [
        {
          data: analytics?.paymentMethods.map(p => p.amount) || [],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
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

  const hourlySalesConfig = {
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Sales Count',
          data: analytics?.salesByHour.map(h => h.sales) || [],
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
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
          },
        },
        x: {
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgb(107, 114, 128)',
          },
        },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive sales analytics and performance metrics
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${analytics?.totalRevenue.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold">{analytics?.totalSales.toLocaleString() || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Order Value</p>
                  <p className="text-2xl font-bold">${analytics?.averageOrderValue.toFixed(2) || 0}</p>
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
                  <p className="text-orange-100 text-sm">Unique Customers</p>
                  <p className="text-2xl font-bold">{analytics?.totalCustomers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Trend</h3>
          </div>
          <div className="h-80">
            <Line {...salesTrendConfig} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
            </div>
            <div className="h-64">
              <Doughnut {...paymentMethodsConfig} />
            </div>
          </CardBody>
        </Card>

        {/* Hourly Sales */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales by Hour</h3>
            </div>
            <div className="h-64">
              <Bar {...hourlySalesConfig} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Orders</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Total Spent</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{customer.orderCount}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${customer.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${(customer.totalSpent / customer.orderCount).toFixed(2)}</td>
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