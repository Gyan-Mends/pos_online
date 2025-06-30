import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

// User schema (simplified for seeding)
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'seller', 'manager', 'cashier', 'inventory'],
    default: 'seller',
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', UserSchema);

// Initial users data
const initialUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+1-555-0001',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    permissions: ['pos', 'products', 'inventory', 'customers', 'reports', 'users', 'settings']
  },
  {
    firstName: 'John',
    lastName: 'Seller',
    email: 'seller@example.com',
    phone: '+1-555-0002',
    password: 'seller123',
    role: 'seller',
    isActive: true,
    permissions: ['pos', 'customers']
  },
  {
    firstName: 'Jane',
    lastName: 'Manager',
    email: 'manager@example.com',
    phone: '+1-555-0003',
    password: 'manager123',
    role: 'manager',
    isActive: true,
    permissions: ['pos', 'products', 'inventory', 'customers', 'reports']
  },
  {
    firstName: 'Mike',
    lastName: 'Cashier',
    email: 'cashier@example.com',
    phone: '+1-555-0004',
    password: 'cashier123',
    role: 'cashier',
    isActive: true,
    permissions: ['pos', 'customers']
  },
  {
    firstName: 'Lisa',
    lastName: 'Inventory',
    email: 'inventory@example.com',
    phone: '+1-555-0005',
    password: 'inventory123',
    role: 'inventory',
    isActive: false,
    permissions: ['inventory', 'products']
  }
];

async function seedUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    
    if (existingUsers > 0) {
      console.log(`ℹ️  Found ${existingUsers} existing users in database`);
      console.log('🔄 Clearing existing users...');
      await User.deleteMany({});
      console.log('✅ Cleared existing users');
    }

    console.log('🔄 Creating initial users...');
    
    for (const userData of initialUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('🎉 Successfully seeded users!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin:     admin@example.com     / admin123');
    console.log('Seller:    seller@example.com    / seller123');
    console.log('Manager:   manager@example.com   / manager123');
    console.log('Cashier:   cashier@example.com   / cashier123');
    console.log('Inventory: inventory@example.com / inventory123 (inactive)');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
seedUsers(); 