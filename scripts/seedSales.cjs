const mongoose = require('mongoose');

// Clear any existing models to avoid caching issues
if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}
if (mongoose.models.User) {
  delete mongoose.models.User;
}
if (mongoose.models.Customer) {
  delete mongoose.models.Customer;
}
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

// Connect to MongoDB - UPDATED TO USE CORRECT DATABASE
mongoose.connect('mongodb://localhost:27017/pos');

// Define schemas (minimal versions for seeding)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
});

const customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  totalPurchases: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  description: String,
  categoryId: mongoose.Schema.Types.ObjectId,
  costPrice: Number,
  sellingPrice: Number,
  stockQuantity: Number,
  minStockLevel: Number,
  barcode: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Sale schema without min constraints to allow refunds
const saleSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    totalPrice: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, required: true },
  changeAmount: { type: Number, default: 0 },
  payments: [{
    method: { type: String, enum: ['cash', 'card', 'refund'], required: true },
    amount: { type: Number, required: true },
    reference: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
  }],
  status: { type: String, enum: ['pending', 'completed', 'refunded', 'partially_refunded'], default: 'completed' },
  notes: String,
  saleDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Product = mongoose.model('Product', productSchema);
const Sale = mongoose.model('Sale', saleSchema);

async function seedSales() {
  try {
    console.log('🌱 Starting sales seeding...');

    // Get existing users, customers, and products
    const users = await User.find({ role: { $in: ['admin', 'manager', 'seller', 'cashier'] } });
    const customers = await Customer.find();
    const products = await Product.find({ isActive: true });

    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    if (products.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }

    console.log(`📊 Found ${users.length} users, ${customers.length} customers, ${products.length} products`);

    // Clear existing sales
    await Sale.deleteMany({});
    console.log('🗑️ Cleared existing sales');

    // Generate sample sales over the past 30 days
    const salesData = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Generate receipt number helper
    const generateReceiptNumber = (date, index) => {
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      return `RCP-${dateStr}-${(index + 1).toString().padStart(4, '0')}`;
    };

    // Create 50 sample sales
    for (let i = 0; i < 50; i++) {
      // Random date in the past 30 days
      const saleDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      
      // Random seller
      const seller = users[Math.floor(Math.random() * users.length)];
      
      // Random customer (90% chance of having a customer, 10% walk-in) - INCREASED FOR MORE PURCHASE HISTORY
      const customer = Math.random() > 0.1 && customers.length > 0 
        ? customers[Math.floor(Math.random() * customers.length)]
        : null;

      // Random number of items (1-5)
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const saleItems = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        let unitPrice = product.sellingPrice || product.costPrice || 10; // Fallback price
        
        // Validate price
        if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
          console.log(`⚠️ Invalid price for product ${product.name}: ${unitPrice}, using fallback`);
          unitPrice = 10;
        }
        
        // Random discount (20% chance)
        const hasDiscount = Math.random() > 0.8;
        const discount = hasDiscount ? Math.floor(Math.random() * 10) + 5 : 0; // 5-15% discount
        const discountType = 'percentage';
        
        const itemTotal = unitPrice * quantity;
        const discountAmount = hasDiscount ? (itemTotal * discount) / 100 : 0;
        const totalPrice = itemTotal - discountAmount;
        
        // Validate calculated values
        if (isNaN(totalPrice) || totalPrice < 0) {
          console.log(`⚠️ Invalid totalPrice calculated: ${totalPrice}, skipping item`);
          continue;
        }
        
        subtotal += totalPrice;

        saleItems.push({
          productId: product._id,
          quantity,
          unitPrice,
          discount,
          discountType,
          totalPrice
        });
      }

      // Skip this sale if no valid items
      if (saleItems.length === 0) {
        console.log('⚠️ No valid items for sale, skipping');
        continue;
      }

      // Calculate tax (15%)
      const taxAmount = subtotal * 0.15;
      const totalAmount = subtotal + taxAmount;

      // Validate final amounts
      if (isNaN(subtotal) || isNaN(taxAmount) || isNaN(totalAmount)) {
        console.log(`⚠️ Invalid calculated amounts: subtotal=${subtotal}, tax=${taxAmount}, total=${totalAmount}, skipping sale`);
        continue;
      }

      // Payment method (80% cash, 20% card)
      const paymentMethod = Math.random() > 0.2 ? 'cash' : 'card';
      
      // For cash payments, sometimes add change
      let amountPaid = totalAmount;
      let changeAmount = 0;
      
      if (paymentMethod === 'cash') {
        // Round up to nearest $5 or $10 for realistic cash payments
        const roundedAmount = Math.ceil(totalAmount / 5) * 5;
        if (roundedAmount > totalAmount) {
          amountPaid = roundedAmount;
          changeAmount = roundedAmount - totalAmount;
        }
      }

      const sale = {
        receiptNumber: generateReceiptNumber(saleDate, i),
        customerId: customer?._id,
        sellerId: seller._id,
        items: saleItems,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        amountPaid,
        changeAmount,
        payments: [{
          method: paymentMethod,
          amount: amountPaid,
          status: 'completed'
        }],
        status: 'completed',
        notes: Math.random() > 0.8 ? 'Customer requested receipt via email' : undefined,
        saleDate,
        createdAt: saleDate,
        updatedAt: saleDate
      };

      salesData.push(sale);
    }

    // Insert sales in batches to avoid issues
    const createdSales = await Sale.insertMany(salesData);
    console.log(`✅ Created ${createdSales.length} sample sales`);

    // Create a few refunded sales
    const refundSales = [];
    for (let i = 0; i < 3; i++) {
      const originalSale = createdSales[Math.floor(Math.random() * createdSales.length)];
      
      // Create partial refund for first item
      const refundItem = originalSale.items[0];
      const refundQuantity = Math.min(refundItem.quantity, Math.floor(refundItem.quantity / 2) + 1);
      
      const refundAmount = (refundItem.unitPrice * refundQuantity);
      const refundTax = (refundAmount / originalSale.subtotal) * originalSale.taxAmount;
      const totalRefund = refundAmount + refundTax;

      const refundDate = new Date(originalSale.saleDate.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within 7 days
      
      const refundSale = {
        receiptNumber: `REF-${refundDate.toISOString().slice(0, 10).replace(/-/g, '')}-${(i + 1).toString().padStart(4, '0')}`,
        customerId: originalSale.customerId,
        sellerId: users[Math.floor(Math.random() * users.length)]._id,
        items: [{
          productId: refundItem.productId,
          quantity: -refundQuantity, // Negative quantity for refund
          unitPrice: refundItem.unitPrice,
          discount: 0,
          discountType: 'fixed',
          totalPrice: -refundAmount // Negative amount for refund
        }],
        subtotal: -refundAmount,
        taxAmount: -refundTax,
        discountAmount: 0,
        totalAmount: -totalRefund,
        amountPaid: -totalRefund,
        changeAmount: 0,
        payments: [{
          method: 'refund',
          amount: -totalRefund,
          reference: originalSale.receiptNumber,
          status: 'completed'
        }],
        status: 'completed',
        notes: `Refund for ${originalSale.receiptNumber}: Customer returned defective item`,
        saleDate: refundDate,
        createdAt: refundDate,
        updatedAt: refundDate
      };

      refundSales.push(refundSale);

      // Update original sale status
      await Sale.findByIdAndUpdate(originalSale._id, {
        status: refundQuantity === refundItem.quantity && originalSale.items.length === 1 
          ? 'refunded' 
          : 'partially_refunded'
      });
    }

    // Insert refund sales
    if (refundSales.length > 0) {
      await Sale.insertMany(refundSales);
      console.log(`✅ Created ${refundSales.length} refund transactions`);
    }

    // Calculate and display summary
    const totalSales = await Sale.countDocuments({ totalAmount: { $gt: 0 } });
    const totalRefunds = await Sale.countDocuments({ totalAmount: { $lt: 0 } });
    const totalRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log('\n📈 Sales Summary:');
    console.log(`   💰 Total Sales: ${totalSales}`);
    console.log(`   🔄 Total Refunds: ${totalRefunds}`);
    console.log(`   💵 Net Revenue: $${totalRevenue[0]?.total?.toFixed(2) || '0.00'}`);

    console.log('\n🎉 Sales seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding sales:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding
seedSales(); 