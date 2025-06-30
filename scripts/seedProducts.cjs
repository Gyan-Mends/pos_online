const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// Category Schema
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  maxStockLevel: {
    type: Number,
    min: 0
  },
  unitOfMeasure: {
    type: String,
    required: true,
    default: 'pcs'
  },
  variations: [{
    id: String,
    name: String,
    value: String,
    additionalCost: Number
  }],
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Models
const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);

// Sample data
const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and accessories'
  },
  {
    name: 'Clothing',
    description: 'Apparel and fashion items'
  },
  {
    name: 'Food & Beverages',
    description: 'Food items and drinks'
  },
  {
    name: 'Books',
    description: 'Books and educational materials'
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create categories
    console.log('Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create products for each category
    console.log('Creating products...');
    const products = [];

    // Electronics
    const electronicsCategory = createdCategories.find(c => c.name === 'Electronics');
    products.push(
      {
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with advanced features',
        sku: 'IPHONE15PRO',
        barcode: '1234567890123',
        categoryId: electronicsCategory._id,
        price: 999.99,
        costPrice: 750.00,
        stockQuantity: 25,
        minStockLevel: 5,
        maxStockLevel: 100,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Apple Inc.',
        location: 'Electronics Section'
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Premium Android smartphone',
        sku: 'GALAXYS24',
        barcode: '1234567890124',
        categoryId: electronicsCategory._id,
        price: 799.99,
        costPrice: 600.00,
        stockQuantity: 30,
        minStockLevel: 10,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Samsung',
        location: 'Electronics Section'
      },
      {
        name: 'AirPods Pro',
        description: 'Wireless earbuds with noise cancellation',
        sku: 'AIRPODSPRO',
        barcode: '1234567890125',
        categoryId: electronicsCategory._id,
        price: 249.99,
        costPrice: 180.00,
        stockQuantity: 50,
        minStockLevel: 15,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Apple Inc.',
        location: 'Electronics Section'
      }
    );

    // Clothing
    const clothingCategory = createdCategories.find(c => c.name === 'Clothing');
    products.push(
      {
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt',
        sku: 'TSHIRT001',
        barcode: '1234567890126',
        categoryId: clothingCategory._id,
        price: 19.99,
        costPrice: 8.00,
        stockQuantity: 100,
        minStockLevel: 20,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 6.0,
        supplier: 'Textile Co.',
        location: 'Clothing Section'
      },
      {
        name: 'Denim Jeans',
        description: 'Classic blue denim jeans',
        sku: 'JEANS001',
        barcode: '1234567890127',
        categoryId: clothingCategory._id,
        price: 59.99,
        costPrice: 25.00,
        stockQuantity: 75,
        minStockLevel: 15,
        maxStockLevel: 300,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 6.0,
        supplier: 'Denim Works',
        location: 'Clothing Section'
      }
    );

    // Food & Beverages
    const foodCategory = createdCategories.find(c => c.name === 'Food & Beverages');
    products.push(
      {
        name: 'Organic Coffee Beans',
        description: 'Premium organic coffee beans',
        sku: 'COFFEE001',
        barcode: '1234567890128',
        categoryId: foodCategory._id,
        price: 12.99,
        costPrice: 6.50,
        stockQuantity: 200,
        minStockLevel: 50,
        maxStockLevel: 1000,
        unitOfMeasure: 'lbs',
        isActive: true,
        taxable: false,
        taxRate: 0,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        batchNumber: 'CF2024001',
        supplier: 'Coffee Roasters Inc.',
        location: 'Food Section'
      },
      {
        name: 'Sparkling Water',
        description: 'Natural sparkling mineral water',
        sku: 'WATER001',
        barcode: '1234567890129',
        categoryId: foodCategory._id,
        price: 1.99,
        costPrice: 0.75,
        stockQuantity: 500,
        minStockLevel: 100,
        maxStockLevel: 2000,
        unitOfMeasure: 'bottles',
        isActive: true,
        taxable: false,
        taxRate: 0,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        batchNumber: 'SW2024001',
        supplier: 'Pure Water Co.',
        location: 'Beverages Section'
      }
    );

    // Books
    const booksCategory = createdCategories.find(c => c.name === 'Books');
    products.push(
      {
        name: 'JavaScript: The Good Parts',
        description: 'Essential JavaScript programming guide',
        sku: 'BOOK001',
        barcode: '1234567890130',
        categoryId: booksCategory._id,
        price: 29.99,
        costPrice: 15.00,
        stockQuantity: 40,
        minStockLevel: 10,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: false,
        taxRate: 0,
        supplier: 'Tech Books Publisher',
        location: 'Books Section'
      }
    );

    // Home & Garden
    const homeCategory = createdCategories.find(c => c.name === 'Home & Garden');
    products.push(
      {
        name: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with USB charging',
        sku: 'LAMP001',
        barcode: '1234567890131',
        categoryId: homeCategory._id,
        price: 45.99,
        costPrice: 20.00,
        stockQuantity: 60,
        minStockLevel: 15,
        maxStockLevel: 300,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Home Lighting Co.',
        location: 'Home Section'
      },
      {
        name: 'Garden Hose',
        description: '50ft expandable garden hose',
        sku: 'HOSE001',
        barcode: '1234567890132',
        categoryId: homeCategory._id,
        price: 34.99,
        costPrice: 12.00,
        stockQuantity: 3, // Low stock for testing
        minStockLevel: 10,
        maxStockLevel: 100,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Garden Supply Co.',
        location: 'Garden Section'
      }
    );

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Low stock items: ${products.filter(p => p.stockQuantity <= p.minStockLevel).length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase(); 