const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/pos');

const saleSchema = new mongoose.Schema({
  receiptNumber: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  discountAmount: { type: Number, default: 0 },
  totalAmount: Number,
  amountPaid: Number,
  changeAmount: { type: Number, default: 0 },
  payments: [{ method: String, amount: Number }],
  status: { type: String, default: 'completed' },
  saleDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String
});

const Sale = mongoose.model('Sale', saleSchema);
const Customer = mongoose.model('Customer', customerSchema);

async function createTestSales() {
  try {
    console.log('🔄 Creating test sales data...');
    
    // Clear existing sales
    await Sale.deleteMany({});
    console.log('🗑️ Cleared existing sales');
    
    // Get some customers for testing
    const customers = await Customer.find().limit(3);
    console.log('👥 Found customers:', customers.length);
    
    // Create test sales with customer references
    const testSales = [
      {
        receiptNumber: 'RCP-20240120-0001',
        customerId: customers[0]?._id || null,
        items: [
          { quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
          { quantity: 1, unitPrice: 3.50, totalPrice: 3.50 }
        ],
        subtotal: 15.48,
        taxAmount: 1.55,
        totalAmount: 17.03,
        amountPaid: 20.00,
        changeAmount: 2.97,
        payments: [{ method: 'cash', amount: 20.00 }],
        status: 'completed',
        saleDate: new Date('2024-01-20T10:30:00Z')
      },
      {
        receiptNumber: 'RCP-20240120-0002',
        customerId: customers[1]?._id || null,
        items: [
          { quantity: 1, unitPrice: 12.99, totalPrice: 12.99 }
        ],
        subtotal: 12.99,
        taxAmount: 1.30,
        totalAmount: 14.29,
        amountPaid: 14.29,
        changeAmount: 0,
        payments: [{ method: 'card', amount: 14.29 }],
        status: 'completed',
        saleDate: new Date('2024-01-20T14:15:00Z')
      },
      {
        receiptNumber: 'RCP-20240121-0001',
        customerId: customers[2]?._id || null,
        items: [
          { quantity: 3, unitPrice: 2.99, totalPrice: 8.97 },
          { quantity: 1, unitPrice: 8.50, totalPrice: 8.50 }
        ],
        subtotal: 17.47,
        taxAmount: 1.75,
        totalAmount: 19.22,
        amountPaid: 19.22,
        changeAmount: 0,
        payments: [{ method: 'card', amount: 19.22 }],
        status: 'completed',
        saleDate: new Date('2024-01-21T09:45:00Z')
      },
      // Guest purchase (no customer)
      {
        receiptNumber: 'RCP-20240121-0002',
        customerId: null,
        items: [
          { quantity: 1, unitPrice: 4.99, totalPrice: 4.99 }
        ],
        subtotal: 4.99,
        taxAmount: 0.50,
        totalAmount: 5.49,
        amountPaid: 6.00,
        changeAmount: 0.51,
        payments: [{ method: 'cash', amount: 6.00 }],
        status: 'completed',
        saleDate: new Date('2024-01-21T16:20:00Z')
      }
    ];
    
    const result = await Sale.insertMany(testSales);
    console.log('✅ Created', result.length, 'test sales records');
    
    console.log('\n📊 Test Sales Summary:');
    testSales.forEach((sale, index) => {
      const customerInfo = customers[index] ? `${customers[index].firstName} ${customers[index].lastName}` : 'Guest Customer';
      console.log(`- ${sale.receiptNumber}: $${sale.totalAmount} (${customerInfo})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test sales:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestSales(); 