import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
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
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  ShoppingBag,
  Eye,
  RefreshCw,
  Package,
  Mail,
  Phone
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { customersAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import type { Customer, Sale } from '../../types';

export default function CustomerHistoryPage() {
  const { id: customerId } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
      loadPurchaseHistory();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      const response = await customersAPI.getById(customerId!);
      const customerData = (response as any)?.data || response;
      setCustomer(customerData);
    } catch (error) {
      errorToast('Failed to load customer details');
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getPurchaseHistory(customerId!);
      const salesData = (response as any)?.data || response || [];
      setPurchaseHistory(salesData);
    } catch (error) {
      errorToast('Failed to load purchase history');
      setPurchaseHistory([]);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCustomerInitials = (customer: Customer) => {
    if (!customer?.firstName || !customer?.lastName) return 'N/A';
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
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

  const filteredHistory = purchaseHistory.filter(sale => {
    const matchesSearch = searchQuery === '' || 
      sale.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Sale>[] = [
    {
      key: 'receiptNumber',
      title: 'Receipt #',
      render: (sale) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {sale.receiptNumber}
          </span>
          <span className="text-sm text-gray-500">
            {formatDateTime(sale.saleDate)}
          </span>
        </div>
      )
    },
    {
      key: 'items',
      title: 'Items',
      render: (sale) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-blue-500" />
          <span>{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (sale) => (
        <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (sale) => (
        <Chip 
          size="sm" 
          color={getStatusColor(sale.status)}
          variant="flat"
        >
          {sale.status.replace('_', ' ')}
        </Chip>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (sale) => (
        <Button 
          as={Link}
          to={`/sales/view/${sale._id}`}
          size="sm"
          variant="ghost"
          isIconOnly
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const stats = {
    totalOrders: filteredHistory.length,
    totalSpent: filteredHistory.reduce((sum, sale) => sum + sale.totalAmount, 0),
    averageOrderValue: filteredHistory.length > 0 
      ? filteredHistory.reduce((sum, sale) => sum + sale.totalAmount, 0) / filteredHistory.length 
      : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            as={Link} 
            to="/customers"
            variant="ghost"
            isIconOnly
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Purchase History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete purchase history and transaction details
            </p>
          </div>
        </div>
        <Button 
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={() => {
            loadCustomerData();
            loadPurchaseHistory();
          }}
        >
          Refresh
        </Button>
      </div>

      {customer && (
        <Card className="customed-dark-card">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <Avatar
                size="lg"
                name={getCustomerInitials(customer)}
                className="bg-blue-500 text-white"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {customer.firstName} {customer.lastName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(customer.totalSpent)} lifetime value</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="customed-dark-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase History</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search orders..."
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
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <DataTable
            data={filteredHistory}
            columns={columns}
            loading={loading}
            emptyText="No purchase history found"
          />
        </CardBody>
      </Card>
    </div>
  );
} 