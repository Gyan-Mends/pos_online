import { Outlet, useNavigate, useLocation } from "react-router";
import React from "react";
import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Tooltip,
  Switch,
  Divider,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Accordion,
  AccordionItem,
  Spinner,
} from "@heroui/react";
import { authAPI } from "../utils/api";
import { successToast, errorToast } from "../components/toast";
import type { User } from "../types";
import { Toaster } from "react-hot-toast";
import { useStoreData } from "../hooks/useStore";

// Icons (using simple SVG icons)
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SalesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const POSIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProductsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const InventoryIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CustomersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ReportsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

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

const AuditIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const LogsIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const TruckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);

const OrdersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

// Add these type definitions at the top of the file
type SubMenuItem = {
  name: string;
  href: string;
};

type NavigationItem = {
  name: string;
  icon: ({ className }: { className?: string }) => React.ReactNode;
  href: string;
  submenu?: SubMenuItem[];
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", icon: DashboardIcon, href: "/dashboard" },
  { 
    name: "Sales & POS", 
    icon: POSIcon, 
    href: "/pos",
    submenu: [
      { name: "Point of Sale", href: "/pos" },
      { name: "Sales History", href: "/sales" },
      { name: "Process Refund", href: "/sales/refund" }
    ]
  },
  { 
    name: "Products", 
    icon: ProductsIcon, 
    href: "/products",
    submenu: [
      { name: "All Products", href: "/products" },
      { name: "Categories", href: "/categories" }
    ]
  },
  { 
    name: "Inventory", 
    icon: InventoryIcon, 
    href: "/inventory/movements",
    submenu: [
      { name: "Movements", href: "/inventory/movements" },
      { name: "Adjustments", href: "/inventory/adjustments" }
    ]
  },
  // { 
  //   name: "Procurement", 
  //   icon: TruckIcon, 
  //   href: "/purchase-orders",
  //   submenu: [
  //     { name: "Purchase Orders", href: "/purchase-orders" },
  //     { name: "Suppliers", href: "/suppliers" },
  //     { name: "Receiving", href: "/purchase-orders/receiving" }
  //   ]
  // },
  { 
    name: "Customers", 
    icon: CustomersIcon, 
    href: "/customers",
    submenu: [
      { name: "All Customers", href: "/customers" },
    ]
  },
  { 
    name: "Orders", 
    icon: OrdersIcon, 
    href: "/orders",
    submenu: [
      { name: "Order Management", href: "/orders" },
      { name: "Tracking Dashboard", href: "/orders/dashboard" },
      { name: "Order Tracking", href: "/orders/tracking" }
    ]
  },
  { 
    name: "Reports", 
    icon: ReportsIcon, 
    href: "/reports",
    submenu: [
      { name: "Overview", href: "/reports" },
      { name: "Sales Reports", href: "/reports/sales" },
      { name: "Product Reports", href: "/reports/products" },
      { name: "Inventory Reports", href: "/reports/inventory" },
      { name: "Employee Reports", href: "/reports/employees" },
      { name: "Financial Reports", href: "/reports/financial" }
    ]
  },
  { 
    name: "Users", 
    icon: UsersIcon, 
    href: "/users",
    submenu: [
      { name: "All Users", href: "/users" },
      { name: "Roles & Permissions", href: "/users/roles" }
    ]
  },
  { 
    name: "Settings", 
    icon: SettingsIcon, 
    href: "/settings",
    submenu: [
      { name: "Store Information", href: "/settings/store" },
    ]
  }
];

// Function to filter navigation based on user role
const getNavigationForRole = (userRole: string): NavigationItem[] => {
  if (userRole === 'admin') {
    return navigation; // Admins see everything
  } else if (userRole === 'cashier') {
    // Cashiers only see POS-related items and profile
    return [
      { name: "Dashboard", icon: DashboardIcon, href: "/dashboard" },
      { 
        name: "Sales & POS", 
        icon: POSIcon, 
        href: "/pos",
        submenu: [
          { name: "Point of Sale", href: "/pos" },
          { name: "Sales History", href: "/sales" },
          { name: "Process Refund", href: "/sales/refund" }
        ]
      },
      { 
        name: "Profile", 
        icon: UsersIcon, 
        href: "/profile",
        submenu: [
          { name: "My Profile", href: "/profile" },
          { name: "Change Password", href: "/profile/security" }
        ]
      }
    ];
  }
  return [];
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { store } = useStoreData();
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Get filtered navigation based on user role
  const userNavigation = user ? getNavigationForRole(user.role) : [];

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for stored user data from login
      const userData = localStorage.getItem('user');

      if (!userData) {
        navigate('/');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Optionally verify session with backend
        // const profile = await authAPI.getProfile();
        // setUser(profile);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('user');
        navigate('/');
      } finally {
        setIsAuthenticating(false);
      }
    };

    checkAuth();
  }, [navigate]);

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

  // Initialize expanded items based on current path
  useEffect(() => {
    userNavigation.forEach(item => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some(subItem => 
          location.pathname === subItem.href || 
          location.pathname.startsWith(subItem.href + '/')
        );
        if (isSubmenuActive) {
          setExpandedItems(prev => 
            prev.includes(item.name) ? prev : [...prev, item.name]
          );
        }
      }
    });
  }, [location.pathname, userNavigation]);

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

  // Get current page title
  const getCurrentPageTitle = () => {
    // Check for submenu items first
    for (const item of userNavigation) {
      if (item.submenu) {
        const activeSubmenu = item.submenu.find(subItem => 
          location.pathname === subItem.href || 
          location.pathname.startsWith(subItem.href + '/')
        );
        if (activeSubmenu) {
          return activeSubmenu.name;
        }
      }
    }
    
    // Check main navigation items
    const currentPage = userNavigation.find(item => 
      location.pathname === item.href || 
      (item.href === '/dashboard' && location.pathname === '/') ||
      location.pathname.startsWith(item.href + '/')
    );
    
    return currentPage?.name || 'Dashboard';
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (item: any) => {
    if (item.submenu) {
      // For items with submenu, don't highlight parent unless exactly matching
      return location.pathname === item.href;
    }
    return location.pathname === item.href || 
           (item.href === '/dashboard' && location.pathname === '/');
  };

  const isSubmenuItemActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API (optional - for server-side session cleanup)
      try {
        await authAPI.logout();
      } catch (error) {
        // Even if logout API fails, we should still clear local data
        console.warn('Logout API call failed:', error);
      }
      
      // Clear local storage
      localStorage.removeItem('user');
      
      // Clear user state
      setUser(null);
      
      successToast('Logged out successfully');
      
      // Redirect to home
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      errorToast('Error during logout');
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render the layout (will redirect to login)
  if (!user) {
    return null;
  }

  return (
    <div style={{
      scrollBehavior: 'smooth',
      overflowY: 'scroll',
      scrollbarWidth: 'thin',
      scrollbarColor: 'transparent transparent',
      scrollbarGutter: 'stable',
    }} className="flex h-screen dark:customed-dark-bg">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <div style={{  
        scrollBehavior: 'smooth',
        overflowY: 'scroll',
        scrollbarWidth: 'thin',
        scrollbarColor: 'transparent transparent',
        scrollbarGutter: 'stable',
      }}
       className={`${sidebarCollapsed ? "w-16 flex items-center justify-center  flex-col" : "w-64"} customed-dark-card shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Header */}
        <div className=" flex items-center px-3 !py-5 border-b border-white/20 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              
              <span className="font-bold text-gray-900 dark:text-white font-heading">
                {store?.name || 'Point of Sale'}
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">
                {store?.name ? store.name.substring(0, 3).toUpperCase() : 'POS'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Container */}
        <div className="flex-1 flex flex-col pt-6 min-h-0">
          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="py-1">
              {userNavigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(item.name);

                if (item.submenu && !sidebarCollapsed) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-2 mt-2"  key={item.name}>
                      {/* Main Item */}
                      <Button
                        variant="light"
                        className={`w-full  h-9 px-3 ${
                          isActive 
                            ? "isActive" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        startContent={<IconComponent className="w-5 h-5" />}
                        endContent={
                          <ChevronRightIcon 
                            className={`w-4 h-4 transition-transform ml-auto ${isExpanded ? 'rotate-90' : ''}`} 
                          />
                        }
                        onClick={() => toggleExpanded(item.name)}
                      >
                        {item.name}
                      </Button>

                      {/* Submenu */}
                      {isExpanded && (
                        <div className="ml-3">
                          {item.submenu.map((subItem) => (
                            <Button
                              key={subItem.href}
                              variant="light"
                              className={`w-full justify-start h-8 px-3 text-sm ${
                                isSubmenuItemActive(subItem.href)
                                  ? "isActive"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                              onClick={() => navigate(subItem.href)}
                            >
                              {subItem.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular navigation item or collapsed mode
                return (
                  <Tooltip
                    key={item.name}
                    content={item.name}
                    placement="right"
                    isDisabled={!sidebarCollapsed}
                  >
                    <Button
                      variant="light"
                      className={`w-full ${sidebarCollapsed ? "justify-center h-9 px-2" : "justify-start h-9 px-3"} ${
                        isActive 
                          ? "isActive" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      startContent={!sidebarCollapsed ? <IconComponent className="w-5 h-5" /> : undefined}
                      onClick={() => navigate(item.href)}
                    >
                      {sidebarCollapsed ? <IconComponent className="w-5 h-5" /> : item.name}
                    </Button>
                  </Tooltip>
                );
              })}
            </div>
          </nav>

          {/* System Links - Only for Admin */}
          {!sidebarCollapsed && user?.role === 'admin' && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="py-1 px-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  System
                </div>
                <Button
                  variant="light"
                  className="w-full justify-start h-8 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => navigate('/audit')}
                  startContent={<AuditIcon className="w-4 h-4" />}
                >
                  Audit Trail
                </Button>
               
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="light"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <MenuIcon />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getCurrentPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
             


              {/* Theme Toggle */}
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
              
              {/* User Profile Dropdown */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <button>
                    <div className="flex items-center space-x-2">
                      <Avatar 
                        size="sm" 
                        // show users image
                        name={user?.avatar || 'User'}
                        src={user?.avatar}
                        className="flex-shrink-0" 
                      />
                      {/* <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block">
                        {user ? `${user.firstName} ${user.lastName}` : 'User'}
                      </span> */}
                    </div>
                  </button>
                </DropdownTrigger>
                <DropdownMenu 
                  onAction={(key) => {
                    switch(key) {
                      case 'profile':
                        navigate('/profile');
                        break;
                      case 'security':
                        navigate('/profile/security');
                        break;
                     
                      case 'logout':
                        handleLogout();
                        break;
                    }
                  }}
                >
                  <DropdownItem key="profile" className="py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
                      <span className="text-xs text-gray-500">{user?.email || 'user@example.com'}</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="security" startContent={<LockIcon className="w-4 h-4" />}>
                    Security Settings
                  </DropdownItem>
                  
                  <DropdownItem key="logout" className="text-danger" color="danger" startContent={<LogoutIcon className="w-4 h-4" />}>
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto  p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Add these icons near the top with other icons
const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const BellIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HelpIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LogoutIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);