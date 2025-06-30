import { data } from 'react-router';
import mongoose from 'mongoose';
import Customer from '../../models/Customer';
import '../../mongoose.server';

// GET /api/customers - Get all customers
export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
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
    
    return data({
      success: true,
      data: customers,
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
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    
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
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
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