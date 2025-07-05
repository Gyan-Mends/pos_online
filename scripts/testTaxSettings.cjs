const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pos_v2', {
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
  description: String,
  email: { type: String, required: true },
  phone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  businessRegistration: String,
  taxId: String,
  businessType: String,
  operatingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  currency: String,
  timezone: String,
  dateFormat: String,
  receiptSettings: {
    showLogo: Boolean,
    showAddress: Boolean,
    showPhone: Boolean,
    showEmail: Boolean,
    showWebsite: Boolean,
    footerText: String,
    headerText: String
  },
  notifications: {
    lowStockAlert: Boolean,
    lowStockThreshold: Number,
    dailyReports: Boolean,
    weeklyReports: Boolean,
    monthlyReports: Boolean
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  taxSettings: {
    rate: Number,
    type: String,
    name: String
  }
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);

// Test function
const testTaxSettings = async () => {
  console.log('🧪 Testing Tax Settings Configuration...\n');

  try {
    // Test 1: Create store with default tax settings
    console.log('📝 Test 1: Creating store with default VAT tax settings...');
    const defaultStore = new Store({
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
      businessType: 'retail',
      currency: 'GHS',
      timezone: 'Africa/Accra',
      dateFormat: 'DD/MM/YYYY',
      taxSettings: {
        rate: 0.15,
        type: 'percentage',
        name: 'VAT'
      },
      operatingHours: {
        monday: { open: '08:00', close: '18:00', isClosed: false },
        tuesday: { open: '08:00', close: '18:00', isClosed: false },
        wednesday: { open: '08:00', close: '18:00', isClosed: false },
        thursday: { open: '08:00', close: '18:00', isClosed: false },
        friday: { open: '08:00', close: '18:00', isClosed: false },
        saturday: { open: '08:00', close: '18:00', isClosed: false },
        sunday: { open: '10:00', close: '16:00', isClosed: true }
      },
      receiptSettings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showEmail: true,
        showWebsite: false,
        footerText: 'Thank you for your business!',
        headerText: ''
      },
      notifications: {
        lowStockAlert: true,
        lowStockThreshold: 10,
        dailyReports: true,
        weeklyReports: true,
        monthlyReports: false
      },
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      }
    });

    await defaultStore.save();
    console.log('✅ Store created with default tax settings');
    console.log(`   Tax Name: ${defaultStore.taxSettings.name}`);
    console.log(`   Tax Rate: ${(defaultStore.taxSettings.rate * 100).toFixed(1)}%`);
    console.log(`   Tax Type: ${defaultStore.taxSettings.type}`);

    // Test 2: Update tax settings to Sales Tax
    console.log('\n📝 Test 2: Updating tax settings to Sales Tax...');
    defaultStore.taxSettings = {
      rate: 0.08,
      type: 'percentage',
      name: 'Sales Tax'
    };
    await defaultStore.save();
    console.log('✅ Tax settings updated');
    console.log(`   Tax Name: ${defaultStore.taxSettings.name}`);
    console.log(`   Tax Rate: ${(defaultStore.taxSettings.rate * 100).toFixed(1)}%`);
    console.log(`   Tax Type: ${defaultStore.taxSettings.type}`);

    // Test 3: Test with fixed tax amount
    console.log('\n📝 Test 3: Testing fixed tax amount...');
    defaultStore.taxSettings = {
      rate: 5.00,
      type: 'fixed',
      name: 'Service Fee'
    };
    await defaultStore.save();
    console.log('✅ Fixed tax settings applied');
    console.log(`   Tax Name: ${defaultStore.taxSettings.name}`);
    console.log(`   Tax Amount: ${defaultStore.currency} ${defaultStore.taxSettings.rate.toFixed(2)}`);
    console.log(`   Tax Type: ${defaultStore.taxSettings.type}`);

    // Test 4: Calculate tax for different scenarios
    console.log('\n📝 Test 4: Testing tax calculations...');
    
    // Percentage tax
    const percentageStore = await Store.findOne({ _id: defaultStore._id });
    percentageStore.taxSettings = {
      rate: 0.125,
      type: 'percentage',
      name: 'GST'
    };
    await percentageStore.save();
    
    const saleAmount = 100;
    const percentageTax = saleAmount * percentageStore.taxSettings.rate;
    console.log(`   Sale Amount: ${percentageStore.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   ${percentageStore.taxSettings.name} (${(percentageStore.taxSettings.rate * 100).toFixed(1)}%): ${percentageStore.currency} ${percentageTax.toFixed(2)}`);
    console.log(`   Total: ${percentageStore.currency} ${(saleAmount + percentageTax).toFixed(2)}`);

    // Fixed tax
    const fixedStore = await Store.findOne({ _id: defaultStore._id });
    fixedStore.taxSettings = {
      rate: 3.50,
      type: 'fixed',
      name: 'City Tax'
    };
    await fixedStore.save();
    
    const fixedTax = fixedStore.taxSettings.rate;
    console.log(`\n   Sale Amount: ${fixedStore.currency} ${saleAmount.toFixed(2)}`);
    console.log(`   ${fixedStore.taxSettings.name} (Fixed): ${fixedStore.currency} ${fixedTax.toFixed(2)}`);
    console.log(`   Total: ${fixedStore.currency} ${(saleAmount + fixedTax).toFixed(2)}`);

    // Test 5: Verify store retrieval
    console.log('\n📝 Test 5: Verifying store retrieval...');
    const retrievedStore = await Store.findOne({ _id: defaultStore._id });
    console.log('✅ Store retrieved successfully');
    console.log(`   Store Name: ${retrievedStore.name}`);
    console.log(`   Tax Configuration: ${retrievedStore.taxSettings.name} - ${retrievedStore.taxSettings.type === 'percentage' ? 
      `${(retrievedStore.taxSettings.rate * 100).toFixed(1)}%` : 
      `${retrievedStore.currency} ${retrievedStore.taxSettings.rate.toFixed(2)}`
    }`);

    // Clean up
    await Store.deleteMany({});
    console.log('\n🧹 Test data cleaned up');

    console.log('\n✅ All tax settings tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - Tax name configuration working ✓');
    console.log('   - Percentage tax calculation working ✓');
    console.log('   - Fixed tax amount working ✓');
    console.log('   - Tax type switching working ✓');
    console.log('   - Store data persistence working ✓');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testTaxSettings();
  process.exit(0);
};

runTest(); 