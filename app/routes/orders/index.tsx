import { useState, useEffect } from 'react';
import { Link, useNavigate, useLoaderData } from 'react-router';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Badge,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Tabs,
  Tab,
  Pagination,
  Textarea
} from '@heroui/react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Hash,
  MapPin,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

// Status color mapping
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
    case 'refunded': return 'danger';
    default: return 'default';
  }
};

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'normal': return 'primary';
    case 'low': return 'default';
    default: return 'default';
  }
};

// Status icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock;
    case 'confirmed': return CheckCircle;
    case 'processing': return Package;
    case 'packed': return Package;
    case 'shipped': return Truck;
    case 'out_for_delivery': return Truck;
    case 'delivered': return CheckCircle;
    case 'cancelled': return XCircle;
    case 'refunded': return XCircle;
    default: return Clock;
  }
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
    trackingNumber: '',
    estimatedDelivery: '',
    assignedTo: ''
  });

  // State for filtering and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`/api/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setOrders(result.data.orders);
        setStats(result.data.stats);
        setPagination(result.data.pagination);
      } else {
        console.error('Failed to load orders:', result.message);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, filters]);

  // Handle order update
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('orderId', selectedOrder._id);
      
      Object.entries(updateForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Update the order in the list
        setOrders(orders.map((order: any) => 
          order._id === selectedOrder._id ? result.data : order
        ));
        setSelectedOrder(result.data);
        setUpdateForm({
          status: '',
          notes: '',
          trackingNumber: '',
          estimatedDelivery: '',
          assignedTo: ''
        });
      } else {
        console.error('Failed to update order:', result.message);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage all orders from placement to delivery
          </p>
        </div>
        <Button color="primary" startContent={<Package />}>
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat: any) => {
          const StatusIcon = getStatusIcon(stat._id);
          return (
            <Card key={stat._id}>
              <CardBody className="flex flex-row items-center gap-3">
                <div className={`p-2 rounded-lg bg-${getStatusColor(stat._id)}-100`}>
                  <StatusIcon className={`w-6 h-6 text-${getStatusColor(stat._id)}-600`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {stat._id.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(stat.totalValue)}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
     
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              placeholder="Search orders..."
              startContent={<Search size={16} />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <SelectItem key="">All Statuses</SelectItem>
              <SelectItem key="pending">Pending</SelectItem>
              <SelectItem key="confirmed">Confirmed</SelectItem>
              <SelectItem key="processing">Processing</SelectItem>
              <SelectItem key="packed">Packed</SelectItem>
              <SelectItem key="shipped">Shipped</SelectItem>
              <SelectItem key="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem key="delivered">Delivered</SelectItem>
              <SelectItem key="cancelled">Cancelled</SelectItem>
            </Select>
            <Select
              placeholder="Priority"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <SelectItem key="">All Priorities</SelectItem>
              <SelectItem key="urgent">Urgent</SelectItem>
              <SelectItem key="high">High</SelectItem>
              <SelectItem key="normal">Normal</SelectItem>
              <SelectItem key="low">Low</SelectItem>
            </Select>
            <Select
              placeholder="Source"
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <SelectItem key="">All Sources</SelectItem>
              <SelectItem key="ecommerce">E-commerce</SelectItem>
              <SelectItem key="pos">POS</SelectItem>
              <SelectItem key="phone">Phone</SelectItem>
              <SelectItem key="email">Email</SelectItem>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        

      {/* Orders Table */}
    
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Table aria-label="Orders table " className='mt-6'> 
                <TableHeader>
                  <TableColumn>ORDER#</TableColumn>
                  <TableColumn>CUSTOMER</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>PRIORITY</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{order.orderNumber}</span>
                          <span className="text-sm text-gray-500 capitalize">
                            {order.source}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.customerInfo.firstName} {order.customerInfo.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {order.customerInfo.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color={getStatusColor(order.status)} variant="flat">
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Chip color={getPriorityColor(order.priority)} size="sm">
                          {order.priority.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Edit size={16} />}
                            onPress={() => {
                              setSelectedOrder(order);
                              setUpdateForm({
                                status: order.status,
                                notes: '',
                                trackingNumber: order.trackingNumber || '',
                                estimatedDelivery: order.estimatedDelivery 
                                  ? new Date(order.estimatedDelivery).toISOString().split('T')[0]
                                  : '',
                                assignedTo: order.assignedTo?._id || ''
                              });
                              onOpen();
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    total={pagination.totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
       

      {/* Order Details/Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">
                  Order {selectedOrder?.orderNumber}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge color={getStatusColor(selectedOrder?.status)} variant="flat">
                    {selectedOrder?.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Chip color={getPriorityColor(selectedOrder?.priority)} size="sm">
                    {selectedOrder?.priority?.toUpperCase()}
                  </Chip>
                </div>
              </ModalHeader>
              
              <ModalBody>
                {selectedOrder && (
                  <Tabs aria-label="Order details tabs">
                    <Tab key="details" title="Order Details">
                      <div className="space-y-6">
                        {/* Customer Info */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3">Customer Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <User size={16} />
                              <span>{selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={16} />
                              <span>{selectedOrder.customerInfo.email}</span>
                            </div>
                            {selectedOrder.customerInfo.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={16} />
                                <span>{selectedOrder.customerInfo.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3">Shipping Address</h4>
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="mt-1" />
                            <div>
                              <p>{selectedOrder.shippingAddress.fullName}</p>
                              <p>{selectedOrder.shippingAddress.address}</p>
                              <p>
                                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                              </p>
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
                                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatCurrency(item.unitPrice)} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3">Order Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(selectedOrder.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping:</span>
                              <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                              <span>Total:</span>
                              <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab>

                    <Tab key="tracking" title="Tracking">
                      <div className="space-y-6">
                        {/* Status History */}
                        <div>
                          <h4 className="font-semibold text-lg mb-3">Status History</h4>
                          <div className="space-y-3">
                            {selectedOrder.statusHistory?.map((history: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
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
                                        <p className="text-sm text-gray-600">{history.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                      <p>{formatDate(history.timestamp)}</p>
                                      {history.updatedBy && (
                                        <p>{history.updatedBy.firstName} {history.updatedBy.lastName}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tracking Info */}
                        {selectedOrder.trackingNumber && (
                          <div>
                            <h4 className="font-semibold text-lg mb-3">Tracking Information</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Tracking Number:</span>
                                <span className="font-mono">{selectedOrder.trackingNumber}</span>
                              </div>
                              {selectedOrder.estimatedDelivery && (
                                <div className="flex justify-between">
                                  <span>Estimated Delivery:</span>
                                  <span>{formatDate(selectedOrder.estimatedDelivery)}</span>
                                </div>
                              )}
                              {selectedOrder.actualDelivery && (
                                <div className="flex justify-between">
                                  <span>Delivered:</span>
                                  <span>{formatDate(selectedOrder.actualDelivery)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Tab>

                    <Tab key="update" title="Update Order">
                      <div className="space-y-4">
                        <Select
                          label="Status"
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <SelectItem key="pending">Pending</SelectItem>
                          <SelectItem key="confirmed">Confirmed</SelectItem>
                          <SelectItem key="processing">Processing</SelectItem>
                          <SelectItem key="packed">Packed</SelectItem>
                          <SelectItem key="shipped">Shipped</SelectItem>
                          <SelectItem key="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem key="delivered">Delivered</SelectItem>
                          <SelectItem key="cancelled">Cancelled</SelectItem>
                        </Select>

                        <Input
                          label="Tracking Number"
                          value={updateForm.trackingNumber}
                          onChange={(e) => setUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                        />

                        <Input
                          type="date"
                          label="Estimated Delivery"
                          value={updateForm.estimatedDelivery}
                          onChange={(e) => setUpdateForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                        />

                        <Textarea
                          label="Notes"
                          placeholder="Add notes about this status update..."
                          value={updateForm.notes}
                          onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                        />

                        <Button
                          color="primary"
                          onPress={handleUpdateOrder}
                          isLoading={isUpdating}
                          className="w-full"
                        >
                          Update Order
                        </Button>
                      </div>
                    </Tab>
                  </Tabs>
                )}
              </ModalBody>
              
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OrdersPage; 