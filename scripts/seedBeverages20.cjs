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

async function seedMoreBeverages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find existing Beverages category
    let category = await Category.findOne({ name: 'Beverages' });
    if (!category) {
      category = await Category.create({
        name: 'Beverages',
        description: 'Drinks, juices, sodas, coffee, tea, and other beverages'
      });
      console.log('Created Beverages category');
    } else {
      console.log('Using existing Beverages category');
    }

    const categoryId = category._id;

    const beverages = [
      {
        name: 'Sprite Lemon-Lime',
        description: 'Crisp lemon-lime flavored carbonated soft drink, 330ml can',
        sku: 'BEV-SPRT-011',
        barcode: generateBarcode(),
        categoryId,
        price: 1.50,
        costPrice: 0.80,
        stockQuantity: 190,
        minStockLevel: 50,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1632459250869-dff3ea071113?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Coca-Cola Distributors',
        location: 'Shelf A1'
      },
      {
        name: 'Fanta Orange',
        description: 'Vibrant orange-flavored carbonated soft drink, 330ml can',
        sku: 'BEV-FNTA-012',
        barcode: generateBarcode(),
        categoryId,
        price: 1.50,
        costPrice: 0.80,
        stockQuantity: 170,
        minStockLevel: 50,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1601751924328-81edaa1b8c87?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Coca-Cola Distributors',
        location: 'Shelf A1'
      },
      {
        name: 'Iced Tea Peach',
        description: 'Refreshing peach-flavored iced tea, 500ml bottle',
        sku: 'BEV-ITEA-013',
        barcode: generateBarcode(),
        categoryId,
        price: 2.29,
        costPrice: 1.10,
        stockQuantity: 110,
        minStockLevel: 30,
        maxStockLevel: 250,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1641919089328-5d5063828c4f?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Tea House Co.',
        location: 'Shelf A3'
      },
      {
        name: 'Pure Coconut Water',
        description: '100% natural coconut water, hydrating and refreshing, 330ml',
        sku: 'BEV-COCO-014',
        barcode: generateBarcode(),
        categoryId,
        price: 3.49,
        costPrice: 1.80,
        stockQuantity: 85,
        minStockLevel: 20,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1758186989205-20afdf8d2665?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Tropical Blends Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Fresh Apple Juice',
        description: 'Cold-pressed apple juice, no sugar added, 500ml bottle',
        sku: 'BEV-APLJ-015',
        barcode: generateBarcode(),
        categoryId,
        price: 3.79,
        costPrice: 2.00,
        stockQuantity: 70,
        minStockLevel: 20,
        maxStockLevel: 180,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1509459331813-67a0c10e527c?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Strawberry Milkshake',
        description: 'Creamy strawberry milkshake, thick and delicious, 400ml',
        sku: 'BEV-STMK-016',
        barcode: generateBarcode(),
        categoryId,
        price: 5.49,
        costPrice: 2.90,
        stockQuantity: 50,
        minStockLevel: 15,
        maxStockLevel: 120,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1583024012457-b6de05b7003a?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Dairy Fresh Ltd.',
        location: 'Fridge B3'
      },
      {
        name: 'Ginger Ale',
        description: 'Classic ginger ale with a sharp ginger kick, 330ml can',
        sku: 'BEV-GALE-017',
        barcode: generateBarcode(),
        categoryId,
        price: 1.79,
        costPrice: 0.90,
        stockQuantity: 130,
        minStockLevel: 30,
        maxStockLevel: 300,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1732247610040-c6a2193092ca?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Schweppes Distributors',
        location: 'Shelf A2'
      },
      {
        name: 'Grape Juice',
        description: 'Rich purple grape juice, 100% natural, 500ml bottle',
        sku: 'BEV-GRPJ-018',
        barcode: generateBarcode(),
        categoryId,
        price: 3.29,
        costPrice: 1.70,
        stockQuantity: 65,
        minStockLevel: 15,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1530816878870-4f4fe65f5946?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Double Espresso Shot',
        description: 'Strong double espresso shot, ready-to-drink, 200ml',
        sku: 'BEV-ESPR-019',
        barcode: generateBarcode(),
        categoryId,
        price: 3.99,
        costPrice: 2.10,
        stockQuantity: 90,
        minStockLevel: 25,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1511495069777-323685717483?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Roast & Brew Ltd.',
        location: 'Fridge B1'
      },
      {
        name: 'Chai Tea Latte',
        description: 'Spiced chai tea latte with cinnamon and cardamom, 350ml',
        sku: 'BEV-CHAI-020',
        barcode: generateBarcode(),
        categoryId,
        price: 4.29,
        costPrice: 2.20,
        stockQuantity: 75,
        minStockLevel: 20,
        maxStockLevel: 180,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1727421586273-34da74740a88?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Tea House Co.',
        location: 'Shelf A3'
      },
      {
        name: 'Cranberry Juice',
        description: 'Tart and sweet cranberry juice cocktail, 500ml bottle',
        sku: 'BEV-CRNB-021',
        barcode: generateBarcode(),
        categoryId,
        price: 3.49,
        costPrice: 1.80,
        stockQuantity: 60,
        minStockLevel: 15,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1686602397438-1c882caa7d52?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Classic Root Beer',
        description: 'Old-fashioned root beer with vanilla undertones, 330ml bottle',
        sku: 'BEV-RTBR-022',
        barcode: generateBarcode(),
        categoryId,
        price: 2.29,
        costPrice: 1.10,
        stockQuantity: 100,
        minStockLevel: 25,
        maxStockLevel: 250,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1603389016966-d1f15ea2e215?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Craft Soda Co.',
        location: 'Shelf A2'
      },
      {
        name: 'Vanilla Protein Shake',
        description: 'High-protein vanilla shake, 25g protein per bottle, 350ml',
        sku: 'BEV-PROT-023',
        barcode: generateBarcode(),
        categoryId,
        price: 5.99,
        costPrice: 3.20,
        stockQuantity: 55,
        minStockLevel: 15,
        maxStockLevel: 120,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1693996045899-7cf0ac0229c7?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'FitFuel Nutrition',
        location: 'Fridge B3'
      },
      {
        name: 'Organic Kombucha',
        description: 'Fermented organic kombucha, gut-friendly probiotics, 400ml',
        sku: 'BEV-KOMB-024',
        barcode: generateBarcode(),
        categoryId,
        price: 4.79,
        costPrice: 2.50,
        stockQuantity: 45,
        minStockLevel: 10,
        maxStockLevel: 100,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1573812914274-226dc19fbe17?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Green Leaf Imports',
        location: 'Fridge B1'
      },
      {
        name: 'Sparkling Water Lime',
        description: 'Lime-infused sparkling mineral water, zero calories, 500ml',
        sku: 'BEV-SPRK-025',
        barcode: generateBarcode(),
        categoryId,
        price: 1.49,
        costPrice: 0.55,
        stockQuantity: 220,
        minStockLevel: 60,
        maxStockLevel: 500,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1669139470813-827cbcf54b20?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Spring Valley Inc.',
        location: 'Shelf A4'
      },
      {
        name: 'Tropical Pineapple Juice',
        description: 'Sweet tropical pineapple juice, no added sugar, 500ml',
        sku: 'BEV-PINJ-026',
        barcode: generateBarcode(),
        categoryId,
        price: 3.69,
        costPrice: 1.90,
        stockQuantity: 70,
        minStockLevel: 20,
        maxStockLevel: 180,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1541085681957-a433bdafd5b9?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Tropical Blends Co.',
        location: 'Fridge B2'
      },
      {
        name: 'Matcha Latte',
        description: 'Premium Japanese matcha green tea latte, 350ml',
        sku: 'BEV-MTCH-027',
        barcode: generateBarcode(),
        categoryId,
        price: 4.99,
        costPrice: 2.60,
        stockQuantity: 65,
        minStockLevel: 15,
        maxStockLevel: 150,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1560148196-df61132466ce?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Green Leaf Imports',
        location: 'Fridge B1'
      },
      {
        name: 'Chocolate Milk',
        description: 'Rich and creamy chocolate flavored milk, 500ml bottle',
        sku: 'BEV-CMLK-028',
        barcode: generateBarcode(),
        categoryId,
        price: 2.99,
        costPrice: 1.50,
        stockQuantity: 95,
        minStockLevel: 25,
        maxStockLevel: 250,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1553909489-ec2175ef3f52?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Dairy Fresh Ltd.',
        location: 'Fridge B3'
      },
      {
        name: 'Classic Cappuccino',
        description: 'Smooth cappuccino with velvety foam, ready-to-drink, 250ml',
        sku: 'BEV-CAPP-029',
        barcode: generateBarcode(),
        categoryId,
        price: 4.29,
        costPrice: 2.30,
        stockQuantity: 80,
        minStockLevel: 20,
        maxStockLevel: 200,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1645354114738-781616b92c08?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Roast & Brew Ltd.',
        location: 'Fridge B1'
      },
      {
        name: 'Watermelon Juice',
        description: 'Fresh-pressed watermelon juice, naturally sweet, 400ml',
        sku: 'BEV-WMLJ-030',
        barcode: generateBarcode(),
        categoryId,
        price: 3.99,
        costPrice: 2.10,
        stockQuantity: 55,
        minStockLevel: 15,
        maxStockLevel: 130,
        unitOfMeasure: 'pcs',
        images: ['https://images.unsplash.com/photo-1683166263544-e754e85c3e7c?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=600'],
        isActive: true,
        taxable: true,
        taxRate: 0,
        supplier: 'Fresh Farms Co.',
        location: 'Fridge B2'
      }
    ];

    console.log('\nSeeding 20 additional beverage products...');

    // Remove existing with these SKUs to avoid duplicates
    const skus = beverages.map(b => b.sku);
    const deleted = await Product.deleteMany({ sku: { $in: skus } });
    if (deleted.deletedCount > 0) {
      console.log(`Removed ${deleted.deletedCount} existing products with same SKUs`);
    }

    for (const bevData of beverages) {
      const product = await Product.create(bevData);
      console.log(`  Created: ${product.name} (${product.sku}) - $${product.price}`);
    }

    const totalBeverages = await Product.countDocuments({ categoryId });
    console.log(`\nSuccessfully seeded 20 additional beverages!`);
    console.log(`Total beverages in database: ${totalBeverages}`);

  } catch (error) {
    console.error('Error seeding beverages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

seedMoreBeverages();
