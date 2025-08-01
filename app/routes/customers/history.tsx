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
  Avatar,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea
} from '@heroui/react';
import { 
  Users,
  UserPlus,
  Search,
  Calendar,
  DollarSign,
  ShoppingBag,
  Eye,
  RefreshCw,
  Package,
  Mail,
  Phone,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { customersAPI, salesAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import CustomInput from '../../components/CustomInput';
import ConfirmModal from '../../components/confirmModal';
import type { Customer } from '../../types';

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalItems: 0
  });

  // Form states
  const [formData, setFormData] = useState({
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
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
    loadCustomerStats();
  }, []);

  useEffect(() => {
    setCustomerStats(prev => ({
      ...prev,
      totalCustomers: customers.length
    }));
  }, [customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({ limit: 1000 });
      const customersData = (response as any)?.data || response || [];
      setCustomers(customersData);
    } catch (error) {
      errorToast('Failed to load customers');
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerStats = async () => {
    try {
      // Load sales data to calculate stats
      const salesResponse = await salesAPI.getAll({ limit: 10000 });
      const salesData = (salesResponse as any)?.data || salesResponse || [];
      
      const positiveSales = salesData.filter((sale: any) => (sale.totalAmount || 0) > 0);
      const totalPurchases = positiveSales.length;
      const totalRevenue = positiveSales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
      const totalItems = salesData.reduce((sum: number, sale: any) => sum + (sale.items?.length || 0), 0);
      
      setCustomerStats(prev => ({
        ...prev,
        totalPurchases,
        totalRevenue,
        totalItems
      }));
    } catch (error) {
      console.error('Error loading customer stats:', error);
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
      loadCustomerStats();
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
      loadCustomerStats();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete customer');
    }
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
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerInitials = (customer: Customer) => {
    if (!customer?.firstName || !customer?.lastName) return 'N/A';
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase();
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === '' || 
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive);
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (customer) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size="sm"
            name={getCustomerInitials(customer)}
            className="bg-blue-500 text-white"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {customer.email || 'No email'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (customer) => (
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center space-x-1 text-sm">
              <Phone className="w-3 h-3 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center space-x-1 text-sm">
              <Mail className="w-3 h-3 text-gray-400" />
              <span>{customer.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'purchases',
      title: 'Purchases',
      render: (customer) => (
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">
            {customer.totalPurchases || 0}
          </div>
          <div className="text-sm text-gray-500">orders</div>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      render: (customer) => (
        <div className="font-medium text-green-600">
          {formatCurrency(customer.totalSpent || 0)}
        </div>
      ),
    },
    {
      key: 'loyaltyPoints',
      title: 'Points',
      render: (customer) => (
        <div className="text-center">
          <Chip size="sm" color="secondary" variant="flat">
            {customer.loyaltyPoints || 0} pts
          </Chip>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (customer) => (
        <Chip 
          size="sm" 
          color={customer.isActive ? 'success' : 'danger'}
          variant="flat"
        >
          {customer.isActive ? 'Active' : 'Inactive'}
        </Chip>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (customer) => (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            as={Link}
            to={`/customers/view/${customer._id}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onClick={() => handleEdit(customer)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            color="danger"
            onClick={() => handleDeleteClick(customer)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer information and view purchase history
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            startContent={<RefreshCw className="w-4 h-4" />}
            variant="ghost"
            onPress={() => {
              loadCustomers();
              loadCustomerStats();
            }}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            startContent={<UserPlus className="w-4 h-4" />}
            onPress={onCreateOpen}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="customed-dark-card">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerStats.totalPurchases}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(customerStats.totalRevenue)}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerStats.totalItems}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="customed-dark-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Customer Management</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4" />}
                className="w-64"
              />
              <Select
                placeholder="Status"
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const status = Array.from(keys)[0] as string || 'all';
                  setStatusFilter(status);
                }}
                className="w-40"
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="inactive">Inactive</SelectItem>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <DataTable
            data={filteredCustomers}
            columns={columns}
            loading={loading}
            emptyText="No customers found"
            pageSize={10}
          />
        </CardBody>
      </Card>

      {/* Create Customer Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Add New Customer</ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                  required
                />
                <CustomInput
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                />
                <CustomInput
                  label="Phone"
                  placeholder="Enter phone number"
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
              <Textarea
                label="Notes"
                placeholder="Enter any notes about the customer"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onPress={onCreateClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Create Customer
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Edit Customer</ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                  required
                />
                <CustomInput
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                />
                <CustomInput
                  label="Phone"
                  placeholder="Enter phone number"
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
              <Textarea
                label="Notes"
                placeholder="Enter any notes about the customer"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onPress={onEditClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Update Customer
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteClose}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.firstName} ${customerToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
} 