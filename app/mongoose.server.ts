import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// MongoDB URI with fallback for different environments
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_v2';

console.log('Environment:', process.env.NODE_ENV);
console.log('Connecting to MongoDB...');

// Connection options for better reliability
const connectionOptions = {
  serverSelectionTimeoutMS: 15000, // Timeout after 15s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  bufferCommands: true, // Enable mongoose buffering for better performance
  maxPoolSize: 10, // Maintain up to 10 socket connections
  family: 4, // Use IPv4, skip trying IPv6
  connectTimeoutMS: 15000, // Connection timeout
  heartbeatFrequencyMS: 10000, // Heartbeat frequency
  retryWrites: true, // Enable retry writes
  maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
  minPoolSize: 1 // Minimum pool size
};

// Connect to MongoDB with error handling
mongoose.connect(MONGODB_URI, connectionOptions)
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error) => {
    console.error("❌ Initial connection failed:", error);
    // Don't exit process, let the app handle the error
  });

// Create a new instance of the database connection
const db = mongoose.connection;

// Handle successful connection
db.once("open", () => {
    console.log("✅ Database connected successfully to:", MONGODB_URI);
});

// Handle connection errors
db.on("error", (error) => {
    console.error("❌ Database connection error:", error);
    console.error("Make sure MongoDB is running and the connection string is correct");
});

// Handle disconnection
db.on("disconnected", () => {
    console.log("⚠️ Database disconnected");
});

// Handle process termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Database connection closed through app termination');
    process.exit(0);
});

// Function to ensure database connection is ready
export async function ensureConnection() {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }
  
  if (mongoose.connection.readyState === 0) {
    // Not connected, try to connect
    await mongoose.connect(MONGODB_URI, connectionOptions);
  }
  
  // Wait for connection to be ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Database connection timeout'));
    }, 15000);
    
    const checkConnection = () => {
      if (mongoose.connection.readyState === 1) {
        clearTimeout(timeout);
        resolve(true);
      } else if (mongoose.connection.readyState === 0) {
        setTimeout(checkConnection, 100);
      } else {
        clearTimeout(timeout);
        reject(new Error('Database connection failed'));
      }
    };
    
    checkConnection();
  });
}

export default mongoose;
