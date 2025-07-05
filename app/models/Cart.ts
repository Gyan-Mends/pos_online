import mongoose, { Schema, Document } from 'mongoose';

export interface CartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  variations?: Array<{
    name: string;
    value: string;
    additionalCost: number;
  }>;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  variations: [{
    name: { type: String, required: true },
    value: { type: String, required: true },
    additionalCost: { type: Number, default: 0 }
  }]
});

const CartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true // Allows null for guest carts
  },
  sessionId: {
    type: String,
    sparse: true // For guest carts
  },
  items: [CartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: { expireAfterSeconds: 0 }
  }
});

// Indexes for performance
CartSchema.index({ userId: 1, updatedAt: -1 });
CartSchema.index({ sessionId: 1, updatedAt: -1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to calculate totals
CartSchema.pre('save', function(this: ICart) {
  this.updatedAt = new Date();
  
  // Calculate totals
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => {
    const variationCost = item.variations?.reduce((varSum, variation) => 
      varSum + variation.additionalCost, 0) || 0;
    return sum + ((item.price + variationCost) * item.quantity);
  }, 0);
});

// Helper method to add item to cart
CartSchema.methods.addItem = function(productId: string, quantity: number, price: number, variations?: any[]) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId && 
    JSON.stringify(item.variations) === JSON.stringify(variations)
  );
  
  if (existingItemIndex >= 0) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      price,
      variations: variations || []
    });
  }
};

// Helper method to update item quantity
CartSchema.methods.updateItemQuantity = function(productId: string, quantity: number, variations?: any[]) {
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId && 
    JSON.stringify(item.variations) === JSON.stringify(variations)
  );
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
    }
  }
};

// Helper method to remove item from cart
CartSchema.methods.removeItem = function(productId: string, variations?: any[]) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId && 
      JSON.stringify(item.variations) === JSON.stringify(variations))
  );
};

// Helper method to clear cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalAmount = 0;
  this.totalItems = 0;
};

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema); 