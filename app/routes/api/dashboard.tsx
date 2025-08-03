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
    
    // Today's sales - include completed and partially_refunded sales
    const todaySalesQuery = { 
      ...salesQuery,
      saleDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['completed', 'partially_refunded'] }
    };
    
    const todaySales = await Sale.find(todaySalesQuery);
    const todayPositiveSales = todaySales.filter(sale => (sale.totalAmount || 0) > 0);
    const todayRevenue = todayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const todayCount = todayPositiveSales.length;
    
    // Also try with createdAt field in case saleDate is not set
    const todaySalesQueryAlt = { 
      ...salesQuery,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['completed', 'partially_refunded'] }
    };
    
    const todaySalesAlt = await Sale.find(todaySalesQueryAlt);
    
    console.log('Dashboard Debug:', {
      todaySalesQuery,
      todaySalesFound: todaySales.length,
      todaySalesQueryAlt,
      todaySalesAltFound: todaySalesAlt.length,
      todayPositiveSales: todayPositiveSales.length,
      todayRevenue,
      todayCount,
      startOfDay,
      endOfDay,
      sampleSale: todaySales[0] || todaySalesAlt[0]
    });
    
    // Use whichever query found more sales
    const effectiveTodaySales = todaySales.length > 0 ? todaySales : todaySalesAlt;
    const effectiveTodayPositiveSales = effectiveTodaySales.filter(sale => (sale.totalAmount || 0) > 0);
    
    // Calculate revenue after deducting refunds (using same logic as financial report)
    const effectiveTodayRefundSales = effectiveTodaySales.filter(sale => (sale.totalAmount || 0) < 0);
    const effectiveTodayGrossRevenue = effectiveTodayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const effectiveTodayRefunds = Math.abs(effectiveTodayRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    const effectiveTodayRevenue = effectiveTodayGrossRevenue - effectiveTodayRefunds;
    
    const effectiveTodayCount = effectiveTodayPositiveSales.length;
    
    // Yesterday's sales for comparison
    const yesterdayStart = new Date(startOfDay);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(endOfDay);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    
    const yesterdaySales = await Sale.find({
      ...salesQuery,
      saleDate: { $gte: yesterdayStart, $lt: yesterdayEnd },
      status: { $in: ['completed', 'partially_refunded'] }
    });
    const yesterdayPositiveSales = yesterdaySales.filter(sale => (sale.totalAmount || 0) > 0);
    const yesterdayRefundSales = yesterdaySales.filter(sale => (sale.totalAmount || 0) < 0);
    const yesterdayGrossRevenue = yesterdayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const yesterdayRefunds = Math.abs(yesterdayRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    const yesterdayRevenue = yesterdayGrossRevenue - yesterdayRefunds;
    const yesterdayCount = yesterdayPositiveSales.length;
    
    // Monthly sales
    const monthlySalesQuery = { 
      ...salesQuery,
      saleDate: { $gte: startOfMonth, $lt: endOfMonth },
      status: { $in: ['completed', 'partially_refunded'] }
    };
    
    const monthlySales = await Sale.find(monthlySalesQuery);
    const monthlyPositiveSales = monthlySales.filter(sale => (sale.totalAmount || 0) > 0);
    const monthlyRefundSales = monthlySales.filter(sale => (sale.totalAmount || 0) < 0);
    const monthlyGrossRevenue = monthlyPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const monthlyRefunds = Math.abs(monthlyRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    const monthlyRevenue = monthlyGrossRevenue - monthlyRefunds;
    
    // Last month for comparison
    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(startOfMonth);
    
    const lastMonthSales = await Sale.find({
      ...salesQuery,
      saleDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
      status: { $in: ['completed', 'partially_refunded'] }
    });
    const lastMonthPositiveSales = lastMonthSales.filter(sale => (sale.totalAmount || 0) > 0);
    const lastMonthRefundSales = lastMonthSales.filter(sale => (sale.totalAmount || 0) < 0);
    const lastMonthGrossRevenue = lastMonthPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const lastMonthRefunds = Math.abs(lastMonthRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    const lastMonthRevenue = lastMonthGrossRevenue - lastMonthRefunds;
    
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
        status: { $in: ['completed', 'partially_refunded'] }
      });
      
      const dayPositiveSales = daySales.filter(sale => (sale.totalAmount || 0) > 0);
      const dayRefundSales = daySales.filter(sale => (sale.totalAmount || 0) < 0);
      const dayGrossRevenue = dayPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const dayRefunds = Math.abs(dayRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
      const dayRevenue = dayGrossRevenue - dayRefunds;
      
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
        status: { $in: ['completed', 'partially_refunded'] }
      });
      
      const monthPositiveSales = monthSales.filter(sale => (sale.totalAmount || 0) > 0);
      const monthRefundSales = monthSales.filter(sale => (sale.totalAmount || 0) < 0);
      const monthGrossRevenue = monthPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const monthRefunds = Math.abs(monthRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
      const monthRevenue = monthGrossRevenue - monthRefunds;
      
      monthlyTrend.push({
        month: monthStart.toISOString().substring(0, 7),
        revenue: monthRevenue,
        count: monthPositiveSales.length
      });
    }
    
    // Recent sales - only show positive sales (exclude refunds)
    const recentSalesQuery = {
      ...salesQuery,
      status: { $in: ['completed', 'partially_refunded'] },
      totalAmount: { $gt: 0 } // Only positive amounts (exclude refunds)
    };
    
    const recentSales = await Sale.find(recentSalesQuery)
      .populate('customerId', 'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Top products (for admins) or cashier's top products - include all sales including refunds
    const topProductsQuery = currentUserRole === 'cashier' && currentUserId 
      ? { sellerId: currentUserId, status: { $in: ['completed', 'partially_refunded', 'refunded'] } }
      : { status: { $in: ['completed', 'partially_refunded', 'refunded'] } };
    
    const topProductsSales = await Sale.find({
      ...topProductsQuery,
      saleDate: { $gte: startOfMonth, $lt: endOfMonth }
    }).populate('items.productId', 'name sku').lean();
    
    // Calculate top products - use same logic as revenue calculations
    const productSales = new Map();
    topProductsSales.forEach(sale => {
      const isRefund = (sale.totalAmount || 0) < 0;
      const multiplier = isRefund ? -1 : 1; // Subtract for refunds, add for sales
      
      // Calculate each item's proportional share of the sale's totalAmount
      const saleSubtotal = sale.subtotal || 0;
      const saleTotalAmount = sale.totalAmount || 0;
      
      sale.items?.forEach(item => {
        const productId = item.productId?._id?.toString();
        const productName = item.productId?.name || 'Unknown Product';
        if (productId) {
          const existing = productSales.get(productId) || { 
            name: productName, 
            quantity: 0, 
            revenue: 0 
          };
          
          // Calculate item's proportional share of the total sale amount (including tax)
          const itemSubtotal = item.totalPrice || 0;
          const itemProportionalRevenue = saleSubtotal > 0 
            ? (itemSubtotal / saleSubtotal) * Math.abs(saleTotalAmount)
            : 0;
          
          existing.quantity += (item.quantity || 0) * multiplier;
          existing.revenue += itemProportionalRevenue * multiplier;
          productSales.set(productId, existing);
        }
      });
    });
    
    const topProducts = Array.from(productSales.values())
      .filter(product => product.quantity > 0 && product.revenue > 0) // Only include products with net positive sales
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Calculate percentage changes
    const todayRevenueChange = yesterdayRevenue === 0 ? 0 : 
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    
    const todayCountChange = yesterdayCount === 0 ? 0 : 
      ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    
    const monthlyRevenueChange = lastMonthRevenue === 0 ? 0 : 
      ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    
    // Calculate total revenue for all users (with role-based filtering) - include both positive and negative amounts
    const totalRevenueQuery = currentUserRole === 'cashier' && currentUserId 
      ? { sellerId: currentUserId, status: { $in: ['completed', 'partially_refunded', 'refunded'] } }
      : { status: { $in: ['completed', 'partially_refunded', 'refunded'] } };
    
    // Calculate total revenue using same logic as financial report
    const allSales = await Sale.find(totalRevenueQuery);
    const allPositiveSales = allSales.filter(sale => (sale.totalAmount || 0) > 0);
    const allRefundSales = allSales.filter(sale => (sale.totalAmount || 0) < 0);
    const allGrossRevenue = allPositiveSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const allRefunds = Math.abs(allRefundSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0));
    const totalRevenue = allGrossRevenue - allRefunds;

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
        revenue: effectiveTodayRevenue,
        count: effectiveTodayCount,
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