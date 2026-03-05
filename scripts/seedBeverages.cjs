const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_v2';

// Category Schema
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true }
}, { timestamps: true });

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  barcode: { type: String, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  minStockLevel: { type: Number, required: true, min: 0, default: 5 },
  maxStockLevel: { type: Number, min: 0 },
  unitOfMeasure: { type: String, required: true, default: 'pcs' },
  variations: [{ id: String, name: String, value: String, additionalCost: Number }],
  images: [String],
  isActive: { type: Boolean, default: true },
  taxable: { type: Boolean, default: true },
  taxRate: { type: Number, min: 0, max: 100, default: 0 },
  expiryDate: { type: Date },
  batchNumber: { type: String, trim: true },
  supplier: { type: String, trim: true },
  location: { type: String, trim: true }
}, { timestamps: true });

const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);

function generateBarcode() {
  return '49' + Math.random().toString().slice(2, 13).padEnd(11, '0');
}

async function seedBeverages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Seed the Beverages category
    console.log('\nSeeding Beverages category...');
    let category = await Category.findOne({ name: 'Beverages' });
    if (category) {
      console.log('Beverages category already exists, using existing one.');
    } else {
      category = await Category.create({
        name: 'Beverages',
        description: 'Drinks, juices, sodas, coffee, tea, and other beverages'
      });
      console.log('Created Beverages category');
    }

    const categoryId = category._id;

    // Step 2: Seed 10 beverage products
    const beverages = [
      {
        name: 'Coca-Cola Classic',
        description: 'The original Coca-Cola carbonated soft drink, 330ml can',
        sku: 'BEV-COKE-001',
        barcode: generateBarcode(),
        categoryId,
        price: 1.50,
        costPrice: 0.85,
        stockQuantity: 200,
        minStockLevel: 50,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1567103472667-6898f3a79cf2?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Coca-Cola Distributors',
        location: 'Shelf A1'
      },
      {
        name: 'Pepsi Cola',
        description: 'Pepsi carbonated soft drink, 330ml can',
        sku: 'BEV-PEPS-002',
        barcode: generateBarcode(),
        categoryId,
        price: 1.50,
        costPrice: 0.80,
        stockQuantity: 180,
        minStockLevel: 50,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1553456558-aff63285bdd1?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'PepsiCo Distributors',
        location: 'Shelf A1'
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice, 500ml bottle',
        sku: 'BEV-OJ-003',
        barcode: generateBarcode(),
        categoryId,
        price: 3.99,
        costPrice: 2.20,
        stockQuantity: 80,
        minStockLevel: 20,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Premium Coffee Latte',
        description: 'Ready-to-drink coffee latte, smooth and creamy, 250ml',
        sku: 'BEV-COFF-004',
        barcode: generateBarcode(),
        categoryId,
        price: 4.50,
        costPrice: 2.50,
        stockQuantity: 100,
        minStockLevel: 25,
        maxStockLevel: 300,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1524240485266-07dd6863d4ae?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Roast & Brew Ltd.',
        location: 'Fridge B1'
      },
      {
        name: 'Organic Green Tea',
        description: 'Organic Japanese green tea, brewed and bottled, 500ml',
        sku: 'BEV-GTEA-005',
        barcode: generateBarcode(),
        categoryId,
        price: 2.99,
        costPrice: 1.50,
        stockQuantity: 120,
        minStockLevel: 30,
        maxStockLevel: 250,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1622704430654-efc23177434a?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Green Leaf Imports',
        location: 'Shelf A3'
      },
      {
        name: 'Red Bull Energy Drink',
        description: 'Red Bull energy drink, 250ml can - gives you wings',
        sku: 'BEV-RBUL-006',
        barcode: generateBarcode(),
        categoryId,
        price: 3.49,
        costPrice: 2.00,
        stockQuantity: 150,
        minStockLevel: 40,
        maxStockLevel: 400,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1613218222876-954978a4404e?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Red Bull Distributors',
        location: 'Shelf A2'
      },
      {
        name: 'Natural Mineral Water',
        description: 'Pure natural mineral water, 500ml bottle',
        sku: 'BEV-WATR-007',
        barcode: generateBarcode(),
        categoryId,
        price: 0.99,
        costPrice: 0.35,
        stockQuantity: 300,
        minStockLevel: 100,
        maxStockLevel: 600,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1675914861279-921639cd47e1?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Spring Valley Inc.',
        location: 'Shelf A4'
      },
      {
        name: 'Classic Lemonade',
        description: 'Refreshing homestyle lemonade, 350ml bottle',
        sku: 'BEV-LMND-008',
        barcode: generateBarcode(),
        categoryId,
        price: 2.49,
        costPrice: 1.20,
        stockQuantity: 90,
        minStockLevel: 20,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1513558003720-343f3a99d97b?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Mango Smoothie',
        description: 'Tropical mango smoothie blend, thick and creamy, 400ml',
        sku: 'BEV-MNGO-009',
        barcode: generateBarcode(),
        categoryId,
        price: 4.99,
        costPrice: 2.80,
        stockQuantity: 60,
        minStockLevel: 15,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Tropical Blends Co.',
        location: 'Fridge B3'
      },
      {
        name: 'Hot Chocolate Mix',
        description: 'Rich and creamy hot chocolate drink, 300ml ready-to-drink',
        sku: 'BEV-HCHC-010',
        barcode: generateBarcode(),
        categoryId,
        price: 3.79,
        costPrice: 1.90,
        stockQuantity: 75,
        minStockLevel: 20,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1692776406655-24873779e52a?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Choco Delight Ltd.',
        location: 'Shelf A3'
      }
    ];

    console.log('\nSeeding 10 beverage products...');

    // Remove existing beverages with these SKUs to avoid duplicates
    const skus = beverages.map(b => b.sku);
    const deleted = await Product.deleteMany({ sku: { $in: skus } });
    if (deleted.deletedCount > 0) {
      console.log(`Removed ${deleted.deletedCount} existing beverage products`);
    }

    for (const bevData of beverages) {
      const product = await Product.create(bevData);
      console.log(`  Created: ${product.name} (${product.sku}) - $${product.price}`);
    }

    console.log('\nSuccessfully seeded 10 beverages!');
    console.log('\nProducts:');
    console.log('  1. Coca-Cola Classic       - $1.50');
    console.log('  2. Pepsi Cola              - $1.50');
    console.log('  3. Fresh Orange Juice      - $3.99');
    console.log('  4. Premium Coffee Latte    - $4.50');
    console.log('  5. Organic Green Tea       - $2.99');
    console.log('  6. Red Bull Energy Drink   - $3.49');
    console.log('  7. Natural Mineral Water   - $0.99');
    console.log('  8. Classic Lemonade        - $2.49');
    console.log('  9. Mango Smoothie          - $4.99');
    console.log(' 10. Hot Chocolate Mix       - $3.79');

  } catch (error) {
    console.error('Error seeding beverages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

seedBeverages();
