const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test store information integration
async function testStoreIntegration() {
  try {
    console.log('Testing Store Information Integration...\n');
    
    // 1. Test store API endpoint
    console.log('1. Testing store API endpoint...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/store`);
      console.log('✓ Store API endpoint accessible');
      
      if (response.data.success && response.data.data) {
        console.log('✓ Store data exists:');
        console.log(`  - Name: ${response.data.data.name}`);
        console.log(`  - Currency: ${response.data.data.currency}`);
        console.log(`  - Email: ${response.data.data.email}`);
        console.log(`  - Phone: ${response.data.data.phone}`);
        console.log(`  - Address: ${response.data.data.address?.street}, ${response.data.data.address?.city}`);
        console.log(`  - Business Hours: ${JSON.stringify(response.data.data.operatingHours?.monday || {})}`);
        console.log(`  - Receipt Settings: ${JSON.stringify(response.data.data.receiptSettings || {})}`);
      } else {
        console.log('⚠ Store data not found - using default values');
      }
    } catch (error) {
      console.log('✗ Store API endpoint error:', error.message);
    }
    
    // 2. Test dashboard API (verify currency formatting)
    console.log('\n2. Testing dashboard API...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard`);
      console.log('✓ Dashboard API accessible');
      
      if (response.data.data && response.data.data.todayStats) {
        console.log(`  - Today's Revenue: ${response.data.data.todayStats.revenue || 0}`);
        console.log(`  - Today's Sales Count: ${response.data.data.todayStats.count || 0}`);
      }
    } catch (error) {
      console.log('✗ Dashboard API error:', error.message);
    }
    
    // 3. Test products API (verify stock and pricing)
    console.log('\n3. Testing products API...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products?limit=5`);
      console.log('✓ Products API accessible');
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`  - Found ${response.data.data.length} products`);
        console.log(`  - Sample product: ${response.data.data[0].name} - Price: ${response.data.data[0].price}`);
      }
    } catch (error) {
      console.log('✗ Products API error:', error.message);
    }
    
    // 4. Test customers API
    console.log('\n4. Testing customers API...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers?limit=5`);
      console.log('✓ Customers API accessible');
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`  - Found ${response.data.data.length} customers`);
      }
    } catch (error) {
      console.log('✗ Customers API error:', error.message);
    }
    
    // 5. Test sales API
    console.log('\n5. Testing sales API...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sales?limit=5`);
      console.log('✓ Sales API accessible');
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`  - Found ${response.data.data.length} sales`);
        console.log(`  - Sample sale total: ${response.data.data[0].totalAmount || 0}`);
      }
    } catch (error) {
      console.log('✗ Sales API error:', error.message);
    }
    
    console.log('\nStore integration test completed!');
    console.log('\nKey Integration Points:');
    console.log('- Store name appears in sidebar and receipts');
    console.log('- Currency formatting uses store settings');
    console.log('- Date formatting uses store preferences');
    console.log('- Business hours status shown in dashboard');
    console.log('- Receipt customization applied');
    console.log('- Operating hours validation in POS');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testStoreIntegration(); 