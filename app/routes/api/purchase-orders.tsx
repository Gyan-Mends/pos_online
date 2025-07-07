import { type ActionFunctionArgs, data } from 'react-router';

// GET /api/purchase-orders - Get all purchase orders with pagination and filters
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: PurchaseOrder } = await import('../../models/PurchaseOrder');
    const { default: Supplier } = await import('../../models/Supplier');
    const { default: Product } = await import('../../models/Product');
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const supplierId = url.searchParams.get('supplierId');
    
    const skip = (page - 1) * limit;
    
    // Build search query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (supplierId && supplierId !== 'all') {
      query.supplierId = supplierId;
    }
    
    // Get purchase orders with populated data
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplierId', 'name code contactPerson')
      .populate('createdBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName')
      .populate('items.productId', 'name sku unitOfMeasure')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await PurchaseOrder.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return data({
      success: true,
      data: purchaseOrders,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error in purchase orders API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create, Update, or Receive purchase orders
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: PurchaseOrder } = await import('../../models/PurchaseOrder');
    const { default: Supplier } = await import('../../models/Supplier');
    const { default: Product } = await import('../../models/Product');
    const { default: StockMovement } = await import('../../models/StockMovement');
    
    const method = request.method;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (method === 'POST') {
      // Check if this is a receiving request
      if (pathParts.includes('receive') && pathParts.length >= 4) {
        const purchaseOrderId = pathParts[2]; // /api/purchase-orders/123/receive
        return await handleReceiving(request, purchaseOrderId);
      }
      
      // Regular purchase order creation
      const orderData = await request.json();
      
      // Validate required fields
      if (!orderData.supplierId || !orderData.items || orderData.items.length === 0) {
        return data(
          {
            success: false,
            message: 'Supplier and items are required'
          },
          { status: 400 }
        );
      }
      
      if (!orderData.createdBy) {
        return data(
          {
            success: false,
            message: 'Creator ID is required'
          },
          { status: 400 }
        );
      }
      
      // Validate supplier exists
      const supplier = await Supplier.findById(orderData.supplierId);
      if (!supplier) {
        return data(
          {
            success: false,
            message: 'Supplier not found'
          },
          { status: 404 }
        );
      }
      
      // Validate products exist
      const productIds = orderData.items.map((item: any) => item.productId);
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
      
      // Generate order number
      const generateOrderNumber = async () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await PurchaseOrder.countDocuments({
          orderDate: {
            $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          }
        });
        return `PO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
      };
      
      const orderNumber = await generateOrderNumber();
      
      // Calculate totals
      const items = orderData.items.map((item: any) => ({
        ...item,
        totalCost: item.orderedQuantity * item.unitCost
      }));
      
      const subtotal = items.reduce((sum: number, item: any) => sum + item.totalCost, 0);
      const taxAmount = orderData.taxAmount || 0;
      const shippingCost = orderData.shippingCost || 0;
      const discountAmount = orderData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;
      
      // Create purchase order
      const purchaseOrder = new PurchaseOrder({
        orderNumber,
        supplierId: orderData.supplierId,
        expectedDeliveryDate: orderData.expectedDeliveryDate,
        items,
        subtotal,
        taxAmount,
        shippingCost,
        discountAmount,
        totalAmount,
        paymentTerms: orderData.paymentTerms || supplier.paymentTerms,
        createdBy: orderData.createdBy,
        notes: orderData.notes,
        internalNotes: orderData.internalNotes
      });
      
      await purchaseOrder.save();
      
      // Update supplier statistics
      await Supplier.findByIdAndUpdate(orderData.supplierId, {
        $inc: {
          totalOrders: 1,
          totalSpent: totalAmount
        }
      });
      
      // Populate for response
      await purchaseOrder.populate('supplierId', 'name code contactPerson');
      await purchaseOrder.populate('createdBy', 'firstName lastName');
      await purchaseOrder.populate('items.productId', 'name sku unitOfMeasure');
      
      return data({
        success: true,
        data: purchaseOrder,
        message: 'Purchase order created successfully'
      });
    }
    
    // Handle PUT and DELETE by parsing URL for order ID
    const orderId = pathParts[pathParts.length - 1];
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return data(
        {
          success: false,
          message: 'Invalid purchase order ID'
        },
        { status: 400 }
      );
    }
    
    if (method === 'PUT') {
      const updateData = await request.json();
      
      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
        return data(
          {
            success: false,
            message: 'Purchase order not found'
          },
          { status: 404 }
        );
      }
      
      // Can only update draft orders
      if (purchaseOrder.status !== 'draft') {
        return data(
          {
            success: false,
            message: 'Can only update draft orders'
          },
          { status: 400 }
        );
      }
      
      // Recalculate totals if items changed
      if (updateData.items) {
        const items = updateData.items.map((item: any) => ({
          ...item,
          totalCost: item.orderedQuantity * item.unitCost
        }));
        
        const subtotal = items.reduce((sum: number, item: any) => sum + item.totalCost, 0);
        const taxAmount = updateData.taxAmount || 0;
        const shippingCost = updateData.shippingCost || 0;
        const discountAmount = updateData.discountAmount || 0;
        const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;
        
        updateData.items = items;
        updateData.subtotal = subtotal;
        updateData.totalAmount = totalAmount;
      }
      
      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
        orderId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('supplierId', 'name code contactPerson')
       .populate('createdBy', 'firstName lastName')
       .populate('items.productId', 'name sku unitOfMeasure');
      
      return data({
        success: true,
        data: updatedOrder,
        message: 'Purchase order updated successfully'
      });
    }
    
    if (method === 'DELETE') {
      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
        return data(
          {
            success: false,
            message: 'Purchase order not found'
          },
          { status: 404 }
        );
      }
      
      // Can only delete draft orders
      if (purchaseOrder.status !== 'draft') {
        return data(
          {
            success: false,
            message: 'Can only delete draft orders'
          },
          { status: 400 }
        );
      }
      
      await PurchaseOrder.findByIdAndDelete(orderId);
      
      return data({
        success: true,
        message: 'Purchase order deleted successfully'
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
    console.error('Error in purchase orders API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Handle receiving functionality - THE KEY TO AUTOMATED STOCK UPDATES
async function handleReceiving(request: Request, purchaseOrderId: string) {
  try {
    const receivingData = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
      return data(
        {
          success: false,
          message: 'Invalid purchase order ID'
        },
        { status: 400 }
      );
    }
    
    // Find the purchase order
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId)
      .populate('items.productId', 'name sku costPrice stockQuantity');
    
    if (!purchaseOrder) {
      return data(
        {
          success: false,
          message: 'Purchase order not found'
        },
        { status: 404 }
      );
    }
    
    if (!['sent', 'confirmed', 'partial_received'].includes(purchaseOrder.status)) {
      return data(
        {
          success: false,
          message: 'Purchase order is not in a receivable state'
        },
        { status: 400 }
      );
    }
    
    if (!receivingData.items || receivingData.items.length === 0) {
      return data(
        {
          success: false,
          message: 'Receiving items are required'
        },
        { status: 400 }
      );
    }
    
    if (!receivingData.receivedBy) {
      return data(
        {
          success: false,
          message: 'Receiver ID is required'
        },
        { status: 400 }
      );
    }
    
    // Process each received item
    const stockMovements = [];
    let hasErrors = false;
    const errors = [];
    
    for (const receivingItem of receivingData.items) {
      // Find the corresponding order item
      const orderItem = purchaseOrder.items.find(
        item => item.productId._id.toString() === receivingItem.productId
      );
      
      if (!orderItem) {
        errors.push(`Product ${receivingItem.productId} not found in purchase order`);
        hasErrors = true;
        continue;
      }
      
      // Validate received quantity
      const newReceivedQty = orderItem.receivedQuantity + receivingItem.receivedQuantity;
      if (newReceivedQty > orderItem.orderedQuantity) {
        errors.push(`Cannot receive more than ordered quantity for ${orderItem.productId.name}`);
        hasErrors = true;
        continue;
      }
      
      if (receivingItem.receivedQuantity <= 0) {
        continue; // Skip items with no received quantity
      }
      
      // Update product stock - THIS IS THE AUTOMATED PART!
      const product = await Product.findById(receivingItem.productId);
      if (product) {
        const previousStock = product.stockQuantity;
        const newStock = previousStock + receivingItem.receivedQuantity;
        
        // Update product stock
        await Product.findByIdAndUpdate(
          receivingItem.productId,
          { 
            stockQuantity: newStock,
            updatedAt: new Date()
          }
        );
        
        // Create stock movement record
        const stockMovement = await StockMovement.create({
          productId: receivingItem.productId,
          type: 'purchase',
          quantity: receivingItem.receivedQuantity,
          previousStock,
          newStock,
          unitCost: orderItem.unitCost,
          totalValue: receivingItem.receivedQuantity * orderItem.unitCost,
          reference: purchaseOrder.orderNumber,
          notes: `Purchase Order: ${purchaseOrder.orderNumber}${receivingItem.notes ? ` - ${receivingItem.notes}` : ''}`,
          userId: receivingData.receivedBy
        });
        
        stockMovements.push(stockMovement);
        
        // Update received quantity in purchase order
        orderItem.receivedQuantity = newReceivedQty;
        if (receivingItem.notes) {
          orderItem.notes = receivingItem.notes;
        }
      }
    }
    
    if (hasErrors) {
      return data(
        {
          success: false,
          message: 'Receiving failed',
          errors
        },
        { status: 400 }
      );
    }
    
    // Update purchase order status
    const isFullyReceived = purchaseOrder.items.every(
      item => item.receivedQuantity >= item.orderedQuantity
    );
    const isPartiallyReceived = purchaseOrder.items.some(
      item => item.receivedQuantity > 0
    );
    
    if (isFullyReceived) {
      purchaseOrder.status = 'fully_received';
      purchaseOrder.actualDeliveryDate = receivingData.actualDeliveryDate || new Date();
    } else if (isPartiallyReceived) {
      purchaseOrder.status = 'partial_received';
    }
    
    purchaseOrder.receivedBy = receivingData.receivedBy;
    purchaseOrder.receivingNotes = receivingData.receivingNotes;
    purchaseOrder.updatedAt = new Date();
    
    await purchaseOrder.save();
    
    // Populate for response
    await purchaseOrder.populate('supplierId', 'name code contactPerson');
    await purchaseOrder.populate('createdBy', 'firstName lastName');
    await purchaseOrder.populate('receivedBy', 'firstName lastName');
    await purchaseOrder.populate('items.productId', 'name sku unitOfMeasure');
    
    return data({
      success: true,
      data: {
        purchaseOrder,
        stockMovements,
        message: `Successfully received items. ${stockMovements.length} products updated.`
      },
      message: 'Items received and stock updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error in receiving:', error);
    return data(
      {
        success: false,
        message: error.message || 'Error processing receiving'
      },
      { status: 500 }
    );
  }
} 