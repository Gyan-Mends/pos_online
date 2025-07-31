import { data } from 'react-router';
import { handlePreflight, corsResponse } from '../../utils/cors';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS({ request }: { request: Request }) {
  return handlePreflight(request);
}

// GET /api/categories - Get all categories
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Category } = await import('../../models/Category');
    const categories = await Category.find({}).sort({ name: 1 }).lean();

    return corsResponse({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return corsResponse(
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
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Category } = await import('../../models/Category');
    
    const method = request.method;
    
    if (method === 'POST') {
      const formData = await request.json();
      
      // Validate required fields
      if (!formData.name) {
        return corsResponse(
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
        return corsResponse(
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

      return corsResponse({
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
        return corsResponse(
          {
            success: false,
            message: 'Category not found'
          },
          { status: 404 }
        );
      }

      return corsResponse({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Delete category
      const category = await Category.findByIdAndDelete(categoryId);

      if (!category) {
        return corsResponse(
          {
            success: false,
            message: 'Category not found'
          },
          { status: 404 }
        );
      }

      return corsResponse({
        success: true,
        message: 'Category deleted successfully'
      });
    }

    return corsResponse(
      {
        success: false,
        message: 'Method not allowed'
      },
      { status: 405 }
    );
  } catch (error: any) {
    console.error('Error in categories API:', error);
    return corsResponse(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 