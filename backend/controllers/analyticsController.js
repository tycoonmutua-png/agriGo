const Product = require("../models/Product");
const Sale = require("../models/Sale");



// DASHBOARD STATS

exports.getDashboardStats = async (req, res) => {

  try {

    // Total products
    const totalProducts = await Product.countDocuments();

    // Total sales
    const totalSales = await Sale.countDocuments();

    // All sales for revenue calculation
    const sales = await Sale.find();

    const totalRevenue = sales.reduce((sum, sale) => {
      return sum + sale.total;
    }, 0);

    // Low stock products (less than 10)
    const lowStock = await Product.find({
      stock: { $lt: 10 }
    });

    // Recent sales (last 5)
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("product");

    res.json({
      totalProducts,
      totalSales,
      totalRevenue,
      lowStock,
      recentSales
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};