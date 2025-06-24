import { Card, CardBody } from '@heroui/react';
import { Settings, Store, CreditCard, Receipt, Printer, Shield, Database, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure system settings, store information, and preferences
        </p>
      </div>

      {/* Settings Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Store Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Store Information</h3>
                <p className="text-sm text-gray-500">Business details, hours, contact info</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                <p className="text-sm text-gray-500">Configure payment processors</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Receipt Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Receipt Templates</h3>
                <p className="text-sm text-gray-500">Customize receipt layout</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Printer Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Printers</h3>
                <p className="text-sm text-gray-500">Configure receipt printers</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tax Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Tax Configuration</h3>
                <p className="text-sm text-gray-500">Set up tax rates and rules</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* User Management */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">User Management</h3>
                <p className="text-sm text-gray-500">Manage user accounts & roles</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
                <p className="text-sm text-gray-500">Password policies, 2FA settings</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Backup Settings */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Backup & Restore</h3>
                <p className="text-sm text-gray-500">Data backup configuration</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* System Preferences */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">System Preferences</h3>
                <p className="text-sm text-gray-500">General system settings</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Settings Card */}
      <Card>
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Sound Notifications</span>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Auto-backup</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Email Receipts</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Barcode Scanner</span>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 