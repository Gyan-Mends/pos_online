const mongoose = require('mongoose');

// Customer Schema
const customerSchema = new mongoose.Schema({
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
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: Date,
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

// Sample customers
const customers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    loyaltyPoints: 150,
    totalPurchases: 5,
    totalSpent: 299.99,
    isActive: true,
    notes: 'VIP customer, prefers contactless payment'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1234567891',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    loyaltyPoints: 75,
    totalPurchases: 3,
    totalSpent: 149.50,
    isActive: true,
    notes: 'Regular customer, likes electronics'
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@email.com',
    phone: '+1234567892',
    address: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    loyaltyPoints: 200,
    totalPurchases: 8,
    totalSpent: 599.25,
    isActive: true,
    notes: 'Bulk buyer, business owner'
  },
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@email.com',
    phone: '+1234567893',
    address: {
      street: '321 Elm St',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'USA'
    },
    loyaltyPoints: 50,
    totalPurchases: 2,
    totalSpent: 89.99,
    isActive: true,
    notes: 'New customer, interested in home goods'
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@email.com',
    phone: '+1234567894',
    address: {
      street: '654 Maple Ave',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA'
    },
    loyaltyPoints: 300,
    totalPurchases: 12,
    totalSpent: 899.75,
    isActive: true,
    notes: 'Loyal customer since 2020, prefers cash payments'
  }
];

async function seedCustomers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('Cleared existing customers');

    // Insert new customers
    const createdCustomers = await Customer.insertMany(customers);
    console.log(`Created ${createdCustomers.length} customers:`);
    
    createdCustomers.forEach(customer => {
      console.log(`- ${customer.firstName} ${customer.lastName} (${customer.email})`);
    });

    console.log('Customer seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedCustomers(); 