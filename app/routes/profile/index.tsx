import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Input,
  Divider,
  Badge,
  Chip,
  Spinner,
  Switch
} from "@heroui/react";
import { successToast, errorToast } from '../../components/toast';
import { profileAPI } from '../../utils/api';
import type { User } from '../../types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    department: '',
    address: '',
    city: '',
    country: '',
    emailNotifications: true,
    smsNotifications: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = profileAPI.getProfile();
      if (userData) {
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          department: userData.department || '',
          address: userData.address || '',
          city: userData.city || '',
          country: userData.country || '',
          emailNotifications: userData.emailNotifications !== false,
          smsNotifications: userData.smsNotifications === true
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      errorToast('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await profileAPI.updateProfile(formData);
      
      if (response.data) {
        setUser(response.data);
      }
      setIsEditing(false);
      successToast('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      errorToast(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        department: user.department || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        emailNotifications: user.emailNotifications !== false,
        smsNotifications: user.smsNotifications === true
      });
    }
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'warning';
      case 'cashier':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'cashier':
        return 'Cashier';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <p className="text-gray-500 mb-4">User not found</p>
        <Button color="primary" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your personal information and account settings</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            color="primary"
            variant="flat"
            startContent={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            onClick={() => navigate('/profile/security')}
          >
            Security
          </Button>
          {!isEditing && (
            <Button
              color="primary"
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <Avatar 
                size="lg" 
                src={user.avatar || '/default-avatar.png'}
                name={`${user.firstName} ${user.lastName}`}
                className="w-16 h-16"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Chip
                    color={getRoleColor(user.role)}
                    size="sm"
                    variant="flat"
                  >
                    {getRoleLabel(user.role)}
                  </Chip>
                  <Badge color="success" variant="flat" size="sm">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  color="default"
                  variant="flat"
                  startContent={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  startContent={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                  onClick={handleSave}
                  isLoading={saving}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
            />
          </div>
          
          <div className="col-span-full">
            <Input
              label="Bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              isReadOnly={!isEditing}
              variant={isEditing ? "bordered" : "flat"}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Notification Preferences */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  isSelected={formData.emailNotifications}
                  onValueChange={(checked) => handleInputChange('emailNotifications', checked)}
                  isDisabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
                <Switch
                  isSelected={formData.smsNotifications}
                  onValueChange={(checked) => handleInputChange('smsNotifications', checked)}
                  isDisabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Member since</p>
                <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="font-medium">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 