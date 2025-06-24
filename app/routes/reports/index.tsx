import { Card, CardBody } from '@heroui/react';
import { BarChart3, TrendingUp, PieChart, FileText, Calendar, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Business insights, sales analytics, and performance reports
        </p>
      </div>

      {/* Quick Report Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Sales Reports</h3>
                <p className="text-sm text-gray-500">Daily, weekly & monthly sales</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Product Performance</h3>
                <p className="text-sm text-gray-500">Top selling products</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardBody className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Inventory Reports</h3>
                <p className="text-sm text-gray-500">Stock levels & movements</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Revenue Analysis</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Tax Reports</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">Profit & Loss</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operational Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">Employee Performance</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">Customer Analytics</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <PieChart className="w-5 h-5 text-indigo-500" />
                <span className="text-gray-700 dark:text-gray-300">Category Analysis</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Dashboard Placeholder */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
              <p>Coming Soon - Interactive charts and detailed reports</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 