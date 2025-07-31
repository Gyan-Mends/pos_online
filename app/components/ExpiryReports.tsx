import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Select, 
  SelectItem,
  DateRangePicker,
  Divider
} from '@heroui/react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Package, 
  AlertTriangle,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { productsAPI } from '../utils/api';
import { successToast, errorToast } from './toast';
import DataTable, { type Column } from './DataTable';
import type { Product } from '../types';

interface ExpiryReportData {
  product: Product;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning' | 'normal';
  category: string;
  stockValue: number;
}

interface ExpiryStats {
  totalProducts: number;
  expiredProducts: number;
  criticalProducts: number;
  warningProducts: number;
  totalStockValue: number;
  expiredStockValue: number;
}

const ExpiryReports: React.FC = () => {
  const [reportData, setReportData] = useState<ExpiryReportData[]>([]);
  const [stats, setStats] = useState<ExpiryStats>({
    totalProducts: 0,
    expiredProducts: 0,
    criticalProducts: 0,
    warningProducts: 0,
    totalStockValue: 0,
    expiredStockValue: 0
  });
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
  });

  // Generate expiry report
  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ limit: 1000 });
      const products = (response as any)?.data || response || [];

      const reportData: ExpiryReportData[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalStockValue = 0;
      let expiredStockValue = 0;

      products.forEach((product: Product) => {
        if (product.expiryDate) {
          const expiryDate = new Date(product.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Check if product falls within date range
          if (expiryDate >= dateRange.start && expiryDate <= dateRange.end) {
            let status: 'expired' | 'critical' | 'warning' | 'normal';
            
            if (diffDays < 0) {
              status = 'expired';
              expiredStockValue += product.stockQuantity * product.costPrice;
            } else if (diffDays <= 7) {
              status = 'critical';
            } else if (diffDays <= 30) {
              status = 'warning';
            } else {
              status = 'normal';
            }

            // Filter by report type
            if (reportType === 'all' || 
                (reportType === 'expired' && status === 'expired') ||
                (reportType === 'critical' && (status === 'expired' || status === 'critical')) ||
                (reportType === 'warning' && (status === 'expired' || status === 'critical' || status === 'warning'))) {
              
              const stockValue = product.stockQuantity * product.costPrice;
              totalStockValue += stockValue;

              reportData.push({
                product,
                daysUntilExpiry: diffDays,
                status,
                category: typeof product.categoryId === 'object' ? 
                  (product.categoryId as any).name : 'Unknown',
                stockValue
              });
            }
          }
        }
      });

      // Sort by urgency
      reportData.sort((a, b) => {
        const statusOrder = { expired: 0, critical: 1, warning: 2, normal: 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setReportData(reportData);

      // Calculate stats
      const newStats: ExpiryStats = {
        totalProducts: reportData.length,
        expiredProducts: reportData.filter(item => item.status === 'expired').length,
        criticalProducts: reportData.filter(item => item.status === 'critical').length,
        warningProducts: reportData.filter(item => item.status === 'warning').length,
        totalStockValue,
        expiredStockValue
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error generating expiry report:', error);
      errorToast('Failed to generate expiry report');
    } finally {
      setLoading(false);
    }
  };

  // Export report to CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      errorToast('No data to export');
      return;
    }

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Expiry Date',
      'Days Until Expiry',
      'Status',
      'Stock Quantity',
      'Stock Value',
      'Unit Price'
    ];

    const csvData = reportData.map(item => [
      item.product.name,
      item.product.sku,
      item.category,
      new Date(item.product.expiryDate!).toLocaleDateString(),
      item.daysUntilExpiry.toString(),
      item.status.toUpperCase(),
      item.product.stockQuantity.toString(),
      `$${item.stockValue.toFixed(2)}`,
      `$${item.product.price.toFixed(2)}`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expiry-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    successToast('Report exported successfully');
  };

  // Table columns
  const columns: Column<ExpiryReportData>[] = [
    {
      key: 'product',
      title: 'Product',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 border rounded-lg flex items-center justify-center overflow-hidden">
            {record.product.images && record.product.images.length > 0 ? (
              <img 
                src={record.product.images[0]} 
                alt={record.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{record.product.name}</p>
            <p className="text-sm text-gray-500">SKU: {record.product.sku}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      render: (value) => value || 'Unknown'
    },
    {
      key: 'expiryDate',
      title: 'Expiry Date',
      render: (_, record) => new Date(record.product.expiryDate!).toLocaleDateString()
    },
    {
      key: 'daysUntilExpiry',
      title: 'Days Until Expiry',
      sortable: true,
      render: (value) => {
        if (value < 0) {
          return <span className="text-red-600 font-medium">{Math.abs(value)} days ago</span>;
        } else if (value === 0) {
          return <span className="text-red-600 font-medium">Today</span>;
        } else {
          return <span className="font-medium">{value} days</span>;
        }
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const colors = {
          expired: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          critical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
          warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {value.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'stockQuantity',
      title: 'Stock',
      sortable: true,
      render: (_, record) => `${record.product.stockQuantity} ${record.product.unitOfMeasure}`
    },
    {
      key: 'stockValue',
      title: 'Stock Value',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    }
  ];

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expiry Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage product expiry dates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="secondary"
            variant="bordered"
            startContent={<Download className="w-4 h-4" />}
            onClick={exportToCSV}
            isDisabled={reportData.length === 0}
          >
            Export CSV
          </Button>
          <Button
            color="primary"
            startContent={<BarChart3 className="w-4 h-4" />}
            onClick={generateReport}
            isLoading={loading}
          >
            Refresh Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Report Filters</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <SelectItem key="all" value="all">All Products with Expiry</SelectItem>
              <SelectItem key="expired" value="expired">Expired Only</SelectItem>
              <SelectItem key="critical" value="critical">Critical (≤7 days)</SelectItem>
              <SelectItem key="warning" value="warning">Warning (≤30 days)</SelectItem>
            </Select>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                  className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                />
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                  className="p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expiredProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical (≤7 days)</p>
                <p className="text-2xl font-bold text-orange-600">{stats.criticalProducts}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock Value at Risk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.expiredStockValue.toFixed(0)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardBody>
          <DataTable
            data={reportData}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search products by name, SKU, or category..."
            emptyText="No products found matching the criteria"
            pageSize={20}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default ExpiryReports;