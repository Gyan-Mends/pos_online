import { Outlet, useNavigate, useLocation } from "react-router";
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
} from "@heroui/react";

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

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const navigation = [
  { name: "Dashboard", icon: DashboardIcon, href: "/dashboard" },
  { name: "POS", icon: POSIcon, href: "/pos" },
  { name: "Sales", icon: SalesIcon, href: "/sales" },
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
    href: "/inventory",
    submenu: [
      { name: "Stock Levels", href: "/inventory" },
      { name: "Movements", href: "/inventory/movements" },
      { name: "Adjustments", href: "/inventory/adjustments" }
    ]
  },
  { name: "Customers", icon: CustomersIcon, href: "/customers" },
  { 
    name: "Reports", 
    icon: ReportsIcon, 
    href: "/reports",
    submenu: [
      { name: "Dashboard", href: "/reports" },
      { name: "Sales Reports", href: "/reports/sales" },
      { name: "Product Reports", href: "/reports/products" },
      { name: "Inventory Reports", href: "/reports/inventory" },
      { name: "Employee Reports", href: "/reports/employees" },
      { name: "Financial Reports", href: "/reports/financial" }
    ]
  },
  { name: "Users", icon: UsersIcon, href: "/users" },
  { 
    name: "Settings", 
    icon: SettingsIcon, 
    href: "/settings",
    submenu: [
      { name: "General", href: "/settings" },
      { name: "Store Information", href: "/settings/store" },
      { name: "Tax Configuration", href: "/settings/tax" },
      { name: "Payment Methods", href: "/settings/payments" },
      { name: "Receipt Templates", href: "/settings/receipts" },
      { name: "Printers", href: "/settings/printers" },
      { name: "Backup & Restore", href: "/settings/backup" }
    ]
  }
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
    navigation.forEach(item => {
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
  }, [location.pathname]);

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
    for (const item of navigation) {
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
    const currentPage = navigation.find(item => 
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
      return item.submenu.some((subItem: any) => 
        location.pathname === subItem.href || 
        location.pathname.startsWith(subItem.href + '/')
      );
    }
    return location.pathname === item.href || 
           (item.href === '/dashboard' && location.pathname === '/') ||
           location.pathname.startsWith(item.href + '/');
  };

  const isSubmenuItemActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">POS</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Point of Sale</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">POS</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.name);

            if (item.submenu && !sidebarCollapsed) {
              return (
                <div key={item.name}>
                  {/* Main Item */}
                  <Button
                    variant={isActive ? "flat" : "light"}
                    color={isActive ? "primary" : "default"}
                    className={`w-full justify-between ${
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    startContent={<IconComponent />}
                    endContent={
                      <ChevronRightIcon 
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    }
                    onClick={() => toggleExpanded(item.name)}
                  >
                    {item.name}
                  </Button>

                  {/* Submenu */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Button
                          key={subItem.href}
                          variant="light"
                          size="sm"
                          className={`w-full justify-start text-sm ${
                            isSubmenuItemActive(subItem.href)
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
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
                  variant={isActive ? "flat" : "light"}
                  color={isActive ? "primary" : "default"}
                  className={`w-full ${sidebarCollapsed ? "justify-center px-2 min-w-0" : "justify-start"} ${
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  startContent={!sidebarCollapsed ? <IconComponent /> : undefined}
                  onClick={() => navigate(item.href)}
                >
                  {sidebarCollapsed ? <IconComponent /> : item.name}
                </Button>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Admin Links */}
          {!sidebarCollapsed && (
            <div className="mb-4 space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Admin
              </div>
              <Button
                variant="light"
                size="sm"
                className="w-full justify-start text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => navigate('/audit')}
              >
                Audit Trail
              </Button>
              <Button
                variant="light"
                size="sm"
                className="w-full justify-start text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => navigate('/logs')}
              >
                System Logs
              </Button>
            </div>
          )}

          {/* User Profile */}
          <Dropdown placement="top-start">
            <DropdownTrigger>
              <Button
                variant="light"
                className={`w-full ${sidebarCollapsed ? "justify-center px-2 min-w-0" : "justify-start"} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                {sidebarCollapsed ? (
                  <Avatar size="sm" name="Admin" className="flex-shrink-0" />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Avatar size="sm" name="Admin" className="flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Admin User</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">admin@pos.com</span>
                    </div>
                  </div>
                )}
              </Button>
            </DropdownTrigger>
            <DropdownMenu onAction={(key) => {
              if (key === 'profile') {
                navigate('/profile');
              } else if (key === 'security') {
                navigate('/profile/security');
              } else if (key === 'preferences') {
                navigate('/settings');
              } else if (key === 'logout') {
                // Handle logout logic
                console.log('Logout clicked');
              }
            }}>
              <DropdownItem key="profile">Profile</DropdownItem>
              <DropdownItem key="security">Security Settings</DropdownItem>
              <DropdownItem key="preferences">Preferences</DropdownItem>
              <DropdownItem key="logout" color="danger">
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/pos')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  New Sale
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/products')}
                  className="text-green-600 hover:text-green-700"
                >
                  Add Product
                </Button>
              </div>

              <Divider orientation="vertical" className="h-6 hidden md:block" />

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
                  <Button variant="light" size="sm" className="text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Avatar size="sm" name="Admin" className="flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block">
                        Admin
                      </span>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu onAction={(key) => {
                  if (key === 'profile') {
                    navigate('/profile');
                  } else if (key === 'security') {
                    navigate('/profile/security');
                  } else if (key === 'preferences') {
                    navigate('/settings');
                  } else if (key === 'logout') {
                    // Handle logout logic
                    console.log('Logout clicked');
                  }
                }}>
                  <DropdownItem key="profile">
                    <div className="flex flex-col">
                      <span className="font-medium">Admin User</span>
                      <span className="text-xs text-gray-500">admin@pos.com</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="security">Security Settings</DropdownItem>
                  <DropdownItem key="preferences">Preferences</DropdownItem>
                  <DropdownItem key="logout" color="danger">
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}