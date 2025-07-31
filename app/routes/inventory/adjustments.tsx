import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Divider,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react';
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  Package, 
  Search,
  Save,
  Clock,
  Settings,
  Trash2,
  RotateCcw,
  Truck
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { productsAPI, stockMovementsAPI } from '../../utils/api';
import { useStockMonitoring } from '../../hooks/useStockMonitoring';
import type { Product, StockMovementFormData } from '../../types';

interface AdjustmentItem {
  id: string;
  product: Product;
  adjustmentType: 'adjustment' | 'damage' | 'expired' | 'transfer' | 'return';
  quantity: number;
  reason: string;
  notes?: string;
}

const adjustmentTypes = [
  { key: 'adjustment', label: 'Stock Adjustment', icon: Settings, color: 'primary' as const },
  { key: 'damage', label: 'Damaged Items', icon: AlertTriangle, color: 'danger' as const },
  { key: 'expired', label: 'Expired Items', icon: Clock, color: 'warning' as const },
  { key: 'transfer', label: 'Transfer Out', icon: Truck, color: 'secondary' as const },
  { key: 'return', label: 'Return to Stock', icon: RotateCcw, color: 'success' as const }
];

const commonReasons = {
  adjustment: [
    'Physical count discrepancy',
    'System error correction',
    'Opening stock entry',
    'Inventory reconciliation'
  ],
  damage: [
    'Water damage',
    'Physical damage during handling',
    'Manufacturing defect',
    'Customer damage before sale'
  ],
  expired: [
    'Past expiration date',
    'Quality control failure',
    'Batch recall',
    'Spoilage'
  ],
  transfer: [
    'Transfer to another location',
    'Return to supplier',
    'Promotional samples',
    'Staff training samples'
  ],
  return: [
    'Customer return - unused',
    'Customer return - defective',
    'Supplier credit return',
    'Found missing inventory'
  ]
};

export default function InventoryAdjustmentsPage() {
  const { checkStockAfterInventoryChange } = useStockMonitoring();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<string>('adjustment');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 1000 });
      const productsData = (response as any)?.data || response || [];
      setProducts(productsData.map((p: any) => ({
        ...p,
        id: p._id || p.id
      })));
    } catch (error) {
      errorToast('Failed to load products');
    }
  };

  const handleAddAdjustment = () => {
    if (!selectedProduct || !quantity || !reason) {
      errorToast('Please fill in all required fields');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum === 0) {
      errorToast('Please enter a valid quantity');
      return;
    }

    // Check if we have enough stock for negative adjustments
    if (quantityNum < 0 && Math.abs(quantityNum) > selectedProduct.stockQuantity) {
      errorToast(`Cannot remove ${Math.abs(quantityNum)} items. Only ${selectedProduct.stockQuantity} in stock.`);
      return;
    }

    const newAdjustment: AdjustmentItem = {
      id: Date.now().toString(),
      product: selectedProduct,
      adjustmentType: adjustmentType as any,
      quantity: quantityNum,
      reason,
      notes: notes.trim() || undefined
    };

    setAdjustmentItems([...adjustmentItems, newAdjustment]);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity('');
    setReason('');
    setNotes('');
    setSearchValue('');
    
    successToast('Adjustment added to batch');
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.id !== id));
  };

  const handleProcessBatch = async () => {
    if (adjustmentItems.length === 0) {
      errorToast('No adjustments to process');
      return;
    }

    setProcessingBatch(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user._id && !user.id) {
        errorToast('User not found. Please log in again.');
        setProcessingBatch(false);
        return;
      }

      for (const item of adjustmentItems) {
        try {
          const movementData: StockMovementFormData = {
            productId: item.product._id || item.product.id,
            type: item.adjustmentType,
            quantity: item.quantity,
            notes: `${item.reason}${item.notes ? ` - ${item.notes}` : ''}`,
            userId: user._id || user.id
          };

          await stockMovementsAPI.create(movementData);
          
          // Check stock immediately after adjustment
          await checkStockAfterInventoryChange(item.product._id || item.product.id);
          
          successCount++;
        } catch (error) {
          console.error('Error processing adjustment:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        successToast(`Successfully processed ${successCount} adjustment${successCount > 1 ? 's' : ''}`);
        setAdjustmentItems([]);
      }

      if (errorCount > 0) {
        errorToast(`Failed to process ${errorCount} adjustment${errorCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      errorToast('Failed to process batch');
    } finally {
      setProcessingBatch(false);
    }
  };

  const getAdjustmentTypeInfo = (type: string) => {
    return adjustmentTypes.find(t => t.key === type) || adjustmentTypes[0];
  };

  const formatQuantity = (quantity: number, type: string) => {
    const isPositive = quantity > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={`font-medium ${color}`}>
        {sign}{quantity}
      </span>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Adjustments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Make manual stock adjustments for discrepancies, damage, and corrections
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-2">
          <Card className="customed-dark-card">
            <CardHeader className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Stock Adjustment
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Product Selection */}
              <div>
                <Autocomplete
                  label="Select Product"
                  placeholder="Search by name or SKU..."
                  selectedKey={selectedProduct?.id || null}
                  onSelectionChange={(key) => {
                    const product = products.find(p => p.id === key || p._id === key);
                    setSelectedProduct(product || null);
                  }}
                  inputValue={searchValue}
                  onInputChange={setSearchValue}
                  isRequired
                  variant="bordered"
                  startContent={<Search className="w-4 h-4 text-gray-400" />}
                >
                  {filteredProducts.map((product) => (
                    <AutocompleteItem key={product.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.name}</div>
                        </div>
                       
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {selectedProduct.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedProduct.stockQuantity} {selectedProduct.unitOfMeasure}
                      </p>
                      <p className="text-sm text-gray-500">Current Stock</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Type */}
              <div>
                <Select
                  label="Adjustment Type"
                  placeholder="Select adjustment type"
                  selectedKeys={[adjustmentType]}
                  onSelectionChange={(keys) => {
                    const type = Array.from(keys)[0] as string;
                    setAdjustmentType(type);
                    setReason(''); // Reset reason when type changes
                  }}
                  isRequired
                  variant="bordered"
                >
                  {adjustmentTypes.map((type) => (
                    <SelectItem key={type.key}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <Input
                  type="number"
                  label="Quantity"
                  placeholder="Enter quantity (use negative for reductions)"
                  value={quantity}
                  onValueChange={setQuantity}
                  isRequired
                  variant="bordered"
                  description="Use positive numbers to add stock, negative to remove stock"
                  startContent={
                    quantity && parseInt(quantity) > 0 ? 
                      <Plus className="w-4 h-4 text-green-500" /> : 
                      <Minus className="w-4 h-4 text-red-500" />
                  }
                />
              </div>

              {/* Reason */}
              <div>
                <Select
                  label="Reason"
                  placeholder="Select or enter reason"
                  selectedKeys={reason ? [reason] : []}
                  onSelectionChange={(keys) => {
                    const selectedReason = Array.from(keys)[0] as string;
                    setReason(selectedReason);
                  }}
                  isRequired
                  variant="bordered"
                >
                  {commonReasons[adjustmentType as keyof typeof commonReasons]?.map((reasonText) => (
                    <SelectItem key={reasonText}>
                      {reasonText}
                    </SelectItem>
                  ))}
                </Select>
                
                {/* Custom reason input */}
                <Input
                  className="mt-2"
                  placeholder="Or enter custom reason..."
                  value={reason}
                  onValueChange={setReason}
                  variant="bordered"
                />
              </div>

              {/* Notes */}
              <div>
                <Textarea
                  label="Additional Notes"
                  placeholder="Optional additional details..."
                  value={notes}
                  onValueChange={setNotes}
                  variant="bordered"
                  minRows={2}
                />
              </div>

              {/* Add Button */}
              <div className="flex justify-end">
                <Button
                  color="primary"
                  onClick={handleAddAdjustment}
                  startContent={<Plus className="w-4 h-4" />}
                  isDisabled={!selectedProduct || !quantity || !reason}
                >
                  Add to Batch
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Adjustment Batch */}
        <div>
          <Card className="customed-dark-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Adjustment Batch
                </h3>
                <Chip size="sm" variant="flat" color="primary">
                  {adjustmentItems.length} items
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              {adjustmentItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No adjustments added yet
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add items to create a batch
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adjustmentItems.map((item) => {
                    const typeInfo = getAdjustmentTypeInfo(item.adjustmentType);
                    return (
                      <div
                        key={item.id}
                        className="p-3 customed-dark-card rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              SKU: {item.product.sku}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Chip
                                size="sm"
                                color={typeInfo.color}
                                variant="flat"
                                startContent={<typeInfo.icon className="w-3 h-3" />}
                              >
                                {typeInfo.label}
                              </Chip>
                              {formatQuantity(item.quantity, item.adjustmentType)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {item.reason}
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            color="danger"
                            onClick={() => handleRemoveAdjustment(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {adjustmentItems.length > 0 && (
                <>
                  <Divider className="my-4" />
                  <Button
                    color="success"
                    onClick={handleProcessBatch}
                    isLoading={processingBatch}
                    startContent={!processingBatch && <Save className="w-4 h-4" />}
                    className="w-full"
                  >
                    {processingBatch ? 'Processing...' : 'Process All Adjustments'}
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
} 
