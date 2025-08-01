import { data } from 'react-router';
import type { ProductFormData } from '../../types';
import { handlePreflight, corsResponse } from '../../utils/cors';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS({ request }: { request: Request }) {
  return handlePreflight(request);
}

// GET /api/products or /api/products/:id
export async function loader({ request, params }: { request: Request; params?: any }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Product } = await import('../../models/Product');
    const { default: Category } = await import('../../models/Category');
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    // If there's a specific product ID in the URL, get single product
    if (productId && productId !== 'products' && mongoose.Types.ObjectId.isValid(productId)) {
      const product = await Product.findById(productId).populate('categoryId').lean();

      if (!product) {
        return corsResponse({
          success: false,
          message: 'Product not found'
        }, { status: 404 }, request);
      }

      return corsResponse({
        success: true,
        data: product
      }, {}, request);
    }

    // Otherwise, get all products with pagination and search
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const includeOutOfStock = url.searchParams.get('includeOutOfStock') === 'true';

    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.categoryId = category;
    }
    // Filter out products with zero stock unless explicitly requested
    if (!includeOutOfStock) {
      query.stockQuantity = { $gt: 0 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    return corsResponse({
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, {}, request);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return corsResponse({
      success: false,
      message: error.message || 'Failed to fetch products'
    }, { status: 500 }, request);
  }
}

// POST, PUT, DELETE /api/products
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Product } = await import('../../models/Product');
    const { default: Category } = await import('../../models/Category');
    
    const method = request.method;
    
    if (method === 'POST') {
      const formData: ProductFormData = await request.json();
      
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.categoryId) {
        return corsResponse(
          {
            success: false,
            message: 'Name, SKU, and Category are required'
          },
          { status: 400 }
        );
      }

      // Validate category exists
      if (!mongoose.Types.ObjectId.isValid(formData.categoryId)) {
        return corsResponse(
          {
            success: false,
            message: 'Invalid category ID'
          },
          { status: 400 }
        );
      }

      // Check if SKU already exists
      const existingSku = await Product.findOne({ sku: formData.sku });
      if (existingSku) {
        return corsResponse(
          {
            success: false,
            message: 'SKU already exists'
          },
          { status: 400 }
        );
      }

      // Create new product
      const product = new Product(formData);
      await product.save();
      await product.populate('categoryId');

      return corsResponse({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    }

    // Handle PUT and DELETE by parsing URL for product ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return corsResponse(
        {
          success: false,
          message: 'Invalid product ID'
        },
        { status: 400 }
      );
    }

    if (method === 'PUT') {
      // Update product
      const updateData: Partial<ProductFormData> = await request.json();
      
      // Validate category if provided
      if (updateData.categoryId && !mongoose.Types.ObjectId.isValid(updateData.categoryId)) {
        return corsResponse(
          {
            success: false,
            message: 'Invalid category ID'
          },
          { status: 400 }
        );
      }

      // Check if SKU already exists (excluding current product)
      if (updateData.sku) {
        const existingSku = await Product.findOne({ 
          sku: updateData.sku, 
          _id: { $ne: productId } 
        });
        if (existingSku) {
          return corsResponse(
            {
              success: false,
              message: 'SKU already exists'
            },
            { status: 400 }
          );
        }
      }
      
      const product = await Product.findByIdAndUpdate(
        productId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('categoryId');

      if (!product) {
        return corsResponse({
          success: false,
          message: 'Product not found'
        }, { status: 404 }, request);
      }

      return corsResponse({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Delete product
      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return corsResponse({
          success: false,
          message: 'Product not found'
        }, { status: 404 }, request);
      }

      return corsResponse({
        success: true,
        message: 'Product deleted successfully'
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
    console.error('Error in products API:', error);
    return corsResponse(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 