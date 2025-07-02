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
  Link,
  Switch
} from '@heroui/react';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { authAPI } from '../utils/api';
import { successToast, errorToast } from '../components/toast';
import type { AuthResponse, APIError } from '../types';
import type { Route } from "./+types/login";

// Add theme icons
const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    
    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // User is already logged in, redirect to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      {/* Theme Toggle - positioned at top right */}
      <div className="absolute top-6 right-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
          <Switch
            isSelected={isDarkMode}
            onValueChange={toggleTheme}
            thumbIcon={({ isSelected }) =>
              isSelected ? <MoonIcon /> : <SunIcon />
            }
            size="sm"
          />
        </div>
      </div>

      <div className="w-full max-w-md">
          <div className="pb-0 pt-6 px-6 flex-col items-center">
            <div className="flex items-center justify-center   p-3 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-semibold font-heading text-center text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600 font-heading dark:text-gray-400 text-center mt-1">
              Sign in to your account
            </p>
          </div>
          
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4">
              <div>
                <Input
                  variant="bordered"
                  type="email"
                  label="Email Address"
                  labelPlacement="outside"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: " text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-black/20 dark:border-white/20"
                  }}
                />
              </div>

              <div>
                <Input
                  variant="bordered"
                  type={isVisible ? "text" : "password"}
                  label="Password"
                  labelPlacement="outside"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  startContent={<Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  }
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  isDisabled={isLoading}
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300 font-medium",
                    input: " text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    inputWrapper: "border border-1 border-black/20 dark:border-white/20"
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="mr-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400" 
                  />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
              
              </div>

              <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full font-semibold bg-primary-600 hover:bg-primary-700 dark:bg-primary-300 dark:hover:bg-primary-400 text-white"
                isLoading={isLoading}
                isDisabled={isLoading}
                spinner={<Spinner color="white" size="sm" />}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Divider className="my-6 bg-gray-200 dark:bg-gray-700" />

         
          </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Contact your administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


// oklch(.21 .006 285.885)