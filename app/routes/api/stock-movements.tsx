import { data } from 'react-router';
import mongoose from '../../mongoose.server';
import StockMovement from '../../models/StockMovement';
import Product from '../../models/Product';

// GET /api/stock-movements or /api/stock-movements/:productId
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productId = url.searchParams.get('productId');
    
    // Build query
    let query: any = {};
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }
    
    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('productId', 'name sku unitOfMeasure')
        .populate('userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(query)
    ]);

    return data({
      success: true,
      data: movements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch stock movements'
      },
      { status: 500 }
    );
  }
}

// POST /api/stock-movements - Create new stock movement
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    
    if (method === 'POST') {
      const movementData = await request.json();
      
      // Validate required fields
      if (!movementData.productId || !movementData.type || !movementData.quantity || !movementData.userId) {
        return data(
          {
            success: false,
            message: 'Product ID, type, quantity, and user ID are required'
          },
          { status: 400 }
        );
      }

      // Validate product exists and get current stock
      const product = await Product.findById(movementData.productId);
      if (!product) {
        return data(
          {
            success: false,
            message: 'Product not found'
          },
          { status: 404 }
        );
      }

      const previousStock = product.stockQuantity;
      let newStock = previousStock;
      
      // Calculate new stock based on movement type
      if (['purchase', 'return', 'adjustment'].includes(movementData.type)) {
        // Positive movements (add stock)
        newStock = previousStock + Math.abs(movementData.quantity);
      } else if (['sale', 'damage', 'expired', 'transfer'].includes(movementData.type)) {
        // Negative movements (remove stock)
        newStock = previousStock - Math.abs(movementData.quantity);
        // Ensure stock doesn't go negative
        if (newStock < 0) {
          return data(
            {
              success: false,
              message: 'Insufficient stock for this operation'
            },
            { status: 400 }
          );
        }
      }

      // Create stock movement record
      const movement = new StockMovement({
        ...movementData,
        quantity: ['purchase', 'return'].includes(movementData.type) 
          ? Math.abs(movementData.quantity) 
          : -Math.abs(movementData.quantity),
        previousStock,
        newStock,
        totalValue: Math.abs(movementData.quantity) * (movementData.unitCost || product.costPrice)
      });

      // Save movement and update product stock (without transaction for standalone MongoDB)
      try {
        await movement.save();
        await Product.findByIdAndUpdate(
          movementData.productId,
          { 
            stockQuantity: newStock,
            updatedAt: new Date()
          }
        );
        
        // Populate the movement for response
        await movement.populate('productId', 'name sku unitOfMeasure');
        await movement.populate('userId', 'firstName lastName');

        return data({
          success: true,
          data: movement,
          message: 'Stock movement recorded successfully'
        });
      } catch (error) {
        // If movement was saved but product update failed, try to clean up
        if (movement._id) {
          try {
            await StockMovement.findByIdAndDelete(movement._id);
          } catch (cleanupError) {
            console.error('Failed to cleanup movement after error:', cleanupError);
          }
        }
        throw error;
      }
    }

    // Handle PUT and DELETE by parsing URL for movement ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const movementId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(movementId)) {
      return data(
        {
          success: false,
          message: 'Invalid movement ID'
        },
        { status: 400 }
      );
    }

    if (method === 'PUT') {
      // Update stock movement
      const updateData = await request.json();
      
      // Get the original movement to reverse its stock effect
      const originalMovement = await StockMovement.findById(movementId);
      if (!originalMovement) {
        return data(
          {
            success: false,
            message: 'Movement not found'
          },
          { status: 404 }
        );
      }

      // Get the product
      const product = await Product.findById(originalMovement.productId);
      if (!product) {
        return data(
          {
            success: false,
            message: 'Product not found'
          },
          { status: 404 }
        );
      }

      // Reverse the original movement's effect on stock
      let currentStock = product.stockQuantity - originalMovement.quantity;
      
      // Apply the new movement's effect
      let newQuantity = updateData.quantity || originalMovement.quantity;
      if (['purchase', 'return', 'adjustment'].includes(updateData.type || originalMovement.type)) {
        newQuantity = Math.abs(newQuantity);
      } else {
        newQuantity = -Math.abs(newQuantity);
      }
      
      const newStock = currentStock + newQuantity;
      
      // Ensure stock doesn't go negative
      if (newStock < 0) {
        return data(
          {
            success: false,
            message: 'Insufficient stock for this operation'
          },
          { status: 400 }
        );
      }

      // Update the movement
      const updatedMovement = await StockMovement.findByIdAndUpdate(
        movementId,
        {
          ...updateData,
          quantity: newQuantity,
          previousStock: currentStock,
          newStock: newStock,
          totalValue: Math.abs(newQuantity) * (updateData.unitCost || product.costPrice),
          updatedAt: new Date()
        },
        { new: true }
      ).populate('productId', 'name sku unitOfMeasure').populate('userId', 'firstName lastName');

      // Update product stock
      await Product.findByIdAndUpdate(
        originalMovement.productId,
        { 
          stockQuantity: newStock,
          updatedAt: new Date()
        }
      );

      return data({
        success: true,
        data: updatedMovement,
        message: 'Stock movement updated successfully'
      });
    }

    if (method === 'DELETE') {
      // Delete stock movement and reverse its effect
      const movement = await StockMovement.findById(movementId);
      if (!movement) {
        return data(
          {
            success: false,
            message: 'Movement not found'
          },
          { status: 404 }
        );
      }

      // Get the product and reverse the movement's effect
      const product = await Product.findById(movement.productId);
      if (product) {
        const newStock = product.stockQuantity - movement.quantity;
        
        // Ensure stock doesn't go negative
        if (newStock < 0) {
          return data(
            {
              success: false,
              message: 'Cannot delete movement: would result in negative stock'
            },
            { status: 400 }
          );
        }

        await Product.findByIdAndUpdate(
          movement.productId,
          { 
            stockQuantity: newStock,
            updatedAt: new Date()
          }
        );
      }

      // Delete the movement
      await StockMovement.findByIdAndDelete(movementId);

      return data({
        success: true,
        message: 'Stock movement deleted successfully'
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
    console.error('Error in stock movements API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 