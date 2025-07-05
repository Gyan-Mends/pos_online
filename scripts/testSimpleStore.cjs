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

// Store schema (simplified)
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
  businessType: { type: String, default: 'retail' },
  currency: { type: String, default: 'GHS' },
  timezone: { type: String, default: 'Africa/Accra' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  taxSettings: {
    rate: { type: Number, default: 0.15 },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    name: { type: String, default: 'VAT' },
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);

// Test function
const testSimpleStore = async () => {
  console.log('🧪 Testing Simple Store Configuration...\n');

  try {
    // Drop existing collection to start fresh
    await Store.collection.drop().catch(() => {});
    console.log('📝 Collection dropped (if existed)');

    // Test 1: Create store with tax settings
    console.log('\n📝 Test 1: Creating simple store with tax settings...');
    const store = new Store({
      name: 'Test Store',
      email: 'test@example.com',
      phone: '+233 123 456 789',
      address: {
        street: '123 Test Street',
        city: 'Accra',
        state: 'Greater Accra',
        zipCode: '00233',
        country: 'Ghana'
      },
      taxSettings: {
        rate: 0.15,
        type: 'percentage',
        name: 'VAT'
      }
    });

    await store.save();
    console.log('✅ Store created successfully');
    console.log(`   Store ID: ${store._id}`);
    console.log(`   Tax Settings: ${JSON.stringify(store.taxSettings, null, 2)}`);

    // Test 2: Update tax settings
    console.log('\n📝 Test 2: Updating tax settings...');
    store.taxSettings = {
      rate: 0.08,
      type: 'percentage',
      name: 'Sales Tax'
    };
    await store.save();
    console.log('✅ Tax settings updated successfully');
    console.log(`   Updated Tax Settings: ${JSON.stringify(store.taxSettings, null, 2)}`);

    // Test 3: Test fixed tax
    console.log('\n📝 Test 3: Testing fixed tax...');
    store.taxSettings = {
      rate: 5.00,
      type: 'fixed',
      name: 'Service Fee'
    };
    await store.save();
    console.log('✅ Fixed tax settings applied');
    console.log(`   Fixed Tax Settings: ${JSON.stringify(store.taxSettings, null, 2)}`);

    // Test 4: Retrieve store
    console.log('\n📝 Test 4: Retrieving store...');
    const retrievedStore = await Store.findById(store._id);
    console.log('✅ Store retrieved successfully');
    console.log(`   Retrieved Tax Settings: ${JSON.stringify(retrievedStore.taxSettings, null, 2)}`);

    // Clean up
    await Store.deleteMany({});
    console.log('\n🧹 Test data cleaned up');

    console.log('\n✅ All simple store tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      for (const field in error.errors) {
        console.error(`  - ${field}: ${error.errors[field].message}`);
      }
    }
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testSimpleStore();
  process.exit(0);
};

runTest(); 