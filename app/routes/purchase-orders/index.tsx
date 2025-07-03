import { Card, CardBody } from "@heroui/react";

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage orders from suppliers with automated stock receiving
        </p>
      </div>
      
      <Card className="customed-dark-card">
        <CardBody className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              🚀 Purchase Orders System Ready!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your automated stock receiving system is fully configured with:
            </p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Create and manage purchase orders</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Automated stock level updates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Supplier management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Complete receiving workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Stock movement tracking</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Full UI coming soon! Backend APIs are ready for integration.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
