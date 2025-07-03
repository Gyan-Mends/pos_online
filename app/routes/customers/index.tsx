import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Divider,
  Avatar
} from '@heroui/react';
import { 
  Users, 
  UserPlus, 
  Heart, 
  Star, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Plus,
  UserX
} from 'lucide-react';
import { Link } from 'react-router';
import { successToast, errorToast } from '../../components/toast';
import { customersAPI, salesAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import CustomInput from '../../components/CustomInput';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import type { Customer, CustomerFormData, Sale } from '../../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Sale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    dateOfBirth: '',
    notes: ''
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading customers...');
      
      const response = await customersAPI.getAll({ limit: 1000 });
      console.log('📥 API Response:', response);
      
      const customersData = (response as any)?.data || response || [];
      console.log('👥 Customers Data:', customersData);
      console.log('📊 Number of customers:', customersData.length);
      
      setCustomers(customersData);
      
      if (customersData.length === 0) {
        console.warn('⚠️ No customers found in response');
      } else {
        console.log('✅ Successfully loaded customers:', customersData.length);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      errorToast('Failed to load customers: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async (customerId: string) => {
    try {
      setLoadingHistory(true);
      const response = await customersAPI.getPurchaseHistory(customerId);
      const salesData = (response as any)?.data || response || [];
      setPurchaseHistory(salesData);
    } catch (error) {
      errorToast('Failed to load purchase history');
      console.error('Error loading purchase history:', error);
      setPurchaseHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      errorToast('First name and last name are required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingCustomer) {
        await customersAPI.update(editingCustomer._id, formData);
        successToast('Customer updated successfully');
        onEditClose();
      } else {
        await customersAPI.create(formData);
        successToast('Customer created successfully');
        onCreateClose();
      }
      
      resetForm();
      loadCustomers();
    } catch (error: any) {
      errorToast(error.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      await customersAPI.delete(customerToDelete._id);
      successToast('Customer deleted successfully');
      onDeleteClose();
      setCustomerToDelete(null);
      loadCustomers();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete customer');
    }
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadPurchaseHistory(customer._id);
    onViewOpen();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      dateOfBirth: customer.dateOfBirth || '',
      notes: customer.notes || ''
    });
    onEditOpen();
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    onDeleteOpen();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      dateOfBirth: '',
      notes: ''
    });
    setEditingCustomer(null);
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

  const getCustomerInitials = (customer: Customer) => {
    if (!customer || !customer.firstName || !customer.lastName) {
      return 'N/A';
    }
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
  };

  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    const searchTerm = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchTerm) ||
      customer.lastName?.toLowerCase().includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  });

  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (customer) => {
        if (!customer) return <div>Invalid customer data</div>;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              name={getCustomerInitials(customer)}
              className="bg-blue-500 text-white"
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">
                {customer.firstName || 'N/A'} {customer.lastName || 'N/A'}
              </span>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {customer.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'location',
      title: 'Location',
      render: (customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>
              {customer.address && customer.address.city && customer.address.state ? 
                `${customer.address.city}, ${customer.address.state}` : 
                'No address'
              }
            </span>
          </div>
        );
      }
    },
    {
      key: 'stats',
      title: 'Purchase Stats',
      render: (customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-sm">
              <ShoppingBag className="w-3 h-3 text-blue-500" />
              <span className="font-medium">{customer.totalPurchases || 0} orders</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="font-medium">{formatCurrency(customer.totalSpent || 0)}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'loyalty',
      title: 'Loyalty',
      render: (customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="font-medium">{customer.loyaltyPoints || 0} pts</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <Chip 
            size="sm" 
            color={customer.isActive ? 'success' : 'danger'}
            variant="flat"
          >
            {customer.isActive ? 'Active' : 'Inactive'}
          </Chip>
        );
      }
    },
    {
      key: 'joined',
      title: 'Joined',
      render: (customer) => {
        if (!customer || !customer.createdAt) return <div>-</div>;
        
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(customer.createdAt)}</span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <div className="flex gap-1">
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => handleView(customer)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => handleEdit(customer)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              color="danger"
              onPress={() => handleDeleteClick(customer)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  // Calculate summary stats with null checks
  const stats = {
    total: filteredCustomers.length,
    newThisMonth: filteredCustomers.filter(c => {
      if (!c || !c.createdAt) return false;
      const createdDate = new Date(c.createdAt);
      const thisMonth = new Date();
      return createdDate.getMonth() === thisMonth.getMonth() && 
             createdDate.getFullYear() === thisMonth.getFullYear();
    }).length,
    loyaltyMembers: filteredCustomers.filter(c => c && (c.loyaltyPoints || 0) > 0).length,
    vipCustomers: filteredCustomers.filter(c => c && (c.totalSpent || 0) > 1000).length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer relationships and track purchase history
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              resetForm();
              onCreateOpen();
            }}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loyalty Members</p>
                <p className="text-2xl font-bold text-red-600">{stats.loyaltyMembers}</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP Customers</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.vipCustomers}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="customed-dark-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customers</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4" />}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <DataTable
            data={filteredCustomers}
            columns={columns}
            loading={loading}
            emptyText="No customers found"
          />
        </CardBody>
      </Card>

      {/* Create/Edit Customer Modal */}
      <Modal 
        isOpen={isCreateOpen || isEditOpen} 
        onClose={() => {
          onCreateClose();
          onEditClose();
          resetForm();
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <CustomInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <CustomInput
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <CustomInput
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />

              <Divider />
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Address</h4>
                <CustomInput
                  label="Street Address"
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address!, street: e.target.value }
                  }))}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    label="City"
                    value={formData.address?.city || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, city: e.target.value }
                    }))}
                  />
                  <CustomInput
                    label="State"
                    value={formData.address?.state || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, state: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    label="Zip Code"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, zipCode: e.target.value }
                    }))}
                  />
                  <CustomInput
                    label="Country"
                    value={formData.address?.country || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, country: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <Textarea
                label="Notes"
                placeholder="Additional notes about the customer..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                minRows={3}
              />
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={() => {
                  onCreateClose();
                  onEditClose();
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={isSubmitting}
              >
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Customer Details Modal */}
      <Modal 
        isOpen={isViewOpen} 
        onClose={onViewClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Customer Details
          </ModalHeader>
          <ModalBody className="space-y-6">
            {selectedCustomer && (
              <>
                {/* Customer Info */}
                <div className="flex items-start gap-4">
                  <Avatar
                    size="lg"
                    name={getCustomerInitials(selectedCustomer)}
                    className="bg-blue-500 text-white"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h3>
                    <div className="space-y-2 mt-2">
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Customer Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="customed-dark-card">
                    <CardBody className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <ShoppingBag className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedCustomer.totalPurchases}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                    </CardBody>
                  </Card>

                  <Card className="customed-dark-card">
                    <CardBody className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                    </CardBody>
                  </Card>

                  <Card className="customed-dark-card">
                    <CardBody className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Heart className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedCustomer.loyaltyPoints}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loyalty Points</p>
                    </CardBody>
                  </Card>
                </div>

                <Divider />

                {/* Purchase History */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Purchase History
                  </h4>
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Loading purchase history...</p>
                    </div>
                  ) : purchaseHistory.length > 0 ? (
                    <div className="space-y-3">
                      {purchaseHistory.slice(0, 5).map((sale) => (
                        <Card key={sale._id} className="customed-dark-card">
                          <CardBody className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  Order #{sale.receiptNumber}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(sale.saleDate)} • {sale.items.length} items
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(sale.totalAmount)}
                                </p>
                                <Chip 
                                  size="sm" 
                                  color={sale.status === 'completed' ? 'success' : 'warning'}
                                  variant="flat"
                                >
                                  {sale.status}
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                      {purchaseHistory.length > 5 && (
                        <div className="text-center">
                          <Button 
                            as={Link}
                            to={`/customers/${selectedCustomer._id}/history`}
                            variant="ghost" 
                            size="sm"
                          >
                            View All ({purchaseHistory.length} total)
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No purchase history found</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteClose}
        header="Delete Customer"
        content={`Are you sure you want to delete ${customerToDelete?.firstName} ${customerToDelete?.lastName}? This action cannot be undone.`}
      >
        <div className="flex gap-2">
          <Button 
            color="danger" 
            variant="light" 
            onPress={onDeleteClose}
          >
            Cancel
          </Button>
          <Button 
            color="danger" 
            onPress={handleDelete}
          >
            Delete Customer
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 