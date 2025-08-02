import { data } from 'react-router';

// GET /api/dashboard - Get dashboard statistics
export async function loader({ request }: { request: Request }) {
  try {
    // Import server-only modules
    await import('../../mongoose.server');
    const { default: Sale } = await import('../../models/Sale');
    const { default: Product } = await import('../../models/Product');
    const { default: Customer } = await import('../../models/Customer');
    const { default: User } = await import('../../models/User');
    const url = new URL(request.url);
    const currentUserId = request.headers.get('x-user-id');
    const currentUserRole = request.headers.get('x-user-role');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Build query filters based on user role
    const salesQuery: any = {};
    if (currentUserRole === 'cashier' && currentUserId) {
      salesQuery.sellerId = currentUserId;
    }
    
    // Today's sales
    const todaySalesQuery = { 
      ...salesQuery,
      saleDate: { $gte: startOfDay, $lt: endOfDay },
      status: 'completed'
    };
    
    const todaySales = await Sale.find(todaySalesQuery);
    const todayPositiveSales = todaySales.filter(sale => (sale.totalAmount || 0) > 0);
    const todayRevenue = todayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const todayCount = todayPositiveSales.length;
    
    // Yesterday's sales for comparison
    const yesterdayStart = new Date(startOfDay);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(endOfDay);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    
    const yesterdaySales = await Sale.find({
      ...salesQuery,
      saleDate: { $gte: yesterdayStart, $lt: yesterdayEnd },
      status: 'completed'
    });
    const yesterdayPositiveSales = yesterdaySales.filter(sale => (sale.totalAmount || 0) > 0);
    const yesterdayRevenue = yesterdayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const yesterdayCount = yesterdayPositiveSales.length;
    
    // Monthly sales
    const monthlySalesQuery = { 
      ...salesQuery,
      saleDate: { $gte: startOfMonth, $lt: endOfMonth },
      status: 'completed'
    };
    
    const monthlySales = await Sale.find(monthlySalesQuery);
    const monthlyPositiveSales = monthlySales.filter(sale => (sale.totalAmount || 0) > 0);
    const monthlyRevenue = monthlyPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    
    // Last month for comparison
    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(startOfMonth);
    
    const lastMonthSales = await Sale.find({
      ...salesQuery,
      saleDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
      status: 'completed'
    });
    const lastMonthPositiveSales = lastMonthSales.filter(sale => (sale.totalAmount || 0) > 0);
    const lastMonthRevenue = lastMonthPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    
    // Weekly sales trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const daySales = await Sale.find({
        ...salesQuery,
        saleDate: { $gte: dayStart, $lt: dayEnd },
        status: 'completed'
      });
      
      const dayPositiveSales = daySales.filter(sale => (sale.totalAmount || 0) > 0);
      const dayRevenue = dayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
      weeklyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        count: dayPositiveSales.length
      });
    }
    
    // Monthly sales trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthSales = await Sale.find({
        ...salesQuery,
        saleDate: { $gte: monthStart, $lt: monthEnd },
        status: 'completed'
      });
      
      const monthPositiveSales = monthSales.filter(sale => (sale.totalAmount || 0) > 0);
      const monthRevenue = monthPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
      monthlyTrend.push({
        month: monthStart.toISOString().substring(0, 7),
        revenue: monthRevenue,
        count: monthPositiveSales.length
      });
    }
    
    // Recent sales
    const recentSales = await Sale.find(salesQuery)
      .populate('customerId', 'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Top products (for admins) or cashier's top products
    const topProductsQuery = currentUserRole === 'cashier' && currentUserId 
      ? { sellerId: currentUserId, status: 'completed' }
      : { status: 'completed' };
    
    const topProductsSales = await Sale.find({
      ...topProductsQuery,
      saleDate: { $gte: startOfMonth, $lt: endOfMonth }
    }).populate('items.productId', 'name sku').lean();
    
    // Calculate top products
    const productSales = new Map();
    topProductsSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.productId?._id?.toString();
        const productName = item.productId?.name || 'Unknown Product';
        if (productId) {
          const existing = productSales.get(productId) || { 
            name: productName, 
            quantity: 0, 
            revenue: 0 
          };
          existing.quantity += item.quantity || 0;
          existing.revenue += (item.quantity || 0) * (item.unitPrice || 0);
          productSales.set(productId, existing);
        }
      });
    });
    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Calculate percentage changes
    const todayRevenueChange = yesterdayRevenue === 0 ? 0 : 
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    
    const todayCountChange = yesterdayCount === 0 ? 0 : 
      ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    
    const monthlyRevenueChange = lastMonthRevenue === 0 ? 0 : 
      ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    
    // Calculate total revenue for all users (with role-based filtering)
    const totalRevenueQuery = currentUserRole === 'cashier' && currentUserId 
      ? { sellerId: currentUserId, status: 'completed', totalAmount: { $gt: 0 } }
      : { status: 'completed', totalAmount: { $gt: 0 } };
    
    const totalRevenue = await Sale.aggregate([
      { $match: totalRevenueQuery },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => result[0]?.total || 0);

    const totalSalesCount = await Sale.countDocuments(totalRevenueQuery);
    
    // Admin-specific data
    let adminData = {};
    if (currentUserRole === 'admin') {
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      const totalProducts = await Product.countDocuments({ isActive: true });
      const totalUsers = await User.countDocuments({ isActive: true });
      const lowStockProducts = await Product.countDocuments({ 
        stockQuantity: { $lt: 10 }, 
        isActive: true 
      });
      
      adminData = {
        totalCustomers,
        totalProducts,
        totalUsers,
        lowStockProducts
      };
    }
    
    const dashboardData = {
      todayStats: {
        revenue: todayRevenue,
        count: todayCount,
        revenueChange: todayRevenueChange,
        countChange: todayCountChange
      },
      monthlyStats: {
        revenue: monthlyRevenue,
        count: monthlyPositiveSales.length,
        revenueChange: monthlyRevenueChange
      },
      weeklyTrend,
      monthlyTrend,
      recentSales: recentSales.slice(0, 5),
      topProducts,
      totalRevenue,
      totalSales: totalSalesCount,
      ...adminData
    };
    
    return data({
      success: true,
      data: dashboardData
    });
    
  } catch (error: any) {
    console.error('Error in dashboard loader:', error);
    return data(
      {
        success: false,
        message: error.message || 'Failed to load dashboard data'
      },
      { status: 500 }
    );
  }
} 