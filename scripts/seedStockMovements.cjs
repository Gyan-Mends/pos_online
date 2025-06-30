const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pos');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas (same as in the models)
const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  price: Number,
  costPrice: Number,
  stockQuantity: Number,
  // ... other fields
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  // ... other fields
});

const stockMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage', 'expired'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  unitCost: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  reference: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);

const seedStockMovements = async () => {
  try {
    // Clear existing stock movements
    await StockMovement.deleteMany({});
    console.log('🧹 Cleared existing stock movements');

    // Get some products and users to reference
    const products = await Product.find().limit(5);
    const users = await User.find().limit(3);
    
    if (products.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    console.log(`📦 Found ${products.length} products and ${users.length} users`);

    const sampleMovements = [];
    const now = new Date();

    // Create movements for each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const user = users[i % users.length]; // Cycle through users
      
      let currentStock = product.stockQuantity || 0;

      // Initial purchase (stock in)
      const purchaseQuantity = 50 + (i * 10);
      const purchaseMovement = {
        productId: product._id,
        type: 'purchase',
        quantity: purchaseQuantity,
        previousStock: currentStock,
        newStock: currentStock + purchaseQuantity,
        unitCost: product.costPrice || 5.00,
        totalValue: purchaseQuantity * (product.costPrice || 5.00),
        reference: `PO-${String(i + 1).padStart(3, '0')}`,
        notes: 'Initial stock purchase from supplier',
        userId: user._id,
        createdAt: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) // 7 days ago
      };
      sampleMovements.push(purchaseMovement);
      currentStock = purchaseMovement.newStock;

      // Some sales (stock out)
      const saleQuantity = 5 + (i * 2);
      const saleMovement = {
        productId: product._id,
        type: 'sale',
        quantity: -saleQuantity,
        previousStock: currentStock,
        newStock: currentStock - saleQuantity,
        unitCost: product.price || 10.00,
        totalValue: saleQuantity * (product.price || 10.00),
        reference: `SALE-${String(i + 1).padStart(3, '0')}`,
        notes: 'Regular customer sale',
        userId: user._id,
        createdAt: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)) // 5 days ago
      };
      sampleMovements.push(saleMovement);
      currentStock = saleMovement.newStock;

      // Adjustment (could be positive or negative)
      if (i % 2 === 0) {
        // Positive adjustment
        const adjustmentQuantity = 3;
        const adjustmentMovement = {
          productId: product._id,
          type: 'adjustment',
          quantity: adjustmentQuantity,
          previousStock: currentStock,
          newStock: currentStock + adjustmentQuantity,
          unitCost: 0,
          totalValue: 0,
          reference: `ADJ-${String(i + 1).padStart(3, '0')}`,
          notes: 'Found additional items during inventory count',
          userId: user._id,
          createdAt: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)) // 3 days ago
        };
        sampleMovements.push(adjustmentMovement);
        currentStock = adjustmentMovement.newStock;
      } else {
        // Negative adjustment (damage)
        const damageQuantity = 2;
        const damageMovement = {
          productId: product._id,
          type: 'damage',
          quantity: -damageQuantity,
          previousStock: currentStock,
          newStock: currentStock - damageQuantity,
          unitCost: 0,
          totalValue: 0,
          reference: `DMG-${String(i + 1).padStart(3, '0')}`,
          notes: 'Items damaged during handling',
          userId: user._id,
          createdAt: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)) // 2 days ago
        };
        sampleMovements.push(damageMovement);
        currentStock = damageMovement.newStock;
      }

      // Return (stock back in)
      if (i % 3 === 0) {
        const returnQuantity = 1;
        const returnMovement = {
          productId: product._id,
          type: 'return',
          quantity: returnQuantity,
          previousStock: currentStock,
          newStock: currentStock + returnQuantity,
          unitCost: product.price || 10.00,
          totalValue: returnQuantity * (product.price || 10.00),
          reference: `RET-${String(i + 1).padStart(3, '0')}`,
          notes: 'Customer return - item unused',
          userId: user._id,
          createdAt: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)) // 1 day ago
        };
        sampleMovements.push(returnMovement);
        currentStock = returnMovement.newStock;
      }

      // Update the product's current stock
      await Product.findByIdAndUpdate(product._id, { 
        stockQuantity: currentStock,
        updatedAt: new Date()
      });
    }

    // Insert all movements
    await StockMovement.insertMany(sampleMovements);
    console.log(`✅ Successfully seeded ${sampleMovements.length} stock movements`);
    
    // Show summary
    const movementCounts = await StockMovement.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Movement Summary:');
    movementCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count} movements`);
    });

  } catch (error) {
    console.error('❌ Error seeding stock movements:', error);
    console.error(error.stack);
  }
};

const main = async () => {
  await connectDB();
  await seedStockMovements();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
};

main(); 