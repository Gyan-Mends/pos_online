# POS Online System

A comprehensive Point of Sale system built with React Router v7, TypeScript, and MongoDB.

## Features

- **Product Management**: Full CRUD operations for products with categories, pricing, and stock management
- **Barcode Scanning**: Built-in barcode scanning using device camera for:
  - Adding products with automatic barcode population
  - Quick product lookup by scanning existing barcodes
  - Real-time camera scanning with visual feedback
- **Inventory Management**: Track stock levels, movements, and adjustments
- **Sales Management**: Process sales, refunds, and track transactions
- **Customer Management**: Manage customer information and purchase history
- **Order Management**: Handle orders, tracking, and fulfillment
- **Reports**: Financial, inventory, and sales analytics
- **User Management**: Role-based access control
- **Settings**: Store configuration, tax settings, and preferences

## New Barcode Scanning Feature

The product management page now includes advanced barcode scanning capabilities:

### 1. **Add Product Mode**
- Click "Add Product" to open the form
- Use the camera button next to the barcode field to scan barcodes
- Automatically populates the barcode field when a code is detected

### 2. **Quick Scan Mode**
- Click "Quick Scan" button in the main toolbar
- Scan any barcode to instantly find matching products
- Shows search results in a modal with options to view or edit products
- Supports scanning by both barcode and SKU

### 3. **Scanner Features**
- Real-time camera preview with targeting overlay
- Automatic barcode detection and processing
- Error handling for camera access issues
- Support for multiple barcode formats (Code 128, EAN, UPC, etc.)
- Mobile-friendly with back camera preference

### 4. **Browser Compatibility**
- Works on modern browsers with camera access
- Requires HTTPS for camera permissions in production
- Fallback to manual entry if camera is unavailable

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Type Checking

```bash
npm run typecheck
```

## Building

```bash
npm run build
```

## Starting Production Server

```bash
npm run start
```

## Camera Permissions

For the barcode scanning feature to work:
1. Allow camera access when prompted by the browser
2. Ensure your site is served over HTTPS in production
3. The scanner will automatically select the best available camera

## Supported Barcode Formats

- Code 128
- EAN-8 and EAN-13
- UPC-A and UPC-E
- Code 39
- ITF
- Codabar
- QR Code
- Data Matrix

# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
