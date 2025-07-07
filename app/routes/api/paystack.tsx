import { data } from 'react-router';

// CORS Headers for cross-origin requests
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});

// Paystack configuration - Replace with your own test key from dashboard.paystack.com
// TODO: Replace with your actual Paystack test secret key
const PAYSTACK_SECRET_KEY = 'sk_test_7b025b4ea02131b362f09b5027f9a1bb67d2a106';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Helper function to verify transaction with Paystack
async function verifyPaystackTransaction(reference: string) {
  try {
    console.log('🔍 Verifying transaction with Paystack:', reference);

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('💳 Paystack verification result:', result);

    return result;
  } catch (error: any) {
    console.error('❌ Error verifying with Paystack:', error);
    throw error;
  }
}

// POST /api/paystack - Handle Paystack operations
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Cart } = await import('../../models/Cart');
    const { default: Product } = await import('../../models/Product');
    const { default: Sale } = await import('../../models/Sale');
    const { default: Order } = await import('../../models/Order');
    const { default: StockMovement } = await import('../../models/StockMovement');
    const { default: Customer } = await import('../../models/Customer');
    const { default: User } = await import('../../models/User');
    const method = request.method;
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: getCorsHeaders()
      });
    }
    
    if (method !== 'POST') {
      return data(
        {
          success: false,
          message: 'Method not allowed'
        },
        { 
          status: 405,
          headers: getCorsHeaders()
        }
      );
    }

    const { action: paystackAction, reference, amount, email, userId, sessionId } = await request.json();

    switch (paystackAction) {
      case 'verify': {
        // Verify transaction
        if (!reference) {
          return data(
            {
              success: false,
              message: 'Transaction reference is required'
            },
            { 
              status: 400,
              headers: getCorsHeaders()
            }
          );
        }

        try {
          const paystackResult = await verifyPaystackTransaction(reference);

          if (paystackResult.status && paystackResult.data) {
            const transactionData = paystackResult.data;

            // Check if transaction was successful
            if (transactionData.status === 'success') {
              console.log('✅ Transaction verified successfully:', {
                reference: transactionData.reference,
                amount: transactionData.amount,
                status: transactionData.status,
                gateway_response: transactionData.gateway_response
              });

              // Process order after successful payment
              try {
                console.log('🔍 Processing order - metadata:', JSON.stringify(transactionData.metadata, null, 2));
                console.log('🔍 User ID:', userId);
                console.log('🔍 Session ID:', sessionId);
                
                // Find the cart with items populated
                let cart = null;
                if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                  cart = await Cart.findOne({ userId }).populate('items.product');
                  console.log('🛒 Found cart by userId:', cart ? cart._id : 'null');
                } else if (sessionId) {
                  cart = await Cart.findOne({ sessionId }).populate('items.product');
                  console.log('🛒 Found cart by sessionId:', cart ? cart._id : 'null');
                }
                
                // Also try to find cart by cart_id from metadata
                if (!cart && transactionData.metadata?.cart_id) {
                  const cartId = transactionData.metadata.cart_id;
                  if (mongoose.Types.ObjectId.isValid(cartId)) {
                    cart = await Cart.findById(cartId).populate('items.product');
                    console.log('🛒 Found cart by metadata cart_id:', cart ? cart._id : 'null');
                  }
                }
                
                if (cart && cart.items.length > 0) {
                  console.log('🛒 Processing order for cart:', cart._id, 'with', cart.items.length, 'items');
                  
                  // Extract customer info from payment metadata
                  const customerData = transactionData.metadata?.customer || {};
                  console.log('👤 Customer data from metadata:', customerData);
                  
                  // Create or find customer
                  let customer = null;
                  if (customerData.email) {
                    customer = await Customer.findOne({ email: customerData.email });
                    if (!customer) {
                      customer = new Customer({
                        firstName: customerData.firstName || 'Guest',
                        lastName: customerData.lastName || 'Customer',
                        email: customerData.email,
                        phone: customerData.phone || '',
                        totalPurchases: 0,
                        totalSpent: 0
                      });
                      await customer.save();
                      console.log('👤 New customer created:', customer._id);
                    }
                  }
                  
                  // Find or create a system user for e-commerce sales
                  let systemUser = await User.findOne({ role: 'admin' });
                  if (!systemUser) {
                    systemUser = new User({
                      firstName: 'E-commerce',
                      lastName: 'System',
                      email: 'system@ecommerce.com',
                      password: 'system123',
                      role: 'admin',
                      permissions: ['all']
                    });
                    await systemUser.save();
                    console.log('👤 System user created:', systemUser._id);
                  }
                  
                  // Process each cart item
                  const saleItems = [];
                  const stockMovements = [];
                  
                  for (const item of cart.items) {
                    // Get the product document (item.product should be populated)
                    const product = typeof item.product === 'object' ? item.product : await Product.findById(item.product);
                    if (!product) {
                      console.error(`Product not found: ${item.product}`);
                      continue;
                    }
                    
                    const quantity = item.quantity;
                    
                    // Check if sufficient stock is available
                    if (product.stockQuantity < quantity) {
                      console.warn(`⚠️  Insufficient stock for product ${product.name}: ${product.stockQuantity} < ${quantity}`);
                      // In a real scenario, you might want to handle this differently
                      // For now, we'll continue with available stock
                    }
                    
                    // Update product stock
                    const previousStock = product.stockQuantity;
                    const newStock = Math.max(0, previousStock - quantity);
                    product.stockQuantity = newStock;
                    await product.save();
                    
                    console.log(`📦 Stock updated for ${product.name}: ${previousStock} -> ${newStock}`);
                    
                    // Create stock movement record
                    const stockMovement = new StockMovement({
                      productId: product._id,
                      type: 'sale',
                      quantity: -quantity, // Negative because it's a sale
                      previousStock,
                      newStock,
                      unitCost: product.costPrice,
                      totalValue: product.costPrice * quantity,
                      reference: transactionData.reference,
                      notes: `E-commerce sale - Payment ref: ${transactionData.reference}`,
                      userId: systemUser._id
                    });
                    await stockMovement.save();
                    stockMovements.push(stockMovement);
                    
                    // Create sale item
                    saleItems.push({
                      productId: product._id,
                      quantity,
                      unitPrice: item.price,
                      discount: 0,
                      discountType: 'percentage',
                      totalPrice: item.price * quantity
                    });
                  }
                  
                  // Create order record for tracking
                  const orderItems = [];
                  for (const item of cart.items) {
                    const product = typeof item.product === 'object' ? item.product : await Product.findById(item.product);
                    if (product) {
                      orderItems.push({
                        productId: product._id,
                        name: product.name,
                        sku: product.sku,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: item.price * item.quantity,
                        variations: item.variations || []
                      });
                    }
                  }

                  console.log('🔄 Creating order with data:', {
                    customerId: customer ? customer._id : undefined,
                    customerEmail: customerData.email,
                    itemCount: orderItems.length,
                    totalAmount: transactionData.amount / 100
                  });

                  const order = new Order({
                    customerId: customer ? customer._id : undefined,
                    customerInfo: {
                      firstName: customerData.firstName || 'Guest',
                      lastName: customerData.lastName || 'Customer',
                      email: customerData.email,
                      phone: customerData.phone || ''
                    },
                    items: orderItems,
                    subtotal: cart.totalAmount,
                    shippingCost: 0, // Will be calculated based on shipping method
                    taxAmount: 0, // Tax is handled in frontend
                    discountAmount: 0,
                    totalAmount: transactionData.amount / 100, // Convert from pesewas
                    status: 'confirmed', // Start with confirmed since payment is complete
                    shippingAddress: {
                      fullName: transactionData.metadata?.shipping?.fullName || `${customerData.firstName || 'Guest'} ${customerData.lastName || 'Customer'}`,
                      address: transactionData.metadata?.shipping?.address || 'Address not provided',
                      city: transactionData.metadata?.shipping?.city || 'Not specified',
                      state: transactionData.metadata?.shipping?.state || 'Not specified',
                      zipCode: transactionData.metadata?.shipping?.zipCode || '00000',
                      country: transactionData.metadata?.shipping?.country || 'US',
                      phone: transactionData.metadata?.shipping?.phone || customerData.phone || ''
                    },
                    shippingMethod: transactionData.metadata?.shipping_method || 'standard',
                    paymentInfo: {
                      method: 'mobile_money',
                      reference: transactionData.reference,
                      amount: transactionData.amount / 100,
                      currency: transactionData.currency || 'GHS',
                      status: 'completed',
                      gateway: 'paystack',
                      transactionId: transactionData.id
                    },
                    priority: 'normal',
                    source: 'ecommerce',
                    notes: `E-commerce order - Payment gateway: ${transactionData.gateway_response}`,
                    orderDate: new Date(),
                    confirmedAt: new Date()
                  });

                  console.log('🔄 Order created (before save), orderNumber:', order.orderNumber);

                  // Generate order number manually if not set (fallback)
                  if (!order.orderNumber) {
                    const date = new Date();
                    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                    const timestamp = Date.now().toString().slice(-4);
                    order.orderNumber = `ORD-${dateStr}-${timestamp}`;
                    console.log('🔢 Generated order number manually:', order.orderNumber);
                  }

                  // Add initial status to history
                  order.statusHistory.push({
                    status: 'confirmed',
                    timestamp: new Date(),
                    notes: 'Order confirmed after successful payment',
                    updatedBy: systemUser._id
                  });

                  try {
                    await order.save();
                    console.log('📦 Order created successfully:', order.orderNumber);
                    console.log('📦 Order details:', {
                      id: order._id,
                      orderNumber: order.orderNumber,
                      status: order.status,
                      totalAmount: order.totalAmount,
                      customerEmail: order.customerInfo.email,
                      itemCount: order.items.length
                    });
                  } catch (orderSaveError: any) {
                    console.error('❌ Error saving order:', orderSaveError);
                    throw orderSaveError; // Re-throw to be caught by the outer catch
                  }

                  // Create sale record for accounting
                  const sale = new Sale({
                    customerId: customer ? customer._id : undefined,
                    sellerId: systemUser._id,
                    items: saleItems,
                    subtotal: cart.totalAmount,
                    taxAmount: 0, // Tax is handled in frontend
                    discountAmount: 0,
                    totalAmount: transactionData.amount / 100, // Convert from pesewas
                    amountPaid: transactionData.amount / 100,
                    changeAmount: 0,
                    payments: [{
                      method: 'mobile_money', // Assuming mobile money for Ghana
                      amount: transactionData.amount / 100,
                      reference: transactionData.reference,
                      status: 'completed'
                    }],
                    status: 'completed',
                    notes: `E-commerce order ${order.orderNumber} - Payment gateway: ${transactionData.gateway_response}`
                  });
                  await sale.save();
                  
                  console.log('💰 Sale created successfully:', sale.receiptNumber);
                  
                  // Update customer stats
                  if (customer) {
                    customer.totalPurchases += 1;
                    customer.totalSpent += transactionData.amount / 100;
                    customer.loyaltyPoints += Math.floor((transactionData.amount / 100) * 0.1); // 10% loyalty rate
                    await customer.save();
                    console.log('👤 Customer stats updated:', customer.email);
                  }
                  
                  // Clear cart after successful processing
                  cart.items = [];
                  cart.totalAmount = 0;
                  cart.totalItems = 0;
                  await cart.save();
                  console.log('🛒 Cart cleared successfully after order processing');
                  
                } else {
                  console.log('🛒 No cart found or cart is empty');
                  console.log('🔍 Debug info:');
                  console.log('  - userId:', userId);
                  console.log('  - sessionId:', sessionId);
                  console.log('  - metadata cart_id:', transactionData.metadata?.cart_id);
                  console.log('  - cart found:', cart ? 'yes' : 'no');
                  console.log('  - cart items count:', cart ? cart.items.length : 'N/A');
                  
                  // Still create order with minimal data from payment metadata
                  if (transactionData.metadata?.customer && transactionData.metadata?.order_items) {
                    console.log('🔄 Creating order from payment metadata only');
                    
                    const customerData = transactionData.metadata.customer;
                    
                    // Create or find customer
                    let customer = null;
                    if (customerData.email) {
                      customer = await Customer.findOne({ email: customerData.email });
                      if (!customer) {
                        customer = new Customer({
                          firstName: customerData.firstName || 'Guest',
                          lastName: customerData.lastName || 'Customer',
                          email: customerData.email,
                          phone: customerData.phone || '',
                          totalPurchases: 0,
                          totalSpent: 0
                        });
                        await customer.save();
                        console.log('👤 New customer created from metadata:', customer._id);
                      }
                    }
                    
                    // Find or create a system user
                    let systemUser = await User.findOne({ role: 'admin' });
                    if (!systemUser) {
                      systemUser = new User({
                        firstName: 'E-commerce',
                        lastName: 'System',
                        email: 'system@ecommerce.com',
                        password: 'system123',
                        role: 'admin',
                        permissions: ['all']
                      });
                      await systemUser.save();
                      console.log('👤 System user created:', systemUser._id);
                    }
                    
                    // Create order items from metadata
                    const orderItems = transactionData.metadata.order_items.map((item: any) => ({
                      productId: new mongoose.Types.ObjectId(), // Temporary - would need product lookup
                      name: item.name,
                      sku: item.name.replace(/\s+/g, '-').toLowerCase(),
                      quantity: item.quantity,
                      unitPrice: item.unit_price,
                      totalPrice: item.total_price,
                      variations: []
                    }));
                    
                    console.log('🔄 Creating fallback order with data:', {
                      customerId: customer ? customer._id : undefined,
                      customerEmail: customerData.email,
                      itemCount: orderItems.length,
                      totalAmount: transactionData.amount / 100
                    });

                    const order = new Order({
                      customerId: customer ? customer._id : undefined,
                      customerInfo: {
                        firstName: customerData.firstName || 'Guest',
                        lastName: customerData.lastName || 'Customer',
                        email: customerData.email,
                        phone: customerData.phone || ''
                      },
                      items: orderItems,
                      subtotal: transactionData.metadata.order_total || (transactionData.amount / 100),
                      shippingCost: 0,
                      taxAmount: 0,
                      discountAmount: 0,
                      totalAmount: transactionData.amount / 100,
                      status: 'confirmed',
                      shippingAddress: {
                        fullName: transactionData.metadata.shipping?.fullName || `${customerData.firstName || 'Guest'} ${customerData.lastName || 'Customer'}`,
                        address: transactionData.metadata.shipping?.address || 'Address not provided',
                        city: transactionData.metadata.shipping?.city || 'Not specified',
                        state: transactionData.metadata.shipping?.state || 'Not specified',
                        zipCode: transactionData.metadata.shipping?.zipCode || '00000',
                        country: transactionData.metadata.shipping?.country || 'US',
                        phone: transactionData.metadata.shipping?.phone || customerData.phone || ''
                      },
                      shippingMethod: transactionData.metadata.shipping_method || 'standard',
                      paymentInfo: {
                        method: 'card',
                        reference: transactionData.reference,
                        amount: transactionData.amount / 100,
                        currency: transactionData.currency || 'USD',
                        status: 'completed',
                        gateway: 'paystack',
                        transactionId: transactionData.id
                      },
                      priority: 'normal',
                      source: 'ecommerce',
                      notes: `E-commerce order - Payment gateway: ${transactionData.gateway_response}`,
                      orderDate: new Date(),
                      confirmedAt: new Date()
                    });

                    console.log('🔄 Fallback order created (before save), orderNumber:', order.orderNumber);
                    
                    // Generate order number manually if not set (fallback)
                    if (!order.orderNumber) {
                      const date = new Date();
                      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                      const timestamp = Date.now().toString().slice(-4);
                      order.orderNumber = `ORD-${dateStr}-${timestamp}`;
                      console.log('🔢 Generated fallback order number manually:', order.orderNumber);
                    }
                    
                    // Add initial status to history
                    order.statusHistory.push({
                      status: 'confirmed',
                      timestamp: new Date(),
                      notes: 'Order confirmed after successful payment (created from payment metadata)',
                      updatedBy: systemUser._id
                    });
                    
                    try {
                      await order.save();
                      console.log('📦 Order created from metadata successfully:', order.orderNumber);
                    } catch (orderSaveError: any) {
                      console.error('❌ Error saving order from metadata:', orderSaveError);
                    }
                  }
                }
              } catch (orderError: any) {
                console.error('❌ Error processing order:', orderError);
                // Don't fail the payment verification if order processing fails
                // The payment was successful, so we still return success
              }

              return data({
                success: true,
                verified: true,
                data: {
                  reference: transactionData.reference,
                  amount: transactionData.amount / 100, // Convert from pesewas to GHS
                  currency: transactionData.currency,
                  status: transactionData.status,
                  gateway_response: transactionData.gateway_response,
                  paid_at: transactionData.paid_at,
                  customer: transactionData.customer,
                  authorization: transactionData.authorization,
                  metadata: transactionData.metadata
                },
                message: 'Payment verified successfully'
              }, {
                headers: getCorsHeaders()
              });
            } else {
              console.log('❌ Transaction not successful:', transactionData.status);

              return data({
                success: true,
                verified: false,
                data: {
                  reference: transactionData.reference,
                  status: transactionData.status,
                  gateway_response: transactionData.gateway_response
                },
                message: `Payment verification failed: ${transactionData.gateway_response}`
              }, {
                headers: getCorsHeaders()
              });
            }
          } else {
            throw new Error('Invalid response from Paystack');
          }
        } catch (error: any) {
          console.error('❌ Paystack verification error:', error);

          return data(
            {
              success: false,
              verified: false,
              message: `Payment verification failed: ${error.message}`
            },
            { 
              status: 500,
              headers: getCorsHeaders()
            }
          );
        }
      }

      case 'initialize': {
        // Initialize transaction (optional - for future use)
        if (!email || !amount) {
          return data(
            {
              success: false,
              message: 'Email and amount are required'
            },
            { 
              status: 400,
              headers: getCorsHeaders()
            }
          );
        }

        try {
          const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              amount: Math.round(amount * 100), // Convert to pesewas (GHS * 100)
              currency: 'GHS', // Ghanaian Cedi
              channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
            }),
          });

          if (!response.ok) {
            throw new Error(`Paystack API error: ${response.status}`);
          }

          const result = await response.json();

          if (result.status) {
            return data({
              success: true,
              data: {
                authorization_url: result.data.authorization_url,
                access_code: result.data.access_code,
                reference: result.data.reference
              },
              message: 'Transaction initialized successfully'
            }, {
              headers: getCorsHeaders()
            });
          } else {
            throw new Error(result.message || 'Failed to initialize transaction');
          }
        } catch (error: any) {
          console.error('❌ Paystack initialization error:', error);

          return data(
            {
              success: false,
              message: `Payment initialization failed: ${error.message}`
            },
            { 
              status: 500,
              headers: getCorsHeaders()
            }
          );
        }
      }

      default: {
        return data(
          {
            success: false,
            message: 'Invalid action. Use: verify or initialize'
          },
          { 
            status: 400,
            headers: getCorsHeaders()
          }
        );
      }
    }
  } catch (error: any) {
    console.error('❌ Error in paystack action:', error);
    
    return data(
      {
        success: false,
        message: error.message || 'Paystack operation failed'
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}

// GET /api/paystack - Handle GET requests (for testing)
export async function loader({ request }: { request: Request }) {
  return data({
    success: true,
    message: 'Paystack API is running',
    endpoints: {
      verify: 'POST /api/paystack with { action: "verify", reference: "xxx" }',
      initialize: 'POST /api/paystack with { action: "initialize", email: "xxx", amount: 100 }'
    }
  }, {
    headers: getCorsHeaders()
  });
} 