import { Card, CardBody } from '@heroui/react';
import { Receipt, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage sales transactions, refunds, and receipts
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Sale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">$0.00</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Refunds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sales Table Placeholder */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sales History</h3>
              <p>Coming Soon - Sales transaction management and history</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 