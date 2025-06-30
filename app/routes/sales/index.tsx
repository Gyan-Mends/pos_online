import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab
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
import { successToast, errorToast } from '../../components/toast';
import { salesAPI } from '../../utils/api';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import CustomInput from '../../components/CustomInput';
import ConfirmModal from '../../components/confirmModal';
import type { Sale } from '../../types';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundItems, setRefundItems] = useState<any[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const { isOpen: isViewModalOpen, onOpen: openViewModal, onOpenChange: onViewModalChange } = useDisclosure();
  const { isOpen: isRefundModalOpen, onOpen: openRefundModal, onOpenChange: onRefundModalChange } = useDisclosure();
  const { isOpen: isConfirmRefundOpen, onOpen: openConfirmRefund, onOpenChange: onConfirmRefundChange } = useDisclosure();

  useEffect(() => {
    loadSales();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadSales();
  }, [startDate, endDate, statusFilter]);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
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
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    openViewModal();
  };

  const handleRefundSale = (sale: Sale) => {
    if (sale.status === 'refunded') {
      errorToast('This sale has already been fully refunded');
      return;
    }
    
    setSelectedSale(sale);
    // Initialize refund items with zero quantities
    setRefundItems(sale.items.map(item => ({
      productId: item.productId,
      product: item.product,
      originalQuantity: item.quantity,
      refundQuantity: 0,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType
    })));
    setRefundReason('');
    openRefundModal();
  };

  const updateRefundQuantity = (productId: string, quantity: number) => {
    setRefundItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, refundQuantity: Math.max(0, Math.min(quantity, item.originalQuantity)) }
        : item
    ));
  };

  const calculateRefundAmount = () => {
    return refundItems.reduce((total, item) => {
      if (item.refundQuantity > 0) {
        const itemTotal = item.unitPrice * item.refundQuantity;
        const itemDiscount = item.discountType === 'percentage' 
          ? (itemTotal * item.discount) / 100
          : item.discount * item.refundQuantity;
        return total + itemTotal - itemDiscount;
      }
      return total;
    }, 0);
  };

  const processRefund = async () => {
    if (!selectedSale || !currentUser) {
      errorToast('Missing required information');
      return;
    }

    const itemsToRefund = refundItems.filter(item => item.refundQuantity > 0);
    
    if (itemsToRefund.length === 0) {
      errorToast('Please select items to refund');
      return;
    }

    if (!refundReason.trim()) {
      errorToast('Please provide a refund reason');
      return;
    }

    try {
      setProcessingRefund(true);
      
      const refundData = {
        items: itemsToRefund.map(item => ({
          productId: item.productId,
          quantity: item.refundQuantity
        })),
        reason: refundReason,
        processedBy: currentUser._id || currentUser.id
      };

      await salesAPI.refund(selectedSale._id || selectedSale.id, refundData);
      
      successToast('Refund processed successfully');
      onRefundModalChange();
      onConfirmRefundChange();
      await loadSales(); // Reload sales to show updated status
      
    } catch (error: any) {
      errorToast(error.message || 'Failed to process refund');
      console.error('Refund error:', error);
    } finally {
      setProcessingRefund(false);
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewSale(sale)}
              startContent={<Eye className="w-4 h-4" />}
            >
              View
            </Button>
            {sale.status !== 'refunded' && sale.totalAmount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                color="warning"
                onClick={() => handleRefundSale(sale)}
                startContent={<RefreshCcw className="w-4 h-4" />}
              >
                Refund
              </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* View Sale Modal */}
      <Modal isOpen={isViewModalOpen} onOpenChange={onViewModalChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Sale Details - {selectedSale?.receiptNumber}</ModalHeader>
              <ModalBody>
                {selectedSale && (
                  <div className="space-y-4">
                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                        <p className="text-sm">{formatDate(selectedSale.saleDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                        <div className="mt-1">
                          <Chip 
                            color={getStatusColor(selectedSale.status)}
                            variant="flat"
                            startContent={getStatusIcon(selectedSale.status)}
                            size="sm"
                          >
                            {selectedSale.status.replace('_', ' ').toUpperCase()}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</label>
                        <p className="text-sm">
                          {selectedSale.customer 
                            ? `${selectedSale.customer.firstName} ${selectedSale.customer.lastName}`
                            : 'Walk-in Customer'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Seller</label>
                        <p className="text-sm">
                          {selectedSale.seller 
                            ? `${selectedSale.seller.firstName} ${selectedSale.seller.lastName}`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Items</label>
                      <div className="mt-2 space-y-2">
                        {selectedSale.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedSale.subtotal)}</span>
                        </div>
                        {selectedSale.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-{formatCurrency(selectedSale.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(selectedSale.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span className={selectedSale.totalAmount < 0 ? 'text-red-600' : 'text-green-600'}>
                            {selectedSale.totalAmount < 0 ? '-' : ''}{formatCurrency(selectedSale.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment</label>
                      <div className="mt-2 space-y-2">
                        {selectedSale.payments.map((payment, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium capitalize">{payment.method}</p>
                              <p className="text-sm text-gray-600">Status: {payment.status}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedSale.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                        <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{selectedSale.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                {selectedSale && selectedSale.status !== 'refunded' && selectedSale.totalAmount > 0 && (
                  <Button
                    color="warning"
                    onClick={() => {
                      onClose();
                      handleRefundSale(selectedSale);
                    }}
                    startContent={<RefreshCcw className="w-4 h-4" />}
                  >
                    Process Refund
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Refund Modal */}
      <Modal isOpen={isRefundModalOpen} onOpenChange={onRefundModalChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Process Refund - {selectedSale?.receiptNumber}</ModalHeader>
              <ModalBody>
                {selectedSale && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Processing a refund will restore inventory and update customer records. This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    {/* Items to Refund */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                        Select Items to Refund
                      </label>
                      <div className="space-y-3">
                        {refundItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                              <p className="text-sm text-gray-600">
                                Original: {item.originalQuantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <CustomInput
                                type="number"
                                placeholder="0"
                                value={item.refundQuantity.toString()}
                                onChange={(value) => updateRefundQuantity(item.productId, parseInt(value) || 0)}
                                min="0"
                                max={item.originalQuantity}
                                className="w-20"
                              />
                              <span className="text-sm text-gray-600">of {item.originalQuantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refund Reason */}
                    <CustomInput
                      label="Refund Reason"
                      placeholder="Enter reason for refund..."
                      value={refundReason}
                      onChange={setRefundReason}
                      required
                    />

                    {/* Refund Summary */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Refund Amount:</span>
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(calculateRefundAmount())}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  color="warning"
                  onClick={openConfirmRefund}
                  isDisabled={calculateRefundAmount() === 0 || !refundReason.trim()}
                  startContent={<RefreshCcw className="w-4 h-4" />}
                >
                  Process Refund
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Confirm Refund Modal */}
      <ConfirmModal
        isOpen={isConfirmRefundOpen}
        onOpenChange={onConfirmRefundChange}
        header="Confirm Refund"
        content={`Are you sure you want to process a refund of ${formatCurrency(calculateRefundAmount())}? This action cannot be undone.`}
      >
        <Button
          variant="ghost"
          onClick={onConfirmRefundChange}
        >
          Cancel
        </Button>
        <Button
          color="warning"
          onClick={processRefund}
          isLoading={processingRefund}
          startContent={<RefreshCcw className="w-4 h-4" />}
        >
          Process Refund
        </Button>
      </ConfirmModal>
    </div>
  );
} 