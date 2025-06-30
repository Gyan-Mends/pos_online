import { data } from 'react-router';
import mongoose from 'mongoose';
import Sale from '../../models/Sale';
import Product from '../../models/Product';
import Customer from '../../models/Customer';
import StockMovement from '../../models/StockMovement';
import '../../mongoose.server';

// GET /api/sales - Get all sales with optional filters
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const customerId = url.searchParams.get('customerId');
    const sellerId = url.searchParams.get('sellerId');
    const status = url.searchParams.get('status');
    
    // Check if this is a request for a specific sale by ID
    const pathParts = url.pathname.split('/');
    const saleId = pathParts[pathParts.length - 1];
    
    if (saleId && saleId !== 'sales' && mongoose.Types.ObjectId.isValid(saleId)) {
      // Get specific sale
      const sale = await Sale.findById(saleId)
        .populate('customerId', 'firstName lastName email phone')
        .populate('sellerId', 'firstName lastName')
        .populate('items.productId', 'name sku costPrice sellingPrice')
        .lean();
        
      if (!sale) {
        return data(
          {
            success: false,
            message: 'Sale not found'
          },
          { status: 404 }
        );
      }
      
      // Transform the data to match expected structure
      const transformedSale = {
        ...sale,
        customer: sale.customerId,
        seller: sale.sellerId,
        items: sale.items.map(item => ({
          ...item,
          product: item.productId
        }))
      };
      
      return data({
        success: true,
        data: transformedSale
      });
    }
    
    // Build query filters
    const query: any = {};
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (customerId) query.customerId = customerId;
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;
    
    // Get total count for pagination
    const total = await Sale.countDocuments(query);
    
    // Get sales with pagination
    const sales = await Sale.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('sellerId', 'firstName lastName')
      .populate('items.productId', 'name sku costPrice sellingPrice')
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Transform the data to match expected structure
    const transformedSales = sales.map(sale => ({
      ...sale,
      customer: sale.customerId,
      seller: sale.sellerId,
      items: sale.items.map(item => ({
        ...item,
        product: item.productId
      }))
    }));
    
    return data({
      success: true,
      data: transformedSales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Error in sales loader:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to load sales'
      },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sale
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty parts
    
    if (method === 'POST') {
      // Check if this is a refund request
      if (url.pathname.includes('/refund') && pathParts.length >= 4) {
        // For path like /api/sales/123/refund, pathParts = ['api', 'sales', '123', 'refund']
        const saleId = pathParts[2]; // Get the sale ID
        return await handleRefund(request, saleId);
      }
      
      // Regular sale creation
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
      
      // Generate receipt number
      const generateReceiptNumber = async () => {
        try {
          const date = new Date();
          const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
          const count = await Sale.countDocuments({
            createdAt: {
              $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
          });
          return `RCP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
        } catch (error) {
          console.error('Error generating receipt number:', error);
          return `RCP-${Date.now()}`;
        }
      };

      const receiptNumber = await generateReceiptNumber();

      // Create the sale
      const sale = new Sale({
        receiptNumber,
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

// Handle refund functionality
async function handleRefund(request: Request, saleId: string) {
  try {
    const refundData = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return data(
        {
          success: false,
          message: 'Invalid sale ID'
        },
        { status: 400 }
      );
    }
    
    // Find the original sale
    const sale = await Sale.findById(saleId).populate('items.productId', 'name sku costPrice');
    if (!sale) {
      return data(
        {
          success: false,
          message: 'Sale not found'
        },
        { status: 404 }
      );
    }
    
    if (sale.status === 'refunded') {
      return data(
        {
          success: false,
          message: 'Sale has already been fully refunded'
        },
        { status: 400 }
      );
    }
    
    // Validate refund items
    const { items: refundItems, reason, processedBy } = refundData;
    
    if (!refundItems || refundItems.length === 0) {
      return data(
        {
          success: false,
          message: 'Refund items are required'
        },
        { status: 400 }
      );
    }
    
    if (!reason) {
      return data(
        {
          success: false,
          message: 'Refund reason is required'
        },
        { status: 400 }
      );
    }
    
    if (!processedBy) {
      return data(
        {
          success: false,
          message: 'Processor ID is required'
        },
        { status: 400 }
      );
    }
    
    // Calculate refund amount and validate quantities
    let refundAmount = 0;
    const refundItemsWithDetails = [];
    
    for (const refundItem of refundItems) {
      const originalItem = sale.items.find(item => 
        item.productId._id.toString() === refundItem.productId
      );
      
      if (!originalItem) {
        return data(
          {
            success: false,
            message: `Product ${refundItem.productId} not found in original sale`
          },
          { status: 400 }
        );
      }
      
      if (refundItem.quantity > originalItem.quantity) {
        return data(
          {
            success: false,
            message: `Cannot refund more than original quantity for ${originalItem.productId.name}`
          },
          { status: 400 }
        );
      }
      
      const itemRefundAmount = (originalItem.unitPrice * refundItem.quantity) - 
        (originalItem.discount * refundItem.quantity / originalItem.quantity);
      
      refundAmount += itemRefundAmount;
      
      refundItemsWithDetails.push({
        productId: refundItem.productId,
        quantity: refundItem.quantity,
        unitPrice: originalItem.unitPrice,
        discount: originalItem.discount * refundItem.quantity / originalItem.quantity,
        discountType: originalItem.discountType,
        totalPrice: itemRefundAmount
      });
      
      // Update product stock (add back refunded items)
      const product = await Product.findById(refundItem.productId);
      if (product) {
        const previousStock = product.stockQuantity;
        const newStock = previousStock + refundItem.quantity;
        
        try {
          const updateResult = await Product.findByIdAndUpdate(
            refundItem.productId,
            { 
              stockQuantity: newStock,
              updatedAt: new Date()
            },
            { new: true } // Return updated document
          );
          
          // Create stock movement record for refund
          const stockMovement = await StockMovement.create({
            productId: refundItem.productId,
            type: 'return',
            quantity: refundItem.quantity,
            previousStock,
            newStock,
            unitCost: product.costPrice,
            totalValue: refundItem.quantity * product.costPrice,
            reference: `REFUND-${sale.receiptNumber}`,
            notes: `Refund: ${sale.receiptNumber} - ${reason}`,
            userId: processedBy
          });
        } catch (stockError) {
          console.error(`Error updating stock for product ${refundItem.productId}:`, stockError);
          throw stockError;
        }
      } else {
        return data(
          {
            success: false,
            message: `Product ${refundItem.productId} not found`
          },
          { status: 404 }
        );
      }
    }
    
    // Calculate tax refund proportionally
    const taxRefund = (refundAmount / sale.subtotal) * sale.taxAmount;
    const totalRefund = refundAmount + taxRefund;
    
    // Generate refund number
    const generateRefundNumber = async () => {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await Sale.countDocuments({
        receiptNumber: { $regex: `^REF-${dateStr}` }
      });
      return `REF-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    };
    
    const refundNumber = await generateRefundNumber();
    
    // Create refund record (as a sale with negative amounts)
    const refund = new Sale({
      receiptNumber: refundNumber,
      customerId: sale.customerId,
      sellerId: processedBy,
      items: refundItemsWithDetails,
      subtotal: -refundAmount,
      taxAmount: -taxRefund,
      discountAmount: 0,
      totalAmount: -totalRefund,
      amountPaid: -totalRefund,
      changeAmount: 0,
      payments: [{
        method: 'refund',
        amount: -totalRefund,
        reference: sale.receiptNumber,
        status: 'completed'
      }],
      status: 'completed',
      notes: `Refund for ${sale.receiptNumber}: ${reason}`,
      saleDate: new Date()
    });
    
    await refund.save();
    
    // Update original sale status
    const isFullRefund = refundItemsWithDetails.every(refundItem => {
      const originalItem = sale.items.find(item => 
        item.productId._id.toString() === refundItem.productId
      );
      return originalItem && refundItem.quantity === originalItem.quantity;
    }) && refundItemsWithDetails.length === sale.items.length;
    
    if (isFullRefund) {
      sale.status = 'refunded';
    } else {
      sale.status = 'partially_refunded';
    }
    
    await sale.save();
    
    // Update customer statistics if customer exists
    if (sale.customerId) {
      await Customer.findByIdAndUpdate(
        sale.customerId,
        {
          $inc: {
            totalSpent: -totalRefund,
            loyaltyPoints: -Math.floor(totalRefund) // Remove points for refunded amount
          }
        }
      );
    }
    
    // Populate the refund for response
    await refund.populate('customerId', 'firstName lastName email phone');
    await refund.populate('sellerId', 'firstName lastName');
    await refund.populate('items.productId', 'name sku');
    
    return data({
      success: true,
      data: {
        refund,
        originalSale: sale,
        refundAmount: totalRefund
      },
      message: 'Refund processed successfully'
    });
    
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to process refund'
      },
      { status: 500 }
    );
  }
} 