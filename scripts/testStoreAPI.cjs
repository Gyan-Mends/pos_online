const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5173';
const STORE_API_URL = `${BASE_URL}/api/store`;

// Test store data
const testStoreData = {
  name: 'TechMart Electronics',
  description: 'Leading electronics retailer in Accra specializing in computers, phones, and accessories with over 10 years of experience serving customers.',
  logo: '',
  website: 'https://techmart.com',
  email: 'info@techmart.com',
  phone: '+233 24 123 4567',
  address: {
    street: '123 Liberation Road',
    city: 'Accra',
    state: 'Greater Accra Region',
    zipCode: 'GA-123-4567',
    country: 'Ghana'
  },
  businessRegistration: 'REG-2024-001234',
  taxId: 'TAX-GH-567890',
  businessType: 'both',
  operatingHours: {
    monday: { open: '08:00', close: '19:00', isClosed: false },
    tuesday: { open: '08:00', close: '19:00', isClosed: false },
    wednesday: { open: '08:00', close: '19:00', isClosed: false },
    thursday: { open: '08:00', close: '19:00', isClosed: false },
    friday: { open: '08:00', close: '20:00', isClosed: false },
    saturday: { open: '09:00', close: '18:00', isClosed: false },
    sunday: { open: '10:00', close: '16:00', isClosed: false }
  },
  currency: 'GHS',
  timezone: 'Africa/Accra',
  dateFormat: 'DD/MM/YYYY',
  receiptSettings: {
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    footerText: 'Thank you for shopping with us! Visit us again for great deals on electronics.',
    headerText: 'Welcome to TechMart Electronics'
  },
  notifications: {
    lowStockAlert: true,
    lowStockThreshold: 5,
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: true
  },
  socialMedia: {
    facebook: 'https://facebook.com/techmart.electronics',
    twitter: 'https://twitter.com/techmart_gh',
    instagram: 'https://instagram.com/techmart.electronics',
    linkedin: 'https://linkedin.com/company/techmart-electronics'
  }
};

// Helper function to create FormData from object
function createFormData(data, prefix = '') {
  const formData = new FormData();
  
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      const fieldName = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively handle nested objects
        const nestedFormData = createFormData(value, fieldName);
        for (const [nestedKey, nestedValue] of nestedFormData.entries()) {
          formData.append(nestedKey, nestedValue);
        }
      } else {
        formData.append(fieldName, value);
      }
    }
  }
  
  return formData;
}

// Test functions
async function testGetStore() {
  console.log('\n🔍 Testing GET /api/store...');
  try {
    const response = await axios.get(STORE_API_URL);
    console.log('✅ GET Store - Success');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️  GET Store - No store found (404) - This is expected for first run');
      return null;
    }
    console.error('❌ GET Store - Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateStore() {
  console.log('\n📝 Testing POST /api/store (Create)...');
  try {
    const formData = createFormData(testStoreData);
    const response = await axios.post(STORE_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ POST Store - Success');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ POST Store - Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateStore() {
  console.log('\n✏️  Testing PUT /api/store (Update)...');
  try {
    const updatedData = {
      ...testStoreData,
      name: 'TechMart Electronics (Updated)',
      description: 'Updated description for testing purposes',
      phone: '+233 24 999 8888'
    };
    
    const formData = createFormData(updatedData);
    const response = await axios.put(STORE_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ PUT Store - Success');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PUT Store - Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetStoreAfterUpdate() {
  console.log('\n🔍 Testing GET /api/store after update...');
  try {
    const response = await axios.get(STORE_API_URL);
    console.log('✅ GET Store After Update - Success');
    console.log('Store Name:', response.data.data.name);
    console.log('Store Phone:', response.data.data.phone);
    return response.data;
  } catch (error) {
    console.error('❌ GET Store After Update - Error:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runStoreAPITests() {
  console.log('🚀 Starting Store API Tests...');
  console.log('=====================================');
  
  try {
    // Test 1: Get store (should return 404 if no store exists)
    await testGetStore();
    
    // Test 2: Create store
    await testCreateStore();
    
    // Test 3: Get store after creation (should return the created store)
    await testGetStore();
    
    // Test 4: Update store
    await testUpdateStore();
    
    // Test 5: Get store after update (should return updated values)
    await testGetStoreAfterUpdate();
    
    console.log('\n🎉 All Store API Tests Completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('💥 Test Suite Failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runStoreAPITests().catch(console.error);
}

module.exports = { runStoreAPITests }; 