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
import { Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { productsAPI, categoriesAPI, dashboardAPI, salesAPI } from '../../utils/api';
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

const ProductsReport = () => {
  const [productsData, setProductsData] = useState<any[]>([]);
  const [allProductsData, setAllProductsData] = useState<any[]>([]); // For summary calculations
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    lowStock: false,
    inactive: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadProductsData();
  }, [filters, pagination.page]);

  const loadProductsData = async () => {
    try {
      setLoading(true);
      
      // Load products data for table (with pagination)
      const productsParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.lowStock && { lowStock: true }),
        ...(filters.inactive && { inactive: true }),
      };
      
      const productsResponse = await productsAPI.getAll(productsParams);
      const products = productsResponse.data || productsResponse;
      
      setProductsData(Array.isArray(products) ? products : products.data || []);
      if (products.pagination) {
        setPagination(prev => ({
          ...prev,
          total: products.pagination.total,
          pages: products.pagination.pages
        }));
      }
      
      // Load ALL products for summary calculations (without pagination)
      const allProductsResponse = await productsAPI.getAll({ limit: 10000 }); // Large limit to get all
      const allProducts = allProductsResponse.data || allProductsResponse;
      setAllProductsData(Array.isArray(allProducts) ? allProducts : allProducts.data || []);
      
      // Load categories
      const categoriesResponse = await categoriesAPI.getAll();
      setCategoriesData(categoriesResponse.data || categoriesResponse || []);
      
      // Load dashboard data for charts
      const dashboardResponse = await dashboardAPI.getStats();
      setDashboardData(dashboardResponse.data || dashboardResponse);
      
    } catch (error) {
      console.error('Error loading products data:', error);
      errorToast('Failed to load products data');
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

  // Calculate summary statistics using all products data
  const calculateSummary = () => {
    if (!allProductsData.length) return null;
    
    const totalProducts = allProductsData.length;
    const activeProducts = allProductsData.filter(product => product.isActive).length;
    const lowStockProducts = allProductsData.filter(product => product.stockQuantity < 10).length;
    const outOfStockProducts = allProductsData.filter(product => product.stockQuantity === 0).length;
    const totalStockValue = allProductsData.reduce((sum, product) => 
      sum + (product.stockQuantity * product.costPrice || 0), 0);
    const totalRetailValue = allProductsData.reduce((sum, product) => 
      sum + (product.stockQuantity * product.sellingPrice || 0), 0);
    
    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      totalRetailValue
    };
  };

  const summary = calculateSummary();

  // Prepare chart data
  const getCategoryDistributionData = () => {
    if (!allProductsData.length || !categoriesData.length) return { labels: [], datasets: [] };
    
    const categoryCount = categoriesData.map(category => ({
      name: category.name,
      count: allProductsData.filter(product => product.categoryId?._id === category._id).length
    }));
    
    return {
      labels: categoryCount.map(item => item.name),
      datasets: [
        {
          data: categoryCount.map(item => item.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const getStockLevelsData = () => {
    if (!allProductsData.length) return { labels: [], datasets: [] };
    
    const stockRanges = [
      { label: 'Out of Stock', count: allProductsData.filter(p => p.stockQuantity === 0).length },
      { label: 'Low Stock (1-9)', count: allProductsData.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length },
      { label: 'Medium Stock (10-50)', count: allProductsData.filter(p => p.stockQuantity >= 10 && p.stockQuantity <= 50).length },
      { label: 'High Stock (50+)', count: allProductsData.filter(p => p.stockQuantity > 50).length },
    ];
    
    return {
      labels: stockRanges.map(item => item.label),
      datasets: [
        {
          label: 'Number of Products',
          data: stockRanges.map(item => item.count),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
          ],
          borderWidth: 1,
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
      y: {
        beginAtZero: true,
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
            Products Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Product performance, inventory levels, and category analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="primary"
            variant="flat"
            onClick={loadProductsData}
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
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <Select
              placeholder="Select category"
              selectedKeys={filters.category !== 'all' ? [filters.category] : []}
              onSelectionChange={(keys) => {
                const category = Array.from(keys)[0] as string || 'all';
                setFilters(prev => ({ ...prev, category }));
              }}
            >
              <SelectItem key="all">All Categories</SelectItem>
              {categoriesData.map((category) => (
                <SelectItem key={category._id}>{category.name}</SelectItem>
              ))}
            </Select>
            <Select
              placeholder="Stock level"
              selectedKeys={filters.lowStock ? ['lowStock'] : []}
              onSelectionChange={(keys) => {
                const lowStock = Array.from(keys).includes('lowStock');
                setFilters(prev => ({ ...prev, lowStock }));
              }}
            >
              <SelectItem key="all">All Stock Levels</SelectItem>
              <SelectItem key="lowStock">Low Stock Only</SelectItem>
            </Select>
            <Select
              placeholder="Status"
              selectedKeys={filters.inactive ? ['inactive'] : []}
              onSelectionChange={(keys) => {
                const inactive = Array.from(keys).includes('inactive');
                setFilters(prev => ({ ...prev, inactive }));
              }}
            >
              <SelectItem key="active">Active Only</SelectItem>
              <SelectItem key="inactive">Include Inactive</SelectItem>
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
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalProducts}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.activeProducts} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
                    Stock Value (Cost)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalStockValue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Retail: {formatCurrency(summary.totalRetailValue)}
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
                    Low Stock Alerts
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.lowStockProducts}
                  </p>
                  <p className="text-sm text-gray-500">
                    Needs attention
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
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
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.outOfStockProducts}
                  </p>
                  <p className="text-sm text-gray-500">
                    Critical
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              Products by Category
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Doughnut 
                data={getCategoryDistributionData()} 
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
              Stock Level Distribution
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <Bar data={getStockLevelsData()} options={chartOptions} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Products Performance */}
      {dashboardData?.topProducts && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Products
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {product.quantity} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.revenue)}
                    </p>
                    <Progress
                      size="sm"
                      value={((product.revenue / (dashboardData.topProducts[0]?.revenue || 1)) * 100)}
                      color="primary"
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Inventory
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {productsData.length} of {pagination.total} products
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="Products inventory table">
            <TableHeader>
              <TableColumn>PRODUCT</TableColumn>
              <TableColumn>SKU</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>STOCK</TableColumn>
              <TableColumn>COST PRICE</TableColumn>
              <TableColumn>SELLING PRICE</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {productsData.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.description?.substring(0, 50)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {product.sku}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.categoryId?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        product.stockQuantity === 0 ? 'text-red-600' :
                        product.stockQuantity < 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.stockQuantity}
                      </span>
                      {product.stockQuantity === 0 && (
                        <Chip size="sm" color="danger" variant="flat">
                          Out of Stock
                        </Chip>
                      )}
                      {product.stockQuantity > 0 && product.stockQuantity < 10 && (
                        <Chip size="sm" color="warning" variant="flat">
                          Low Stock
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(product.costPrice)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={product.isActive ? 'success' : 'default'}
                      variant="flat"
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
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

export default ProductsReport;