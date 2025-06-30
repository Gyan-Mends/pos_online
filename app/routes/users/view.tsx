import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Card, 
  CardBody, 
  Button, 
  Badge,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab
} from '@heroui/react';
import { 
  ArrowLeft,
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Clock, 
  Mail,
  Phone,
  Calendar,
  Activity,
  Settings,
  Lock,
  Unlock,
  Crown,
  User as UserIcon,
  Key,
  AlertCircle
} from 'lucide-react';
import ConfirmModal from '../../components/confirmModal';
import { successToast, errorToast } from '../../components/toast';
import type { User } from '../../types';

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  permissions: string[];
}

const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'danger' as const, icon: Crown },
  { value: 'manager', label: 'Manager', color: 'warning' as const, icon: ShieldCheck },
  { value: 'cashier', label: 'Cashier', color: 'primary' as const, icon: UserIcon },
  { value: 'inventory', label: 'Inventory Clerk', color: 'secondary' as const, icon: Shield }
];

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'sales',
    name: 'Sales Operations',
    permissions: ['pos', 'customers', 'refunds']
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    permissions: ['inventory', 'products', 'categories', 'suppliers']
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    permissions: ['reports', 'analytics', 'export']
  },
  {
    id: 'admin',
    name: 'Administration',
    permissions: ['users', 'settings', 'audit', 'backup']
  }
];

export default function UserViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: 'delete' | 'deactivate' | 'activate' | 'resetPassword';
  }>({ open: false, action: 'delete' });

  // Mock data - replace with API calls
  const mockUser: User = {
    id: id!,
    firstName: 'Sarah',
    lastName: 'Manager',
    email: 'sarah.manager@pos.com',
    phone: '+1-555-0102',
    role: 'manager',
    permissions: ['pos', 'products', 'inventory', 'customers', 'reports'],
    isActive: true,
    createdAt: '2024-01-05T10:30:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
    lastLogin: '2024-01-14T14:22:00Z'
  };

  const mockActivityLogs: ActivityLog[] = [
    {
      id: '1',
      action: 'Login',
      details: 'Successful login to POS system',
      timestamp: '2024-01-14T14:22:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0'
    },
    {
      id: '2',
      action: 'Product Updated',
      details: 'Updated product "Wireless Headphones" - changed price from $79.99 to $69.99',
      timestamp: '2024-01-14T13:45:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: '3',
      action: 'Sale Processed',
      details: 'Processed sale #12345 for $156.50',
      timestamp: '2024-01-14T12:30:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: '4',
      action: 'Inventory Adjustment',
      details: 'Adjusted stock for "USB Cable" from 45 to 50 units',
      timestamp: '2024-01-14T11:15:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: '5',
      action: 'Profile Updated',
      details: 'Updated phone number',
      timestamp: '2024-01-13T16:45:00Z',
      ipAddress: '192.168.1.105'
    }
  ];

  useEffect(() => {
    loadUser();
    loadActivityLogs();
  }, [id]);

  const loadUser = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setUser(mockUser);
        setLoading(false);
      }, 500);
    } catch (error) {
      errorToast('Failed to load user details');
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setActivityLogs(mockActivityLogs);
      }, 600);
    } catch (error) {
      errorToast('Failed to load activity logs');
    }
  };

  const handleBack = () => {
    navigate('/users');
  };

  const handleEdit = () => {
    // Navigate back to users page with edit mode
    navigate('/users', { state: { editUser: user } });
  };

  const handleDelete = async () => {
    try {
      // API call to delete user
      successToast('User deleted successfully');
      navigate('/users');
    } catch (error) {
      errorToast('Failed to delete user');
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, isActive: !user.isActive };
      setUser(updatedUser);
      successToast(`User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmModal({ open: false, action: 'activate' });
    } catch (error) {
      errorToast('Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    try {
      // API call to reset password
      successToast('Password reset email sent successfully');
      setConfirmModal({ open: false, action: 'resetPassword' });
    } catch (error) {
      errorToast('Failed to reset password');
    }
  };

  const getRoleInfo = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[2];
  };

  const getPermissionsByGroup = (permissions: string[]) => {
    return PERMISSION_GROUPS.map(group => ({
      ...group,
      grantedPermissions: group.permissions.filter(p => permissions.includes(p))
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <UserIcon className="w-4 h-4" />;
      case 'logout':
        return <ArrowLeft className="w-4 h-4" />;
      case 'product updated':
      case 'inventory adjustment':
        return <Edit className="w-4 h-4" />;
      case 'sale processed':
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          User not found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          The user you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={handleBack}>
          Back to Users
        </Button>
      </div>
    );
  }

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              User Details & Activity
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={handleEdit}
            startContent={<Edit className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            color={user.isActive ? "warning" : "success"}
            onClick={() => setConfirmModal({ 
              open: true, 
              action: user.isActive ? 'deactivate' : 'activate' 
            })}
            startContent={user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            color="danger"
            onClick={() => setConfirmModal({ open: true, action: 'delete' })}
            startContent={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-6">
              <div className="text-center">
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  size="lg"
                  className="mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {user.email}
                </p>
                
                <div className="flex justify-center mb-4">
                  <Chip
                    color={roleInfo.color}
                    variant="flat"
                    startContent={<RoleIcon className="w-4 h-4" />}
                  >
                    {roleInfo.label}
                  </Chip>
                </div>

                <div className="flex justify-center mb-6">
                  <Badge color={user.isActive ? 'success' : 'default'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <Divider className="mb-4" />

                {/* Contact Information */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last login {formatDate(user.lastLogin)}
                      </span>
                    </div>
                  )}
                </div>

                <Divider className="my-4" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="flat"
                    color="warning"
                    startContent={<Key className="w-4 h-4" />}
                    onClick={() => setConfirmModal({ open: true, action: 'resetPassword' })}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-6">
              <Tabs 
                selectedKey={activeTab} 
                onSelectionChange={(key) => setActiveTab(key as string)}
              >
                <Tab key="overview" title="Overview">
                  <div className="space-y-6">
                    {/* Permissions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Permissions
                      </h3>
                      <div className="space-y-4">
                        {getPermissionsByGroup(user.permissions).map(group => (
                          <div key={group.id}>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              {group.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {group.permissions.map(permission => (
                                <div
                                  key={permission}
                                  className={`p-2 rounded-lg text-sm ${
                                    group.grantedPermissions.includes(permission)
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      group.grantedPermissions.includes(permission)
                                        ? 'bg-green-500'
                                        : 'bg-gray-400'
                                    }`} />
                                    <span className="capitalize">{permission.replace(/([A-Z])/g, ' $1')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Account Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Account Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            User ID
                          </label>
                          <p className="text-gray-900 dark:text-white font-mono">
                            {user.id}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Created
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Last Updated
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(user.updatedAt)}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Status
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab key="activity" title="Activity Log">
                  <div className="space-y-4">
                    {activityLogs.length > 0 ? (
                      <div className="space-y-4">
                        {activityLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {log.action}
                                </h4>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {log.details}
                              </p>
                              {log.ipAddress && (
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>IP: {log.ipAddress}</span>
                                  {log.userAgent && <span>Browser: {log.userAgent}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No activity logs available
                        </p>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: 'delete' })}
        onConfirm={() => {
          switch (confirmModal.action) {
            case 'delete':
              handleDelete();
              break;
            case 'deactivate':
            case 'activate':
              handleToggleStatus();
              break;
            case 'resetPassword':
              handleResetPassword();
              break;
          }
        }}
        title={
          confirmModal.action === 'delete' 
            ? 'Delete User'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate User'
            : confirmModal.action === 'activate'
            ? 'Activate User'
            : 'Reset Password'
        }
        message={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`
            : confirmModal.action === 'deactivate'
            ? `Are you sure you want to deactivate ${user.firstName} ${user.lastName}? They will not be able to log into the system.`
            : confirmModal.action === 'activate'
            ? `Are you sure you want to activate ${user.firstName} ${user.lastName}? They will be able to log into the system.`
            : `Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? A password reset email will be sent to ${user.email}.`
        }
        confirmText={
          confirmModal.action === 'delete' 
            ? 'Delete'
            : confirmModal.action === 'deactivate'
            ? 'Deactivate'
            : confirmModal.action === 'activate'
            ? 'Activate'
            : 'Reset Password'
        }
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
} 