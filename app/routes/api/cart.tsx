import { data } from 'react-router';
import mongoose from '../../mongoose.server';
import Cart from '../../models/Cart';
import Product from '../../models/Product';

// Helper function to get or create cart
async function getOrCreateCart(userId?: string, sessionId?: string) {
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

// GET /api/cart - Get user's cart
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return data(
        {
          success: false,
          message: 'Either userId or sessionId is required'
        },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart(userId || undefined, sessionId || undefined);

    return data({
      success: true,
      data: cart
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch cart'
      },
      { status: 500 }
    );
  }
}

// POST /api/cart - Cart operations (add, update, remove, clear)
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    const { action: cartAction, userId, sessionId, productId, quantity, variations } = await request.json();

    if (!userId && !sessionId) {
      return data(
        {
          success: false,
          message: 'Either userId or sessionId is required'
        },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart(userId, sessionId);

    switch (cartAction) {
      case 'add': {
        // Add item to cart
        if (!productId || !quantity) {
          return data(
            {
              success: false,
              message: 'ProductId and quantity are required'
            },
            { status: 400 }
          );
        }

        // Validate product exists and has stock
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
          return data(
            {
              success: false,
              message: 'Product not found or inactive'
            },
            { status: 404 }
          );
        }

        if (product.stockQuantity < quantity) {
          return data(
            {
              success: false,
              message: `Only ${product.stockQuantity} items available in stock`
            },
            { status: 400 }
          );
        }

        // Add item to cart
        cart.addItem(productId, quantity, product.price, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return data({
          success: true,
          data: cart,
          message: 'Item added to cart successfully'
        });
      }

      case 'update': {
        // Update item quantity
        if (!productId || quantity === undefined) {
          return data(
            {
              success: false,
              message: 'ProductId and quantity are required'
            },
            { status: 400 }
          );
        }

        if (quantity > 0) {
          // Validate stock availability
          const product = await Product.findById(productId);
          if (product && product.stockQuantity < quantity) {
            return data(
              {
                success: false,
                message: `Only ${product.stockQuantity} items available in stock`
              },
              { status: 400 }
            );
          }
        }

        cart.updateItemQuantity(productId, quantity, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return data({
          success: true,
          data: cart,
          message: quantity > 0 ? 'Cart updated successfully' : 'Item removed from cart'
        });
      }

      case 'remove': {
        // Remove item from cart
        if (!productId) {
          return data(
            {
              success: false,
              message: 'ProductId is required'
            },
            { status: 400 }
          );
        }

        cart.removeItem(productId, variations);
        await cart.save();
        await cart.populate('items.product', 'name price images stockQuantity');

        return data({
          success: true,
          data: cart,
          message: 'Item removed from cart successfully'
        });
      }

      case 'clear': {
        // Clear entire cart
        cart.clearCart();
        await cart.save();

        return data({
          success: true,
          data: cart,
          message: 'Cart cleared successfully'
        });
      }

      default:
        return data(
          {
            success: false,
            message: 'Invalid action. Use: add, update, remove, or clear'
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in cart action:', error);
    return data(
      {
        success: false,
        message: error.message || 'Cart operation failed'
      },
      { status: 500 }
    );
  }
} 