import { data } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import Store from '../../models/Store';
import '../../mongoose.server';

// GET /api/store - Get store information
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET') {
      // Get store information (there should only be one store record)
      const store = await Store.findOne({ isActive: true });
      
      if (!store) {
        // Return default store structure if no store exists
        return data({
          success: false,
          message: 'No store information found',
          data: null
        }, { status: 404 });
      }

      return data({
        success: true,
        data: store
      });
    }

    return data({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Store API error:', error);
    return data({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST/PUT /api/store - Create or update store information
export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = request.method;
    const body = await request.json();

    // Parse JSON data directly
    const storeData = {
      name: body.name,
      description: body.description,
      logo: body.logo,
      website: body.website,
      email: body.email,
      phone: body.phone,
      address: body.address || {},
      businessRegistration: body.businessRegistration,
      taxId: body.taxId,
      businessType: body.businessType,
      operatingHours: body.operatingHours || {},
      currency: body.currency || 'GHS',
      timezone: body.timezone || 'Africa/Accra',
      dateFormat: body.dateFormat || 'DD/MM/YYYY',
      receiptSettings: body.receiptSettings || {},
      notifications: body.notifications || {},
      socialMedia: body.socialMedia || {},
      taxSettings: body.taxSettings || { rate: 0, type: 'percentage', name: 'VAT' },
      isActive: true,
    };

    if (method === 'POST' || method === 'PUT') {
      // Check if store already exists
      const existingStore = await Store.findOne({ isActive: true });
      
      if (existingStore) {
        // Update existing store
        const updatedStore = await Store.findByIdAndUpdate(
          existingStore._id,
          storeData,
          { new: true, runValidators: true }
        );

        return data({
          success: true,
          message: 'Store information updated successfully',
          data: updatedStore
        });
      } else {
        // Create new store
        const newStore = new Store(storeData);
        await newStore.save();

        return data({
          success: true,
          message: 'Store information created successfully',
          data: newStore
        });
      }
    }

    if (method === 'DELETE') {
      // Soft delete store (set isActive to false)
      const store = await Store.findOne({ isActive: true });
      if (!store) {
        return data({
          success: false,
          message: 'Store not found'
        }, { status: 404 });
      }

      store.isActive = false;
      await store.save();

      return data({
        success: true,
        message: 'Store information deactivated successfully'
      });
    }

    return data({ success: false, message: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Store API error:', error);
    return data({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 