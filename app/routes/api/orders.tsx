import { data } from 'react-router';

// Helper function to get current user (for status updates)
async function getCurrentUser(request: Request) {
  // Import server-only modules
  await import('../../mongoose.server');
  const { default: User } = await import('../../models/User');
  
  // In a real implementation, you'd extract user from session/token
  // For now, we'll find any admin user
  const user = await User.findOne({ role: 'admin' });
  return user;
}

// Helper function to convert order to sale
async function convertOrderToSale(order: any, currentUser: any) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Sale } = await import('../../models/Sale');
    
    // Check if sale already exists for this order
    const existingSale = await Sale.findOne({ orderNumber: order.orderNumber });
    if (existingSale) {
      console.log(`Sale already exists for order ${order.orderNumber}`);
      return existingSale;
    }

    // Create sale from order
    const saleData = {
      customerId: order.customerId,
      sellerId: currentUser._id,
      orderNumber: order.orderNumber,
      source: order.source || 'ecommerce',
      items: order.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        discountType: 'percentage',
        totalPrice: item.totalPrice
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      amountPaid: order.totalAmount,
      changeAmount: 0,
      payments: [{
        method: order.paymentInfo.method,
        amount: order.totalAmount,
        reference: order.paymentInfo.reference,
        status: 'completed'
      }],
      status: 'completed',
      notes: `Sale from e-commerce order ${order.orderNumber}`,
      saleDate: order.deliveredAt || new Date()
    };

    const sale = new Sale(saleData);
    await sale.save();

    console.log(`Successfully created sale for order ${order.orderNumber}`);
    return sale;

  } catch (error) {
    console.error('Error converting order to sale:', error);
    throw error;
  }
}

// GET /api/orders - Get all orders with filtering and pagination
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Order } = await import('../../models/Order');
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const source = url.searchParams.get('source');
    const search = url.searchParams.get('search');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Build query
    const query: any = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
        { 'customerInfo.lastName': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
      if (dateTo) query.orderDate.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders with population
    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName')
      .populate('packedBy', 'firstName lastName')
      .populate('shippedBy', 'firstName lastName')
      .populate('statusHistory.updatedBy', 'firstName lastName')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Order.countDocuments(query);

    // Calculate stats
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    return data({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats
      }
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch orders'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order or update existing order
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Order } = await import('../../models/Order');
    const method = request.method;
    const formData = await request.formData();
    const action = formData.get('_method') || method;

    switch (action) {
      case 'POST': {
        // Create new order
        const orderData = JSON.parse(formData.get('orderData') as string);
        
        const order = new Order(orderData);
        await order.save();
        
        // Populate for response
        await order.populate('customerId', 'firstName lastName email phone');
        
        return data({
          success: true,
          data: order,
          message: 'Order created successfully'
        });
      }

      case 'PUT': {
        // Update order status
        const orderId = formData.get('orderId') as string;
        const newStatus = formData.get('status') as string;
        const notes = formData.get('notes') as string;
        const trackingNumber = formData.get('trackingNumber') as string;
        const estimatedDelivery = formData.get('estimatedDelivery') as string;
        const assignedTo = formData.get('assignedTo') as string;

        if (!orderId) {
          return data(
            { success: false, message: 'Order ID is required' },
            { status: 400 }
          );
        }

        const order = await Order.findById(orderId);
        if (!order) {
          return data(
            { success: false, message: 'Order not found' },
            { status: 404 }
          );
        }

        // Get current user for status update
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
          return data(
            { success: false, message: 'User not found' },
            { status: 401 }
          );
        }

        // Update status if provided
        if (newStatus && newStatus !== order.status) {
          order.updateStatus(newStatus, notes || '', currentUser._id);
          
          // Set fulfillment user based on status
          switch (newStatus) {
            case 'packed':
              order.packedBy = currentUser._id;
              break;
            case 'shipped':
              order.shippedBy = currentUser._id;
              break;
          }
        }

        // Update other fields
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
        if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
          order.assignedTo = new mongoose.Types.ObjectId(assignedTo);
        }
        if (notes && !newStatus) {
          // Add notes without status change
          order.internalNotes = order.internalNotes 
            ? `${order.internalNotes}\n${new Date().toISOString()}: ${notes}`
            : `${new Date().toISOString()}: ${notes}`;
        }

        await order.save();
        
        // Populate for response
        await order.populate([
          { path: 'customerId', select: 'firstName lastName email phone' },
          { path: 'assignedTo', select: 'firstName lastName' },
          { path: 'packedBy', select: 'firstName lastName' },
          { path: 'shippedBy', select: 'firstName lastName' },
          { path: 'statusHistory.updatedBy', select: 'firstName lastName' }
        ]);

        // Convert order to sale if status is delivered
        if (newStatus === 'delivered') {
          await convertOrderToSale(order, currentUser);
        }

        return data({
          success: true,
          data: order,
          message: 'Order updated successfully'
        });
      }

      case 'DELETE': {
        // Cancel order
        const orderId = formData.get('orderId') as string;
        const reason = formData.get('reason') as string;

        if (!orderId) {
          return data(
            { success: false, message: 'Order ID is required' },
            { status: 400 }
          );
        }

        const order = await Order.findById(orderId);
        if (!order) {
          return data(
            { success: false, message: 'Order not found' },
            { status: 404 }
          );
        }

        // Check if order can be cancelled
        if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
          return data(
            { success: false, message: 'Order cannot be cancelled in current status' },
            { status: 400 }
          );
        }

        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
          return data(
            { success: false, message: 'User not found' },
            { status: 401 }
          );
        }

        order.updateStatus('cancelled', reason || 'Order cancelled', currentUser._id);
        await order.save();

        return data({
          success: true,
          data: order,
          message: 'Order cancelled successfully'
        });
      }

      default:
        return data(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error in order action:', error);
    return data(
      {
        success: false,
        message: error.message || 'Order operation failed'
      },
      { status: 500 }
    );
  }
} 