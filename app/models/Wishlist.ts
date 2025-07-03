import mongoose from 'mongoose';

export interface IWishlistItem {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends mongoose.Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const WishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const WishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  items: [WishlistItemSchema],
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
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for guest users
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ sessionId: 1 });
WishlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure either userId or sessionId is present
WishlistSchema.pre('save', function(next) {
  if (!this.userId && !this.sessionId) {
    return next(new Error('Either userId or sessionId must be provided'));
  }
  next();
});

// Remove expired guest wishlists
WishlistSchema.pre('save', function(next) {
  if (!this.userId && this.sessionId) {
    // Set expiration for guest users only
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  } else if (this.userId) {
    // Remove expiration for authenticated users
    this.expiresAt = undefined;
  }
  next();
});

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema); 