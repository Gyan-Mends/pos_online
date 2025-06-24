import { useState } from 'react';
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
  Edit, 
  Shield, 
  ShieldCheck, 
  Clock, 
  Mail,
  Phone,
  Calendar,
  Crown,
  User as UserIcon,
  Key,
  Settings,
  Bell
} from 'lucide-react';
import CustomInput from '../../components/CustomInput';
import { showSuccessToast, showErrorToast } from '../../components/toast';

// Mock current user data
const currentUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Admin',
  email: 'admin@pos.com',
  phone: '+1-555-0101',
  role: 'admin' as const,
  permissions: ['pos', 'products', 'inventory', 'customers', 'reports', 'users', 'settings'],
  isActive: true,
  createdAt: '2024-01-01T10:30:00Z',
  updatedAt: '2024-01-15T09:15:00Z',
  lastLogin: '2024-01-15T14:22:00Z'
};

const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'danger' as const, icon: Crown },
  { value: 'manager', label: 'Manager', color: 'warning' as const, icon: ShieldCheck },
  { value: 'cashier', label: 'Cashier', color: 'primary' as const, icon: UserIcon },
  { value: 'inventory', label: 'Inventory Clerk', color: 'secondary' as const, icon: Shield }
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    phone: currentUser.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    language: 'en',
    timezone: 'UTC-5'
  });

  const getRoleInfo = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[2];
  };

  const handleSaveProfile = async () => {
    try {
      // API call to update profile
      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      showErrorToast('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      showErrorToast('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showErrorToast('New passwords do not match');
      return;
    }

    try {
      // API call to change password
      showSuccessToast('Password changed successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      showErrorToast('Failed to change password');
    }
  };

  const handleSavePreferences = async () => {
    try {
      // API call to save preferences
      showSuccessToast('Preferences saved successfully');
    } catch (error) {
      showErrorToast('Failed to save preferences');
    }
  };

  const roleInfo = getRoleInfo(currentUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-6">
              <div className="text-center">
                <Avatar
                  name={`${currentUser.firstName} ${currentUser.lastName}`}
                  size="lg"
                  className="mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {currentUser.email}
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
                  <Badge color="success">Active</Badge>
                </div>

                <Divider className="mb-4" />

                {/* Account Stats */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Last login {new Date(currentUser.lastLogin).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentUser.permissions.length} permissions
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-6">
              <Tabs 
                selectedKey={activeTab} 
                onSelectionChange={(key) => setActiveTab(key as string)}
              >
                <Tab key="profile" title="Profile">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Personal Information
                      </h3>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditing(!isEditing)}
                        startContent={<Edit className="w-4 h-4" />}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomInput
                        label="First Name"
                        value={formData.firstName}
                        onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                        disabled={!isEditing}
                      />
                      <CustomInput
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                        disabled={!isEditing}
                      />
                      <CustomInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                        disabled={!isEditing}
                      />
                      <CustomInput
                        label="Phone"
                        value={formData.phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-4">
                        <Button
                          variant="ghost"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}

                    <Divider />

                    {/* Current Permissions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Current Permissions
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {currentUser.permissions.map(permission => (
                          <div
                            key={permission}
                            className="p-2 rounded-lg text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="capitalize">{permission}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab key="security" title="Security">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Change Password
                    </h3>
                    
                    <div className="space-y-4">
                      <CustomInput
                        label="Current Password"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(value) => setFormData(prev => ({ ...prev, currentPassword: value }))}
                        placeholder="Enter current password"
                      />
                      <CustomInput
                        label="New Password"
                        type="password"
                        value={formData.newPassword}
                        onChange={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
                        placeholder="Enter new password"
                      />
                      <CustomInput
                        label="Confirm New Password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        color="primary"
                        onClick={handleChangePassword}
                        startContent={<Key className="w-4 h-4" />}
                      >
                        Update Password
                      </Button>
                    </div>

                    <Divider />

                    {/* Security Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Security Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Account Status
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            <Badge color="success">Secure</Badge>
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Two-Factor Authentication
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            <Badge color="default">Not Enabled</Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab key="preferences" title="Preferences">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notification Preferences
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Email Notifications
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive notifications via email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            emailNotifications: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Push Notifications
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Receive push notifications in browser
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.pushNotifications}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            pushNotifications: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Sound Alerts
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Play sounds for notifications and alerts
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.soundEnabled}
                          onChange={(e) => setPreferences(prev => ({ 
                            ...prev, 
                            soundEnabled: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    <Divider />

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        System Preferences
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Language
                          </label>
                          <select
                            value={preferences.language}
                            onChange={(e) => setPreferences(prev => ({ 
                              ...prev, 
                              language: e.target.value 
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Timezone
                          </label>
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences(prev => ({ 
                              ...prev, 
                              timezone: e.target.value 
                            }))}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="UTC-8">Pacific Time (UTC-8)</option>
                            <option value="UTC-5">Eastern Time (UTC-5)</option>
                            <option value="UTC+0">GMT (UTC+0)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        color="primary"
                        onClick={handleSavePreferences}
                        startContent={<Settings className="w-4 h-4" />}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
} 