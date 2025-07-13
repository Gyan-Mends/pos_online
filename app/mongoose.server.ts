import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// MongoDB URI with fallback for different environments
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_v2';

console.log('Environment:', process.env.NODE_ENV);
console.log('Connecting to MongoDB...');

// Connection options for better reliability
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  family: 4 // Use IPv4, skip trying IPv6
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

export default mongoose;
