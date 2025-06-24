import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Button, 
  Badge,
  Chip,
  Avatar,
  Tooltip
} from '@heroui/react';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  Users,
  Crown,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import CustomInput from '../../components/CustomInput';
import ConfirmModal from '../../components/confirmModal';
import { showSuccessToast, showErrorToast } from '../../components/toast';
import type { User } from '../../types';

const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'danger' as const, icon: Crown },
  { value: 'manager', label: 'Manager', color: 'warning' as const, icon: ShieldCheck },
  { value: 'cashier', label: 'Cashier', color: 'primary' as const, icon: User },
  { value: 'inventory', label: 'Inventory Clerk', color: 'secondary' as const, icon: Shield }
];

const USER_PERMISSIONS = [
  { id: 'pos', label: 'POS Operations', description: 'Process sales transactions' },
  { id: 'products', label: 'Product Management', description: 'Manage products and categories' },
  { id: 'inventory', label: 'Inventory Management', description: 'Manage stock levels and movements' },
  { id: 'customers', label: 'Customer Management', description: 'Manage customer information' },
  { id: 'reports', label: 'Reports & Analytics', description: 'View business reports' },
  { id: 'users', label: 'User Management', description: 'Manage system users' },
  { id: 'settings', label: 'System Settings', description: 'Configure system settings' }
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    user: User | null;
    action: 'delete' | 'deactivate' | 'activate';
  }>({ open: false, user: null, action: 'delete' });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'cashier',
    permissions: [] as string[],
    isActive: true,
    password: '',
    confirmPassword: ''
  });

  // Mock data - replace with API calls
  const mockUsers: User[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin@pos.com',
      phone: '+1-555-0101',
      role: 'admin',
      permissions: ['pos', 'products', 'inventory', 'customers', 'reports', 'users', 'settings'],
      isActive: true,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      lastLogin: new Date('2024-01-15T09:30:00').toISOString()
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Manager',
      email: 'sarah.manager@pos.com',
      phone: '+1-555-0102',
      role: 'manager',
      permissions: ['pos', 'products', 'inventory', 'customers', 'reports'],
      isActive: true,
      createdAt: new Date('2024-01-05').toISOString(),
      updatedAt: new Date('2024-01-14').toISOString(),
      lastLogin: new Date('2024-01-14T14:22:00').toISOString()
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Cashier',
      email: 'mike.cashier@pos.com',
      phone: '+1-555-0103',
      role: 'cashier',
      permissions: ['pos', 'customers'],
      isActive: true,
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-13').toISOString(),
      lastLogin: new Date('2024-01-13T16:45:00').toISOString()
    },
    {
      id: '4',
      firstName: 'Lisa',
      lastName: 'Inventory',
      email: 'lisa.inventory@pos.com',
      phone: '+1-555-0104',
      role: 'inventory',
      permissions: ['inventory', 'products'],
      isActive: false,
      createdAt: new Date('2024-01-08').toISOString(),
      updatedAt: new Date('2024-01-12').toISOString(),
      lastLogin: new Date('2024-01-10T11:20:00').toISOString()
    }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 500);
    } catch (error) {
      showErrorToast('Failed to load users');
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'cashier',
      permissions: [],
      isActive: true,
      password: '',
      confirmPassword: ''
    });
    setDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      password: '',
      confirmPassword: ''
    });
    setDrawerOpen(true);
  };

  const handleViewUser = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    if (!editingUser && (!formData.password || formData.password !== formData.confirmPassword)) {
      showErrorToast('Password and confirm password must match');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updatedUser: User = {
          ...editingUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role as User['role'],
          permissions: formData.permissions,
          isActive: formData.isActive,
          updatedAt: new Date().toISOString()
        };
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
        showSuccessToast('User updated successfully');
      } else {
        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role as User['role'],
          permissions: formData.permissions,
          isActive: formData.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUsers(prev => [...prev, newUser]);
        showSuccessToast('User created successfully');
      }
      setDrawerOpen(false);
    } catch (error) {
      showErrorToast('Failed to save user');
    }
  };

  const handleDelete = async (user: User) => {
    try {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccessToast('User deleted successfully');
      setConfirmModal({ open: false, user: null, action: 'delete' });
    } catch (error) {
      showErrorToast('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedUser = { ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      showSuccessToast(`User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmModal({ open: false, user: null, action: 'activate' });
    } catch (error) {
      showErrorToast('Failed to update user status');
    }
  };

  const getRoleInfo = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[2];
  };

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return USER_PERMISSIONS.map(p => p.id);
      case 'manager':
        return ['pos', 'products', 'inventory', 'customers', 'reports'];
      case 'cashier':
        return ['pos', 'customers'];
      case 'inventory':
        return ['inventory', 'products'];
      default:
        return [];
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            name={`${user.firstName} ${user.lastName}`}
            size="sm"
            className="flex-shrink-0"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => {
        const roleInfo = getRoleInfo(user.role);
        const IconComponent = roleInfo.icon;
        return (
          <Chip
            color={roleInfo.color}
            variant="flat"
            startContent={<IconComponent className="w-4 h-4" />}
          >
            {roleInfo.label}
          </Chip>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: User) => (
        <Badge color={user.isActive ? 'success' : 'default'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (user: User) => (
        <div className="text-sm">
          {user.lastLogin ? (
            <div>
              <div className="text-gray-900 dark:text-white">
                {new Date(user.lastLogin).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {new Date(user.lastLogin).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Never</span>
          )}
        </div>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (user: User) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.permissions.length} permissions
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Tooltip content="View Details">
            <Button
              variant="light"
              size="sm"
              onClick={() => handleViewUser(user)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Edit User">
            <Button
              variant="light"
              size="sm"
              onClick={() => handleEditUser(user)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content={user.isActive ? "Deactivate" : "Activate"}>
            <Button
              variant="light"
              size="sm"
              color={user.isActive ? "warning" : "success"}
              onClick={() => setConfirmModal({ 
                open: true, 
                user, 
                action: user.isActive ? 'deactivate' : 'activate' 
              })}
            >
              {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
          </Tooltip>
          <Tooltip content="Delete User">
            <Button
              variant="light"
              size="sm"
              color="danger"
              onClick={() => setConfirmModal({ open: true, user, action: 'delete' })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      )
    }
  ];

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Active Users',
      value: users.filter(u => u.isActive).length,
      icon: User,
      color: 'text-green-500'
    },
    {
      title: 'Administrators',
      value: users.filter(u => u.role === 'admin').length,
      icon: Crown,
      color: 'text-red-500'
    },
    {
      title: 'Inactive Users',
      value: users.filter(u => !u.isActive).length,
      icon: Lock,
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<UserPlus className="w-4 h-4" />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardBody>
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            searchable
            searchPlaceholder="Search users..."
            emptyState={{
              icon: Users,
              title: "No users found",
              description: "Get started by adding your first user."
            }}
          />
        </CardBody>
      </Card>

      {/* Add/Edit User Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <CustomInput
                label="Email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                required
              />
              <CustomInput
                label="Phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Role & Permissions
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {USER_ROLES.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <Button
                        key={role.value}
                        variant={formData.role === role.value ? "flat" : "ghost"}
                        color={formData.role === role.value ? role.color : "default"}
                        className="justify-start h-auto p-4"
                        onClick={() => handleRoleChange(role.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">{role.label}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {USER_PERMISSIONS.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {permission.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          {!editingUser && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                  required
                />
                <CustomInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
                  required
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">
                Active User
              </span>
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Inactive users cannot log into the system
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, user: null, action: 'delete' })}
        onConfirm={() => {
          if (confirmModal.user) {
            if (confirmModal.action === 'delete') {
              handleDelete(confirmModal.user);
            } else {
              handleToggleStatus(confirmModal.user);
            }
          }
        }}
        title={
          confirmModal.action === 'delete' 
            ? 'Delete User'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate User'
            : 'Activate User'
        }
        message={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? This action cannot be undone.`
            : confirmModal.action === 'deactivate'
            ? `Are you sure you want to deactivate ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will not be able to log into the system.`
            : `Are you sure you want to activate ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will be able to log into the system.`
        }
        confirmText={
          confirmModal.action === 'delete' 
            ? 'Delete'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate'
            : 'Activate'
        }
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
} 