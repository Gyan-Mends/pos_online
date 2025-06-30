import { data } from 'react-router';
import mongoose from 'mongoose';
import Sale from '../../models/Sale';
import Product from '../../models/Product';
import Customer from '../../models/Customer';
import StockMovement from '../../models/StockMovement';
import '../../mongoose.server';

// GET /api/sales - Get all sales
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Sale.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('sellerId', 'firstName lastName')
      .populate('items.productId', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Sale.countDocuments(query);
    
    return data({
      success: true,
      data: sales,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch sales'
      },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sale
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    
    if (method === 'POST') {
      const saleData = await request.json();
      
      // Validate required fields
      if (!saleData.items || saleData.items.length === 0) {
        return data(
          {
            success: false,
            message: 'Sale items are required'
          },
          { status: 400 }
        );
      }
      
      if (!saleData.sellerId) {
        return data(
          {
            success: false,
            message: 'Seller ID is required'
          },
          { status: 400 }
        );
      }
      
      // Validate products and stock
      const productIds = saleData.items.map((item: any) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      
      if (products.length !== productIds.length) {
        return data(
          {
            success: false,
            message: 'One or more products not found'
          },
          { status: 404 }
        );
      }
      
      // Check stock availability
      for (const item of saleData.items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (!product) {
          return data(
            {
              success: false,
              message: `Product ${item.productId} not found`
            },
            { status: 404 }
          );
        }
        
        if (product.stockQuantity < item.quantity) {
          return data(
            {
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
            },
            { status: 400 }
          );
        }
      }
      
      // Create the sale
      const sale = new Sale({
        customerId: saleData.customerId || undefined,
        sellerId: saleData.sellerId,
        items: saleData.items,
        subtotal: saleData.subtotal,
        taxAmount: saleData.taxAmount,
        discountAmount: saleData.discountAmount || 0,
        totalAmount: saleData.totalAmount,
        amountPaid: saleData.amountPaid,
        changeAmount: saleData.changeAmount || 0,
        payments: saleData.payments,
        status: 'completed',
        notes: saleData.notes
      });
      
      await sale.save();
      
      // Update product stock and create stock movements
      for (const item of saleData.items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product) {
          const previousStock = product.stockQuantity;
          const newStock = previousStock - item.quantity;
          
          // Update product stock
          await Product.findByIdAndUpdate(
            item.productId,
            { 
              stockQuantity: newStock,
              updatedAt: new Date()
            }
          );
          
          // Create stock movement record
          await StockMovement.create({
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            previousStock,
            newStock,
            unitCost: product.costPrice,
            totalValue: item.quantity * product.costPrice,
            reference: sale.receiptNumber,
            notes: `Sale: ${sale.receiptNumber}`,
            userId: saleData.sellerId
          });
        }
      }
      
      // Update customer statistics if customer exists
      if (saleData.customerId) {
        await Customer.findByIdAndUpdate(
          saleData.customerId,
          {
            $inc: {
              totalPurchases: 1,
              totalSpent: saleData.totalAmount,
              loyaltyPoints: Math.floor(saleData.totalAmount) // 1 point per dollar
            }
          }
        );
      }
      
      // Populate the sale for response
      await sale.populate('customerId', 'firstName lastName email phone');
      await sale.populate('sellerId', 'firstName lastName');
      await sale.populate('items.productId', 'name sku');
      
      return data({
        success: true,
        data: sale,
        message: 'Sale completed successfully'
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
    console.error('Error in sales API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 