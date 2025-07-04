import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Card,
  CardBody,
  Input,
  Badge,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Progress
} from '@heroui/react';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Hash,
  Eye
} from 'lucide-react';

// This is a simplified version focused on tracking
const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTrackOrder = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders?search=${encodeURIComponent(searchQuery)}&limit=1`);
      const result = await response.json();

      if (result.success && result.data.orders.length > 0) {
        setTrackingResult(result.data.orders[0]);
      } else {
        setTrackingResult(null);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'processing': return 'secondary';
      case 'packed': return 'success';
      case 'shipped': return 'primary';
      case 'out_for_delivery': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Order Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your order using order number, email, or tracking number
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="Enter order number, email, or tracking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
              className="flex-1"
            />
            <Button
              color="primary"
              onPress={handleTrackOrder}
              isLoading={loading}
              startContent={<Search size={16} />}
            >
              Track Order
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tracking Result */}
      {trackingResult && (
        <Card>
          <CardBody>
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{trackingResult.orderNumber}</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Placed on {formatDate(trackingResult.orderDate)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge color={getStatusColor(trackingResult.status)} variant="flat" className="mb-2">
                    {trackingResult.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-xl font-bold">{formatCurrency(trackingResult.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {trackingResult.customerInfo.firstName} {trackingResult.customerInfo.lastName}</p>
                    <p><strong>Email:</strong> {trackingResult.customerInfo.email}</p>
                    {trackingResult.customerInfo.phone && (
                      <p><strong>Phone:</strong> {trackingResult.customerInfo.phone}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Shipping Address:</strong></p>
                    <p>{trackingResult.shippingAddress.fullName}</p>
                    <p>{trackingResult.shippingAddress.address}</p>
                    <p>{trackingResult.shippingAddress.city}, {trackingResult.shippingAddress.state} {trackingResult.shippingAddress.zipCode}</p>
                  </div>
                </div>
              </div>

              {/* Tracking Number */}
              {trackingResult.trackingNumber && (
                <div>
                  <h3 className="font-semibold mb-2">Tracking Information</h3>
                  <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {trackingResult.trackingNumber}
                  </p>
                </div>
              )}

              {/* Status History */}
              <div>
                <h3 className="font-semibold mb-3">Order Status History</h3>
                <div className="space-y-3">
                  {trackingResult.statusHistory?.map((history: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-1 rounded-full bg-${getStatusColor(history.status)}-100`}>
                        <div className={`w-2 h-2 rounded-full bg-${getStatusColor(history.status)}-600`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">
                              {history.status.replace('_', ' ')}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{history.notes}</p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(history.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-2">
                  {trackingResult.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  color="primary"
                  onPress={() => navigate('/orders/dashboard')}
                  startContent={<Eye size={16} />}
                >
                  View in Dashboard
                </Button>
                <Button
                  variant="flat"
                  onPress={() => navigate('/orders')}
                >
                  All Orders
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* No Results */}
      {!loading && searchQuery && !trackingResult && (
        <Card>
          <CardBody className="text-center py-8">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Order Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No order found with the provided information. Please check your order number, email, or tracking number.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default OrderTrackingPage;