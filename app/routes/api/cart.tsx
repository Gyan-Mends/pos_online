import { data } from 'react-router';
import { handlePreflight, corsResponse } from '../../utils/cors';

// Helper function to get or create cart
async function getOrCreateCart(userId?: string, sessionId?: string) {
  // Import server-only modules
  await import('../../mongoose.server');
  const mongoose = await import('mongoose');
  const { default: Cart } = await import('../../models/Cart');
  
  let cart;
  
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    // For authenticated users
    cart = await Cart.findOne({ userId }).populate('items.product', 'name price images stockQuantity');
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }
  } else if (sessionId) {
    // For guest users
    cart = await Cart.findOne({ sessionId }).populate('items.product', 'name price images stockQuantity');
    if (!cart) {
      cart = new Cart({ sessionId });
      await cart.save();
    }
  } else {
    throw new Error('Either userId or sessionId is required');
  }
  
  return cart;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS({ request }: { request: Request }) {
  return handlePreflight(request);
}

// GET /api/cart - Get user's cart
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return corsResponse({
        success: false,
        message: 'Either userId or sessionId is required'
      }, { status: 400 }, request);
    }

    const cart = await getOrCreateCart(userId || undefined, sessionId || undefined);

    return corsResponse({
      success: true,
      data: cart
    }, {}, request);
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return corsResponse({
      success: false,
      message: error.message || 'Failed to fetch cart'
    }, { status: 500 }, request);
  }
}

// POST /api/cart - Cart operations (add, update, remove, clear)
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Product } = await import('../../models/Product');
    
    const method = request.method;
    const { action: cartAction, userId, sessionId, productId, quantity, variations } = await request.json();

    if (!userId && !sessionId) {
      return corsResponse({
        success: false,
        message: 'Either userId or sessionId is required'
      }, { status: 400 }, request);
    }

    const cart = await getOrCreateCart(userId, sessionId);

    switch (cartAction) {
      case 'add': {
        // Add item to cart
        if (!productId || !quantity) {
          return corsResponse({
            success: false,
            message: 'ProductId and quantity are required'
          }, { status: 400 }, request);
        }

        // Validate product exists and has stock
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
          return corsResponse({
            success: false,
            message: 'Product not found or inactive'
          }, { status: 404 }, request);
        }

        if (product.stockQuantity < quantity) {
          return corsResponse({
            success: false,
            message: `Only ${product.stockQuantity} items available in stock`
          }, { status: 400 }, request);
        }

        // Add item to cart
        cart.addItem(productId, quantity, product.price, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return corsResponse({
          success: true,
          data: cart,
          message: 'Item added to cart successfully'
        }, {}, request);
      }

      case 'update': {
        // Update item quantity
        if (!productId || quantity === undefined) {
          return corsResponse({
            success: false,
            message: 'ProductId and quantity are required'
          }, { status: 400 }, request);
        }

        if (quantity > 0) {
          // Validate stock availability
          const product = await Product.findById(productId);
          if (product && product.stockQuantity < quantity) {
            return corsResponse({
              success: false,
              message: `Only ${product.stockQuantity} items available in stock`
            }, { status: 400 }, request);
          }
        }

        cart.updateItemQuantity(productId, quantity, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return corsResponse({
          success: true,
          data: cart,
          message: quantity > 0 ? 'Cart updated successfully' : 'Item removed from cart'
        }, {}, request);
      }

      case 'remove': {
        // Remove item from cart
        if (!productId) {
          return corsResponse({
            success: false,
            message: 'ProductId is required'
          }, { status: 400 }, request);
        }

        cart.removeItem(productId, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return corsResponse({
          success: true,
          data: cart,
          message: 'Item removed from cart successfully'
        }, {}, request);
      }

      case 'clear': {
        // Clear entire cart
        cart.clearCart();
        await cart.save();

        return corsResponse({
          success: true,
          data: cart,
          message: 'Cart cleared successfully'
        }, {}, request);
      }

      default:
        return corsResponse({
          success: false,
          message: 'Invalid action. Use: add, update, remove, or clear'
        }, { status: 400 }, request);
    }
  } catch (error: any) {
    console.error('Error in cart action:', error);
    return corsResponse({
      success: false,
      message: error.message || 'Cart operation failed'
    }, { status: 500 }, request);
  }
} 