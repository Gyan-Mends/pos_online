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
  User as UserIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import CustomInput from '../../components/CustomInput';
import ConfirmModal from '../../components/confirmModal';
import { successToast, errorToast } from '../../components/toast';
import { usersAPI } from '../../utils/api';
import type { User } from '../../types';

const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'danger' as const, icon: Crown },
  { value: 'manager', label: 'Manager', color: 'warning' as const, icon: ShieldCheck },
  { value: 'cashier', label: 'Cashier', color: 'primary' as const, icon: UserIcon },
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
  const location = useLocation();
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

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle edit user from navigation state
  useEffect(() => {
    if (location.state?.editUser) {
      handleEditUser(location.state.editUser);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      // The API returns { success: true, data: users }
      // But apiRequest.get returns response.data, so we get the whole response object
      const usersData = (response as any)?.data || response || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      errorToast('Failed to load users');
      console.error('Error loading users:', error);
      setUsers([]); // Set empty array on error
    } finally {
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
    navigate(`/users/${user._id}`);
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      errorToast('Please fill in all required fields');
      return;
    }

    if (!editingUser && (!formData.password || formData.password !== formData.confirmPassword)) {
      errorToast('Password and confirm password must match');
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role as User['role'],
        permissions: formData.permissions,
        isActive: formData.isActive,
        ...(formData.password && { password: formData.password })
      };

      if (editingUser) {
        await usersAPI.update(editingUser._id, userData);
        successToast('User updated successfully');
      } else {
        await usersAPI.create(userData);
        successToast('User created successfully');
      }
      
      setDrawerOpen(false);
      loadUsers(); // Reload users after create/update
    } catch (error) {
      errorToast('Failed to save user');
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await usersAPI.delete(user._id);
      successToast('User deleted successfully');
      setConfirmModal({ open: false, user: null, action: 'delete' });
      loadUsers(); // Reload users after delete
    } catch (error) {
      errorToast('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersAPI.update(user._id, { isActive: !user.isActive });
      successToast(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmModal({ open: false, user: null, action: 'activate' });
      loadUsers(); // Reload users after status change
    } catch (error) {
      errorToast('Failed to update user status');
      console.error('Error updating user status:', error);
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
      title: 'User',
      render: (value: any, user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            name={`${user.firstName} ${user.lastName}`}
            size="sm"
            className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white"
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
      title: 'Role',
      render: (value: any, user: User) => {
        const roleInfo = getRoleInfo(user.role);
        const IconComponent = roleInfo.icon;
        return (
          <Chip
            color={roleInfo.color}
            variant="flat"
            startContent={<IconComponent className="w-4 h-4" />}
            className="font-medium"
          >
            {roleInfo.label}
          </Chip>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: any, user: User) => (
        <Chip
          color={user.isActive ? 'success' : 'default'}
          variant="flat"
          size="sm"
          className="font-medium"
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Chip>
      )
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      render: (value: any, user: User) => (
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
      title: 'Permissions',
      render: (value: any, user: User) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.permissions.length} permissions
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value: any, user: User) => (
        <div className="flex items-center space-x-2">
          <Tooltip content="View Details">
            <button
              onClick={() => handleViewUser(user)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Eye className="w-4 h-4 text-primary" />
            </button>
          </Tooltip>
          <Tooltip content="Edit User">
            <button
             
              onClick={() => handleEditUser(user)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
               <Edit className="w-4 h-4 text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content={user.isActive ? "Deactivate" : "Activate"}>
            <button
              onClick={() => setConfirmModal({ 
                open: true, 
                user, 
                action: user.isActive ? 'deactivate' : 'activate' 
              })}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              {user.isActive ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-success" />}
            </button>
          </Tooltip>
          <Tooltip content="Delete User">
            <button
                 
              onClick={() => setConfirmModal({ open: true, user, action: 'delete' })}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
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
      icon: UserIcon,
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
            <Card key={stat.title} className="border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
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
                  <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800">
                    <IconComponent className={`w-6 h-6 ${stat.color} dark:opacity-80`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search users..."
            emptyText="No users found. Get started by adding your first user."
          />
       

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
        onOpenChange={() => setConfirmModal({ open: false, user: null, action: 'delete' })}
        header={
          confirmModal.action === 'delete' 
            ? 'Delete User'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate User'
            : 'Activate User'
        }
        content={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? This action cannot be undone.`
            : confirmModal.action === 'deactivate'
            ? `Are you sure you want to deactivate ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will not be able to log into the system.`
            : `Are you sure you want to activate ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will be able to log into the system.`
        }
      >
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmModal({ open: false, user: null, action: 'delete' })}
          >
            Cancel
          </Button>
          <Button
            color={confirmModal.action === 'delete' ? 'danger' : 'warning'}
            onClick={() => {
              if (confirmModal.user) {
                if (confirmModal.action === 'delete') {
                  handleDelete(confirmModal.user);
                } else {
                  handleToggleStatus(confirmModal.user);
                }
              }
            }}
          >
            {confirmModal.action === 'delete' 
              ? 'Delete'
              : confirmModal.action === 'deactivate'
              ? 'Deactivate'
              : 'Activate'
            }
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 