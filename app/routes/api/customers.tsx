import { data } from 'react-router';
import type { Route } from './+types/customers';

// Helper function to hash password
const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.default.genSalt(12);
  return bcrypt.default.hash(password, salt);
};

// Helper function to compare password
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(password, hashedPassword);
};

// Customer Authentication Functions
const authenticateCustomer = async (email: string, password: string) => {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Customer } = await import('../../models/Customer');
    
    // Find customer by email
    const customer = await Customer.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!customer) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Check if customer has password in notes (temporary solution)
    if (!customer.notes || !customer.notes.startsWith('pwd:')) {
      return { success: false, message: 'Account not set up for login. Please contact support.' };
    }

    // Extract hashed password from notes
    const hashedPassword = customer.notes.replace('pwd:', '').split('|')[0];
    
    // Verify password
    const isPasswordValid = await comparePassword(password, hashedPassword);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid email or password' };
    }

    // Return customer data without password
    const customerData = {
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };

    return { success: true, data: customerData };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
};

const createCustomerWithPassword = async (customerData: any, password: string) => {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Customer } = await import('../../models/Customer');
    
    // Validate required fields
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !password) {
      return { success: false, message: 'First name, last name, email, and password are required' };
    }

    // Check for duplicate email
    const existingCustomer = await Customer.findOne({ 
      email: customerData.email.toLowerCase(),
      isActive: true 
    });
    
    if (existingCustomer) {
      return { success: false, message: 'Customer with this email already exists' };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create customer with password stored in notes (temporary solution)
    const customer = new Customer({
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email.toLowerCase(),
      phone: customerData.phone,
      address: customerData.address,
      dateOfBirth: customerData.dateOfBirth,
      notes: `pwd:${hashedPassword}|Customer account created for e-commerce`,
      loyaltyPoints: 0,
      totalPurchases: 0,
      totalSpent: 0,
      isActive: true
    });
    
    await customer.save();
    
    // Return customer data without password
    const responseData = {
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
    
    return { success: true, data: responseData, message: 'Customer account created successfully' };
  } catch (error) {
    console.error('Customer creation error:', error);
    return { success: false, message: 'Failed to create customer account' };
  }
};

// GET /api/customers - Get all customers
// GET /api/customers/{id}/purchases - Get customer purchase history
// GET /api/customers/auth/login - Customer login (POST method will handle this)
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Customer } = await import('../../models/Customer');
    const { default: Sale } = await import('../../models/Sale');
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Handle customer authentication route
    if (pathParts.includes('auth')) {
      return data(
        {
          success: false,
          message: 'Use POST method for authentication'
        },
        { status: 405 }
      );
    }
    
    // Check if this is a purchase history request: /api/customers/{id}/purchases
    if (pathParts.length === 5 && pathParts[4] === 'purchases') {
      const customerId = pathParts[3];
      
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return data(
          {
            success: false,
            message: 'Invalid customer ID'
          },
          { status: 400 }
        );
      }
      
      // Get customer purchase history
      const sales = await Sale.find({ 
        customerId: customerId,
        status: { $in: ['completed', 'refunded', 'partially_refunded'] }
      })
        .populate('items.product', 'name sku price')
        .sort({ saleDate: -1 })
        .limit(100);
      
      return data({
        success: true,
        data: sales
      });
    }

    // Check if this is a single customer request: /api/customers/{id}
    if (pathParts.length === 4 && pathParts[3] && pathParts[3] !== 'undefined') {
      const customerId = pathParts[3];
      
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return data(
          {
            success: false,
            message: 'Invalid customer ID'
          },
          { status: 400 }
        );
      }
      
      // Get single customer
      const customer = await Customer.findById(customerId);
      
      if (!customer || !customer.isActive) {
        return data(
          {
            success: false,
            message: 'Customer not found'
          },
          { status: 404 }
        );
      }
      
      // Remove password from notes before sending response
      const customerData = {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        dateOfBirth: customer.dateOfBirth,
        loyaltyPoints: customer.loyaltyPoints,
        totalPurchases: customer.totalPurchases,
        totalSpent: customer.totalSpent,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      };
      
      return data({
        success: true,
        data: customerData
      });
    }
    
    // Regular customers list
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const skip = (page - 1) * limit;
    
    let query: any = { isActive: true };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);
    
    // Remove passwords from notes before sending response
    const sanitizedCustomers = customers.map((customer: any) => ({
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      loyaltyPoints: customer.loyaltyPoints,
      totalPurchases: customer.totalPurchases,
      totalSpent: customer.totalSpent,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }));
    
    return data({
      success: true,
      data: sanitizedCustomers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to fetch customers'
      },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
// POST /api/customers/auth/login - Customer login
// POST /api/customers/auth/signup - Customer signup with password
export async function action({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: Customer } = await import('../../models/Customer');
    
    const method = request.method;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // Handle authentication routes
    if (pathParts.includes('auth')) {
      const authAction = pathParts[pathParts.length - 1];
      
      if (authAction === 'login') {
        // Customer login
        const { email, password } = await request.json();
        
        if (!email || !password) {
          return data(
            {
              success: false,
              message: 'Email and password are required'
            },
            { status: 400 }
          );
        }
        
        const result = await authenticateCustomer(email, password);
        
        if (result.success) {
          return data({
            success: true,
            data: { customer: result.data },
            message: 'Login successful'
          });
        } else {
          return data(
            {
              success: false,
              message: result.message
            },
            { status: 401 }
          );
        }
      }
      
      if (authAction === 'signup') {
        // Customer signup
        const { password, ...customerData } = await request.json();
        
        const result = await createCustomerWithPassword(customerData, password);
        
        if (result.success) {
          return data({
            success: true,
            data: { customer: result.data },
            message: result.message
          });
        } else {
          const status = result.message?.includes('already exists') ? 409 : 400;
          return data(
            {
              success: false,
              message: result.message
            },
            { status }
          );
        }
      }
      
      return data(
        {
          success: false,
          message: 'Invalid authentication action'
        },
        { status: 400 }
      );
    }
    
    if (method === 'POST') {
      const customerData = await request.json();
      
      // Validate required fields
      if (!customerData.firstName || !customerData.lastName) {
        return data(
          {
            success: false,
            message: 'First name and last name are required'
          },
          { status: 400 }
        );
      }
      
      // Check for duplicate email or phone
      if (customerData.email) {
        const existingCustomer = await Customer.findOne({ 
          email: customerData.email,
          isActive: true 
        });
        if (existingCustomer) {
          return data(
            {
              success: false,
              message: 'Customer with this email already exists'
            },
            { status: 409 }
          );
        }
      }
      
      if (customerData.phone) {
        const existingCustomer = await Customer.findOne({ 
          phone: customerData.phone,
          isActive: true 
        });
        if (existingCustomer) {
          return data(
            {
              success: false,
              message: 'Customer with this phone number already exists'
            },
            { status: 409 }
          );
        }
      }
      
      const customer = new Customer({
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        dateOfBirth: customerData.dateOfBirth,
        notes: customerData.notes,
        loyaltyPoints: 0,
        totalPurchases: 0,
        totalSpent: 0,
        isActive: true
      });
      
      await customer.save();
      
      return data({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      });
    }
    
    // Handle PUT and DELETE by parsing URL for customer ID
    const customerId = pathParts[pathParts.length - 1];
    
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return data(
        {
          success: false,
          message: 'Invalid customer ID'
        },
        { status: 400 }
      );
    }
    
    if (method === 'PUT') {
      const updateData = await request.json();
      
      // Check for duplicate email or phone (excluding current customer)
      if (updateData.email) {
        const existingCustomer = await Customer.findOne({ 
          email: updateData.email,
          _id: { $ne: customerId },
          isActive: true 
        });
        if (existingCustomer) {
          return data(
            {
              success: false,
              message: 'Customer with this email already exists'
            },
            { status: 409 }
          );
        }
      }
      
      if (updateData.phone) {
        const existingCustomer = await Customer.findOne({ 
          phone: updateData.phone,
          _id: { $ne: customerId },
          isActive: true 
        });
        if (existingCustomer) {
          return data(
            {
              success: false,
              message: 'Customer with this phone number already exists'
            },
            { status: 409 }
          );
        }
      }
      
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      
      if (!customer) {
        return data(
          {
            success: false,
            message: 'Customer not found'
          },
          { status: 404 }
        );
      }
      
      return data({
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      });
    }
    
    if (method === 'DELETE') {
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      if (!customer) {
        return data(
          {
            success: false,
            message: 'Customer not found'
          },
          { status: 404 }
        );
      }
      
      return data({
        success: true,
        message: 'Customer deleted successfully'
      });
    }
    
    return data(
      {
        success: false,
        message: 'Method not allowed'
      },
      { status: 405 }
    );
  } catch (error: any) {
    console.error('Error in customers API:', error);
    return data(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
} 