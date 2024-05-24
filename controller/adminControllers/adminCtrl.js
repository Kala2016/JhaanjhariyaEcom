const productCollection = require("../../models/ProductSchema");
const orderModel = require("../../models/orderSchema");
const userCollection = require("../../models/userSchema");
const CategoryCollection = require("../../models/categorySchema");
const graphHelper = require("../../helpers/graphHelper");
const Banner = require("../../models/bannerSchema");
const couponSchema = require("../../models/couponSchema");

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

const loadDashboard = async (req, res) => {
  try {
    const products = await productCollection
      .find({ isListed: true })
      .countDocuments();
    const categoriesCount = await CategoryCollection.find({
      isListed: true,
    }).countDocuments();
    const ordersCount = await orderModel.countDocuments();
    const latestOrders = await orderModel.find().populate("address").limit(10);
    const newUsers = await userCollection
      .find({ is_Blocked: false })
      .sort({ createdAt: -1 })
      .limit(4);

    const [totalRevenue, slice] = await graphHelper.calculateRevenue();
    const salesData = await graphHelper.calculateSalesData();
    const usersData = await graphHelper.countUsers();
    const productSold = await graphHelper.calculateProductSold();

    // Aggregate to get top-selling product
    const topSellingProduct = await orderModel.aggregate([
      { $unwind: "$items" }, 
      {
        $group: {
          _id: "$items.product", 
          totalQuantity: { $sum: "$items.quantity" }, 
        },
      },
      { $sort: { totalQuantity: -1 } }, 
      {
        $project: {
          productId: "$_id",
          totalQuantity: 1,
          _id: 0,
        },
      },
      {
        $lookup: {
          from: "productcollections",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {$project: {
        _id: 1, 
        total: 1, 
        "productDetails.productName": 1, 
        "productDetails.salePrice": 1, 
        "productDetails.sold": 1 
      }
      },
      { $limit: 3 },
    ]);

    console.log(JSON.stringify(topSellingProduct, null, 2));

    // Aggregate to get top-selling category
    const topSellingCategory = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "productcollections",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categorycollections",
          localField: "productDetails.categoryName",
          foreignField: "_id",
          as: "categoryDetails"
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails._id",
          totalQuantity: { $sum: "$items.quantity" },
          categoryName: { $first: "$categoryDetails.categoryName" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 },
      {
        $project: {
          categoryName: 1,
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);


    console.log("topSellingCategory", topSellingCategory);

    res.render("./admin/pages/dashboard", {
      title: "Dashboard",
      productsCount: products,
      categoriesCount,
      ordersCount,
      totalRevenue,
      slice,
      latestOrders,
      salesData,
      newUsers,
      usersData,
      productSold,
      topSellingProduct: topSellingProduct,
      topSellingCategory: topSellingCategory,
    });
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

const salesReportPage = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const orders = await orderModel.find().count().populate("discount");
    const [totalRevenue, slice] = await graphHelper.calculateRevenue();
    const coupons = await couponSchema.find();
    const salesData = await graphHelper.calculateSalesData();
    const productSold = await graphHelper.calculateProductSold();
    const page = parseInt(req.query.page) || 1;

    res.render("./admin/pages/salesReport", {
      title: "Sales Report",
      reportData: "daily,monthly,yearly,customdate",
      page: "daily",
      fromDate,
      toDate,
      orders,
      productSold,
      totalRevenue,
      slice,
      coupons,
      productSold,
      salesData,
    });
  } catch (error) {
    console.error(error);
  }
};
// Post method of sales report page
const generateSalesReport = async (req, res) => {
  try {
    const { reportType, fromDate, toDate } = req.body;

    let dateFilter = {};
    if (reportType === "daily") {
      dateFilter = {
        orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    } else if (reportType === "monthly") {
      const startOfMonth = new Date(fromDate);
      startOfMonth.setDate(1);
      const endOfMonth = new Date(toDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      dateFilter = { orderDate: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (reportType === "yearly") {
      const startOfYear = new Date(fromDate);
      startOfYear.setMonth(0);
      startOfYear.setDate(1);
      const endOfYear = new Date(toDate);
      endOfYear.setMonth(11);
      endOfYear.setDate(31);
      dateFilter = { orderDate: { $gte: startOfYear, $lte: endOfYear } };
    } else {
      dateFilter = {
        orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      };
    }

    const matchedOrders = await orderModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json({ matchedOrders: matchedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const customDateSort = async (req, res) => {
  try {
    const orders = await orderModel.find().count().populate("discount");
    const [totalRevenue, slice] = await graphHelper.calculateRevenue();
    const coupons = await couponSchema.populate("discountAmount");
    const salesData = await graphHelper.calculateSalesData();
    const productSold = await graphHelper.calculateProductSold();
    const { fromDate, toDate } = req.body;
    console.log("fromDate", fromDate, toDate);
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    const customReport = await orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.status": {
            $nin: [
              "Pending",
              "Shipped",
              "Delivered",
              "Cancelled",
              "Return requested",
              "Refunded",
            ],
          },
        },
      },

      {
        $project: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          orderAmount: 1,
          couponDiscount: 1,

          "items.offer_id": 1,
          "items.quantity": 1,
        },
      },
      {
        $group: {
          _id: {
            orderId: "$_id",
            day: "$day",
            month: "$month",
            year: "$year",
          },
          totalSales: { $first: "$orders.total" },
          productsCount: { $sum: "$items.quantity" },
          offeredProductsSold: {
            $sum: {
              $cond: [
                { $gt: [{ $type: "$items.offer_id" }, "null"] },
                "$items.quantity",
                0,
              ],
            },
          },
          couponAmount: { $first: "$discountAmount" },
        },
      },
      {
        $group: {
          _id: {
            day: "$_id.day",
            month: "$_id.month",
            year: "$_id.year",
          },
          totalOrderCount: { $sum: 1 },
          totalSales: { $sum: "$total" },
          totalProducts: { $sum: "$productsCount" },
          offeredProductsSold: { $sum: "$offeredProductsSold" },
          couponsUsed: { $sum: "$couponAmount" },
        },
      },
      {
        $project: {
          dateFormatted: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.day", 10] },
                  { $concat: ["0", { $toString: "$_id.day" }] },
                  { $toString: "$_id.day" },
                ],
              },
            ],
          },
          totalSales: 1,
          totalProducts: 1,
          offeredProductsSold: 1,
          couponsUsed: 1,
          totalOrderCount: 1,
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    console.log("customReport", customReport);
    res.render("./admin/pages/salesReport", {
      reportData: customReport,
      page: "daily",
      TotalAmount: customReport.reduce((acc, curr) => acc + curr.totalSales, 0),
      TotalSaleCount: customReport.reduce(
        (acc, curr) => acc + curr.totalOrderCount,
        0
      ),
      TotalCouponAmount: customReport.reduce(
        (acc, curr) => acc + curr.couponsUsed,
        0
      ),
      fromDate,
      toDate,
      orders,
      products,
      productSold,
      totalRevenue,
      slice,
      coupons,
      productSold,
      salesData,
      page,
    });
  } catch (error) {
    console.log("error in custom sales report");
  }
};

const dailySaleReport = async (req, res) => {
  try {
    const { reportData, fromDate, toDate } = req.body;
    const orders = await orderModel.find().count().populate("discount");
    const totalRevenue = await graphHelper.calculateRevenue();
    const coupons = await couponSchema.populate("discountAmount");
    const salesData = await graphHelper.calculateSalesData();
    const productSold = await graphHelper.calculateProductSold();
    const page = parseInt(req.query.page) || 1;

    let dailyReport = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.status": {
            $nin: [
              "Pending",
              "Shipped",
              "Delivered",
              "Cancelled",
              "Return requested",
              "Refunded",
            ],
          },
        },
      },

      {
        $project: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          orderAmount: 1,
          couponDiscount: 1,
          orderId: 1,
          "items.quantity": 1,
        },
      },
      {
        $group: {
          _id: {
            orderId: "$_id",
            day: "$day",
            month: "$month",
            year: "$year",
          },
          totalSales: { $first: "$total" },
          productsCount: { $sum: "$items.quantity" },
          offeredProductsSold: {
            $sum: {
              $cond: [
                { $gt: [{ $type: "$orderId" }, "null"] },
                "$items.quantity",
                0,
              ],
            },
          },
          couponAmount: { $first: "$discountAmount" },
        },
      },
      {
        $group: {
          _id: {
            day: "$_id.day",
            month: "$_id.month",
            year: "$_id.year",
          },
          totalOrderCount: { $sum: 1 },
          totalSales: { $sum: "$total" },
          totalProducts: { $sum: "$products" },
          offeredProductsSold: { $sum: "$offeredProductsSold" },
          couponsUsed: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          dateFormatted: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.day", 10] },
                  { $concat: ["0", { $toString: "$_id.day" }] },
                  { $toString: "$_id.day" },
                ],
              },
            ],
          },
          totalSales: 1,
          totalProducts: 1,
          offeredProductsSold: 1,
          couponsUsed: 1,
          totalOrderCount: 1,
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.render("./admin/pages/salesReport", {
      reportData: dailyReport,
      page: "daily",
      TotalAmount: dailyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
      TotalSaleCount: dailyReport.reduce(
        (acc, curr) => acc + curr.totalOrderCount,
        0
      ),
      TotalCouponAmount: dailyReport.reduce(
        (acc, curr) => acc + curr.couponsUsed,
        0
      ),
      fromDate,
      toDate,
      orders,
      products,
      productSold,
      totalRevenue,
      coupons,
      productSold,
      salesData,
      page,
    });
  } catch (error) {
    console.log("error in daily sales report", error);
    res.status(500).send("Error generating daily sales report");
  }
};

const weeklySalesReport = async (req, res) => {
  try {
    const sevenWeeksAgo = new Date(
      new Date().setDate(new Date().getDate() - 49)
    );

    const weeklyReport = await orders.aggregate([
      { $match: { createdAt: { $gte: sevenWeeksAgo } } },
      { $unwind: "$orderedItem" },
      {
        $match: {
          "orderedItem.productStatus": {
            $nin: ["cancelled", "pending", "returned", "shipped"],
          },
        },
      },
      {
        $project: {
          week: { $isoWeek: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
          orderAmount: 1,
          couponDiscount: 1,
          orderedItemQuantity: "$orderedItem.quantity",
          offeredProduct: {
            $cond: [
              { $gt: [{ $type: "$orderedItem.offer_id" }, "null"] },
              "$orderedItem.quantity",
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { week: "$week", year: "$year", orderId: "$_id" },
          orderAmount: { $first: "$orderAmount" },
          couponAmount: { $first: "$couponDiscount" },
          totalProducts: { $sum: "$orderedItemQuantity" },
          offeredProductsSold: { $sum: "$offeredProduct" },
        },
      },
      {
        $group: {
          _id: { week: "$_id.week", year: "$_id.year" },
          totalOrderCount: { $sum: 1 },
          totalSales: { $sum: "$orderAmount" },
          totalProducts: { $sum: "$totalProducts" },
          offeredProductsSold: { $sum: "$offeredProductsSold" },
          couponsUsed: { $sum: "$couponAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          week: "$_id.week",
          year: "$_id.year",
          totalOrderCount: 1,
          totalSales: 1,
          totalProducts: 1,
          offeredProductsSold: 1,
          couponsUsed: 1,
          startOfWeek: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  isoWeekYear: "$_id.year",
                  isoWeek: "$_id.week",
                  isoDayOfWeek: 1,
                },
              },
            },
          },
          endOfWeek: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  isoWeekYear: "$_id.year",
                  isoWeek: "$_id.week",
                  isoDayOfWeek: 7,
                },
              },
            },
          },
        },
      },
      { $sort: { year: 1, week: 1 } },
    ]);

    res.render("salesReport", {
      reportData: weeklyReport,
      page: "weekly",
      TotalAmount: weeklyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
      TotalSaleCount: weeklyReport.reduce(
        (acc, curr) => acc + curr.totalOrderCount,
        0
      ),
      TotalCouponAmount: weeklyReport.reduce(
        (acc, curr) => acc + curr.couponsUsed,
        0
      ),
      fromDate: "",
      toDate: "",
    });
  } catch (error) {
    console.log("error in weekly sales report", error);
    res.status(500).send("Error generating weekly sales report");
  }
};

const monthlySalesReport = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date(
      new Date().setFullYear(new Date().getFullYear() - 1)
    );

    const monthlyReport = await orders.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      { $unwind: "$orderedItem" },
      {
        $match: {
          "orderedItem.productStatus": {
            $nin: ["cancelled", "pending", "returned", "shipped"],
          },
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
          orderAmount: 1,
          couponDiscount: 1,
          orderedItemQuantity: "$orderedItem.quantity",
          offeredProduct: {
            $cond: [
              { $gt: [{ $type: "$orderedItem.offer_id" }, "null"] },
              "$orderedItem.quantity",
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year", orderId: "$_id" },
          orderAmount: { $first: "$orderAmount" },
          couponAmount: { $first: "$couponDiscount" },
          totalProducts: { $sum: "$orderedItemQuantity" },
          offeredProductsSold: { $sum: "$offeredProduct" },
        },
      },
      {
        $group: {
          _id: { month: "$_id.month", year: "$_id.year" },
          totalOrderCount: { $sum: 1 },
          totalSales: { $sum: "$orderAmount" },
          totalProducts: { $sum: "$totalProducts" },
          offeredProductsSold: { $sum: "$offeredProductsSold" },
          couponsUsed: { $sum: "$couponAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          totalOrderCount: 1,
          totalSales: 1,
          totalProducts: 1,
          offeredProductsSold: 1,
          couponsUsed: 1,
          monthName: {
            $arrayElemAt: [
              [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              { $subtract: ["$_id.month", 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          monthYear: { $concat: ["$monthName", "-", { $toString: "$year" }] },
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.render("salesReport", {
      reportData: monthlyReport,
      page: "monthly",
      TotalAmount: monthlyReport.reduce(
        (acc, curr) => acc + curr.totalSales,
        0
      ),
      TotalSaleCount: monthlyReport.reduce(
        (acc, curr) => acc + curr.totalOrderCount,
        0
      ),
      TotalCouponAmount: monthlyReport.reduce(
        (acc, curr) => acc + curr.couponsUsed,
        0
      ),
      fromDate: "",
      toDate: "",
    });
  } catch (error) {
    console.log("error in monthly sales report", error);
    res.status(500).send("Error generating monthly sales report");
  }
};

const YearlySalesReport = async (req, res) => {
  try {
    const yearlyReport = await orders.aggregate([
      { $unwind: "$orderedItem" },
      {
        $match: {
          "orderedItem.productStatus": {
            $nin: ["cancelled", "pending", "returned"],
          },
        },
      },
      {
        $project: {
          year: { $isoWeekYear: "$createdAt" },
          orderAmount: 1,
          couponDiscount: 1,
          orderedItemQuantity: "$orderedItem.quantity",
          offeredProduct: {
            $cond: [
              { $gt: [{ $type: "$orderedItem.offer_id" }, "null"] },
              "$orderedItem.quantity",
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { year: "$year", orderId: "$_id" },
          orderAmount: { $first: "$orderAmount" },
          couponAmount: { $first: "$couponDiscount" },
          totalProducts: { $sum: "$orderedItemQuantity" },
          offeredProductsSold: { $sum: "$offeredProduct" },
        },
      },
      {
        $group: {
          _id: { year: "$_id.year" },
          totalOrderCount: { $sum: 1 },
          totalSales: { $sum: "$orderAmount" },
          totalProducts: { $sum: "$totalProducts" },
          offeredProductsSold: { $sum: "$offeredProductsSold" },
          couponsUsed: { $sum: "$couponAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          totalOrderCount: 1,
          totalSales: 1,
          totalProducts: 1,
          offeredProductsSold: 1,
          couponsUsed: 1,
        },
      },
      { $sort: { year: 1 } },
    ]);

    const totalAmountResult = await orders.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$orderAmount" } } },
    ]);
    const TotalAmount =
      totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

    console.log("yearlyReport", yearlyReport);
    res.render("salesReport", {
      reportData: yearlyReport,
      page: "yearly",
      TotalAmount: yearlyReport.reduce((acc, curr) => acc + curr.totalSales, 0),
      TotalSaleCount: yearlyReport.reduce(
        (acc, curr) => acc + curr.totalOrderCount,
        0
      ),
      TotalCouponAmount: yearlyReport.reduce(
        (acc, curr) => acc + curr.couponsUsed,
        0
      ),
      fromDate: "",
      toDate: "",
    });
  } catch (error) {
    console.log("error in yearly sales report", error);
    res.status(500).send("Error generating yearly sales report");
  }
};

const yearlyChart = async (req, res) => {
  try {
    const userCount = await User.countDocuments({});

    const tenYearsAgo = new Date(
      new Date().setFullYear(new Date().getFullYear() - 10)
    );

    const yearlyOrderData = await orders.aggregate([
      { $match: { createdAt: { $gte: tenYearsAgo } } },
      { $unwind: "$orderedItem" },
      {
        $match: {
          "orderedItem.productStatus": {
            $nin: ["cancelled", "returned", "pending", "shipped"],
          },
        },
      },
      {
        $group: {
          _id: {
            orderId: "$_id",
            year: { $year: "$createdAt" },
          },

          orderAmount: { $first: "$orderAmount" },
          couponDiscount: { $first: "$couponDiscount" },
        },
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
          },
          yearlyTotal: { $sum: "$orderAmount" },
          yearlyCouponDiscount: { $sum: "$couponDiscount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1 } },
    ]);

    let orderCounts = new Array(6).fill(0);
    let totalAmounts = new Array(6).fill(0);
    let couponDiscounts = new Array(6).fill(0);
    let years = [];

    const currentYear = new Date().getFullYear();

    for (let i = 6; i >= 0; i--) {
      years.push(currentYear - i);
    }

    yearlyOrderData.forEach((data) => {
      const yearIndex = years.indexOf(data._id.year);
      if (yearIndex !== -1) {
        orderCounts[yearIndex] = data.orderCount;
        totalAmounts[yearIndex] = data.yearlyTotal;
        couponDiscounts[yearIndex] = data.yearlyCouponDiscount;
      }
    });

    res.render("dashboard", {
      userCount,
      TotalAmount: yearlyOrderData.reduce(
        (acc, curr) => acc + curr.yearlyTotal,
        0
      ),
      TotalCouponDiscount: yearlyOrderData.reduce(
        (acc, curr) => acc + curr.yearlyCouponDiscount,
        0
      ),

      TotalOrderCount: yearlyOrderData.reduce(
        (acc, curr) => acc + curr.orderCount,
        0
      ),
      OrderCounts: orderCounts,
      TotalAmounts: totalAmounts,
      CouponDiscounts: couponDiscounts,
      categories: years,
      text: "Yearly",
      activePage: "dashboard",
    });
  } catch (error) {
    console.error("Error on dashboard", error);
    res.status(500).send("Error generating dashboard data");
  }
};

const getTopSellingData = async (req, res) => {
  try {
    const topSellingProducts = await orderModel
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalSales: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: "productCollection",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        { $project: { _id: 1, totalSales: 1, productDetails: 1 } },
      ])
      .exec();

    const topSellingCategories = await orderModel
      .aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "productCollection",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.categoryName",
            totalSales: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
      ])
      .exec();

    const topSellingBrands = await orderModel
      .aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "productCollection",
            localField: "items.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.brandName",
            totalSales: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 3 },
      ])
      .exec();

    res.render("./users/pages/home", {
      topSellingProducts,
      topSellingCategories,
      topSellingBrands,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const checkDataExist = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    console.log("fromDate", fromDate, toDate);
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      return res.json({
        succes: false,
        message: " Start date is greater than the end date",
      });
    }
    const data = await orders.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    console.log("data", data);
    if (data.length == 0) {
      return res.json({
        succes: false,
        message: "Data not found in this date",
      });
    } else {
      return res.json({ success: true, message: "" });
    }
  } catch (error) {}
};

module.exports = {
  loadLogin,
  verifyAdmin,
  loadDashboard,
  logout,
  adminProfile,
  generateSalesReport,
  salesReportPage,
  dailySaleReport,
  weeklySalesReport,
  monthlySalesReport,
  YearlySalesReport,
  customDateSort,
  yearlyChart,
  getTopSellingData,
  checkDataExist,
};
