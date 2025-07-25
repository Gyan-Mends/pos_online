import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { 
  Card, 
  CardBody,
  Button,
  Chip,
  Divider
} from '@heroui/react';
import { 
  ArrowLeft,
  Receipt,
  User,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';
import { errorToast } from '../../components/toast';
import { salesAPI } from '../../utils/api';
import type { Sale } from '../../types';

export default function SaleViewPage() {
  const { id } = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSale(id);
    }
  }, [id]);

  const loadSale = async (saleId: string) => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(saleId);
      const saleData = (response as any)?.data || response;
      setSale(saleData);
    } catch (error) {
      errorToast('Failed to load sale details');
      console.error('Error loading sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'GH₵0.00';
    }
    return `GH₵${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'default';
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'danger';
      case 'partially_refunded': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Receipt className="w-4 h-4" />;
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'refunded': return <XCircle className="w-4 h-4" />;
      case 'partially_refunded': return <AlertTriangle className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (!method) return <CreditCard className="w-4 h-4" />;
    switch (method.toLowerCase()) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'refund': return <RefreshCcw className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const printReceipt = (sale: any) => {
    if (!sale) return;
    
    const receiptWindow = window.open('', '_blank', 'width=300,height=600');
    if (!receiptWindow) {
      alert('Unable to open print window. Please allow popups for this site.');
      return;
    }
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.receiptNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
            width: 280px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-name { flex: 1; }
          .item-price { text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-label { font-weight: bold; }
          .total-amount { font-weight: bold; text-align: right; }
          .header { margin-bottom: 10px; }
          .footer { margin-top: 10px; }
          @media print {
            body { width: auto; margin: 0; padding: 5px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="center bold header">
          <div>STORE RECEIPT</div>
          <div>Point of Sale System</div>
        </div>
        <div class="line"></div>
        
        <div>Receipt #: ${sale.receiptNumber || 'N/A'}</div>
        <div>Date: ${formatDate(sale.saleDate || sale.createdAt)}</div>
        <div>Customer: ${sale.customer 
          ? `${sale.customer.firstName} ${sale.customer.lastName}`
          : 'Walk-in Customer'}</div>
        <div>Seller: ${sale.seller 
          ? `${sale.seller.firstName} ${sale.seller.lastName}`
          : 'Unknown Seller'}</div>
        
        <div class="line"></div>
        
        <div class="bold">ITEMS:</div>
        ${(sale.items || []).map((item: any) => {
          const productName = item.product?.name || item.productId?.name || 'Unknown Item';
          const unitPrice = item.unitPrice || 0;
          const quantity = item.quantity || 0;
          const totalPrice = quantity * unitPrice;
          
          return `
          <div class="item-row">
            <div class="item-name">${productName}</div>
          </div>
          <div class="item-row">
            <div>${quantity} x ${formatCurrency(unitPrice)}</div>
            <div class="item-price">${formatCurrency(totalPrice)}</div>
          </div>
          ${item.discount > 0 ? `
          <div class="item-row">
            <div>Discount (${item.discountType === 'percentage' ? item.discount + '%' : formatCurrency(item.discount)})</div>
            <div class="item-price">-${formatCurrency(
              item.discountType === 'percentage' 
                ? (totalPrice * item.discount) / 100
                : item.discount * quantity
            )}</div>
          </div>
          ` : ''}
        `;
        }).join('')}
        
        <div class="line"></div>
        
        <div class="total-row">
          <div>Subtotal:</div>
          <div class="right">${formatCurrency(sale.subtotal || 0)}</div>
        </div>
        
        ${(sale.discountAmount || 0) > 0 ? `
          <div class="total-row">
            <div>Discount:</div>
            <div class="right">-${formatCurrency(sale.discountAmount)}</div>
          </div>
        ` : ''}
        
        <div class="total-row">
          <div>Tax:</div>
          <div class="right">${formatCurrency(sale.taxAmount || 0)}</div>
        </div>
        
        <div class="line"></div>
        
        <div class="total-row bold">
          <div class="total-label">TOTAL:</div>
          <div class="total-amount">${formatCurrency(sale.totalAmount || 0)}</div>
        </div>
        
        <div class="total-row">
          <div>Amount Paid:</div>
          <div class="right">${formatCurrency(sale.amountPaid || 0)}</div>
        </div>
        
        ${(sale.changeAmount || 0) > 0 ? `
          <div class="total-row">
            <div>Change:</div>
            <div class="right">${formatCurrency(sale.changeAmount)}</div>
          </div>
        ` : ''}
        
        <div class="line"></div>
        
        <div class="center footer">
          <div>Thank you for your business!</div>
          <div>Please come again</div>
        </div>
        
        <div class="center no-print" style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Receipt</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; margin-left: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    
    // Auto-focus the print window
    receiptWindow.focus();
    
    // Optional: Auto-print after a short delay
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sale Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The sale you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/sales">
            <Button color="primary">Back to Sales</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sale Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {sale.receiptNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            startContent={<Printer className="w-4 h-4" />}
            onClick={() => printReceipt(sale)}
          >
            Print Receipt
          </Button>
          {sale.status !== 'refunded' && sale.totalAmount > 0 && (
            <Link to={`/sales/refund?receipt=${sale.receiptNumber}`}>
              <Button
                color="warning"
                startContent={<RefreshCcw className="w-4 h-4" />}
              >
                Process Refund
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sale Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Header */}
          <div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
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
                  startContent={getStatusIcon(sale.status)}
                  size="lg"
                >
                  {sale.status ? sale.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                </Chip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {sale.customer 
                      ? `${sale.customer.firstName} ${sale.customer.lastName}`
                      : 'Walk-in Customer'
                    }
                  </p>
                  {sale.customer?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sale.customer.email}</p>
                  )}
                  {sale.customer?.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sale.customer.phone}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Seller</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {sale.seller 
                      ? `${sale.seller.firstName} ${sale.seller.lastName}`
                      : 'Unknown Seller'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Items ({sale.items?.length || 0})
                </h3>
              </div>

              <div className="space-y-3">
                {(sale.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 customed-dark-card !border-none shadow-sm rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {item.product?.sku || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Unit Price: {formatCurrency(item.unitPrice)}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-sm text-green-600 dark:text-green-400">
                            Discount: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          -{formatCurrency(
                            item.discountType === 'percentage' 
                              ? (item.quantity * item.unitPrice * item.discount) / 100
                              : item.discount * item.quantity
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

         
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                </div>
                
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span>-{formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium">{formatCurrency(sale.taxAmount)}</span>
                </div>
                
                <Divider />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className={sale.totalAmount < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}>
                    {sale.totalAmount < 0 ? '-' : ''}{formatCurrency(sale.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                  <span className="font-medium">{formatCurrency(sale.amountPaid)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transaction Details
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono">{sale._id || sale.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
                
                {sale.updatedAt !== sale.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                    <span>{formatDate(sale.updatedAt)}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

         {/* it comes here */}
          {/* Payment Information */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Information
                </h3>
              </div>

              <div className="space-y-3">
                {(sale.payments || []).map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPaymentMethodIcon(payment.method)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {payment.method}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {payment.status}
                        </p>
                        {payment.reference && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className={`font-medium ${payment.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {payment.amount < 0 ? '-' : ''}{formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {sale.changeAmount > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800 dark:text-green-200">Change Given:</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(sale.changeAmount)}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          {sale.notes && (
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {sale.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
