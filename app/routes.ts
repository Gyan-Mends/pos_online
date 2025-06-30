import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("routes/_layout.tsx", [
        // Dashboard
        route("/dashboard", "routes/dashboard/index.tsx"),
        
        // Products & Inventory Management
        route("/products", "routes/products/index.tsx"),
        route("/products/:id", "routes/products/view.tsx"),
        route("/categories", "routes/categories/index.tsx"),
        route("/inventory", "routes/inventory/index.tsx"),
        route("/inventory/movements", "routes/inventory/movements.tsx"),
        route("/inventory/adjustments", "routes/inventory/adjustments.tsx"),
        
        // Sales & POS
        route("/sales", "routes/sales/index.tsx"),
        route("/pos", "routes/pos/index.tsx"),
        route("/sales/view/:id", "routes/sales/view.tsx"),
        route("/sales/refund", "routes/sales/refund.tsx"),
        
        // Customer Management
        route("/customers", "routes/customers/index.tsx"),
        route("/customers/:id", "routes/customers/view.tsx"),
        route("/customers/:id/history", "routes/customers/history.tsx"),
        
        // Reports & Analytics
        route("/reports", "routes/reports/index.tsx"),
        route("/reports/sales", "routes/reports/sales.tsx"),
        route("/reports/products", "routes/reports/products.tsx"),
        route("/reports/inventory", "routes/reports/inventory.tsx"),
        route("/reports/employees", "routes/reports/employees.tsx"),
        route("/reports/financial", "routes/reports/financial.tsx"),
        
        // User Management (Admin)
        route("/users", "routes/users/index.tsx"),
        route("/users/:id", "routes/users/view.tsx"),
        
        // Settings
        route("/settings", "routes/settings/index.tsx"),
        route("/settings/store", "routes/settings/store.tsx"),
        route("/settings/tax", "routes/settings/tax.tsx"),
        route("/settings/payments", "routes/settings/payments.tsx"),
        route("/settings/receipts", "routes/settings/receipts.tsx"),
        route("/settings/printers", "routes/settings/printers.tsx"),
        route("/settings/backup", "routes/settings/backup.tsx"),
        
        // Profile & Account
        route("/profile", "routes/profile/index.tsx"),
        route("/profile/security", "routes/profile/security.tsx"),
        
        // Audit & Logs (Admin)
        route("/audit", "routes/audit/index.tsx"),
        route("/logs", "routes/logs/index.tsx")
    ]),
    // API Routes
    route("/api/login", "routes/api/login.tsx"),
    route("/api/users/*", "routes/api/users.tsx"),
    route("/api/products/*", "routes/api/products.tsx"),
    route("/api/categories/*", "routes/api/categories.tsx"),
    route("/api/stock-movements/*", "routes/api/stock-movements.tsx"),
    route("/api/sales/*", "routes/api/sales.tsx"),
    route("/api/customers/*", "routes/api/customers.tsx"),
    
    // Auth Route
    route("/", "routes/login.tsx")
] satisfies RouteConfig;
