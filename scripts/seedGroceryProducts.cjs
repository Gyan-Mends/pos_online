const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection - Use local database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_v2';

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

// Categories for grocery store
const categories = [
  {
    name: 'Food Items',
    description: 'Basic food items and groceries'
  },
  {
    name: 'Beverages',
    description: 'Drinks and beverages'
  },
  {
    name: 'Toiletries & Personal Care',
    description: 'Personal hygiene and care products'
  },
  {
    name: 'Cleaning Products',
    description: 'Household cleaning supplies'
  },
  {
    name: 'Household Items',
    description: 'General household items and utilities'
  },
  {
    name: 'Snacks & Confectionery',
    description: 'Snacks, candies and confectionery items'
  },
  {
    name: 'Baby Products',
    description: 'Baby care and feeding products'
  },
  {
    name: 'Stationery',
    description: 'School and office supplies'
  }
];

// Helper function to generate SKU
function generateSKU(category, name) {
  const prefix = category.substring(0, 3).toUpperCase();
  const nameCode = name.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${nameCode}${random}`;
}

// Helper function to generate barcode
function generateBarcode() {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000;
}

// Helper function to calculate cost price (60-70% of selling price)
function calculateCostPrice(sellingPrice) {
  const margin = 0.65 + (Math.random() * 0.1); // 65-75% cost
  return Math.round(sellingPrice * margin * 100) / 100;
}

// Helper function to generate random stock quantity
function generateStockQuantity(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

    // Food Items Category
    const foodCategory = createdCategories.find(c => c.name === 'Food Items');
    const foodProducts = [
      { name: 'Rice (5kg bag)', price: 45.00, unit: 'bags', stock: [20, 50] },
      { name: 'Rice (1kg sachet)', price: 9.50, unit: 'sachets', stock: [100, 200] },
      { name: 'Gari (1kg)', price: 8.00, unit: 'kg', stock: [50, 100] },
      { name: 'Maize (1kg)', price: 6.50, unit: 'kg', stock: [80, 150] },
      { name: 'Beans - Black Eye (1kg)', price: 12.00, unit: 'kg', stock: [40, 80] },
      { name: 'Beans - Red (1kg)', price: 11.50, unit: 'kg', stock: [40, 80] },
      { name: 'Sugar - White (1kg)', price: 7.50, unit: 'kg', stock: [100, 200] },
      { name: 'Sugar - Brown (1kg)', price: 8.50, unit: 'kg', stock: [60, 120] },
      { name: 'Salt - Iodized (1kg)', price: 3.50, unit: 'kg', stock: [150, 300] },
      { name: 'Salt - Sea Salt (500g)', price: 4.50, unit: 'packs', stock: [80, 150] },
      { name: 'Cooking Oil - Vegetable (1L)', price: 15.00, unit: 'liters', stock: [60, 120] },
      { name: 'Cooking Oil - Palm (1L)', price: 12.00, unit: 'liters', stock: [60, 120] },
      { name: 'Cooking Oil - Sunflower (1L)', price: 18.00, unit: 'liters', stock: [40, 80] },
      { name: 'Tomato Paste (70g sachet)', price: 2.50, unit: 'sachets', stock: [200, 400] },
      { name: 'Tomato Paste (400g tin)', price: 8.00, unit: 'tins', stock: [80, 150] },
      { name: 'Canned Fish - Sardines (155g)', price: 6.50, unit: 'tins', stock: [100, 200] },
      { name: 'Canned Fish - Tuna (185g)', price: 12.00, unit: 'tins', stock: [60, 120] },
      { name: 'Canned Fish - Mackerel (155g)', price: 7.50, unit: 'tins', stock: [80, 150] },
      { name: 'Canned Meat - Corned Beef (340g)', price: 18.00, unit: 'tins', stock: [50, 100] },
      { name: 'Canned Meat - Luncheon Meat (340g)', price: 16.00, unit: 'tins', stock: [50, 100] },
      { name: 'Noodles - Indomie (70g)', price: 1.50, unit: 'packs', stock: [300, 600] },
      { name: 'Noodles - Tasty Tom (70g)', price: 1.80, unit: 'packs', stock: [250, 500] },
      { name: 'Spaghetti (500g)', price: 4.50, unit: 'packs', stock: [120, 250] },
      { name: 'Macaroni (500g)', price: 4.00, unit: 'packs', stock: [120, 250] },
      { name: 'Flour - Wheat (1kg)', price: 6.00, unit: 'kg', stock: [100, 200] },
      { name: 'Flour - Corn (1kg)', price: 5.50, unit: 'kg', stock: [80, 150] },
      { name: 'Baking Powder (100g)', price: 3.50, unit: 'packs', stock: [80, 150] },
      { name: 'Seasoning Cubes - Maggi (120g)', price: 4.50, unit: 'packs', stock: [150, 300] },
      { name: 'Seasoning Cubes - Knorr (120g)', price: 4.00, unit: 'packs', stock: [150, 300] },
      { name: 'Pepper - Dry (100g)', price: 5.00, unit: 'packs', stock: [100, 200] },
      { name: 'Milk - Powdered (400g)', price: 25.00, unit: 'tins', stock: [60, 120] },
      { name: 'Milk - Evaporated (410g)', price: 8.50, unit: 'tins', stock: [80, 150] },
      { name: 'Milo (400g)', price: 28.00, unit: 'tins', stock: [50, 100] },
      { name: 'Ovaltine (400g)', price: 26.00, unit: 'tins', stock: [50, 100] },
      { name: 'Tea - Lipton (100 bags)', price: 12.00, unit: 'boxes', stock: [80, 150] },
      { name: 'Tea - Top Tea (100 bags)', price: 10.50, unit: 'boxes', stock: [80, 150] },
      { name: 'Bread - White (500g)', price: 3.50, unit: 'loaves', stock: [200, 400] },
      { name: 'Biscuits - Assorted (200g)', price: 4.50, unit: 'packs', stock: [150, 300] },
      { name: 'Groundnut - Raw (1kg)', price: 15.00, unit: 'kg', stock: [40, 80] },
      { name: 'Groundnut - Roasted (500g)', price: 12.00, unit: 'packs', stock: [60, 120] },
      { name: 'Eggs (30 pieces)', price: 25.00, unit: 'trays', stock: [50, 100] }
    ];

    foodProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Quality ${product.name.toLowerCase()}`,
        sku: generateSKU('Food', product.name),
        barcode: generateBarcode().toString(),
        categoryId: foodCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 0, // Food items often have 0% tax
        supplier: 'Local Suppliers',
        location: 'Food Section'
      });
    });

    // Beverages Category
    const beveragesCategory = createdCategories.find(c => c.name === 'Beverages');
    const beverageProducts = [
      { name: 'Bottled Water (500ml)', price: 2.00, unit: 'bottles', stock: [200, 500] },
      { name: 'Bottled Water (1L)', price: 3.50, unit: 'bottles', stock: [150, 300] },
      { name: 'Coca-Cola (330ml)', price: 3.00, unit: 'cans', stock: [200, 400] },
      { name: 'Coca-Cola (500ml)', price: 4.50, unit: 'bottles', stock: [150, 300] },
      { name: 'Fanta (330ml)', price: 3.00, unit: 'cans', stock: [150, 300] },
      { name: 'Sprite (330ml)', price: 3.00, unit: 'cans', stock: [150, 300] },
      { name: 'Energy Drink - Rush (250ml)', price: 6.00, unit: 'cans', stock: [80, 150] },
      { name: 'Energy Drink - Lucozade (330ml)', price: 7.50, unit: 'bottles', stock: [60, 120] },
      { name: 'Beer - Star (330ml)', price: 8.00, unit: 'bottles', stock: [100, 200] },
      { name: 'Beer - Gulder (330ml)', price: 8.50, unit: 'bottles', stock: [100, 200] }
    ];

    beverageProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Refreshing ${product.name.toLowerCase()}`,
        sku: generateSKU('Bev', product.name),
        barcode: generateBarcode().toString(),
        categoryId: beveragesCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Beverage Distributors',
        location: 'Beverages Section'
      });
    });

    // Toiletries & Personal Care Category
    const toiletriesCategory = createdCategories.find(c => c.name === 'Toiletries & Personal Care');
    const toiletriesProducts = [
      { name: 'Soap - Toilet (100g)', price: 2.50, unit: 'bars', stock: [200, 400] },
      { name: 'Soap - Medicated (100g)', price: 4.00, unit: 'bars', stock: [100, 200] },
      { name: 'Soap - Laundry (200g)', price: 3.50, unit: 'bars', stock: [150, 300] },
      { name: 'Toothpaste (100g)', price: 5.00, unit: 'tubes', stock: [120, 250] },
      { name: 'Toothbrush', price: 2.00, unit: 'pcs', stock: [150, 300] },
      { name: 'Sanitary Pads (10 pieces)', price: 8.00, unit: 'packs', stock: [100, 200] },
      { name: 'Roll-on Deodorant (50ml)', price: 6.50, unit: 'bottles', stock: [80, 150] },
      { name: 'Detergent - Omo (1kg)', price: 12.00, unit: 'packs', stock: [80, 150] },
      { name: 'Detergent - Ariel (1kg)', price: 13.50, unit: 'packs', stock: [80, 150] },
      { name: 'Body Cream (200ml)', price: 8.00, unit: 'bottles', stock: [60, 120] },
      { name: 'Vaseline (100g)', price: 4.50, unit: 'tins', stock: [100, 200] },
      { name: 'Shampoo (200ml)', price: 10.00, unit: 'bottles', stock: [60, 120] },
      { name: 'Shaving Stick', price: 3.00, unit: 'pcs', stock: [80, 150] },
      { name: 'Tissue Paper (200 sheets)', price: 3.50, unit: 'rolls', stock: [150, 300] },
      { name: 'Baby Diapers (Size 1, 30 pcs)', price: 25.00, unit: 'packs', stock: [50, 100] },
      { name: 'Baby Wipes (80 pieces)', price: 8.50, unit: 'packs', stock: [80, 150] }
    ];

    toiletriesProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Quality ${product.name.toLowerCase()}`,
        sku: generateSKU('Toi', product.name),
        barcode: generateBarcode().toString(),
        categoryId: toiletriesCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Personal Care Suppliers',
        location: 'Toiletries Section'
      });
    });

    // Cleaning Products Category
    const cleaningCategory = createdCategories.find(c => c.name === 'Cleaning Products');
    const cleaningProducts = [
      { name: 'Bleach - Parazone (500ml)', price: 4.50, unit: 'bottles', stock: [80, 150] },
      { name: 'Bleach - Jik (500ml)', price: 4.00, unit: 'bottles', stock: [80, 150] },
      { name: 'Antiseptic - Dettol (500ml)', price: 8.00, unit: 'bottles', stock: [60, 120] },
      { name: 'Antiseptic - Savlon (100ml)', price: 3.50, unit: 'bottles', stock: [100, 200] },
      { name: 'Disinfectant - Izal (500ml)', price: 5.50, unit: 'bottles', stock: [60, 120] },
      { name: 'Broom', price: 8.00, unit: 'pcs', stock: [40, 80] },
      { name: 'Scrubbing Brush', price: 3.50, unit: 'pcs', stock: [60, 120] },
      { name: 'Bucket (10L)', price: 12.00, unit: 'pcs', stock: [30, 60] },
      { name: 'Bowl (5L)', price: 8.00, unit: 'pcs', stock: [40, 80] },
      { name: 'Mop', price: 15.00, unit: 'pcs', stock: [20, 40] }
    ];

    cleaningProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Effective ${product.name.toLowerCase()}`,
        sku: generateSKU('Cle', product.name),
        barcode: generateBarcode().toString(),
        categoryId: cleaningCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Cleaning Supplies Co.',
        location: 'Cleaning Section'
      });
    });

    // Household Items Category
    const householdCategory = createdCategories.find(c => c.name === 'Household Items');
    const householdProducts = [
      { name: 'Matches (50 pieces)', price: 1.50, unit: 'boxes', stock: [200, 400] },
      { name: 'Lighter', price: 2.00, unit: 'pcs', stock: [150, 300] },
      { name: 'Charcoal (5kg)', price: 25.00, unit: 'bags', stock: [40, 80] },
      { name: 'Firewood (Bundle)', price: 15.00, unit: 'bundles', stock: [30, 60] },
      { name: 'Candles (6 pieces)', price: 3.00, unit: 'packs', stock: [100, 200] },
      { name: 'Torchlight', price: 12.00, unit: 'pcs', stock: [40, 80] },
      { name: 'Batteries - AA (4 pieces)', price: 8.00, unit: 'packs', stock: [80, 150] },
      { name: 'Batteries - AAA (4 pieces)', price: 7.50, unit: 'packs', stock: [80, 150] },
      { name: 'Light Bulb - LED (9W)', price: 6.00, unit: 'pcs', stock: [60, 120] },
      { name: 'Mosquito Coils (10 pieces)', price: 4.50, unit: 'packs', stock: [100, 200] },
      { name: 'Insecticide Spray (400ml)', price: 8.50, unit: 'cans', stock: [60, 120] }
    ];

    householdProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Essential ${product.name.toLowerCase()}`,
        sku: generateSKU('Hou', product.name),
        barcode: generateBarcode().toString(),
        categoryId: householdCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Household Suppliers',
        location: 'Household Section'
      });
    });

    // Snacks & Confectionery Category
    const snacksCategory = createdCategories.find(c => c.name === 'Snacks & Confectionery');
    const snacksProducts = [
      { name: 'Toffees (Assorted)', price: 1.00, unit: 'packs', stock: [300, 600] },
      { name: 'Candies (Mixed)', price: 0.50, unit: 'pcs', stock: [500, 1000] },
      { name: 'Chocolate Bar (50g)', price: 3.50, unit: 'bars', stock: [150, 300] },
      { name: 'Chewing Gum (5 pieces)', price: 1.50, unit: 'packs', stock: [200, 400] },
      { name: 'Plantain Chips (100g)', price: 4.00, unit: 'packs', stock: [100, 200] },
      { name: 'Groundnut Cake (200g)', price: 3.00, unit: 'packs', stock: [120, 250] },
      { name: 'Popcorn (100g)', price: 2.50, unit: 'packs', stock: [150, 300] },
      { name: 'Ice Cream (Vanilla, 500ml)', price: 15.00, unit: 'tubs', stock: [30, 60] }
    ];

    snacksProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Delicious ${product.name.toLowerCase()}`,
        sku: generateSKU('Sna', product.name),
        barcode: generateBarcode().toString(),
        categoryId: snacksCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Snack Distributors',
        location: 'Snacks Section'
      });
    });

    // Baby Products Category
    const babyCategory = createdCategories.find(c => c.name === 'Baby Products');
    const babyProducts = [
      { name: 'Baby Milk Formula (400g)', price: 45.00, unit: 'tins', stock: [40, 80] },
      { name: 'Cerelac (400g)', price: 35.00, unit: 'tins', stock: [50, 100] },
      { name: 'Baby Soap (100g)', price: 3.50, unit: 'bars', stock: [100, 200] },
      { name: 'Baby Powder (200g)', price: 8.00, unit: 'tins', stock: [80, 150] },
      { name: 'Feeding Bottle (250ml)', price: 12.00, unit: 'pcs', stock: [30, 60] }
    ];

    babyProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Safe and gentle ${product.name.toLowerCase()}`,
        sku: generateSKU('Bab', product.name),
        barcode: generateBarcode().toString(),
        categoryId: babyCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 0, // Baby products often have 0% tax
        supplier: 'Baby Care Suppliers',
        location: 'Baby Section'
      });
    });

    // Stationery Category
    const stationeryCategory = createdCategories.find(c => c.name === 'Stationery');
    const stationeryProducts = [
      { name: 'Pen - Blue', price: 1.50, unit: 'pcs', stock: [200, 400] },
      { name: 'Pen - Black', price: 1.50, unit: 'pcs', stock: [200, 400] },
      { name: 'Pencil - HB', price: 0.50, unit: 'pcs', stock: [300, 600] },
      { name: 'Exercise Book (40 pages)', price: 2.50, unit: 'pcs', stock: [150, 300] },
      { name: 'Eraser', price: 0.80, unit: 'pcs', stock: [250, 500] },
      { name: 'Ruler (30cm)', price: 1.20, unit: 'pcs', stock: [120, 250] },
      { name: 'Envelopes (10 pieces)', price: 3.00, unit: 'packs', stock: [80, 150] }
    ];

    stationeryProducts.forEach(product => {
      const costPrice = calculateCostPrice(product.price);
      const stockQuantity = generateStockQuantity(product.stock[0], product.stock[1]);
      
      products.push({
        name: product.name,
        description: `Quality ${product.name.toLowerCase()}`,
        sku: generateSKU('Sta', product.name),
        barcode: generateBarcode().toString(),
        categoryId: stationeryCategory._id,
        price: product.price,
        costPrice: costPrice,
        stockQuantity: stockQuantity,
        minStockLevel: Math.floor(product.stock[0] * 0.3),
        maxStockLevel: product.stock[1],
        unitOfMeasure: product.unit,
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Stationery Suppliers',
        location: 'Stationery Section'
      });
    });

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('\n🎉 Grocery store database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Low stock items: ${products.filter(p => p.stockQuantity <= p.minStockLevel).length}`);

    // Display category breakdown
    console.log('\n📊 Category Breakdown:');
    categories.forEach(category => {
      const categoryProducts = products.filter(p => p.categoryId && p.categoryId.toString() === category._id?.toString());
      console.log(`- ${category.name}: ${categoryProducts.length} products`);
    });

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