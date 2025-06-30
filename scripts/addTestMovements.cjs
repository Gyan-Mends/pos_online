const axios = require('axios');

const API_BASE = 'http://localhost:5174/api';

// Sample test movements
const testMovements = [
  {
    productId: null, // Will be set dynamically
    type: 'adjustment',
    quantity: -3,
    userId: null, // Will be set dynamically
    reference: 'ADJ-TEST-001',
    notes: 'Test adjustment - found damaged items during inspection'
  },
  {
    productId: null,
    type: 'damage',
    quantity: -2,
    userId: null,
    reference: 'DMG-TEST-001',
    notes: 'Test damage - water damage in storage'
  },
  {
    productId: null,
    type: 'return',
    quantity: 1,
    userId: null,
    reference: 'RET-TEST-001',
    notes: 'Test return - customer return unused item'
  }
];

async function addTestMovements() {
  try {
    console.log('🔧 Adding test stock movements...');

    // Get products
    console.log('📦 Fetching products...');
    const productsResponse = await axios.get(`${API_BASE}/products`);
    const products = productsResponse.data.data || productsResponse.data;
    
    if (!products || products.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }

    // Get users  
    console.log('👥 Fetching users...');
    const usersResponse = await axios.get(`${API_BASE}/users`);
    const users = usersResponse.data.data || usersResponse.data;
    
    if (!users || users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    console.log(`Found ${products.length} products and ${users.length} users`);

    // Add movements
    let successCount = 0;
    for (let i = 0; i < testMovements.length && i < products.length; i++) {
      const movement = {
        ...testMovements[i],
        productId: products[i]._id || products[i].id,
        userId: users[0]._id || users[0].id
      };

      try {
        console.log(`Creating movement ${i + 1}: ${movement.type} for ${products[i].name}`);
        const response = await axios.post(`${API_BASE}/stock-movements`, movement);
        
        if (response.data.success) {
          successCount++;
          console.log(`✅ Created ${movement.type} movement for ${products[i].name}`);
        } else {
          console.log(`❌ Failed to create movement: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ Error creating movement: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log(`\n🎉 Successfully created ${successCount} test movements!`);
    console.log('You can now view them in the Inventory → Movements page');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

addTestMovements(); 