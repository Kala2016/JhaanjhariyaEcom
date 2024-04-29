const productCollection = require("../../models/ProductSchema");
const orderModel = require("../../models/orderSchema");
const userCollection = require("../../models/userSchema");
const CategoryCollection =require("../../models/categorySchema")
const graphHelper = require('../../helpers/graphHelper')
const Banner = require('../../models/bannerSchema')



//Load Login Page
const loadLogin = async (req, res) => {
  try {
    res.render("./admin/pages/login", { title: "Login" });
  } catch (error) {
    console.log(error.message);
  }
};

//Verify Admin Login
const verifyAdmin = async (req, res) => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    const emailCheck = req.body.email;
    const user = await userCollection.findOne({ email: emailCheck });

    if (user) {
      res.render("./admin/pages/login", {
        adminCheck: "You are not an Admin",
        title: "Login",
      });
    }
    if (req.body.email === email && req.body.password === password) {
      req.session.admin = email;
      console.log("email", email);
      res.redirect("admin/dashboard");
    } else {
      res.render("./admin/pages/login", {
        adminCheck: "Invalid Credentials",
        title: "Login",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Load Dashboard
const loadDashboard = async (req, res) => {
  try {
        const products = await productCollection.find({ isListed: true }).count()
        const category = await CategoryCollection.find({ isListed: true }).count()
        const orders = await orderModel.find().count()
        const latestOrders = await orderModel.find().populate('address').limit(10)
        const newUsers = await userCollection.find().limit(3)

        const [totalRevenue, slice] = await graphHelper.calculateRevenue();

        const salesData = await graphHelper.calculateSalesData()
        const usersData = await graphHelper.countUsers()
        const productSold = await graphHelper.calculateProductSold()
        
        console.log('totalRevenue',totalRevenue)
        console.log('newUsers',newUsers)

        res.render("./admin/pages/dashboard", 
          {
            title: 'Dashboard',
            products, 
            category,
            orders,
            totalRevenue,
            monthlyRevenue: slice,
            latestOrders,
            salesData,
            newUsers, 
            usersData,
            productSold
        })
  } catch (error) {
    console.error(error);
  }
};

//Logout Admin

const logout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
  }
};


const adminProfile = async (req, res) => {
  try {
    res.render("./admin/pages/adminProfile");
  } catch (error) {
    console.error(error);
  }
};


// Loading sales report form page 
const salesReportPage = async (req, res) => {
  try {
      res.render('./admin/pages/salesReport', { title: 'Sales Report' })
  } catch (error) {
      console.error(error)
  }
}
// Post method of sales report page
const generateSalesReport = async (req, res) => {
  try {
      const { reportType, fromDate, toDate } = req.body;

      let dateFilter = {};
      if (reportType === 'daily') {
          dateFilter = { orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
      } else if (reportType === 'monthly') {
          const startOfMonth = new Date(fromDate);
          startOfMonth.setDate(1);
          const endOfMonth = new Date(toDate);
          endOfMonth.setMonth(endOfMonth.getMonth() + 1);
          endOfMonth.setDate(0);
          dateFilter = { orderDate: { $gte: startOfMonth, $lte: endOfMonth } };
      } else {
          dateFilter = { orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
      }

      const matchedOrders = await orderModel.aggregate([
          { $match: dateFilter },
          // Additional aggregation stages based on report type
          { $group: { _id: "$product", totalQuantity: { $sum: "$quantity" } } },
          { $sort: { totalQuantity: -1 } },
          { $limit: 10 } // Example: Get top 10 products by quantity sold
      ]);

      // Calculate total sales
      // Calculate total sales
      const total = matchedOrders.reduce((prev, curr) => {
        return prev + curr.totalQuantity; // Use totalQuantity instead of total
      }, 0);

      

      res.json({ matchedOrders: matchedOrders, salesTotal: total });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error", success: false });
  }
};

module.exports = { generateSalesReport };






module.exports = {
  loadLogin,
  verifyAdmin,
  loadDashboard,
  logout,
  adminProfile,
  generateSalesReport,
  salesReportPage
};
