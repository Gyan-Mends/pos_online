import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip
} from '@heroui/react';
import { 
  Search, 
  Eye, 
  RefreshCcw, 
  Download, 
  Calendar,
  DollarSign,
  Receipt,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router';
import { errorToast } from '../../components/toast';
import { salesAPI } from '../../utils/api';
import DataTable from '../../components/DataTable';
import type { Sale } from '../../types';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    loadSales();
  }, [startDate, endDate, statusFilter, sourceFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      
      const response = await salesAPI.getAll(params);
      let salesData = (response as any)?.data || response || [];
      
      // Filter by status if needed
      if (statusFilter !== 'all') {
        salesData = salesData.filter((sale: Sale) => sale.status === statusFilter);
      }
      
      setSales(salesData);
    } catch (error) {
      errorToast('Failed to load sales history');
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'danger';
      case 'partially_refunded': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'refunded': return <XCircle className="w-4 h-4" />;
      case 'partially_refunded': return <AlertTriangle className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const columns = [
    {
      key: 'receiptNumber',
      title: 'Receipt #',
      render: (value: any, sale: Sale) => {
        if (!sale) return <span>-</span>;
        return (
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-sm">{sale.receiptNumber || '-'}</span>
          </div>
        );
      }
    },
    {
      key: 'saleDate',
      title: 'Date',
      render: (value: any, sale: Sale) => {
        if (!sale) return <span>-</span>;
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{sale.saleDate ? formatDate(sale.saleDate) : '-'}</span>
          </div>
        );
      }
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (value: any, sale: Sale) => {
        if (!sale) return <span>-</span>;
        return (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {sale.customer 
                ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim()
                : 'Walk-in Customer'
              }
            </span>
          </div>
        );
      }
    },
    {
      key: 'items',
      title: 'Items',
      render: (value: any, sale: Sale) => {
        if (!sale || !sale.items) return <span>-</span>;
        return (
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{sale.items.length} item(s)</span>
          </div>
        );
      }
    },
    {
      key: 'source',
      title: 'Source',
      render: (value: any, sale: Sale) => {
        if (!sale || !sale.source) return <span>-</span>;
        
        const getSourceColor = (source: string) => {
          switch (source) {
            case 'ecommerce': return 'primary';
            case 'pos': return 'success';
            case 'phone': return 'warning';
            case 'email': return 'secondary';
            default: return 'default';
          }
        };
        
        const getSourceIcon = (source: string) => {
          switch (source) {
            case 'ecommerce': return '🛒';
            case 'pos': return '🏪';
            case 'phone': return '📞';
            case 'email': return '📧';
            default: return '📋';
          }
        };
        
        return (
          <Chip 
            color={getSourceColor(sale.source)}
            variant="flat"
            size="sm"
            startContent={<span className="text-xs">{getSourceIcon(sale.source)}</span>}
          >
            {sale.source.replace('_', ' ').toUpperCase()}
          </Chip>
        );
      }
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (value: any, sale: Sale) => {
        if (!sale || sale.totalAmount === undefined) return <span>-</span>;
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-medium ${sale.totalAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {sale.totalAmount < 0 ? '-' : ''}{formatCurrency(sale.totalAmount)}
            </span>
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, sale: Sale) => {
        if (!sale || !sale.status) return <span>-</span>;
        return (
          <Chip 
            color={getStatusColor(sale.status)}
            variant="flat"
            startContent={getStatusIcon(sale.status)}
            size="sm"
          >
            {sale.status.replace('_', ' ').toUpperCase()}
          </Chip>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, sale: Sale) => {
        if (!sale) return <span>-</span>;
        return (
          <div className="flex space-x-2">
            <Link to={`/sales/view/${sale._id || sale.id}`}>
              <Button
                size="sm"
                variant="ghost"
                startContent={<Eye className="w-4 h-4" />}
              >
                View
              </Button>
            </Link>
            {sale.status !== 'refunded' && sale.totalAmount > 0 && (
              <Link to={`/sales/refund?receipt=${sale.receiptNumber}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  color="warning"
                  startContent={<RefreshCcw className="w-4 h-4" />}
                >
                  Refund
                </Button>
              </Link>
            )}
          </div>
        );
      }
    }
  ];

  const filteredSales = sales.filter(sale => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sale.receiptNumber.toLowerCase().includes(query) ||
      sale.customer?.firstName?.toLowerCase().includes(query) ||
      sale.customer?.lastName?.toLowerCase().includes(query) ||
      sale.notes?.toLowerCase().includes(query)
    );
  });

  // Calculate summary statistics
  const totalSales = filteredSales.filter(sale => sale.totalAmount > 0).length;
  const totalRefunds = filteredSales.filter(sale => sale.totalAmount < 0).length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all sales transactions and process refunds
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            color="secondary"
            variant="ghost"
            onClick={loadSales}
            startContent={<RefreshCcw className="w-4 h-4" />}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            variant="ghost"
            startContent={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
          <Link to="/sales/refund">
            <Button
              color="warning"
              startContent={<RefreshCcw className="w-4 h-4" />}
            >
              Process Refund
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRefunds}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <RefreshCcw className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Revenue</p>
                <p className={`text-2xl font-bold ${totalRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search by receipt, customer, or notes..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
            />
            
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onValueChange={setStartDate}
            />
            
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onValueChange={setEndDate}
            />
            
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="partially_refunded">Partially Refunded</SelectItem>
              <SelectItem key="refunded">Refunded</SelectItem>
            </Select>
            
            <Select
              label="Source"
              selectedKeys={[sourceFilter]}
              onSelectionChange={(keys) => setSourceFilter(Array.from(keys)[0] as string)}
            >
              <SelectItem key="all">All Sources</SelectItem>
              <SelectItem key="pos">🏪 POS (In-House)</SelectItem>
              <SelectItem key="ecommerce">🛒 E-Commerce</SelectItem>
              <SelectItem key="phone">📞 Phone Order</SelectItem>
              <SelectItem key="email">📧 Email Order</SelectItem>
              <SelectItem key="other">📋 Other</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardBody className="p-0">
          <DataTable
            data={filteredSales}
            columns={columns}
            loading={loading}
            emptyText="No sales found"
          />
        </CardBody>
      </Card>
    </div>
  );
} 