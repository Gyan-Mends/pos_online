import { Card, CardBody } from '@heroui/react';
import { ShoppingCart, Calculator, CreditCard } from 'lucide-react';

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Process sales transactions and manage the cash register
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">POS Interface</h3>
                  <p>Coming Soon - Product selection and barcode scanning</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Cart and Payment Area */}
        <div className="space-y-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="font-medium">Shopping Cart</h3>
                  <p className="text-sm">Cart management</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="font-medium">Payment</h3>
                  <p className="text-sm">Payment processing</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
} 