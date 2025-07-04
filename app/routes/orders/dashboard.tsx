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

// Order status progression
const STATUS_PROGRESSION = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'warning' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'primary' },
  { key: 'processing', label: 'Processing', icon: Package, color: 'secondary' },
  { key: 'packed', label: 'Packed', icon: Package, color: 'success' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'primary' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'warning' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'success' }
];

const getStatusProgress = (status: string) => {
  const index = STATUS_PROGRESSION.findIndex(s => s.key === status);
  return index >= 0 ? ((index + 1) / STATUS_PROGRESSION.length) * 100 : 0;
};

const getStatusColor = (status: string) => {
  const statusInfo = STATUS_PROGRESSION.find(s => s.key === status);
  return statusInfo?.color || 'default';
};

const OrderTrackingDashboard = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    total: 0
  });

  // Load orders and stats
  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '50',
        status: statusFilter,
        search: searchQuery
      });

      const response = await fetch(`/api/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data.orders);
        
        // Calculate stats
        const statusCounts = result.data.stats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {});
        
        setStats({
          pending: (statusCounts.pending || 0) + (statusCounts.confirmed || 0),
          processing: (statusCounts.processing || 0) + (statusCounts.packed || 0),
          shipped: (statusCounts.shipped || 0) + (statusCounts.out_for_delivery || 0),
          delivered: statusCounts.delivered || 0,
          total: result.data.pagination.total
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  // Quick status update
  const quickUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('orderId', orderId);
      formData.append('status', newStatus);
      formData.append('notes', `Status updated to ${newStatus.replace('_', ' ')}`);

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setOrders(orders.map((order: any) => 
          order._id === orderId ? result.data : order
        ));
        loadData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get next status
  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_PROGRESSION.findIndex(s => s.key === currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_PROGRESSION.length - 1) {
      return STATUS_PROGRESSION[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Tracking Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time order fulfillment pipeline
          </p>
        </div>
        <Button 
          color="primary"
          onPress={() => navigate('/orders')}
          startContent={<Eye />}
        >
          View All Orders
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-blue-600">Pending Orders</div>
          </CardBody>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
            <div className="text-sm text-orange-600">Processing</div>
          </CardBody>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <div className="text-sm text-purple-600">In Transit</div>
          </CardBody>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-green-600">Delivered</div>
          </CardBody>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-900/20">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search orders..."
          startContent={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="">All Statuses</option>
          {STATUS_PROGRESSION.map(status => (
            <option key={status.key} value={status.key}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Pipeline */}
      <Card>
        <CardBody>
          <h3 className="text-xl font-bold mb-4">Order Fulfillment Pipeline</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 20).map((order: any) => (
                <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-lg">{order.orderNumber}</div>
                      <Badge color={getStatusColor(order.status)} variant="flat">
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Chip color="default" size="sm">
                        {order.source.toUpperCase()}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Eye size={16} />}
                        onPress={() => {
                          setSelectedOrder(order);
                          onOpen();
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-6 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-1">
                        <Hash size={14} />
                        <span className="font-mono">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Order Progress</span>
                      <span>{Math.round(getStatusProgress(order.status))}%</span>
                    </div>
                    <Progress 
                      value={getStatusProgress(order.status)} 
                      color={getStatusColor(order.status) as any}
                      size="sm"
                    />
                  </div>

                  {/* Status Timeline */}
                  <div className="flex items-center gap-2 mb-3">
                    {STATUS_PROGRESSION.map((statusInfo, index) => {
                      const StatusIcon = statusInfo.icon;
                      const isActive = STATUS_PROGRESSION.findIndex(s => s.key === order.status) >= index;
                      const isCurrent = statusInfo.key === order.status;
                      
                      return (
                        <div key={statusInfo.key} className="flex items-center">
                          <div className={`p-2 rounded-full ${
                            isActive 
                              ? `bg-${statusInfo.color}-100 text-${statusInfo.color}-600` 
                              : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-2 ring-offset-2 ring-' + statusInfo.color + '-500' : ''}`}>
                            <StatusIcon size={16} />
                          </div>
                          {index < STATUS_PROGRESSION.length - 1 && (
                            <div className={`w-8 h-0.5 ${
                              isActive ? `bg-${statusInfo.color}-300` : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const nextStatus = getNextStatus(order.status);
                      return nextStatus && order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => quickUpdateStatus(order._id, nextStatus.key)}
                          isLoading={isUpdating}
                          startContent={<nextStatus.icon size={14} />}
                        >
                          Mark as {nextStatus.label}
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>
              ))}
              
              {orders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">Order {selectedOrder?.orderNumber}</h3>
                  <Badge color={getStatusColor(selectedOrder?.status)} variant="flat">
                    {selectedOrder?.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </ModalHeader>
              
              <ModalBody>
                {selectedOrder && (
                  <div className="space-y-6">
                    {/* Status History */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Status History</h4>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory?.map((history: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`p-1 rounded-full bg-${getStatusColor(history.status)}-100`}>
                              <div className={`w-2 h-2 rounded-full bg-${getStatusColor(history.status)}-600`}></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium capitalize">
                                {history.status.replace('_', ' ')}
                              </p>
                              {history.notes && (
                                <p className="text-sm text-gray-600">{history.notes}</p>
                              )}
                              <p className="text-sm text-gray-500">{formatDate(history.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-lg mb-3">Customer</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Name:</strong> {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</p>
                          <p><strong>Email:</strong> {selectedOrder.customerInfo.email}</p>
                          {selectedOrder.customerInfo.phone && (
                            <p><strong>Phone:</strong> {selectedOrder.customerInfo.phone}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-3">Shipping Address</h4>
                        <div className="text-sm">
                          <p>{selectedOrder.shippingAddress.fullName}</p>
                          <p>{selectedOrder.shippingAddress.address}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                          <p>{selectedOrder.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => navigate(`/orders`)}
                >
                  Edit Order
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OrderTrackingDashboard; 