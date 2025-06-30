const https = require('http');
const mongoose = require('mongoose');

// Connect to MongoDB to get test data
mongoose.connect('mongodb://localhost:27017/pos_v2');

const Sale = mongoose.model('Sale', new mongoose.Schema({
  receiptNumber: String,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  }],
  totalAmount: Number
}, {strict: false}));

const User = mongoose.model('User', new mongoose.Schema({
  firstName: String,
  lastName: String
}, {strict: false}));

async function testRefundAPI() {
  try {
    console.log('🧪 Testing Refund API via HTTP...\n');

    // Get test data
    const sale = await Sale.findOne({ totalAmount: { $gt: 0 } });
    const user = await User.findOne();

    if (!sale || !user) {
      console.log('❌ Missing test data');
      return;
    }

    console.log(`✅ Testing refund for sale: ${sale.receiptNumber}`);
    console.log(`   Sale ID: ${sale._id}`);
    console.log(`   Items: ${sale.items.length}`);

    // Prepare refund data
    const refundData = {
      items: [{
        productId: sale.items[0].productId,
        quantity: 1
      }],
      reason: 'HTTP API Test - Customer return',
      processedBy: user._id
    };

    // Make HTTP request
    const postData = JSON.stringify(refundData);
    
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: `/api/sales/${sale._id}/refund`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🔄 Making HTTP request to: ${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response:`, data);

        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('   ✅ Refund processed successfully!');
            
            // Verify the results
            const updatedSale = await Sale.findById(sale._id);
            console.log(`   Updated sale status: ${updatedSale.status}`);
            
            // Check for refund record
            const refunds = await Sale.find({ totalAmount: { $lt: 0 } });
            console.log(`   Refund records found: ${refunds.length}`);
            
          } else {
            console.log('   ❌ Refund failed:', response.message);
          }
        } catch (e) {
          console.log('   ❌ Error parsing response:', e.message);
        }

        mongoose.connection.close();
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP Request error:', error.message);
      mongoose.connection.close();
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Test error:', error.message);
    mongoose.connection.close();
  }
}

// Wait a bit for the dev server to start, then run the test
setTimeout(testRefundAPI, 3000); 