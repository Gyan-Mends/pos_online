const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos_v2');

// Define schemas (minimal versions for testing)
const saleSchema = new mongoose.Schema({
  receiptNumber: String,
  customerId: mongoose.Schema.Types.ObjectId,
  sellerId: mongoose.Schema.Types.ObjectId,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    unitPrice: Number,
    discount: { type: Number, default: 0 },
    discountType: { type: String, default: 'fixed' },
    totalPrice: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  discountAmount: { type: Number, default: 0 },
  totalAmount: Number,
  amountPaid: Number,
  changeAmount: { type: Number, default: 0 },
  payments: [{
    method: String,
    amount: Number,
    reference: String,
    status: { type: String, default: 'completed' }
  }],
  status: { type: String, default: 'completed' },
  notes: String,
  saleDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  costPrice: Number,
  sellingPrice: Number,
  stockQuantity: Number,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  type: String,
  quantity: Number,
  previousStock: Number,
  newStock: Number,
  unitCost: Number,
  totalValue: Number,
  reference: String,
  notes: String,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String
});

const Sale = mongoose.model('Sale', saleSchema);
const Product = mongoose.model('Product', productSchema);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
const User = mongoose.model('User', userSchema);

async function simulateRefund() {
  try {
    console.log('🧪 Simulating refund API call...\n');

    // Find a sale with positive amount
    const sale = await Sale.findOne({ totalAmount: { $gt: 0 } }).populate('items.productId');
    
    if (!sale) {
      console.log('❌ No sales found to test refund');
      return;
    }

    console.log(`✅ Found sale: ${sale.receiptNumber}`);
    console.log(`   Total Amount: $${sale.totalAmount.toFixed(2)}`);

    // Get the first item for testing
    const firstItem = sale.items[0];
    if (!firstItem || !firstItem.productId) {
      console.log('❌ No valid items found in sale');
      return;
    }

    const product = await Product.findById(firstItem.productId._id);
    const stockBefore = product.stockQuantity;
    
    console.log(`\n📦 Item to refund: ${firstItem.productId.name}`);
    console.log(`   Original quantity: ${firstItem.quantity}`);
    console.log(`   Stock before refund: ${stockBefore}`);

    // Find a user to process the refund
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found to process refund');
      return;
    }

    // Simulate the refund API call by calling the same logic
    const refundData = {
      items: [{
        productId: firstItem.productId._id,
        quantity: 1 // Refund 1 item
      }],
      reason: 'Test refund - API functionality test',
      processedBy: user._id
    };

    console.log(`\n🔄 Processing refund...`);
    console.log(`   Refunding 1 unit of ${firstItem.productId.name}`);
    console.log(`   Processed by: ${user.firstName} ${user.lastName}`);

    // Simulate the refund logic manually (same as in handleRefund)
    
    // 1. Update product stock
    const newStock = stockBefore + refundData.items[0].quantity;
    await Product.findByIdAndUpdate(
      firstItem.productId._id,
      { 
        stockQuantity: newStock,
        updatedAt: new Date()
      }
    );

    console.log(`   ✅ Updated product stock: ${stockBefore} → ${newStock}`);

    // 2. Create stock movement record
    await StockMovement.create({
      productId: firstItem.productId._id,
      type: 'return',
      quantity: refundData.items[0].quantity,
      previousStock: stockBefore,
      newStock: newStock,
      unitCost: product.costPrice,
      totalValue: refundData.items[0].quantity * product.costPrice,
      reference: `REFUND-${sale.receiptNumber}`,
      notes: `Refund: ${sale.receiptNumber} - ${refundData.reason}`,
      userId: refundData.processedBy
    });

    console.log(`   ✅ Created stock movement record`);

    // 3. Calculate refund amount
    const itemRefundAmount = firstItem.unitPrice * refundData.items[0].quantity;
    const taxRefund = (itemRefundAmount / sale.subtotal) * sale.taxAmount;
    const totalRefund = itemRefundAmount + taxRefund;

    console.log(`   💰 Refund calculation:`);
    console.log(`      Item amount: $${itemRefundAmount.toFixed(2)}`);
    console.log(`      Tax refund: $${taxRefund.toFixed(2)}`);
    console.log(`      Total refund: $${totalRefund.toFixed(2)}`);

    // 4. Generate refund number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Sale.countDocuments({
      receiptNumber: { $regex: `^REF-${dateStr}` }
    });
    const refundNumber = `REF-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    // 5. Create refund record
    const refund = new Sale({
      receiptNumber: refundNumber,
      customerId: sale.customerId,
      sellerId: refundData.processedBy,
      items: [{
        productId: firstItem.productId._id,
        quantity: refundData.items[0].quantity,
        unitPrice: firstItem.unitPrice,
        discount: 0,
        discountType: 'fixed',
        totalPrice: itemRefundAmount
      }],
      subtotal: -itemRefundAmount,
      taxAmount: -taxRefund,
      discountAmount: 0,
      totalAmount: -totalRefund,
      amountPaid: -totalRefund,
      changeAmount: 0,
      payments: [{
        method: 'refund',
        amount: -totalRefund,
        reference: sale.receiptNumber,
        status: 'completed'
      }],
      status: 'completed',
      notes: `Refund for ${sale.receiptNumber}: ${refundData.reason}`,
      saleDate: new Date()
    });

    await refund.save();
    console.log(`   ✅ Created refund record: ${refundNumber}`);

    // 6. Update original sale status
    sale.status = 'partially_refunded';
    await sale.save();
    console.log(`   ✅ Updated original sale status to: ${sale.status}`);

    // Verify the changes
    const updatedProduct = await Product.findById(firstItem.productId._id);
    const stockMovements = await StockMovement.find({ 
      productId: firstItem.productId._id 
    }).sort({ createdAt: -1 }).limit(1);
    
    const refundSales = await Sale.find({ 
      totalAmount: { $lt: 0 },
      receiptNumber: refundNumber 
    });

    console.log(`\n🔍 Verification:`);
    console.log(`   Product stock after refund: ${updatedProduct.stockQuantity}`);
    console.log(`   Stock movements created: ${stockMovements.length}`);
    console.log(`   Refund sales created: ${refundSales.length}`);

    if (stockMovements.length > 0) {
      console.log(`   Latest stock movement: ${stockMovements[0].type} - ${stockMovements[0].quantity}`);
    }

    console.log(`\n✅ Refund simulation completed successfully!`);

  } catch (error) {
    console.error('❌ Error simulating refund:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
  }
}

// Run the simulation
simulateRefund(); 