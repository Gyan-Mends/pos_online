import { Card, CardBody, CardHeader } from "@heroui/react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to POS Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's an overview of your point of sale system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $2,847.32
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                +12.5% from yesterday
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Orders
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  156
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                +8.2% from yesterday
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customers
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,247
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                +3.1% from yesterday
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Inventory Items
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  892
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                -2.1% from yesterday
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-4">
              {[
                { id: "#1001", customer: "John Doe", amount: "$45.99", time: "2 min ago" },
                { id: "#1002", customer: "Jane Smith", amount: "$123.45", time: "5 min ago" },
                { id: "#1003", customer: "Bob Wilson", amount: "$67.89", time: "12 min ago" },
                { id: "#1004", customer: "Alice Brown", amount: "$89.99", time: "18 min ago" },
              ].map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.customer}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Order {transaction.id} • {transaction.time}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Products
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-4">
              {[
                { name: "Coffee Blend Premium", sales: 45, revenue: "$450.00" },
                { name: "Organic Tea Selection", sales: 32, revenue: "$320.00" },
                { name: "Artisan Pastries", sales: 28, revenue: "$280.00" },
                { name: "Fresh Sandwiches", sales: 23, revenue: "$230.00" },
              ].map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.sales} sold
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {product.revenue}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "New Sale", icon: "💰", color: "bg-green-500" },
              { name: "Add Product", icon: "📦", color: "bg-blue-500" },
              { name: "View Reports", icon: "📊", color: "bg-purple-500" },
              { name: "Manage Inventory", icon: "📋", color: "bg-orange-500" },
            ].map((action) => (
              <button
                key={action.name}
                className={`p-6 ${action.color} rounded-lg text-white hover:opacity-90 transition-opacity`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.name}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
