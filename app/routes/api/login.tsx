import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import User from '../../models/User';
import { getSession, setSession } from '../../session';

// Validation helper
const validateLoginData = (email: string, password: string) => {
  const errors: { [key: string]: string[] } = {};

  if (!email || !email.trim()) {
    errors.email = ['Email is required'];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ['Please enter a valid email address'];
  }

  if (!password || !password.trim()) {
    errors.password = ['Password is required'];
  } else if (password.length < 6) {
    errors.password = ['Password must be at least 6 characters long'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Find user by email from database
const findUserByEmail = async (email: string) => {
  try {
    const user = await (User as any).findByEmailWithPassword(email.toLowerCase());
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

// Update user last login in database
const updateUserLastLogin = async (userId: string) => {
  try {
    await User.findByIdAndUpdate(userId, { 
      lastLogin: new Date() 
    });
  } catch (error) {
    console.error('Error updating user last login:', error);
  }
};

// Action function to handle POST requests
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data(
      { 
        success: false, 
        message: 'Method not allowed' 
      },
      { status: 405 }
    );
  }

  try {
    // Get session
    const session = await getSession(request.headers.get("Cookie"));
    
    // Parse request body
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    // Validate input data
    const validation = validateLoginData(email, password);
    if (!validation.isValid) {
      return data(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return data(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return data(
        {
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return data(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Update last login
    await updateUserLastLogin(user.id);

    // Set session using the existing session system
    const sessionCookie = await setSession(session, user.email, rememberMe);

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin
    };

    // Return success response with session cookie
    return data(
      {
        success: true,
        message: 'Login successful',
        user: userData
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': sessionCookie,
        }
      }
    );

  } catch (error) {
    console.error('Login API error:', error);
    
    return data(
      {
        success: false,
        message: 'Internal server error. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Loader function to handle GET requests (not allowed for login)
export function loader() {
  return data(
    { 
      success: false, 
      message: 'GET method not allowed for login endpoint' 
    },
    { status: 405 }
  );
} 