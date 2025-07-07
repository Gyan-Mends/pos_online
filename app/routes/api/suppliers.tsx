import { type ActionFunctionArgs, data } from 'react-router';

// GET /api/suppliers - Get all suppliers with pagination and search
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Supplier } = await import('../../models/Supplier');
    const { default: PurchaseOrder } = await import('../../models/PurchaseOrder');
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const active = url.searchParams.get('active');
    
    const skip = (page - 1) * limit;
    
    // Build search query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (active !== null) {
      query.isActive = active === 'true';
    }
    
    // Get suppliers with pagination
    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Supplier.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return data({
      success: true,
      data: suppliers,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error in suppliers API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create or Update supplier
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Supplier } = await import('../../models/Supplier');
    const { default: PurchaseOrder } = await import('../../models/PurchaseOrder');
    
    const method = request.method;
    
    if (method === 'POST') {
      const supplierData = await request.json();
      
      // Validate required fields
      if (!supplierData.name || !supplierData.code) {
        return data(
          {
            success: false,
            message: 'Name and code are required'
          },
          { status: 400 }
        );
      }
      
      // Check if code already exists
      const existingSupplier = await Supplier.findOne({ 
        code: supplierData.code.toUpperCase() 
      });
      
      if (existingSupplier) {
        return data(
          {
            success: false,
            message: 'Supplier code already exists'
          },
          { status: 400 }
        );
      }
      
      // Create supplier
      const supplier = new Supplier({
        ...supplierData,
        code: supplierData.code.toUpperCase()
      });
      
      await supplier.save();
      
      return data({
        success: true,
        data: supplier,
        message: 'Supplier created successfully'
      });
    }
    
    // Handle PUT and DELETE by parsing URL for supplier ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const supplierId = pathParts[pathParts.length - 1];
    
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return data(
        {
          success: false,
          message: 'Invalid supplier ID'
        },
        { status: 400 }
      );
    }
    
    if (method === 'PUT') {
      const updateData = await request.json();
      
      // Check if code already exists (excluding current supplier)
      if (updateData.code) {
        const existingSupplier = await Supplier.findOne({
          code: updateData.code.toUpperCase(),
          _id: { $ne: supplierId }
        });
        
        if (existingSupplier) {
          return data(
            {
              success: false,
              message: 'Supplier code already exists'
            },
            { status: 400 }
          );
        }
        
        updateData.code = updateData.code.toUpperCase();
      }
      
      const supplier = await Supplier.findByIdAndUpdate(
        supplierId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      
      if (!supplier) {
        return data(
          {
            success: false,
            message: 'Supplier not found'
          },
          { status: 404 }
        );
      }
      
      return data({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully'
      });
    }
    
    if (method === 'DELETE') {
      // Check if supplier has active purchase orders
      const activePurchaseOrders = await PurchaseOrder.countDocuments({
        supplierId,
        status: { $in: ['draft', 'sent', 'confirmed', 'partial_received'] }
      });
      
      if (activePurchaseOrders > 0) {
        return data(
          {
            success: false,
            message: 'Cannot delete supplier with active purchase orders. Please complete or cancel all orders first.'
          },
          { status: 400 }
        );
      }
      
      // Soft delete by setting isActive to false
      const supplier = await Supplier.findByIdAndUpdate(
        supplierId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      if (!supplier) {
        return data(
          {
            success: false,
            message: 'Supplier not found'
          },
          { status: 404 }
        );
      }
      
      return data({
        success: true,
        message: 'Supplier deactivated successfully'
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
    console.error('Error in suppliers API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 