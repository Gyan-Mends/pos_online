import { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody, Chip, useDisclosure, Avatar, Tooltip } from '@heroui/react';
import { Plus, Edit, Trash2, Package, AlertTriangle, Eye, Search, Filter, Upload, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import DataTable, { type Column } from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import CustomInput from '../../components/CustomInput';
import type { Product, Category, ProductFormData } from '../../types';
import { productsAPI, categoriesAPI } from '../../utils/api';
import { successToast, errorToast } from '../../components/toast';

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    images: [],
    isActive: true,
    taxable: true,
    taxRate: 0,
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    location: '',
  });

  const { isOpen: deleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();

  // Handle edit product from navigation state
  useEffect(() => {
    if (location.state?.editProduct) {
      handleEditProduct(location.state.editProduct);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      
      // Handle API response structure
      const productsData = (productsResponse as any)?.data || productsResponse || [];
      const categoriesData = (categoriesResponse as any)?.data || categoriesResponse || [];
      
      // Debug: Log the first product and category to see the structure
      if (productsData.length > 0) {
        console.log('Sample product data:', productsData[0]);
      }
      if (categoriesData.length > 0) {
        console.log('Sample category data:', categoriesData[0]);
      }
      
      // Add id field for compatibility
      const processedProducts = Array.isArray(productsData) ? productsData.map((p: any) => ({
        ...p,
        id: p._id || p.id
      })) : [];
      
      const processedCategories = Array.isArray(categoriesData) ? categoriesData.map((c: any) => ({
        ...c,
        id: c._id || c.id
      })) : [];
      
      setProducts(processedProducts);
      setCategories(processedCategories);
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch data');
      console.error('Error loading data:', error);
      setProducts([]);
      setCategories([]);
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

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const imagePromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        return await convertToBase64(file);
      });

      const base64Images = await Promise.all(imagePromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images]
      }));

      successToast(`${base64Images.length} image(s) uploaded successfully`);
    } catch (error: any) {
      errorToast(error.message || 'Failed to upload images');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
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
      images: [],
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
      images: product.images || [],
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

  // Handle view product
  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
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
      fetchData(); // Reload products after create/update
    } catch (error: any) {
      errorToast(error.message || 'Failed to save product');
      console.error('Error saving product:', error);
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
      console.error('Error deleting product:', error);
    }
  };

  // Confirm delete
  const confirmDelete = (product: Product) => {
    setSelectedProduct(product);
    openDeleteModal();
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'N/A';
    
    // First try to find by direct ID match
    const category = categories.find(c => {
      return c.id === categoryId || c._id === categoryId || 
             (c as any)._id?.toString() === categoryId || 
             (c as any).id?.toString() === categoryId;
    });
    
    return category?.name || 'N/A';
  };

  // Table columns
  const columns: Column<Product>[] = [
    {
      key: 'product',
      title: 'Product',
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {record.images && record.images.length > 0 ? (
              <img 
                src={record.images[0]} 
                alt={record.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
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
      render: (value, record) => {
        // Handle different possible data structures
        let categoryName = 'N/A';
        
        // If categoryId is populated (object with name)
        if (typeof (record as any).categoryId === 'object' && (record as any).categoryId?.name) {
          categoryName = (record as any).categoryId.name;
        } 
        // If categoryId is just an ID string, look it up in categories array
        else if (typeof record.categoryId === 'string') {
          const category = categories.find(c => 
            c.id === record.categoryId || 
            c._id === record.categoryId ||
            (c as any)._id?.toString() === record.categoryId ||
            (c as any).id?.toString() === record.categoryId
          );
          categoryName = category?.name || 'N/A';
        }
        
        return (
          <Chip
            variant="flat"
            size="sm"
            className="font-medium"
          >
            {categoryName}
          </Chip>
        );
      }
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900 dark:text-white">
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      key: 'stockQuantity',
      title: 'Stock',
      sortable: true,
      render: (value, record) => {
        const isLowStock = value <= record.minStockLevel;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
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
        <Chip 
          color={value ? 'success' : 'default'} 
          variant="flat" 
          size="sm"
          className="font-medium"
        >
          {value ? 'Active' : 'Inactive'}
        </Chip>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Tooltip content="View Details">
            <button
              onClick={() => handleViewProduct(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Eye className="w-4 h-4 text-primary" />
            </button>
          </Tooltip>
          <Tooltip content="Edit Product">
            <button
              onClick={() => handleEditProduct(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Edit className="w-4 h-4 text-secondary" />
            </button>
          </Tooltip>
          <Tooltip content="Delete Product">
            <button
              onClick={() => confirmDelete(record)}
              className="min-w-unit-8 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
          </Tooltip>
        </div>
      )
    }
  ];

  // Stats calculations
  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'text-blue-500'
    },
    {
      title: 'Active Products',
      value: products.filter(p => p.isActive).length,
      icon: Package,
      color: 'text-green-500'
    },
    {
      title: 'Low Stock Items',
      value: products.filter(p => p.stockQuantity <= p.minStockLevel).length,
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Categories',
      value: categories.length,
      icon: Filter,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
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
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
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
                  <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800">
                    <IconComponent className={`w-6 h-6 ${stat.color} dark:opacity-80`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search products..."
        emptyText="No products found. Get started by adding your first product."
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
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Product Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Product Images
            </h3>
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Images (Max 5MB each, JPG/PNG/GIF)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="bordered"
                    onClick={() => fileInputRef.current?.click()}
                    startContent={<Upload className="w-4 h-4" />}
                  >
                    Choose Images
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.images?.length || 0} image(s) selected
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {formData.images && formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Supplier"
                  placeholder="Enter supplier name"
                  value={formData.supplier}
                  onChange={(value) => handleInputChange('supplier', value)}
                />
                
                <CustomInput
                  label="Location"
                  placeholder="Enter storage location"
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Batch Number"
                  placeholder="Enter batch number"
                  value={formData.batchNumber}
                  onChange={(value) => handleInputChange('batchNumber', value)}
                />
                
                <CustomInput
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(value) => handleInputChange('expiryDate', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Tax Rate (%)"
                  type="number"
                  placeholder="0"
                  value={formData.taxRate?.toString() || ''}
                  onChange={(value) => handleInputChange('taxRate', parseFloat(value) || 0)}
                  step="0.01"
                  min="0"
                  max="100"
                />
                
                <div className="flex items-center space-x-4 pt-8">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.taxable}
                      onChange={(e) => handleInputChange('taxable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Taxable
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Active
                    </span>
                  </label>
                </div>
              </div>
            </div>
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
            variant="ghost"
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