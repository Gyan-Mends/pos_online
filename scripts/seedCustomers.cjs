const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: Date,
  loyaltyPoints: { type: Number, default: 0, min: 0 },
  totalPurchases: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  notes: String
}, {
  timestamps: true
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

const sampleCustomers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0101',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    dateOfBirth: new Date('1985-03-15'),
    loyaltyPoints: 1250,
    totalPurchases: 15,
    totalSpent: 2750.50,
    notes: 'Premium customer - prefers organic products'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0102',
    address: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    },
    dateOfBirth: new Date('1990-07-22'),
    loyaltyPoints: 850,
    totalPurchases: 8,
    totalSpent: 1650.25,
    notes: 'Regular customer - likes promotional offers'
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@email.com',
    phone: '+1-555-0103',
    address: {
      street: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'United States'
    },
    dateOfBirth: new Date('1978-12-03'),
    loyaltyPoints: 2100,
    totalPurchases: 25,
    totalSpent: 4250.75,
    notes: 'VIP customer - bulk purchaser for office supplies'
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+1-555-0104',
    address: {
      street: '321 Elm Street',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'United States'
    },
    dateOfBirth: new Date('1995-05-18'),
    loyaltyPoints: 450,
    totalPurchases: 5,
    totalSpent: 750.00,
    notes: 'New customer - interested in eco-friendly products'
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '+1-555-0105',
    address: {
      street: '654 Maple Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'United States'
    },
    dateOfBirth: new Date('1982-09-12'),
    loyaltyPoints: 1580,
    totalPurchases: 18,
    totalSpent: 3200.40,
    notes: 'Tech enthusiast - prefers latest gadgets'
  },
  {
    firstName: 'Jessica',
    lastName: 'Garcia',
    email: 'jessica.garcia@email.com',
    phone: '+1-555-0106',
    address: {
      street: '987 Cedar Lane',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'United States'
    },
    dateOfBirth: new Date('1988-11-30'),
    loyaltyPoints: 920,
    totalPurchases: 12,
    totalSpent: 1850.60,
    notes: 'Health-conscious customer - buys organic and natural products'
  },
  {
    firstName: 'Christopher',
    lastName: 'Martinez',
    email: 'chris.martinez@email.com',
    phone: '+1-555-0107',
    address: {
      street: '147 Birch Street',
      city: 'Denver',
      state: 'CO',
      zipCode: '80201',
      country: 'United States'
    },
    dateOfBirth: new Date('1975-04-08'),
    loyaltyPoints: 3200,
    totalPurchases: 35,
    totalSpent: 6500.90,
    notes: 'Long-term customer - runs a small business, bulk orders'
  },
  {
    firstName: 'Amanda',
    lastName: 'Taylor',
    email: 'amanda.taylor@email.com',
    phone: '+1-555-0108',
    address: {
      street: '258 Willow Court',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      country: 'United States'
    },
    dateOfBirth: new Date('1992-01-25'),
    loyaltyPoints: 670,
    totalPurchases: 7,
    totalSpent: 1320.15,
    notes: 'Student discount eligible - price-sensitive buyer'
  },
  {
    firstName: 'Robert',
    lastName: 'Anderson',
    email: 'robert.anderson@email.com',
    phone: '+1-555-0109',
    address: {
      street: '369 Spruce Avenue',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30301',
      country: 'United States'
    },
    dateOfBirth: new Date('1980-06-14'),
    loyaltyPoints: 1750,
    totalPurchases: 20,
    totalSpent: 3750.25,
    notes: 'Corporate account - office supplies and equipment'
  },
  {
    firstName: 'Lisa',
    lastName: 'Thomas',
    email: 'lisa.thomas@email.com',
    phone: '+1-555-0110',
    address: {
      street: '741 Poplar Street',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      country: 'United States'
    },
    dateOfBirth: new Date('1987-08-07'),
    loyaltyPoints: 1100,
    totalPurchases: 14,
    totalSpent: 2200.80,
    notes: 'Environmentally conscious - prefers sustainable products'
  },
  {
    firstName: 'James',
    lastName: 'White',
    email: 'james.white@email.com',
    phone: '+1-555-0111',
    address: {
      street: '852 Ash Boulevard',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94101',
      country: 'United States'
    },
    dateOfBirth: new Date('1983-10-19'),
    loyaltyPoints: 2850,
    totalPurchases: 28,
    totalSpent: 5100.45,
    notes: 'Tech professional - frequent buyer of electronics'
  },
  {
    firstName: 'Michelle',
    lastName: 'Harris',
    email: 'michelle.harris@email.com',
    phone: '+1-555-0112',
    address: {
      street: '963 Cherry Road',
      city: 'Las Vegas',
      state: 'NV',
      zipCode: '89101',
      country: 'United States'
    },
    dateOfBirth: new Date('1991-02-11'),
    loyaltyPoints: 540,
    totalPurchases: 6,
    totalSpent: 980.30,
    notes: 'Fashion enthusiast - interested in trendy items'
  }
];

async function seedCustomers() {
  try {
    // Clear existing customers
    await Customer.deleteMany({});
    console.log('Cleared existing customers');
    
    // Insert new customers
    const insertedCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`Inserted ${insertedCustomers.length} customers successfully`);
    
    // Display summary
    console.log('\n=== CUSTOMER SEEDING SUMMARY ===');
    console.log(`Total customers: ${insertedCustomers.length}`);
    console.log(`Total loyalty points across all customers: ${insertedCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}`);
    console.log(`Total spent across all customers: $${insertedCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}`);
    console.log(`Average spending per customer: $${(insertedCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / insertedCustomers.length).toFixed(2)}`);
    
    console.log('\n=== VIP CUSTOMERS (>$3000 spent) ===');
    const vipCustomers = insertedCustomers.filter(c => c.totalSpent > 3000);
    vipCustomers.forEach(customer => {
      console.log(`${customer.firstName} ${customer.lastName}: $${customer.totalSpent.toFixed(2)} (${customer.loyaltyPoints} points)`);
    });
    
    console.log('\n=== TOP STATES BY CUSTOMERS ===');
    const stateCount = insertedCustomers.reduce((acc, customer) => {
      const state = customer.address?.state || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(stateCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`${state}: ${count} customers`);
      });

  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedCustomers(); 