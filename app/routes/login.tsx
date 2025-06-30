import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  Spinner,
  Link
} from '@heroui/react';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { authAPI } from '../utils/api';
import { successToast, errorToast } from '../components/toast';
import type { AuthResponse, APIError } from '../types';
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - POS System" },
    { name: "description", content: "Sign in to your POS account" },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // User is already logged in, redirect to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe
      }) as AuthResponse;

      // Store authentication data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      successToast('Login successful! Welcome back.');
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error?.errors) {
        // Handle validation errors from API
        setErrors(error.errors);
      } else {
        const errorMessage = error?.message || 'Login failed. Please check your credentials.';
        errorToast(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-none">
          <CardHeader className="pb-0 pt-6 px-6 flex-col items-center">
            <div className="dark:bg-primary-900 p-3 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-center text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600 font-heading dark:text-gray-400 text-center mt-1">
              Sign in to your  account
            </p>
          </CardHeader>
          
          <CardBody className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4">
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  labelPlacement="outside"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Mail className="w-4 h-4 text-gray-400" />}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  isDisabled={isLoading}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: " h-12 border border-black/20 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }}
                />
              </div>

              <div>
                <Input
                  type={isVisible ? "text" : "password"}
                  label="Password"
                  labelPlacement="outside"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Lock className="w-4 h-4 text-gray-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  }
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  isDisabled={isLoading}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: " h-12 border border-black/20 dark:bg-gray-800 border-gray-200 dark:border-gray-700"                  }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link 
                  href="#" 
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-semibold"
                isLoading={isLoading}
                isDisabled={isLoading}
                spinner={<Spinner color="white" size="sm" />}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Divider className="my-6" />

         
          </CardBody>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
            >
              Contact your administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
