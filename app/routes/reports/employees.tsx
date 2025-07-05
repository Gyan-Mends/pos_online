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
  Pagination,
  Avatar,
  Progress
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
import { usersAPI, salesAPI, dashboardAPI } from '../../utils/api';
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

const EmployeesReport = () => {
  const [employeesData, setEmployeesData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    role: 'all',
    active: 'all',
    period: '30'
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
    loadEmployeesData();
  }, [filters, dateRange]);

  const loadEmployeesData = async () => {
    try {
      setLoading(true);
      
      // Load employees data
      const employeesParams = {
        limit: 100,
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.active !== 'all' && { active: filters.active === 'active' }),
      };
      
      const employeesResponse = await usersAPI.getAll(employeesParams);
      const employees = employeesResponse.data || employeesResponse;
      setEmployeesData(Array.isArray(employees) ? employees : employees.data || []);
      
      // Load sales data for performance metrics
      const salesParams = {
        limit: 1000,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      };
      
      const salesResponse = await salesAPI.getAll(salesParams);
      const sales = salesResponse.data || salesResponse;
      setSalesData(Array.isArray(sales) ? sales : sales.data || []);
      
      // Load dashboard data
      const dashboardResponse = await dashboardAPI.getStats();
      setDashboardData(dashboardResponse.data || dashboardResponse);
      
    } catch (error) {
      console.error('Error loading employees data:', error);
      errorToast('Failed to load employees data');
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

  // Calculate employee performance metrics
  const calculateEmployeePerformance = () => {
    if (!employeesData.length || !salesData.length) return [];
    
    return employeesData.map(employee => {
      const employeeSales = salesData.filter(sale => sale.sellerId?._id === employee._id);
      const totalSales = employeeSales.length;
      const totalRevenue = employeeSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      const totalItems = employeeSales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);
      
      return {
        ...employee,
        performance: {
          totalSales,
          totalRevenue,
          avgOrderValue,
          totalItems,
          salesPerDay: totalSales / 30 // assuming 30 days
        }
      };
    }).sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!employeesData.length) return null;
    
    const totalEmployees = employeesData.length;
    const activeEmployees = employeesData.filter(emp => emp.isActive).length;
    const adminCount = employeesData.filter(emp => emp.role === 'admin').length;
    const cashierCount = employeesData.filter(emp => emp.role === 'cashier').length;
    
    const performanceData = calculateEmployeePerformance();
    const totalRevenue = performanceData.reduce((sum, emp) => sum + emp.performance.totalRevenue, 0);
    const avgPerformance = performanceData.length > 0 ? totalRevenue / performanceData.length : 0;
    
    return {
      totalEmployees,
      activeEmployees,
      adminCount,
      cashierCount,
      totalRevenue,
      avgPerformance
    };
  };

  // Get role distribution data
  const getRoleDistribution = () => {
    if (!employeesData.length) return { labels: [], datasets: [] };
    
    const roleCount = {
      admin: employeesData.filter(emp => emp.role === 'admin').length,
      cashier: employeesData.filter(emp => emp.role === 'cashier').length,
      manager: employeesData.filter(emp => emp.role === 'manager').length,
      seller: employeesData.filter(emp => emp.role === 'seller').length,
    };
    
    return {
      labels: Object.keys(roleCount).map(role => role.charAt(0).toUpperCase() + role.slice(1)),
      datasets: [
        {
          data: Object.values(roleCount),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  // Get performance comparison data
  const getPerformanceData = () => {
    const performanceData = calculateEmployeePerformance();
    const topPerformers = performanceData.slice(0, 10);
    
    return {
      labels: topPerformers.map(emp => `${emp.firstName} ${emp.lastName}`),
      datasets: [
        {
          label: 'Revenue',
          data: topPerformers.map(emp => emp.performance.totalRevenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  const summary = calculateSummary();
  const performanceData = calculateEmployeePerformance();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'activity', label: 'Activity' },
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
            Employees Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Staff performance, activity, and productivity metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            onClick={loadEmployeesData}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              placeholder="Select role"
              selectedKeys={filters.role !== 'all' ? [filters.role] : []}
              onSelectionChange={(keys) => {
                const role = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, role }));
              }}
            >
              <SelectItem key="all">All Roles</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="cashier">Cashier</SelectItem>
              <SelectItem key="manager">Manager</SelectItem>
              <SelectItem key="seller">Seller</SelectItem>
            </Select>
            <Select
              placeholder="Status"
              selectedKeys={filters.active !== 'all' ? [filters.active] : []}
              onSelectionChange={(keys) => {
                const active = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, active }));
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="active">Active Only</SelectItem>
              <SelectItem key="inactive">Inactive Only</SelectItem>
            </Select>
            <Select
              placeholder="Period"
              selectedKeys={[filters.period]}
              onSelectionChange={(keys) => {
                const period = Array.from(keys)[0] as string || '30';
                setFilters(prev => ({ ...prev, period }));
              }}
            >
              <SelectItem key="7">Last 7 Days</SelectItem>
              <SelectItem key="30">Last 30 Days</SelectItem>
              <SelectItem key="90">Last 90 Days</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

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
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalEmployees}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.activeEmployees} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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
                  <p className="text-sm text-gray-500">
                    Generated by staff
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
                    Avg Performance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.avgPerformance)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Per employee
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
                    Cashiers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.cashierCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.adminCount} admins
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                Role Distribution
              </h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <Doughnut 
                  data={getRoleDistribution()} 
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

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performers
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {performanceData.slice(0, 5).map((employee, index) => (
                  <div key={employee._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {employee.role} • {employee.performance.totalSales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(employee.performance.totalRevenue)}
                      </p>
                      <Progress
                        size="sm"
                        value={((employee.performance.totalRevenue / (performanceData[0]?.performance.totalRevenue || 1)) * 100)}
                        color="primary"
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Employee Performance Comparison
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Bar 
                data={getPerformanceData()} 
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
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Employee Activity & Performance
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Employee activity table">
              <TableHeader>
                <TableColumn>EMPLOYEE</TableColumn>
                <TableColumn>ROLE</TableColumn>
                <TableColumn>SALES</TableColumn>
                <TableColumn>REVENUE</TableColumn>
                <TableColumn>AVG ORDER</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {performanceData.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar
                          size="sm"
                          name={`${employee.firstName} ${employee.lastName}`}
                          className="flex-shrink-0"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          employee.role === 'admin' ? 'danger' :
                          employee.role === 'cashier' ? 'primary' :
                          employee.role === 'manager' ? 'success' : 'secondary'
                        }
                        variant="flat"
                      >
                        {employee.role}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {employee.performance.totalSales}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(employee.performance.totalRevenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(employee.performance.avgOrderValue)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={employee.isActive ? 'success' : 'default'}
                        variant="flat"
                      >
                        {employee.isActive ? 'Active' : 'Inactive'}
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

export default EmployeesReport;