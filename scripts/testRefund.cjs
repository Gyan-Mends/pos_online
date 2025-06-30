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

const Sale = mongoose.model('Sale', saleSchema);
const Product = mongoose.model('Product', productSchema);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

async function testRefundFunctionality() {
  try {
    console.log('🔍 Testing refund functionality...\n');

    // Find a sale with positive amount
    const sale = await Sale.findOne({ totalAmount: { $gt: 0 } }).populate('items.productId');
    
    if (!sale) {
      console.log('❌ No sales found to test refund');
      return;
    }

    console.log(`✅ Found sale: ${sale.receiptNumber}`);
    console.log(`   Total Amount: $${sale.totalAmount.toFixed(2)}`);
    console.log(`   Items: ${sale.items.length}`);

    // Get the first item for testing
    const firstItem = sale.items[0];
    if (!firstItem || !firstItem.productId) {
      console.log('❌ No valid items found in sale');
      return;
    }

    console.log(`\n📦 Testing refund for item: ${firstItem.productId.name}`);
    console.log(`   Original quantity: ${firstItem.quantity}`);
    console.log(`   Unit price: $${firstItem.unitPrice.toFixed(2)}`);

    // Get current product stock
    const product = await Product.findById(firstItem.productId._id);
    const stockBefore = product.stockQuantity;
    console.log(`   Stock before refund: ${stockBefore}`);

    // Check if there are existing refunds for this sale
    const existingRefunds = await Sale.find({ 
      totalAmount: { $lt: 0 },
      notes: { $regex: sale.receiptNumber }
    });
    
    console.log(`   Existing refunds: ${existingRefunds.length}`);

    // Check stock movements for this product
    const stockMovements = await StockMovement.find({ 
      productId: firstItem.productId._id,
      reference: { $regex: sale.receiptNumber }
    }).sort({ createdAt: -1 });

    console.log(`   Stock movements for this sale: ${stockMovements.length}`);
    
    if (stockMovements.length > 0) {
      console.log('   Recent stock movements:');
      stockMovements.forEach((movement, index) => {
        console.log(`     ${index + 1}. ${movement.type}: ${movement.quantity} (${movement.previousStock} → ${movement.newStock})`);
        console.log(`        Reference: ${movement.reference}`);
        console.log(`        Notes: ${movement.notes}`);
      });
    }

    // Check if there are any refund sales (negative amounts)
    const refundSales = await Sale.find({ totalAmount: { $lt: 0 } }).sort({ createdAt: -1 }).limit(5);
    console.log(`\n📊 Recent refund transactions: ${refundSales.length}`);
    
    if (refundSales.length > 0) {
      refundSales.forEach((refund, index) => {
        console.log(`   ${index + 1}. ${refund.receiptNumber}: $${Math.abs(refund.totalAmount).toFixed(2)}`);
        console.log(`      Items: ${refund.items.length}`);
        console.log(`      Notes: ${refund.notes}`);
      });
    }

    // Test API endpoint simulation
    console.log('\n🧪 Testing refund logic simulation...');
    const testRefundData = {
      items: [{
        productId: firstItem.productId._id,
        quantity: 1
      }],
      reason: 'Test refund - checking functionality',
      processedBy: new mongoose.Types.ObjectId()
    };

    console.log('   Would refund:', {
      product: firstItem.productId.name,
      quantity: testRefundData.items[0].quantity,
      currentStock: stockBefore,
      newStock: stockBefore + testRefundData.items[0].quantity
    });

    console.log('\n✅ Refund functionality test completed');

  } catch (error) {
    console.error('❌ Error testing refund:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testRefundFunctionality(); 