import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';

// GET /api/users - Get all users
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: User } = await import('../../models/User');
    
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];
    
    // Check if this is a request for a specific user
    if (userId && userId !== 'users' && mongoose.Types.ObjectId.isValid(userId)) {
      // Get specific user by ID
      const user = await User.findById(userId)
        .select('-password') // Exclude password field
        .lean();

      if (!user) {
        return data(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return data({
        success: true,
        data: user
      });
    }

    // Get all users with pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return data({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return data(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const mongoose = await import('mongoose');
    const { default: User } = await import('../../models/User');
    
    const method = request.method;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];

    switch (method) {
      case 'POST': {
        // Create new user
        const userData = await request.json();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          return data(
            { success: false, error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        // Create new user
        const newUser = new User(userData);
        await newUser.save();

        // Return user without password
        const userResponse = await User.findById(newUser._id).select('-password').lean();
        
        return data({
          success: true,
          data: userResponse,
          message: 'User created successfully'
        });
      }

      case 'PUT': {
        // Update user
        if (!userId || userId === 'users' || !mongoose.Types.ObjectId.isValid(userId)) {
          return data(
            { success: false, error: 'Valid User ID is required' },
            { status: 400 }
          );
        }

        const updateData = await request.json();
        
        // Handle password change separately
        if (updateData.changePassword) {
          const { currentPassword, newPassword } = updateData;
          
          if (!currentPassword || !newPassword) {
            return data(
              { success: false, error: 'Current password and new password are required' },
              { status: 400 }
            );
          }
          
          // Find user with password to verify current password
          const user = await User.findById(userId);
          if (!user) {
            return data(
              { success: false, error: 'User not found' },
              { status: 404 }
            );
          }
          
          // Verify current password
          const isCurrentPasswordValid = await user.comparePassword(currentPassword);
          if (!isCurrentPasswordValid) {
            return data(
              { success: false, error: 'Current password is incorrect' },
              { status: 400 }
            );
          }
          
          // Update password
          user.password = newPassword;
          await user.save();
          
          return data({
            success: true,
            message: 'Password changed successfully'
          });
        }
        
        // Remove password from update data if it's empty
        if (!updateData.password) {
          delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true }
        ).select('-password').lean();

        if (!updatedUser) {
          return data(
            { success: false, error: 'User not found' },
            { status: 404 }
          );
        }

        return data({
          success: true,
          data: updatedUser,
          message: 'Profile updated successfully'
        });
      }

      case 'DELETE': {
        // Delete user
        if (!userId || userId === 'users' || !mongoose.Types.ObjectId.isValid(userId)) {
          return data(
            { success: false, error: 'Valid User ID is required' },
            { status: 400 }
          );
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
          return data(
            { success: false, error: 'User not found' },
            { status: 404 }
          );
        }

        return data({
          success: true,
          message: 'User deleted successfully'
        });
      }

      default:
        return data(
          { success: false, error: 'Method not allowed' },
          { status: 405 }
        );
    }

  } catch (error) {
    console.error('Error in users API:', error);
    return data(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 