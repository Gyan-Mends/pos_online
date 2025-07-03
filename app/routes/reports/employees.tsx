import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip, Avatar } from '@heroui/react';
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
import { Users, TrendingUp, Star, DollarSign, BarChart3, Award, Target, Clock } from 'lucide-react';
import { format, subDays, parseISO, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { salesAPI, usersAPI } from '../../utils/api';
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

interface EmployeeData {
  totalEmployees: number;
  activeEmployees: number;
  totalSales: number;
  averageSalesPerEmployee: number;
  employeePerformance: {
    employee: any;
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    performance: number;
    lastSale: string;
  }[];
  roleDistribution: { role: string; count: number; revenue: number }[];
  dailyPerformance: { date: string; sales: number; employees: number }[];
  topPerformers: any[];
  salesByEmployee: { employee: any; sales: number; revenue: number }[];
}

export default function EmployeeReportsPage() {
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [dateRange]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfDay(dateRange.start), 'yyyy-MM-dd');
      const endDate = format(endOfDay(dateRange.end), 'yyyy-MM-dd');
      
      // Fetch sales data
      const salesResponse: any = await salesAPI.getAll({
        startDate,
        endDate,
        limit: 10000
      });

      // Fetch employees/users
      const usersResponse: any = await usersAPI.getAll({
        limit: 1000
      });

      if (salesResponse.success && usersResponse.success) {
        generateEmployeeAnalytics(salesResponse.data, usersResponse.data);
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeAnalytics = (sales: any[], employees: any[]) => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active' || !e.status).length;
    const totalSales = sales.length;
    const averageSalesPerEmployee = activeEmployees > 0 ? totalSales / activeEmployees : 0;

    // Create employee map for quick lookup
    const employeeMap = new Map();
    employees.forEach(employee => {
      employeeMap.set(employee._id, {
        ...employee,
        totalSales: 0,
        totalRevenue: 0,
        lastSale: null,
        salesDates: []
      });
    });

    // Analyze sales by employee
    const roleMap = new Map();
    const dailyPerformanceMap = new Map();

    sales.forEach(sale => {
      const sellerId = sale.sellerId || sale.seller?._id;
      const employee = employeeMap.get(sellerId);
      
      if (employee) {
        employee.totalSales += 1;
        employee.totalRevenue += sale.totalAmount;
        employee.lastSale = sale.saleDate;
        employee.salesDates.push(sale.saleDate);

        // Role analysis
        const role = employee.role || 'Unknown';
        if (!roleMap.has(role)) {
          roleMap.set(role, { count: 0, revenue: 0, employees: new Set() });
        }
        const roleData = roleMap.get(role);
        roleData.revenue += sale.totalAmount;
        roleData.employees.add(sellerId);

        // Daily performance
        const date = format(parseISO(sale.saleDate), 'yyyy-MM-dd');
        if (!dailyPerformanceMap.has(date)) {
          dailyPerformanceMap.set(date, { sales: 0, employees: new Set() });
        }
        const dayData = dailyPerformanceMap.get(date);
        dayData.sales += 1;
        dayData.employees.add(sellerId);
      }
    });

    // Update role counts
    roleMap.forEach((data, role) => {
      data.count = data.employees.size;
    });

    // Calculate employee performance
    const employeePerformance = Array.from(employeeMap.values())
      .filter(emp => emp.totalSales > 0)
      .map(emp => {
        const averageOrderValue = emp.totalSales > 0 ? emp.totalRevenue / emp.totalSales : 0;
        const workingDays = emp.salesDates.length > 0 ? 
          Math.max(1, differenceInDays(
            parseISO(emp.lastSale), 
            parseISO(emp.salesDates[0])
          ) + 1) : 1;
        const performance = emp.totalSales / workingDays; // Sales per day
        
        return {
          employee: emp,
          totalSales: emp.totalSales,
          totalRevenue: emp.totalRevenue,
          averageOrderValue,
          performance,
          lastSale: emp.lastSale ? format(parseISO(emp.lastSale), 'MMM dd, yyyy') : 'N/A'
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Role distribution
    const roleDistribution = Array.from(roleMap.entries())
      .map(([role, data]) => ({
        role,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Daily performance
    const dailyPerformance = Array.from(dailyPerformanceMap.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        employees: data.employees.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top performers (by revenue)
    const topPerformers = employeePerformance.slice(0, 5);

    // Sales by employee for chart
    const salesByEmployee = employeePerformance.slice(0, 10).map(emp => ({
      employee: emp.employee,
      sales: emp.totalSales,
      revenue: emp.totalRevenue
    }));

    setEmployeeData({
      totalEmployees,
      activeEmployees,
      totalSales,
      averageSalesPerEmployee,
      employeePerformance,
      roleDistribution,
      dailyPerformance,
      topPerformers,
      salesByEmployee
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Employee performance analytics and productivity insights
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

      {/* Key Employee Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Employees</p>
                  <p className="text-2xl font-bold">{employeeData?.totalEmployees || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Employees</p>
                  <p className="text-2xl font-bold">{employeeData?.activeEmployees || 0}</p>
                </div>
                <Target className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold">{employeeData?.totalSales || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600">
          <CardBody className="p-6">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Avg Sales/Employee</p>
                  <p className="text-2xl font-bold">{employeeData?.averageSalesPerEmployee.toFixed(1) || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Coming Soon for additional charts */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Employee Analytics Dashboard</h3>
              <p>Performance charts and detailed analytics coming soon</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 