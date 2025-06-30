import { data } from 'react-router';
import mongoose from '../../mongoose.server';
import Category from '../../models/Category';

// GET /api/categories - Get all categories
export async function loader({ request }: { request: Request }) {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return data({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    
    if (method === 'POST') {
      const formData = await request.json();
      
      // Validate required fields
      if (!formData.name) {
        return data(
          {
            success: false,
            message: 'Category name is required'
          },
          { status: 400 }
        );
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({ name: formData.name });
      if (existingCategory) {
        return data(
          {
            success: false,
            message: 'Category already exists'
          },
          { status: 400 }
        );
      }

      // Create new category
      const category = new Category({
        name: formData.name,
        description: formData.description || ''
      });

      await category.save();

      return data({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    }

    // Handle other methods by parsing URL for individual category operations
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const categoryId = pathParts[pathParts.length - 1];

    if (method === 'PUT') {
      // Update category
      const updateData = await request.json();
      
      const category = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true }
      );

      if (!category) {
        return data(
          {
            success: false,
            message: 'Category not found'
          },
          { status: 404 }
        );
      }

      return data({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Delete category
      const category = await Category.findByIdAndDelete(categoryId);

      if (!category) {
        return data(
          {
            success: false,
            message: 'Category not found'
          },
          { status: 404 }
        );
      }

      return data({
        success: true,
        message: 'Category deleted successfully'
      });
    }

    return data(
      {
        success: false,
        message: 'Method not allowed'
      },
      { status: 405 }
    );
  } catch (error: any) {
    console.error('Error in categories API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 