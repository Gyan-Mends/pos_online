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
      
      // Process customer data to ensure proper structure and defaults
      const processedCustomers = Array.isArray(customersData) ? customersData.map((customer: any) => ({
        ...customer,
        _id: customer._id || customer.id,
        id: customer._id || customer.id,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        loyaltyPoints: customer.loyaltyPoints || 0,
        totalPurchases: customer.totalPurchases || 0,
        totalSpent: customer.totalSpent || 0,
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        address: customer.address || {},
        notes: customer.notes || ''
      })) : [];
      
      setCustomers(processedCustomers);
      
      if (processedCustomers.length === 0) {
        console.warn('⚠️ No customers found in response');
      } else {
        console.log('✅ Successfully loaded customers:', processedCustomers.length);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      errorToast('Failed to load customers: ' + (error as any)?.message);
      setCustomers([]); // Ensure customers is always an array
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
        resetForm();
        loadCustomers();
      }
    } catch (error: any) {
      errorToast(error.message || 'Failed to update customer');
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
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        zipCode: customer.address?.zipCode || '',
        country: customer.address?.country || ''
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
    if (!customer) return 'N/A';
    
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    
    if (!firstName && !lastName) return 'N/A';
    
    const firstInitial = firstName.charAt(0) || '';
    const lastInitial = lastName.charAt(0) || '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'N/A';
  };


  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (value, customer) => {
        if (!customer) return <div>Invalid customer data</div>;
        
        // Get customer details from the model
        const firstName = customer.firstName || '';
        const lastName = customer.lastName || '';
        const email = customer.email || '';
        const phone = customer.phone || '';
        
        return (
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              name={getCustomerInitials(customer)}
              className="bg-blue-500 text-white"
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">
                {`${firstName} ${lastName}`.trim() || 'N/A'}
              </span>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{email}</span>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'contact',
      title: 'Contact Info',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        const email = customer.email || '';
        const phone = customer.phone || '';
        const dateOfBirth = customer.dateOfBirth || '';
        
        return (
          <div className="flex flex-col gap-1 text-sm">
            
            {phone && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Phone className="w-3 h-3" />
                <span>{phone}</span>
              </div>
            )}
           
          </div>
        );
      }
    },
    {
      key: 'location',
      title: 'Location',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
                 // Get address details from the model
         const address = customer.address as any || {};
         const street = address.street || '';
         const city = address.city || '';
         const state = address.state || '';
         const zipCode = address.zipCode || '';
         const country = address.country || '';
        
        const addressParts = [street, city, state, zipCode, country].filter(Boolean);
        const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No address';
        
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span title={displayAddress}>
              {city && state ? `${city}, ${state}` : displayAddress}
            </span>
          </div>
        );
      }
    },
    {
      key: 'stats',
      title: 'Purchase Stats',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        // Get purchase stats from the model
        const totalPurchases = customer.totalPurchases || 0;
        const totalSpent = customer.totalSpent || 0;
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-sm">
              <ShoppingBag className="w-3 h-3 text-blue-500" />
              <span className="font-medium">{totalPurchases} orders</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="font-medium">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'loyalty',
      title: 'Loyalty',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        // Get loyalty points from the model
        const loyaltyPoints = customer.loyaltyPoints || 0;
        
        return (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="font-medium">{loyaltyPoints} pts</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        // Get status from the model (defaults to true)
        const isActive = customer.isActive !== undefined ? customer.isActive : true;
        
        return (
          <Chip 
            size="sm" 
            color={isActive ? 'success' : 'danger'}
            variant="flat"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Chip>
        );
      }
    },
    {
      key: 'timestamps',
      title: 'Created',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        // Get timestamps from the model
        const createdAt = customer.createdAt || '';
        const updatedAt = customer.updatedAt || '';
        
        return (
          <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
            {createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(createdAt)}</span>
              </div>
            )}
            {updatedAt && updatedAt !== createdAt && (
              <div className="flex items-center gap-1">
                <span className="text-xs">Updated: {formatDate(updatedAt)}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, customer) => {
        if (!customer) return <div>-</div>;
        
        return (
          <div className="flex gap-1">
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => handleView(customer)}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => handleEdit(customer)}
              title="Edit Customer"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              isIconOnly
              color="danger"
              onPress={() => handleDeleteClick(customer)}
              title="Delete Customer"
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
    total: customers.length,
    newThisMonth: customers.filter(c => {
      if (!c || !c.createdAt) return false;
      try {
        const createdDate = new Date(c.createdAt);
        const thisMonth = new Date();
        return createdDate.getMonth() === thisMonth.getMonth() && 
               createdDate.getFullYear() === thisMonth.getFullYear();
      } catch (error) {
        return false;
      }
    }).length,
    loyaltyMembers: customers.filter(c => c && (c.loyaltyPoints || 0) > 0).length,
    vipCustomers: customers.filter(c => c && (c.totalSpent || 0) > 1000).length
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
      <DataTable
        data={customers}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search customers by name, email, or phone..."
        emptyText="No customers found"
      />

      {/* Edit Customer Modal */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => {
          onEditClose();
          resetForm();
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              Edit Customer
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                  required
                />
                <CustomInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                />
                <CustomInput
                  label="Phone"
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                />
              </div>

              <CustomInput
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(value) => setFormData(prev => ({ ...prev, dateOfBirth: value }))}
              />

              <Divider />
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Address</h4>
                <CustomInput
                  label="Street Address"
                  value={formData.address?.street || ''}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address!, street: value }
                  }))}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    label="City"
                    value={formData.address?.city || ''}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, city: value }
                    }))}
                  />
                  <CustomInput
                    label="State"
                    value={formData.address?.state || ''}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, state: value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    label="Zip Code"
                    value={formData.address?.zipCode || ''}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, zipCode: value }
                    }))}
                  />
                  <CustomInput
                    label="Country"
                    value={formData.address?.country || ''}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, country: value }
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
                Update Customer
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
                            {[
                              selectedCustomer.address.street,
                              selectedCustomer.address.city,
                              selectedCustomer.address.state,
                              selectedCustomer.address.zipCode
                            ].filter(Boolean).join(', ') || 'No address'}
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