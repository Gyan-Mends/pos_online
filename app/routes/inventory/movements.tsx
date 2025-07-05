import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  useDisclosure
} from '@heroui/react';
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  Truck,
  Calendar,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import { successToast, errorToast } from '../../components/toast';
import { stockMovementsAPI, productsAPI } from '../../utils/api';
import DataTable, { type Column } from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import CustomInput from '../../components/CustomInput';
import type { StockMovement, Product } from '../../types';

interface MovementFilters {
  search: string;
  type: string;
  productId: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
}

const movementTypes = [
  { key: 'all', label: 'All Types' },
  { key: 'sale', label: 'Sales', icon: ShoppingCart, color: 'primary' as const },
  { key: 'purchase', label: 'Purchases', icon: TrendingUp, color: 'success' as const },
  { key: 'adjustment', label: 'Adjustments', icon: Settings, color: 'warning' as const },
  { key: 'return', label: 'Returns', icon: RotateCcw, color: 'secondary' as const },
  { key: 'damage', label: 'Damage', icon: AlertTriangle, color: 'danger' as const },
  { key: 'expired', label: 'Expired', icon: AlertTriangle, color: 'danger' as const },
  { key: 'transfer', label: 'Transfers', icon: Truck, color: 'default' as const }
];

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    type: '',
    quantity: 0,
    unitCost: 0,
    reference: '',
    notes: ''
  });
  const [filters, setFilters] = useState<MovementFilters>({
    search: '',
    type: 'all',
    productId: 'all',
    dateRange: null
  });

  const { isOpen: deleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, filters]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await stockMovementsAPI.getAll({ limit: 1000 });
      const data = (response as any)?.data || response || [];
      
      // Debug: Log the first movement to see the structure
      if (data.length > 0) {
        console.log('Sample movement data:', data[0]);
      }
      
      setMovements(data.map((m: any) => ({
        ...m,
        id: m._id || m.id
      })));
    } catch (error) {
      errorToast('Failed to load stock movements');
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 1000 });
      const productsData = (response as any)?.data || response || [];
      setProducts(productsData.map((p: any) => ({
        ...p,
        id: p._id || p.id
      })));
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(movement => {
        const productName = (movement as any).productId_populated?.name?.toLowerCase() || '';
        const productSku = (movement as any).productId_populated?.sku?.toLowerCase() || '';
        const reference = movement.reference?.toLowerCase() || '';
        const notes = movement.notes?.toLowerCase() || '';
        
        return productName.includes(searchLower) || 
               productSku.includes(searchLower) || 
               reference.includes(searchLower) ||
               notes.includes(searchLower);
      });
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(movement => movement.type === filters.type);
    }

    // Product filter
    if (filters.productId !== 'all') {
      filtered = filtered.filter(movement => 
        (movement as any).productId_populated?.id === filters.productId ||
        (movement as any).productId_populated?._id === filters.productId
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      filtered = filtered.filter(movement => {
        const movementDate = new Date(movement.createdAt);
        return movementDate >= startDate && movementDate <= endDate;
      });
    }

    setFilteredMovements(filtered);
  };

  const handleFilterChange = (key: keyof MovementFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      productId: 'all',
      dateRange: null
    });
  };

  const getMovementIcon = (type: string) => {
    const movementType = movementTypes.find(t => t.key === type);
    if (movementType && movementType.icon) {
      const IconComponent = movementType.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4" />;
  };

  const getMovementColor = (type: string) => {
    const movementType = movementTypes.find(t => t.key === type);
    return movementType?.color || 'default';
  };

  const formatQuantity = (quantity: number) => {
    const sign = quantity > 0 ? '+' : '';
    const color = quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    return (
      <span className={`font-medium ${color}`}>
        {sign}{quantity}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewDetails = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEditMovement = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setIsEditing(true);
    setEditFormData({
      type: movement.type,
      quantity: Math.abs(movement.quantity),
      unitCost: movement.unitCost || 0,
      reference: movement.reference || '',
      notes: movement.notes || ''
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteMovement = async () => {
    if (!selectedMovement) return;
    
    try {
      await stockMovementsAPI.delete(selectedMovement.id);
      successToast('Movement deleted successfully');
      setMovements(prev => prev.filter(m => m.id !== selectedMovement.id));
      onDeleteModalChange();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete movement');
      console.error('Error deleting movement:', error);
    }
  };

  const confirmDelete = (movement: StockMovement) => {
    setSelectedMovement(movement);
    openDeleteModal();
  };

  const handleSaveEdit = async () => {
    if (!selectedMovement) return;
    
    try {
      const updateData = {
        ...editFormData,
        quantity: editFormData.quantity
      };
      
      await stockMovementsAPI.update(selectedMovement.id, updateData);
      successToast('Movement updated successfully');
      setIsDrawerOpen(false);
      loadMovements(); // Reload to get updated data
    } catch (error: any) {
      errorToast(error.message || 'Failed to update movement');
      console.error('Error updating movement:', error);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportMovements = () => {
    // TODO: Implement CSV export functionality
    successToast('Export feature coming soon');
  };

  const getStatsCards = () => {
    const today = new Date().toDateString();
    const todayMovements = movements.filter(m => 
      new Date(m.createdAt).toDateString() === today
    );

    const positiveMovements = movements.filter(m => m.quantity > 0);
    const negativeMovements = movements.filter(m => m.quantity < 0);

    return [
      {
        title: 'Total Movements',
        value: movements.length.toString(),
        icon: Activity,
        color: 'bg-blue-500'
      },
      {
        title: "Today's Movements",
        value: todayMovements.length.toString(),
        icon: Calendar,
        color: 'bg-green-500'
      },
      {
        title: 'Stock Increases',
        value: positiveMovements.length.toString(),
        icon: TrendingUp,
        color: 'bg-emerald-500'
      },
      {
        title: 'Stock Decreases',
        value: negativeMovements.length.toString(),
        icon: TrendingDown,
        color: 'bg-red-500'
      }
    ];
  };

  // Helper function to get product info from movement
  const getProductInfo = (movement: StockMovement) => {
    // Try different possible structures
    const productData = (movement as any).productId;
    
    // If productId is populated (object), use it directly
    if (productData && typeof productData === 'object' && productData.name) {
      return productData;
    }
    
    // Otherwise, find in products array
    const productId = typeof productData === 'string' ? productData : movement.productId;
    return products.find(p => p.id === productId || p._id === productId);
  };

  // Define columns for the DataTable
  const movementColumns: Column<StockMovement>[] = [
    {
      key: 'productId',
      title: 'Product',
      render: (value: any, record: StockMovement) => {
        const product = getProductInfo(record);
        
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {product?.name || 'Unknown Product'}
            </div>
            <div className="text-sm text-gray-500">
              SKU: {product?.sku || 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => (
        <Chip
          size="sm"
          color={getMovementColor(value)}
          variant="flat"
          startContent={getMovementIcon(value)}
        >
          <span className="capitalize">{value}</span>
        </Chip>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (value: number, record: StockMovement) => {
        const product = getProductInfo(record);
        
        return (
          <div className="flex items-center space-x-2">
            {formatQuantity(value)}
            <span className="text-sm text-gray-500">
              {product?.unitOfMeasure || 'pcs'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'stockChange',
      title: 'Stock Change',
      render: (value: any, record: StockMovement) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {record.previousStock} → {record.newStock}
        </span>
      ),
    },
    {
      key: 'totalValue',
      title: 'Value',
      render: (value: number) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {value > 0 ? formatCurrency(value) : '-'}
        </span>
      ),
    },
    {
      key: 'reference',
      title: 'Reference',
      render: (value: string) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value: string) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (value: any, record: StockMovement) => (
        <div className="flex items-center space-x-2">
          <button
            
            onClick={() => handleViewDetails(record)}
          >
            <Eye className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => handleEditMovement(record)}
          >
            <Edit className="w-4 h-4 text-secondary" />
          </button>
          <button
            onClick={() => confirmDelete(record)}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Movements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all stock movements and inventory transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            startContent={<RefreshCw className="w-4 h-4" />}
            onClick={loadMovements}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            variant="ghost"
            startContent={<Download className="w-4 h-4" />}
            onClick={exportMovements}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => (
          <Card key={index} className="customed-dark-card">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
    
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by product name, SKU, or reference..."
              value={filters.search}
              onValueChange={(value) => handleFilterChange('search', value)}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              variant="bordered"
            />
            
            <Select
              placeholder="Movement Type"
              selectedKeys={[filters.type]}
              onSelectionChange={(keys) => {
                const type = Array.from(keys)[0] as string;
                handleFilterChange('type', type);
              }}
              variant="bordered"
            >
              {movementTypes.map((type) => (
                <SelectItem key={type.key}>
                  <div className="flex items-center space-x-2">
                    {type.icon && <type.icon className="w-4 h-4" />}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Product"
              selectedKeys={[filters.productId]}
              onSelectionChange={(keys) => {
                const productId = Array.from(keys)[0] as string;
                handleFilterChange('productId', productId);
              }}
              variant="bordered"
            >
              <SelectItem key="all">All Products</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} textValue={`${product.name} (${product.sku})`}>
                  {product.name} ({product.sku})
                </SelectItem>
              ))}
            </Select>

            <Button
              variant="ghost"
              onClick={clearFilters}
              startContent={<Filter className="w-4 h-4" />}
            >
              Clear Filters
            </Button>
          </div>
      

      {/* Movements DataTable */}
      
          <DataTable
            data={filteredMovements}
            columns={movementColumns}
            loading={loading}
            pageSize={20}
            searchPlaceholder="Search movements..."
            emptyText="No movements found"
            showSearch={false} // We have custom filters above
            showPagination={true}
          />
       

      {/* Movement Details/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? 'Edit Movement' : 'Movement Details'}
        size="lg"
      >
        {selectedMovement && (
          <div className="space-y-6">
            {!isEditing ? (
              // View Mode
              <>
                {/* Movement Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Chip
                      size="lg"
                      color={getMovementColor(selectedMovement.type)}
                      variant="flat"
                      startContent={getMovementIcon(selectedMovement.type)}
                    >
                      <span className="capitalize font-medium">{selectedMovement.type}</span>
                    </Chip>
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedMovement.createdAt)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Product
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(() => {
                          const product = getProductInfo(selectedMovement);
                          return product?.name || 'Unknown Product';
                        })()}
                      </p>
                      <p className="text-sm text-gray-500">
                        SKU: {(() => {
                          const product = getProductInfo(selectedMovement);
                          return product?.sku || 'N/A';
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Quantity Change
                      </label>
                      <p className="text-2xl font-bold">
                        {formatQuantity(selectedMovement.quantity)} {(() => {
                          const product = getProductInfo(selectedMovement);
                          return product?.unitOfMeasure || 'pcs';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Previous Stock
                    </label>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMovement.previousStock}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label className="text-sm font-medium text-blue-600 dark:text-blue-400 block mb-2">
                      Change
                    </label>
                    <p className="text-xl font-bold">
                      {formatQuantity(selectedMovement.quantity)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      New Stock
                    </label>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMovement.newStock}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  {selectedMovement.reference && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                        <FileText className="w-4 h-4 mr-2" />
                        Reference
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm bg-white dark:bg-gray-700 p-2 rounded border">
                        {selectedMovement.reference}
                      </p>
                    </div>
                  )}

                  {selectedMovement.unitCost > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                        Unit Cost
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedMovement.unitCost)}
                      </p>
                    </div>
                  )}

                  {selectedMovement.totalValue > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <label className="text-sm font-medium text-green-600 dark:text-green-400 block mb-2">
                        Total Value
                      </label>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(selectedMovement.totalValue)}
                      </p>
                    </div>
                  )}

                  {(selectedMovement as any).userId && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center mb-2">
                        <User className="w-4 h-4 mr-2" />
                        Processed By
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {(selectedMovement as any).userId.firstName} {(selectedMovement as any).userId.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedMovement as any).userId.role || 'User'}
                      </p>
                    </div>
                  )}

                  {selectedMovement.notes && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                        Notes
                      </label>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedMovement.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Edit Mode
              <>
                {/* Product Info (Read-only) */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Product Information
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {(() => {
                      const product = getProductInfo(selectedMovement);
                      return product?.name || 'Unknown Product';
                    })()} ({(() => {
                      const product = getProductInfo(selectedMovement);
                      return product?.sku || 'N/A';
                    })()})
                  </p>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Movement Type
                    </label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => handleEditFormChange('type', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {movementTypes.filter(t => t.key !== 'all').map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <CustomInput
                    label="Quantity"
                    type="number"
                    placeholder="0"
                    value={editFormData.quantity.toString()}
                    onChange={(value) => handleEditFormChange('quantity', parseFloat(value) || 0)}
                    min="0"
                    step="1"
                    required
                  />

                  <CustomInput
                    label="Unit Cost"
                    type="number"
                    placeholder="0.00"
                    value={editFormData.unitCost.toString()}
                    onChange={(value) => handleEditFormChange('unitCost', parseFloat(value) || 0)}
                    min="0"
                    step="0.01"
                  />

                  <CustomInput
                    label="Reference"
                    placeholder="Enter reference number"
                    value={editFormData.reference}
                    onChange={(value) => handleEditFormChange('reference', value)}
                  />

                  <CustomInput
                    label="Notes"
                    type="textarea"
                    placeholder="Enter notes or reason for adjustment"
                    value={editFormData.notes}
                    onChange={(value) => handleEditFormChange('notes', value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={onDeleteModalChange}
        header="Delete Movement"
        content={`Are you sure you want to delete this ${selectedMovement?.type} movement? This action cannot be undone and will reverse the stock changes.`}
      >
        <div className="flex justify-center space-x-3">
          <Button
            variant="ghost"
            onClick={onDeleteModalChange}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onClick={handleDeleteMovement}
          >
            Delete Movement
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
}  
