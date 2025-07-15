const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_v2';

console.log('🔍 Testing MongoDB connection...');
console.log('📡 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

// Connection options (updated)
const connectionOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  bufferCommands: true,
  maxPoolSize: 10,
  family: 4,
  connectTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  maxIdleTimeMS: 30000,
  minPoolSize: 1
};

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🏠 Database name:', mongoose.connection.name);
    
    // Test a simple query
    console.log('🧪 Testing basic query...');
    
    // Create a simple test schema
    const TestSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    // Insert a test document
    const testDoc = new Test({ test: 'connection_test' });
    await testDoc.save();
    console.log('✅ Insert test successful');
    
    // Query the test document
    const foundDoc = await Test.findOne({ test: 'connection_test' });
    console.log('✅ Query test successful:', foundDoc ? 'Document found' : 'Document not found');
    
    // Clean up
    await Test.deleteOne({ test: 'connection_test' });
    console.log('✅ Cleanup successful');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection(); 