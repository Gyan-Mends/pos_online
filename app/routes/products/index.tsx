import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Chip, useDisclosure } from '@heroui/react';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import DataTable, { type Column } from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import CustomInput from '../../components/CustomInput';
import type { Product, Category, ProductFormData } from '../../types';
import { productsAPI, categoriesAPI } from '../../utils/api';
import { successToast, errorToast } from '../../components/toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    maxStockLevel: 1000,
    unitOfMeasure: 'pcs',
    isActive: true,
    taxable: true,
    taxRate: 0,
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    location: '',
  });

  const { isOpen: deleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();

  // Fetch products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      setProducts((productsResponse as any)?.data || []);
      setCategories((categoriesResponse as any)?.data || []);
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Open drawer for adding new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 1000,
      unitOfMeasure: 'pcs',
      isActive: true,
      taxable: true,
      taxRate: 0,
      expiryDate: '',
      batchNumber: '',
      supplier: '',
      location: '',
    });
    setIsDrawerOpen(true);
  };

  // Open drawer for editing product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel || 1000,
      unitOfMeasure: product.unitOfMeasure,
      isActive: product.isActive,
      taxable: product.taxable,
      taxRate: product.taxRate || 0,
      expiryDate: product.expiryDate || '',
      batchNumber: product.batchNumber || '',
      supplier: product.supplier || '',
      location: product.location || '',
    });
    setIsDrawerOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.sku || !formData.categoryId) {
        errorToast('Please fill in all required fields');
        return;
      }

      if (isEditing && selectedProduct) {
        await productsAPI.update(selectedProduct.id, formData);
        successToast('Product updated successfully');
      } else {
        await productsAPI.create(formData);
        successToast('Product created successfully');
      }

      setIsDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      errorToast(error.message || 'Failed to save product');
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await productsAPI.delete(selectedProduct.id);
      successToast('Product deleted successfully');
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      onDeleteModalChange();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete product');
    }
  };

  // Confirm delete
  const confirmDelete = (product: Product) => {
    setSelectedProduct(product);
    openDeleteModal();
  };

  // Table columns
  const columns: Column<Product>[] = [
    {
      key: 'name',
      title: 'Product Name',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {record.sku}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      render: (value, record) => record.category?.name || 'N/A'
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'stockQuantity',
      title: 'Stock',
      sortable: true,
      render: (value, record) => {
        const isLowStock = value <= record.minStockLevel;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {value} {record.unitOfMeasure}
            </span>
            {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
        );
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => (
        <Chip color={value ? 'success' : 'danger'} variant="flat" size="sm">
          {value ? 'Active' : 'Inactive'}
        </Chip>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="light"
            onClick={() => handleEditProduct(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="light"
            color="danger"
            onClick={() => confirmDelete(record)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product inventory and catalog
          </p>
        </div>
        <Button
          color="primary"
          onClick={handleAddProduct}
          startContent={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stockQuantity <= p.minStockLevel).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search products..."
        emptyText="No products found"
      />

      {/* Product Form Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <CustomInput
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                required
              />
              
              <CustomInput
                label="Description"
                placeholder="Enter product description"
                type="textarea"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="SKU"
                  placeholder="Enter SKU"
                  value={formData.sku}
                  onChange={(value) => handleInputChange('sku', value)}
                  required
                />
                
                <CustomInput
                  label="Barcode"
                  placeholder="Enter barcode"
                  value={formData.barcode}
                  onChange={(value) => handleInputChange('barcode', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <CustomInput
                  label="Unit of Measure"
                  placeholder="e.g., pcs, kg, lbs"
                  value={formData.unitOfMeasure}
                  onChange={(value) => handleInputChange('unitOfMeasure', value)}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pricing & Stock
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Sale Price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price.toString()}
                  onChange={(value) => handleInputChange('price', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                />
                
                <CustomInput
                  label="Cost Price"
                  type="number"
                  placeholder="0.00"
                  value={formData.costPrice.toString()}
                  onChange={(value) => handleInputChange('costPrice', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <CustomInput
                  label="Current Stock"
                  type="number"
                  placeholder="0"
                  value={formData.stockQuantity.toString()}
                  onChange={(value) => handleInputChange('stockQuantity', parseInt(value) || 0)}
                  min="0"
                />
                
                <CustomInput
                  label="Min Stock Level"
                  type="number"
                  placeholder="5"
                  value={formData.minStockLevel.toString()}
                  onChange={(value) => handleInputChange('minStockLevel', parseInt(value) || 0)}
                  min="0"
                />
                
                <CustomInput
                  label="Max Stock Level"
                  type="number"
                  placeholder="1000"
                  value={formData.maxStockLevel?.toString() || ''}
                  onChange={(value) => handleInputChange('maxStockLevel', parseInt(value) || undefined)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="flat"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={onDeleteModalChange}
        header="Delete Product"
        content={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-center space-x-3">
          <Button
            variant="flat"
            onClick={onDeleteModalChange}
          >
            Cancel
          </Button>
          <Button
            color="danger"
            onClick={handleDeleteProduct}
          >
            Delete Product
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 