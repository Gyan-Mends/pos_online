import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Avatar
} from '@heroui/react';
import { 
  Search,
  Calendar,
  DollarSign,
  ShoppingBag,
  Eye,
  RefreshCw,
  Package,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { salesAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import type { Sale } from '../../types';

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading all purchase history...');
      
      const response = await salesAPI.getAll({ limit: 1000 });
      console.log('📥 Sales API Response:', response);
      
      const salesData = (response as any)?.data || response || [];
      console.log('💰 Purchase Data:', salesData);
      console.log('🔍 Sample sale structure:', salesData[0]);
      
      setPurchases(salesData);
      
      if (salesData.length === 0) {
        console.warn('⚠️ No purchases found in response');
      } else {
        console.log('✅ Successfully loaded purchases:', salesData.length);
      }
    } catch (error) {
      console.error('❌ Error loading purchases:', error);
      errorToast('Failed to load purchase history: ' + (error as any)?.message);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerInitials = (customer: any) => {
    if (!customer || (!customer.firstName && !customer.lastName)) return 'G';
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
    }
    return (customer.firstName || customer.lastName || 'Guest').charAt(0).toUpperCase();
  };

  const getCustomerName = (customer: any) => {
    if (!customer) return 'Guest Customer';
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer.firstName || customer.lastName || 'Guest Customer';
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

  // Filter purchases
  const filteredPurchases = purchases.filter(sale => {
    // Check if sale exists first
    if (!sale) return false;
    
    const customerName = getCustomerName(sale.customer);
    const matchesSearch = searchQuery === '' || 
      (sale.receiptNumber && sale.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && sale.saleDate) {
      const saleDate = new Date(sale.saleDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saleDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const columns: Column<Sale>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (sale) => {
        if (!sale) return <div>Invalid sale data</div>;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              name={getCustomerInitials(sale.customer)}
              className="bg-blue-500 text-white"
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">
                {getCustomerName(sale.customer)}
              </span>
              <span className="text-sm text-gray-500">
                Receipt #{sale.receiptNumber || 'N/A'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'date',
      title: 'Purchase Date',
      render: (sale) => {
        if (!sale) return <div>-</div>;
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">
              {sale.saleDate ? formatDate(sale.saleDate) : 'N/A'}
            </span>
            <span className="text-sm text-gray-500">
              {sale.saleDate ? new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'items',
      title: 'Items',
      render: (sale) => {
        if (!sale) return <div>-</div>;
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}</span>
            </div>
            {sale.items?.slice(0, 2).map((item: any, index: number) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                {item.quantity}x {item.product?.name || item.productId?.name || 'Unknown Product'}
              </div>
            ))}
            {(sale.items?.length || 0) > 2 && (
              <div className="text-sm text-gray-500">
                +{(sale.items?.length || 0) - 2} more...
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (sale) => {
        if (!sale) return <span>$0.00</span>;
        
        return (
          <span className="font-medium text-lg">{formatCurrency(sale.totalAmount || 0)}</span>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (sale) => {
        if (!sale) return <Chip size="sm" color="default" variant="flat">-</Chip>;
        
        return (
          <Chip 
            size="sm" 
            color={getStatusColor(sale.status || 'completed')}
            variant="flat"
          >
            {(sale.status || 'completed').replace('_', ' ')}
          </Chip>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (sale) => {
        if (!sale || !sale._id) return <div>-</div>;
        
        return (
          <Button 
            as={Link}
            to={`/sales/view/${sale._id}`}
            size="sm"
            variant="ghost"
            isIconOnly
          >
            <Eye className="w-4 h-4" />
          </Button>
        );
      }
    }
  ];

  // Calculate summary stats
  const stats = {
    totalPurchases: filteredPurchases.length,
    totalRevenue: filteredPurchases.reduce((sum, sale) => {
      if (!sale) return sum;
      return sum + (sale.totalAmount || 0);
    }, 0),
    totalItems: filteredPurchases.reduce((sum, sale) => {
      if (!sale || !sale.items) return sum;
      return sum + (sale.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    }, 0),
    uniqueCustomers: new Set(filteredPurchases.map(sale => {
      if (!sale) return null;
      return sale.customerId || sale.customer?._id;
    }).filter(Boolean)).size
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete purchase history across all customers
          </p>
        </div>
        <Button 
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={loadPurchases}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPurchases}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.uniqueCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="customed-dark-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Purchase History</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search purchases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4" />}
                className="w-64"
              />
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <SelectItem key="all" value="all">All Status</SelectItem>
                <SelectItem key="completed" value="completed">Completed</SelectItem>
                <SelectItem key="pending" value="pending">Pending</SelectItem>
                <SelectItem key="refunded" value="refunded">Refunded</SelectItem>
              </Select>
              <Select
                placeholder="Date Range"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              >
                <SelectItem key="all" value="all">All Time</SelectItem>
                <SelectItem key="today" value="today">Today</SelectItem>
                <SelectItem key="week" value="week">Last 7 Days</SelectItem>
                <SelectItem key="month" value="month">Last 30 Days</SelectItem>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <DataTable
            data={filteredPurchases}
            columns={columns}
            loading={loading}
            emptyText="No purchase history found"
          />
        </CardBody>
      </Card>
    </div>
  );
} 
