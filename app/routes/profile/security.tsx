import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Divider,
  Switch,
  Chip,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import { successToast, errorToast } from '../../components/toast';
import { profileAPI } from '../../utils/api';
import type { User } from '../../types';

export default function ProfileSecurityPage() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordChangeRequired: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = profileAPI.getProfile();
      if (userData) {
        setUser(userData);
        setSecuritySettings({
          twoFactorEnabled: userData.twoFactorEnabled || false,
          loginNotifications: userData.loginNotifications !== false,
          sessionTimeout: userData.sessionTimeout || 30,
          passwordChangeRequired: userData.passwordChangeRequired || false
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      errorToast('Failed to load user data');
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      errorToast('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errorToast('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      errorToast('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      successToast('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      errorToast(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingChange = async (setting: string, value: boolean | number) => {
    try {
      const updatedSettings = { ...securitySettings, [setting]: value };
      setSecuritySettings(updatedSettings);
      
      // Update user profile with new security settings
      await profileAPI.updateProfile(updatedSettings);
      successToast('Security settings updated');
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      errorToast(error.message || 'Failed to update security settings');
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: 'None', color: 'default' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'danger' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'warning' };
    if (strength <= 4) return { strength, label: 'Good', color: 'success' };
    return { strength, label: 'Strong', color: 'success' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <p className="text-gray-500 mb-4">User not found</p>
        <Button color="primary" onClick={() => navigate('/profile')}>
          Go to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account security and password</p>
          </div>
        </div>
        <Button
          color="primary"
          variant="flat"
          onClick={() => navigate('/profile')}
          startContent={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }
        >
          Back to Profile
        </Button>
      </div>

      {/* Password Security */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Security</h2>
                <p className="text-gray-600 dark:text-gray-400">Keep your account secure with a strong password</p>
              </div>
            </div>
            <Button
              color="primary"
              onClick={onOpen}
              startContent={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                </svg>
              }
            >
              Change Password
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Last Password Change</p>
              <p className="font-medium">{user.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString() : 'Never'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Password Strength</p>
              <div className="flex items-center space-x-2">
                <Chip color="success" size="sm" variant="flat">Strong</Chip>
                <p className="text-sm text-gray-500">Regular updates recommended</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Password Requirements</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
              <li>• Contains at least one special character</li>
              <li>• Different from previous passwords</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Preferences</h2>
              <p className="text-gray-600 dark:text-gray-400">Configure your account security settings</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  isSelected={securitySettings.twoFactorEnabled}
                  onValueChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                />
                {securitySettings.twoFactorEnabled && (
                  <Badge color="success" size="sm">Enabled</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login Notifications</p>
                <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
              </div>
              <Switch
                isSelected={securitySettings.loginNotifications}
                onValueChange={(checked) => handleSecuritySettingChange('loginNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Password Change</p>
                <p className="text-sm text-gray-500">Force password change on next login</p>
              </div>
              <Switch
                isSelected={securitySettings.passwordChangeRequired}
                onValueChange={(checked) => handleSecuritySettingChange('passwordChangeRequired', checked)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-gray-600 dark:text-gray-400">Monitor your account activity</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Security Tip</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Regularly review your account activity and change your password every 90 days. 
              Enable two-factor authentication for maximum security.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Password Change Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Change Password</h2>
            <p className="text-sm text-gray-500">Enter your current password and choose a new one</p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Current Password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
              
              <Input
                label="New Password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
              
              {passwordData.newPassword && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Password Strength:</span>
                  <Chip color={passwordStrength.color as any} size="sm" variant="flat">
                    {passwordStrength.label}
                  </Chip>
                </div>
              )}
              
              <Input
                label="Confirm New Password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
              
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handlePasswordChange}
              isLoading={loading}
              isDisabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
            >
              Change Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 