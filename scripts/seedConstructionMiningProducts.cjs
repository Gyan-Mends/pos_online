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

// Sample data for Construction and Mining
const categories = [
  {
    name: 'Construction Tools',
    description: 'Hand tools and power tools for construction work'
  },
  {
    name: 'Building Materials',
    description: 'Construction materials and supplies'
  },
  {
    name: 'Safety Equipment',
    description: 'Personal protective equipment and safety gear'
  },
  {
    name: 'Mining Equipment',
    description: 'Heavy machinery and equipment for mining operations'
  },
  {
    name: 'Gold Mining Supplies',
    description: 'Specialized equipment and supplies for gold mining'
  },
  {
    name: 'Surveying & Measurement',
    description: 'Surveying equipment and measurement tools'
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

    // Construction Tools
    const constructionToolsCategory = createdCategories.find(c => c.name === 'Construction Tools');
    products.push(
      {
        name: 'Heavy Duty Hammer',
        description: 'Professional grade 20oz claw hammer for construction',
        sku: 'HAMMER001',
        barcode: 'CON001001',
        categoryId: constructionToolsCategory._id,
        price: 45.99,
        costPrice: 25.00,
        stockQuantity: 50,
        minStockLevel: 10,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Professional Tools Co.',
        location: 'Tool Section A'
      },
      {
        name: 'Cordless Drill Set',
        description: '20V lithium-ion cordless drill with 2 batteries',
        sku: 'DRILL001',
        barcode: 'CON001002',
        categoryId: constructionToolsCategory._id,
        price: 199.99,
        costPrice: 120.00,
        stockQuantity: 25,
        minStockLevel: 5,
        maxStockLevel: 100,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Power Tools Inc.',
        location: 'Tool Section B'
      },
      {
        name: 'Circular Saw',
        description: '7-1/4 inch circular saw with laser guide',
        sku: 'SAW001',
        barcode: 'CON001003',
        categoryId: constructionToolsCategory._id,
        price: 89.99,
        costPrice: 55.00,
        stockQuantity: 30,
        minStockLevel: 8,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Power Tools Inc.',
        location: 'Tool Section B'
      }
    );

    // Building Materials
    const buildingMaterialsCategory = createdCategories.find(c => c.name === 'Building Materials');
    products.push(
      {
        name: 'Portland Cement',
        description: 'Type I Portland cement, 94lb bag',
        sku: 'CEMENT001',
        barcode: 'CON002001',
        categoryId: buildingMaterialsCategory._id,
        price: 12.99,
        costPrice: 8.50,
        stockQuantity: 200,
        minStockLevel: 50,
        maxStockLevel: 1000,
        unitOfMeasure: 'bags',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Cement Supply Co.',
        location: 'Materials Yard'
      },
      {
        name: 'Rebar Steel',
        description: '1/2 inch rebar, 20ft length',
        sku: 'REBAR001',
        barcode: 'CON002002',
        categoryId: buildingMaterialsCategory._id,
        price: 15.99,
        costPrice: 10.00,
        stockQuantity: 150,
        minStockLevel: 30,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Steel Supply Inc.',
        location: 'Materials Yard'
      },
      {
        name: 'Concrete Blocks',
        description: '8x8x16 inch concrete blocks',
        sku: 'BLOCK001',
        barcode: 'CON002003',
        categoryId: buildingMaterialsCategory._id,
        price: 2.49,
        costPrice: 1.50,
        stockQuantity: 1000,
        minStockLevel: 200,
        maxStockLevel: 5000,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Block Manufacturing Co.',
        location: 'Materials Yard'
      },
      {
        name: 'Plywood Sheets',
        description: '4x8 foot plywood, 3/4 inch thickness',
        sku: 'PLYWOOD001',
        barcode: 'CON002004',
        categoryId: buildingMaterialsCategory._id,
        price: 45.99,
        costPrice: 30.00,
        stockQuantity: 80,
        minStockLevel: 20,
        maxStockLevel: 300,
        unitOfMeasure: 'sheets',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Lumber Supply Co.',
        location: 'Materials Yard'
      }
    );

    // Safety Equipment
    const safetyEquipmentCategory = createdCategories.find(c => c.name === 'Safety Equipment');
    products.push(
      {
        name: 'Hard Hat',
        description: 'ANSI certified hard hat with suspension',
        sku: 'HARDHAT001',
        barcode: 'CON003001',
        categoryId: safetyEquipmentCategory._id,
        price: 24.99,
        costPrice: 15.00,
        stockQuantity: 100,
        minStockLevel: 25,
        maxStockLevel: 400,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Safety Gear Pro',
        location: 'Safety Section'
      },
      {
        name: 'Safety Glasses',
        description: 'ANSI Z87.1 certified safety glasses',
        sku: 'GLASSES001',
        barcode: 'CON003002',
        categoryId: safetyEquipmentCategory._id,
        price: 12.99,
        costPrice: 7.50,
        stockQuantity: 200,
        minStockLevel: 50,
        maxStockLevel: 800,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Safety Gear Pro',
        location: 'Safety Section'
      },
      {
        name: 'Work Gloves',
        description: 'Leather work gloves, size L',
        sku: 'GLOVES001',
        barcode: 'CON003003',
        categoryId: safetyEquipmentCategory._id,
        price: 18.99,
        costPrice: 11.00,
        stockQuantity: 150,
        minStockLevel: 30,
        maxStockLevel: 600,
        unitOfMeasure: 'pairs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Safety Gear Pro',
        location: 'Safety Section'
      },
      {
        name: 'Safety Vest',
        description: 'High visibility safety vest, ANSI Class 2',
        sku: 'VEST001',
        barcode: 'CON003004',
        categoryId: safetyEquipmentCategory._id,
        price: 15.99,
        costPrice: 9.00,
        stockQuantity: 75,
        minStockLevel: 20,
        maxStockLevel: 300,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Safety Gear Pro',
        location: 'Safety Section'
      }
    );

    // Mining Equipment
    const miningEquipmentCategory = createdCategories.find(c => c.name === 'Mining Equipment');
    products.push(
      {
        name: 'Excavator Bucket',
        description: 'Heavy duty excavator bucket, 1.5 cubic yards',
        sku: 'BUCKET001',
        barcode: 'MIN001001',
        categoryId: miningEquipmentCategory._id,
        price: 2500.00,
        costPrice: 1800.00,
        stockQuantity: 8,
        minStockLevel: 2,
        maxStockLevel: 20,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Mining Equipment Co.',
        location: 'Heavy Equipment Yard'
      },
      {
        name: 'Drill Bits Set',
        description: 'Tungsten carbide drill bits for rock drilling',
        sku: 'DRILLBITS001',
        barcode: 'MIN001002',
        categoryId: miningEquipmentCategory._id,
        price: 450.00,
        costPrice: 280.00,
        stockQuantity: 15,
        minStockLevel: 5,
        maxStockLevel: 50,
        unitOfMeasure: 'sets',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Mining Equipment Co.',
        location: 'Heavy Equipment Yard'
      },
      {
        name: 'Conveyor Belt',
        description: 'Heavy duty conveyor belt, 24 inch width, 50ft length',
        sku: 'CONVEYOR001',
        barcode: 'MIN001003',
        categoryId: miningEquipmentCategory._id,
        price: 1200.00,
        costPrice: 800.00,
        stockQuantity: 12,
        minStockLevel: 3,
        maxStockLevel: 30,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Mining Equipment Co.',
        location: 'Heavy Equipment Yard'
      }
    );

    // Gold Mining Supplies
    const goldMiningCategory = createdCategories.find(c => c.name === 'Gold Mining Supplies');
    products.push(
      {
        name: 'Gold Pan',
        description: 'Professional gold pan, 14 inch diameter',
        sku: 'GOLDPAN001',
        barcode: 'MIN002001',
        categoryId: goldMiningCategory._id,
        price: 29.99,
        costPrice: 18.00,
        stockQuantity: 60,
        minStockLevel: 15,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Gold Mining Supply Co.',
        location: 'Gold Mining Section'
      },
      {
        name: 'Metal Detector',
        description: 'Professional metal detector for gold prospecting',
        sku: 'DETECTOR001',
        barcode: 'MIN002002',
        categoryId: goldMiningCategory._id,
        price: 599.99,
        costPrice: 350.00,
        stockQuantity: 20,
        minStockLevel: 5,
        maxStockLevel: 50,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Gold Mining Supply Co.',
        location: 'Gold Mining Section'
      },
      {
        name: 'Sluice Box',
        description: 'Aluminum sluice box for gold recovery',
        sku: 'SLUICE001',
        barcode: 'MIN002003',
        categoryId: goldMiningCategory._id,
        price: 199.99,
        costPrice: 120.00,
        stockQuantity: 25,
        minStockLevel: 8,
        maxStockLevel: 80,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Gold Mining Supply Co.',
        location: 'Gold Mining Section'
      },
      {
        name: 'Mercury (for Gold Recovery)',
        description: 'Pure mercury for gold amalgamation, 1lb bottle',
        sku: 'MERCURY001',
        barcode: 'MIN002004',
        categoryId: goldMiningCategory._id,
        price: 89.99,
        costPrice: 55.00,
        stockQuantity: 40,
        minStockLevel: 10,
        maxStockLevel: 100,
        unitOfMeasure: 'bottles',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Chemical Supply Co.',
        location: 'Gold Mining Section',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        batchNumber: 'MERC2024001'
      },
      {
        name: 'Gold Testing Kit',
        description: 'Complete kit for testing gold purity',
        sku: 'TESTKIT001',
        barcode: 'MIN002005',
        categoryId: goldMiningCategory._id,
        price: 149.99,
        costPrice: 90.00,
        stockQuantity: 30,
        minStockLevel: 8,
        maxStockLevel: 100,
        unitOfMeasure: 'kits',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Gold Mining Supply Co.',
        location: 'Gold Mining Section'
      }
    );

    // Surveying & Measurement
    const surveyingCategory = createdCategories.find(c => c.name === 'Surveying & Measurement');
    products.push(
      {
        name: 'Laser Level',
        description: 'Professional laser level with tripod',
        sku: 'LASER001',
        barcode: 'CON004001',
        categoryId: surveyingCategory._id,
        price: 299.99,
        costPrice: 180.00,
        stockQuantity: 18,
        minStockLevel: 5,
        maxStockLevel: 50,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Survey Equipment Co.',
        location: 'Surveying Section'
      },
      {
        name: 'Measuring Tape',
        description: '25ft heavy duty measuring tape',
        sku: 'TAPE001',
        barcode: 'CON004002',
        categoryId: surveyingCategory._id,
        price: 19.99,
        costPrice: 12.00,
        stockQuantity: 100,
        minStockLevel: 25,
        maxStockLevel: 400,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Survey Equipment Co.',
        location: 'Surveying Section'
      },
      {
        name: 'GPS Survey Unit',
        description: 'High precision GPS unit for surveying',
        sku: 'GPS001',
        barcode: 'CON004003',
        categoryId: surveyingCategory._id,
        price: 2500.00,
        costPrice: 1600.00,
        stockQuantity: 8,
        minStockLevel: 2,
        maxStockLevel: 20,
        unitOfMeasure: 'pcs',
        isActive: true,
        taxable: true,
        taxRate: 8.5,
        supplier: 'Survey Equipment Co.',
        location: 'Surveying Section'
      }
    );

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('\n🎉 Construction & Mining Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Low stock items: ${products.filter(p => p.stockQuantity <= p.minStockLevel).length}`);
    
    console.log('\n📊 Category Breakdown:');
    createdCategories.forEach(category => {
      const categoryProducts = products.filter(p => p.categoryId.toString() === category._id.toString());
      console.log(`  - ${category.name}: ${categoryProducts.length} products`);
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