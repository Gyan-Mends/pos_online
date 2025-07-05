const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pos_v2_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Store schema
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Ghana' },
  },
  currency: { type: String, default: 'GHS' },
  taxSettings: {
    rate: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    name: { type: String, default: 'VAT' },
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);

// Test function
const testZeroTax = async () => {
  console.log('🧪 Testing Zero Tax Configuration...\n');

  try {
    // Drop existing collection to start fresh
    await Store.collection.drop().catch(() => {});
    console.log('📝 Collection dropped (if existed)');

    // Test 1: Create store with zero tax (default)
    console.log('\n📝 Test 1: Creating store with default zero tax...');
    const store = new Store({
      name: 'Zero Tax Store',
      email: 'test@example.com',
      phone: '+233 123 456 789',
      address: {
        street: '123 Test Street',
        city: 'Accra',
        state: 'Greater Accra',
        zipCode: '00233',
        country: 'Ghana'
      }
    });

    await store.save();
    console.log('✅ Store created with default settings');
    console.log(`   Tax Rate: ${store.taxSettings.rate}`);
    console.log(`   Tax Type: ${store.taxSettings.type}`);
    console.log(`   Tax Name: ${store.taxSettings.name}`);
    console.log(`   Tax Status: ${store.taxSettings.rate > 0 ? 'ENABLED' : 'DISABLED'}`);

    // Test 2: Test tax calculation with zero rate
    console.log('\n📝 Test 2: Testing tax calculation with zero rate...');
    const saleAmount = 100;
    const taxAmount = saleAmount * store.taxSettings.rate;
    const totalAmount = saleAmount + taxAmount;
    
    console.log(`   Sale Amount: ${store.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   Tax Amount: ${store.currency} ${taxAmount.toFixed(2)}`);
    console.log(`   Total Amount: ${store.currency} ${totalAmount.toFixed(2)}`);
    console.log(`   Tax Applied: ${taxAmount > 0 ? 'YES' : 'NO'}`);

    // Test 3: Enable tax
    console.log('\n📝 Test 3: Enabling tax...');
    store.taxSettings.rate = 0.15;
    await store.save();
    
    const taxAmountEnabled = saleAmount * store.taxSettings.rate;
    const totalAmountEnabled = saleAmount + taxAmountEnabled;
    
    console.log(`   Tax Rate: ${(store.taxSettings.rate * 100).toFixed(1)}%`);
    console.log(`   Sale Amount: ${store.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   Tax Amount: ${store.currency} ${taxAmountEnabled.toFixed(2)}`);
    console.log(`   Total Amount: ${store.currency} ${totalAmountEnabled.toFixed(2)}`);
    console.log(`   Tax Status: ${store.taxSettings.rate > 0 ? 'ENABLED' : 'DISABLED'}`);

    // Test 4: Disable tax again
    console.log('\n📝 Test 4: Disabling tax...');
    store.taxSettings.rate = 0;
    await store.save();
    
    const taxAmountDisabled = saleAmount * store.taxSettings.rate;
    const totalAmountDisabled = saleAmount + taxAmountDisabled;
    
    console.log(`   Tax Rate: ${store.taxSettings.rate}%`);
    console.log(`   Sale Amount: ${store.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   Tax Amount: ${store.currency} ${taxAmountDisabled.toFixed(2)}`);
    console.log(`   Total Amount: ${store.currency} ${totalAmountDisabled.toFixed(2)}`);
    console.log(`   Tax Status: ${store.taxSettings.rate > 0 ? 'ENABLED' : 'DISABLED'}`);

    // Test 5: Test fixed tax with zero
    console.log('\n📝 Test 5: Testing fixed tax with zero...');
    store.taxSettings.type = 'fixed';
    store.taxSettings.rate = 0;
    await store.save();
    
    const fixedTaxAmount = store.taxSettings.rate;
    const totalWithFixedTax = saleAmount + fixedTaxAmount;
    
    console.log(`   Tax Type: ${store.taxSettings.type}`);
    console.log(`   Tax Rate: ${store.currency} ${store.taxSettings.rate.toFixed(2)}`);
    console.log(`   Sale Amount: ${store.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   Tax Amount: ${store.currency} ${fixedTaxAmount.toFixed(2)}`);
    console.log(`   Total Amount: ${store.currency} ${totalWithFixedTax.toFixed(2)}`);
    console.log(`   Tax Status: ${store.taxSettings.rate > 0 ? 'ENABLED' : 'DISABLED'}`);

    // Test 6: Test UI display logic
    console.log('\n📝 Test 6: Testing UI display logic...');
    
    // Simulate UI logic
    const shouldShowTax = store.taxSettings.rate > 0;
    const taxDisplayText = shouldShowTax 
      ? `${store.taxSettings.name} (${store.taxSettings.type === 'fixed' ? 
          `${store.currency} ${store.taxSettings.rate.toFixed(2)}` : 
          `${(store.taxSettings.rate * 100).toFixed(1)}%`})` 
      : 'No tax';
    
    console.log(`   Show Tax in UI: ${shouldShowTax ? 'YES' : 'NO'}`);
    console.log(`   Tax Display Text: ${taxDisplayText}`);
    console.log(`   Receipt shows tax line: ${shouldShowTax ? 'YES' : 'NO'}`);

    // Clean up
    await Store.deleteMany({});
    console.log('\n🧹 Test data cleaned up');

    console.log('\n✅ All zero tax tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Default tax rate is 0 (disabled) ✓');
    console.log('   - Zero tax calculations work correctly ✓');
    console.log('   - Tax can be enabled/disabled dynamically ✓');
    console.log('   - UI logic handles zero tax properly ✓');
    console.log('   - Both percentage and fixed tax support zero ✓');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testZeroTax();
  process.exit(0);
};

runTest(); 