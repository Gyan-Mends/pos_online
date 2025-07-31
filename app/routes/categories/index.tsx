import { useState, useEffect } from 'react';
import { Button, Card, CardBody, useDisclosure } from '@heroui/react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import DataTable, { type Column } from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/confirmModal';
import CustomInput from '../../components/CustomInput';
import type { Category } from '../../types';
import { categoriesAPI } from '../../utils/api';
import { successToast, errorToast } from '../../components/toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const { isOpen: deleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      const categoriesData = (response as any)?.data || [];
      
      // Process categories to ensure both _id and id fields exist
      const processedCategories = categoriesData.map((category: any) => ({
        ...category,
        id: category._id || category.id,
        _id: category._id || category.id
      }));
      
      setCategories(processedCategories);
    } catch (error: any) {
      errorToast(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Open drawer for adding new category
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsEditing(false);
    setFormData({
      name: '',
      description: ''
    });
    setIsDrawerOpen(true);
  };

  // Open drawer for editing category
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditing(true);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsDrawerOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        errorToast('Category name is required');
        return;
      }

      if (isEditing && selectedCategory) {
        const categoryId = selectedCategory._id || selectedCategory.id;
        await categoriesAPI.update(categoryId, formData);
        successToast('Category updated successfully');
      } else {
        await categoriesAPI.create(formData);
        successToast('Category created successfully');
      }

      setIsDrawerOpen(false);
      fetchCategories();
    } catch (error: any) {
      errorToast(error.message || 'Failed to save category');
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const categoryId = selectedCategory._id || selectedCategory.id;
      await categoriesAPI.delete(categoryId);
      successToast('Category deleted successfully');
      setCategories(prev => prev.filter(c => (c._id || c.id) !== categoryId));
      onDeleteModalChange();
    } catch (error: any) {
      errorToast(error.message || 'Failed to delete category');
    }
  };

  // Confirm delete
  const confirmDelete = (category: Category) => {
    setSelectedCategory(category);
    openDeleteModal();
  };

  // Table columns
  const columns: Column<Category>[] = [
    {
      key: 'name',
      title: 'Category Name',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {record.description || 'No description'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, record) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="light"
            onClick={() => handleEditCategory(record)}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage product categories
          </p>
        </div>
        <Button
          color="primary"
          onClick={handleAddCategory}
          startContent={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.length}
                </p>
              </div>
              <Tag className="w-8 h-8 text-blue-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Categories Table */}
      <DataTable
        data={categories}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search categories..."
        emptyText="No categories found"
      />

      {/* Category Form Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={isEditing ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <CustomInput
              label="Category Name"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              required
            />
            
            <CustomInput
              label="Description"
              placeholder="Enter category description"
              type="textarea"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              rows={3}
            />
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
              {isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onOpenChange={onDeleteModalChange}
        header="Delete Category"
        content={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
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
            onClick={handleDeleteCategory}
          >
            Delete Category
          </Button>
        </div>
      </ConfirmModal>
    </div>
  );
} 