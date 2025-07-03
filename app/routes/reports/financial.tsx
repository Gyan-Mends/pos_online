import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
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
import { DollarSign, TrendingUp, FileText, Calculator, PieChart } from 'lucide-react';
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

interface FinancialData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalTax: number;
  netProfit: number;
  monthlyRevenue: { month: string; revenue: number; cogs: number; profit: number }[];
  taxBreakdown: { type: string; amount: number }[];
  profitTrend: { date: string; profit: number; margin: number }[];
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: subDays(new Date(), 365),
    end: new Date()
  });

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfDay(dateRange.start), 'yyyy-MM-dd');
      const endDate = format(endOfDay(dateRange.end), 'yyyy-MM-dd');
      
      const salesResponse = await salesAPI.getAll({
        startDate,
        endDate,
        limit: 10000
      });

      const productsResponse = await productsAPI.getAll({
        limit: 10000
      });

      if (salesResponse.success && productsResponse.success) {
        generateFinancialAnalytics(salesResponse.data, productsResponse.data);
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const generateFinancialAnalytics = (sales: any[], products: any[]) => {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalTax = 0;
    
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id, product);
    });

    const monthlyMap = new Map();
    const dailyProfitMap = new Map();

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      totalTax += sale.taxAmount || 0;
      
      let saleCOGS = 0;
      sale.items.forEach((item: any) => {
        const product = productMap.get(item.productId || item.product?._id);
        if (product && product.costPrice) {
          saleCOGS += (product.costPrice * item.quantity);
        }
      });
      
      totalCOGS += saleCOGS;
      
      const month = format(parseISO(sale.saleDate), 'yyyy-MM');
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { revenue: 0, cogs: 0, profit: 0 });
      }
      const monthData = monthlyMap.get(month);
      monthData.revenue += sale.totalAmount;
      monthData.cogs += saleCOGS;
      monthData.profit += (sale.totalAmount - saleCOGS);

      const date = format(parseISO(sale.saleDate), 'yyyy-MM-dd');
      if (!dailyProfitMap.has(date)) {
        dailyProfitMap.set(date, { profit: 0, revenue: 0 });
      }
      const dayData = dailyProfitMap.get(date);
      dayData.profit += (sale.totalAmount - saleCOGS);
      dayData.revenue += sale.totalAmount;
    });

    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - totalTax;

    const monthlyRevenue = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy'),
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const profitTrend = Array.from(dailyProfitMap.entries())
      .map(([date, data]) => ({
        date,
        profit: data.profit,
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const taxBreakdown = [
      { type: 'Sales Tax', amount: totalTax },
      { type: 'Income Tax (Est.)', amount: netProfit * 0.25 },
    ];

    setFinancialData({
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossProfitMargin,
      totalTax,
      netProfit,
      monthlyRevenue,
      taxBreakdown,
      profitTrend
    });
  };

  const setPeriod = (period: string) => {
    setSelectedPeriod(period);
    const end = new Date();
    let start: Date;
    
    switch (period) {
      case '3m':
        start = subDays(end, 90);
        break;
      case '6m':
        start = subDays(end, 180);
        break;
      case '1y':
        start = subDays(end, 365);
        break;
      case '2y':
        start = subDays(end, 730);
        break;
      default:
        start = subDays(end, 365);
    }
    
    setDateRange({ start, end });
  };

  const revenueVsProfitConfig = {
    data: {
      labels: financialData?.monthlyRevenue.map(d => d.month) || [],
      datasets: [
        {
          label: 'Revenue',
          data: financialData?.monthlyRevenue.map(d => d.revenue) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Gross Profit',
          data: financialData?.monthlyRevenue.map(d => d.profit) || [],
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

  const profitMarginConfig = {
    data: {
      labels: financialData?.profitTrend.slice(-30).map(d => format(parseISO(d.date), 'MMM dd')) || [],
      datasets: [
        {
          label: 'Profit Margin %',
          data: financialData?.profitTrend.slice(-30).map(d => d.margin) || [],
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
          ticks: { 
            color: 'rgb(107, 114, 128)',
            callback: function(value: any) { return value + '%'; }
          },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Revenue analysis, profit tracking, and financial insights
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          {['3m', '6m', '1y', '2y'].map((period) => (
            <Button
              key={period}
              size="sm"
              variant={selectedPeriod === period ? 'solid' : 'bordered'}
              onPress={() => setPeriod(period)}
            >
              {period === '3m' && 'Last 3 Months'}
              {period === '6m' && 'Last 6 Months'}
              {period === '1y' && 'Last Year'}
              {period === '2y' && 'Last 2 Years'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${financialData?.totalRevenue.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Gross Profit</p>
                  <p className="text-2xl font-bold">${financialData?.grossProfit.toLocaleString() || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Profit Margin</p>
                  <p className="text-2xl font-bold">{financialData?.grossProfitMargin.toFixed(1) || 0}%</p>
                </div>
                <Calculator className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold">${financialData?.netProfit.toLocaleString() || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Revenue vs Profit Trend */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue vs Profit Analysis</h3>
          </div>
          <div className="h-80">
            <Line {...revenueVsProfitConfig} />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Margin Trend */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profit Margin Trend</h3>
            </div>
            <div className="h-64">
              <Line {...profitMarginConfig} />
            </div>
          </CardBody>
        </Card>

        {/* Tax Summary */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tax Summary</h3>
            </div>
            <div className="space-y-4">
              {financialData?.taxBreakdown.map((tax, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">{tax.type}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${tax.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Monthly P&L Summary */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly P&L Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Month</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">COGS</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Margin</th>
                </tr>
              </thead>
              <tbody>
                {financialData?.monthlyRevenue.slice(-6).map((month, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{month.month}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${month.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${month.cogs.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">${month.profit.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {month.revenue > 0 ? ((month.profit / month.revenue) * 100).toFixed(1) : 0}%
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