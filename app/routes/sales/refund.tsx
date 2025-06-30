import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Input,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { 
  Search, 
  RefreshCcw, 
  Receipt,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { successToast, errorToast } from '../../components/toast';
import { salesAPI } from '../../utils/api';
import CustomInput from '../../components/CustomInput';
import ConfirmModal from '../../components/confirmModal';
import type { Sale } from '../../types';

export default function RefundPage() {
  const [searchParams] = useSearchParams();
  const [receiptNumber, setReceiptNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundItems, setRefundItems] = useState<any[]>([]);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onOpenChange: onConfirmChange } = useDisclosure();

  useEffect(() => {
    loadCurrentUser();
    
    // Check for receipt parameter in URL
    const receiptParam = searchParams.get('receipt');
    if (receiptParam) {
      setReceiptNumber(receiptParam);
      // Auto-search if receipt is provided in URL
      setTimeout(() => {
        if (receiptParam.trim()) {
          searchSaleByReceipt(receiptParam);
        }
      }, 100);
    }
  }, [searchParams]);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    console.log('📋 Loading user data from localStorage:', userData);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('✅ Parsed user data:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    } else {
      console.log('⚠️ No user data found in localStorage');
    }
  };

  const searchSale = async () => {
    if (!receiptNumber.trim()) {
      errorToast('Please enter a receipt number');
      return;
    }
    await searchSaleByReceipt(receiptNumber);
  };

  const searchSaleByReceipt = async (receipt: string) => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll({ limit: 1000 });
      const sales = (response as any)?.data || response || [];
      
      const foundSale = sales.find((s: Sale) => 
        s.receiptNumber.toLowerCase() === receipt.toLowerCase()
      );

      if (!foundSale) {
        errorToast('Sale not found with this receipt number');
        setSale(null);
        return;
      }

      if (foundSale.status === 'refunded') {
        errorToast('This sale has already been fully refunded');
        setSale(null);
        return;
      }

      if (foundSale.totalAmount <= 0) {
        errorToast('Cannot refund a refund transaction');
        setSale(null);
        return;
      }

      setSale(foundSale);
      
      // Initialize refund items
      setRefundItems(foundSale.items.map((item: any) => ({
        productId: item.productId._id || item.productId,
        product: item.product || item.productId,
        originalQuantity: item.quantity,
        refundQuantity: 0,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountType: item.discountType
      })));
      
      setRefundReason('');
      
    } catch (error) {
      errorToast('Failed to search for sale');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRefundQuantity = (productId: string, quantity: number) => {
    setRefundItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, refundQuantity: Math.max(0, Math.min(quantity, item.originalQuantity)) }
        : item
    ));
  };

  const selectAllItems = () => {
    setRefundItems(prev => prev.map(item => ({
      ...item,
      refundQuantity: item.originalQuantity
    })));
  };

  const clearAllItems = () => {
    setRefundItems(prev => prev.map(item => ({
      ...item,
      refundQuantity: 0
    })));
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
    if (!sale || !currentUser) {
      errorToast('Missing required information');
      console.error('Missing data:', { sale: !!sale, currentUser: !!currentUser });
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
          productId: typeof item.productId === 'object' ? item.productId._id || item.productId.id : item.productId,
          quantity: item.refundQuantity
        })),
        reason: refundReason,
        processedBy: currentUser._id || currentUser.id
      };

      console.log('🔄 Processing refund...');
      console.log('Sale ID:', sale._id || sale.id);
      console.log('Refund data:', refundData);
      console.log('Product IDs being sent:', refundData.items.map(item => ({ productId: item.productId, type: typeof item.productId })));
      console.log('API endpoint would be:', `/api/sales/${sale._id || sale.id}/refund`);

      const response = await salesAPI.refund(sale._id || sale.id, refundData);
      console.log('✅ Refund API response:', response);
      
      successToast('Refund processed successfully');
      
      // Reset form
      setReceiptNumber('');
      setSale(null);
      setRefundItems([]);
      setRefundReason('');
      onConfirmChange();
      
    } catch (error: any) {
      console.error('❌ Refund API error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      errorToast(error.response?.data?.message || error.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
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
      case 'partially_refunded': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/sales">
            <Button
              variant="ghost"
              startContent={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Sales
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Refund</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Search for a sale and process refunds for returned items
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardBody className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt Number
              </label>
              <div className="flex space-x-3">
                <CustomInput
                  placeholder="Enter receipt number (e.g., RCP-20231201-0001)"
                  value={receiptNumber}
                  onChange={setReceiptNumber}
                  className="flex-1"
                />
                <Button
                  color="primary"
                  onClick={searchSale}
                  isLoading={loading}
                  startContent={<Search className="w-4 h-4" />}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sale Details */}
      {sale && (
        <Card>
          <CardBody className="p-6">
            <div className="space-y-6">
              {/* Sale Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Receipt className="w-8 h-8 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {sale.receiptNumber}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(sale.saleDate)}
                    </p>
                  </div>
                </div>
                <Chip 
                  color={getStatusColor(sale.status)}
                  variant="flat"
                  size="lg"
                >
                  {sale.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </div>

              {/* Sale Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</label>
                  <p className="text-sm font-medium">
                    {sale.customer 
                      ? `${sale.customer.firstName} ${sale.customer.lastName}`
                      : 'Walk-in Customer'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</label>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(sale.totalAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method</label>
                  <p className="text-sm font-medium capitalize">
                    {sale.payments[0]?.method || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Warning for partial refunds */}
              {sale.status === 'partially_refunded' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This sale has been partially refunded. You can process additional refunds for remaining items.
                    </p>
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Items to Refund
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAllItems}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearAllItems}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {refundItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.product?.name || 'Unknown Product'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.product?.sku} • {formatCurrency(item.unitPrice)} each
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Original quantity: {item.originalQuantity}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Refund Quantity</p>
                          <CustomInput
                            type="number"
                            placeholder="0"
                            value={item.refundQuantity.toString()}
                            onChange={(value) => updateRefundQuantity(item.productId, parseInt(value) || 0)}
                            min="0"
                            max={item.originalQuantity}
                            className="w-20"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Refund Amount</p>
                          <p className="font-medium text-red-600">
                            {item.refundQuantity > 0 
                              ? formatCurrency(item.unitPrice * item.refundQuantity - 
                                  (item.discountType === 'percentage' 
                                    ? (item.unitPrice * item.refundQuantity * item.discount) / 100
                                    : item.discount * item.refundQuantity))
                              : '$0.00'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Reason */}
              <div>
                <CustomInput
                  label="Refund Reason"
                  placeholder="Enter reason for refund (e.g., defective product, customer request, etc.)"
                  value={refundReason}
                  onChange={setRefundReason}
                  required
                />
              </div>

              {/* Refund Summary */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200">Total Refund Amount</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {refundItems.filter(item => item.refundQuantity > 0).length} item(s) selected
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(calculateRefundAmount())}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSale(null);
                    setReceiptNumber('');
                    setRefundItems([]);
                    setRefundReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="warning"
                  onClick={openConfirm}
                  isDisabled={calculateRefundAmount() === 0 || !refundReason.trim()}
                  startContent={<RefreshCcw className="w-4 h-4" />}
                >
                  Process Refund
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Confirm Refund Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onOpenChange={onConfirmChange}
        header="Confirm Refund"
        content={
          <div className="space-y-2">
            <p>Are you sure you want to process this refund?</p>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm"><strong>Amount:</strong> {formatCurrency(calculateRefundAmount())}</p>
              <p className="text-sm"><strong>Items:</strong> {refundItems.filter(item => item.refundQuantity > 0).length}</p>
              <p className="text-sm"><strong>Reason:</strong> {refundReason}</p>
            </div>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
          </div>
        }
      >
        <Button
          variant="ghost"
          onClick={onConfirmChange}
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
